# Network Architecture Migration Plan

## Context

No live customer traffic is running through this system yet. That's a rare window: brief interruptions, test cutovers, and even a failed attempt or two cost nothing but time. The plan below is written to take advantage of that -- compressed into a continuous push across the available days, rather than spread across separate "careful maintenance window" sessions the way it would need to be once real traffic exists. Once this window closes, changes of this kind get meaningfully more expensive to make safely.

Goal: reach a standard three-tier network architecture (public / private-app / private-data) fully, with clean DNS, before real traffic begins.

## Current State (verified 2026-07-31)

- 4 private subnets (2 private-app, 2 private-data) + NAT Gateway + route tables: built, wired correctly, sitting unused.
- ALB: reduced to 2 active AZs (`us-east-1a`, `us-east-1b`), but carries legacy manually-attached Elastic IPs -- one is currently stuck (AWS protects ELB-owned network interfaces from direct API modification; needs an AWS Support case to force-release).
- ASG: still launches into public subnets across all 6 AZs; the current instance landed in `us-east-1f`, which isn't one of the ALB's active AZs -- so it isn't actually providing redundancy behind the load balancer yet.
- RDS (`mvmprod`): Multi-AZ, still on its original default VPC subnet group. In-place migration to the private-data subnet group is blocked by a real AWS platform restriction (confirmed via three different attempts, same error each time).
- RDS also has AWS-managed master password rotation enabled. Our deployment pipeline reads DB credentials from a static copy in Secrets Manager that we populate ourselves -- it has no awareness of AWS's rotation, so when AWS rotates the real password, our copy goes stale and the app starts failing auth. This already caused one real outage today. Left as-is, it will happen again on the next rotation.
- Standalone EC2 instance: staying in the public subnet permanently (deliberate decision, for testing/compliance continuity) -- still shares full credential/network blast radius with everything else, though; today's outage hit it identically to the ASG instance.
- DNS: `api.getvinify.com` points directly at the standalone instance's IP, bypassing the ALB entirely.

## Execution Plan

### Day 1 -- ASG redundancy + RDS migration

1. **Move the ASG into public subnets matching the ALB's active AZs** (`1a`/`1b`). Zero new risk -- reuses the exact instance-refresh mechanism already proven today. This is the first point where the ASG actually contributes real redundancy behind the load balancer.
2. **Migrate RDS via snapshot-restore, not in-place modify.** Take a snapshot of `mvmprod`, restore into a new Multi-AZ instance created directly in the private-data subnet group (sidesteps the platform restriction entirely, since the subnet group is chosen at restore time). Verify connectivity and data on the new instance before cutting over.
3. **Fix the password-rotation gap properly, not just patch around it.** Given the time available, the right fix isn't to disable AWS-managed rotation (that's a real security regression) -- it's to change the app's startup/boot process to fetch the current database credentials directly from RDS's own managed Secrets Manager secret at connect time, instead of maintaining a separate static copy that can go stale. Build and test this as part of standing up the new RDS instance, so rotation becomes a non-event going forward rather than a recurring outage.
4. Cut the app over to the new RDS instance's endpoint (`DB_HOST`) via Secrets Manager, verify, then decommission the old instance (final snapshot kept).

### Day 2 -- ASG into private subnets + real verification

1. Move the ASG from public into the private-app subnets already built.
2. Verify the one genuinely new variable: that the boot script's outbound calls (GitHub clone, `npm ci`, Secrets Manager reads) work correctly through the NAT Gateway. Since there's no live traffic, this can be tested aggressively -- including deliberately breaking things to confirm the failure modes are understood, not just the happy path.
3. Re-run the BCP/DR-style failover and self-healing tests (RDS failover, ASG instance termination) against the *final* architecture, not the interim one -- so the recorded results in the compliance ticket reflect the real, finished setup.

### Day 3 -- ALB cleanup, DNS cutover, and closing decisions

1. Open the AWS Support case for the stuck Elastic IP (doesn't block anything else, can run in parallel).
2. Given the low-stakes window, consider rebuilding the ALB cleanly -- a fresh load balancer with no manually-attached EIPs (using AWS's default dynamic IPs, the standard approach), verified, then cut over and the old one deleted. This fully sidesteps the legacy EIP mess rather than working around it indefinitely.
3. Cut DNS over from the standalone instance's direct IP to the load balancer. This is the point where the ASG's redundancy actually starts protecting the site -- if the standalone instance has a problem, ASG instances behind the LB absorb traffic instead of the whole site going down.
4. **Revisit the standalone instance's role with fresh eyes.** The original "keep it forever" call was made to avoid disrupting its traffic-serving duty under time pressure. With no live customers, this is a much lower-stakes moment to decide, deliberately, whether it stays as a permanent production peer, steps back to a pure testing/reference box (deregistered from the target group), or something else -- rather than carrying forward a decision made under different constraints by default.
5. Update the Security Setup Guide and the architecture diagram to reflect the finished state instead of "in progress."

## Success Criteria

- [ ] ASG instances launch in private-app subnets, in AZs matching the load balancer's active AZs.
- [ ] RDS runs in private-data subnets, with no internet route, and credential rotation no longer requires manual intervention.
- [ ] Load balancer has no orphaned/stuck Elastic IPs.
- [ ] DNS points at the load balancer, not a single instance's IP.
- [ ] Documentation (Security Setup Guide, architecture diagram) matches the actual final state.

## Open Decisions

- **Standalone instance's long-term role** -- permanent production peer, or step back to testing/reference only? (See Day 3, step 4.)
- **RDS credential handling** -- confirm the direct-from-managed-secret approach (recommended) is acceptable, or if a different pattern is preferred.
