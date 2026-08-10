# VINify AWS & System Security Setup Guide

## Version History

| Version | Date | Author | Summary |
|---|---|---|---|
| 1.0 | 2026-07-27 | Betty Waiyego (Engineering Lead) | Initial version. Documents the AWS security configuration as implemented and verified in the production account as of this date. |
| 1.1 | 2026-08-01 | Betty Waiyego (Engineering Lead) | Network segmentation migration complete: RDS and Auto Scaling Group compute now actually run in the private subnet tiers (Section 2), not just provisioned-but-unused. Documents the RDS Proxy credential-rotation pattern, the SSH-over-443 NAT workaround, and a known certificate-renewal risk (Section 3). See [architecture-diagram.md](architecture-diagram.md) for the current topology. |
| 1.2 | 2026-08-06 | Betty Waiyego (Engineering Lead) | Documents the GuardDuty finding-to-email alerting pipeline (Section 4) and closes the database half of a logging gap: enabled and verified RDS connection/disconnection/DDL logging with CloudWatch Logs export (Section 4). Discloses the remaining gap — EC2 server/application logs are not yet centrally collected. |
| 1.3 | 2026-08-07 | Betty Waiyego (Engineering Lead) | Closes the remaining gap from v1.2: EC2 server/application (nginx, PM2) logs are now centrally collected via the CloudWatch agent, baked into `asg-bootstrap.sh`, verified on a fresh unattended instance refresh (Section 4). |
| 1.4 | 2026-08-10 | Betty Waiyego (Engineering Lead) | Expands Section 3 to fully answer KY3P ENC06/ENC07: adds EBS and Backup-vault encryption detail, explicitly states laptop/desktop encryption is pending MDM rollout and removable media is N/A, and adds the exact TLS protocol/cipher suite in use, confirming exclusion of every deprecated algorithm on the ENC07 checklist. |
| 1.5 | 2026-08-11 | Betty Waiyego (Engineering Lead) | Closes the KY3P LM02 gap in Section 4: adds application-level, user-identity-tied audit logging (`src/helpers/auditLog.ts`) for login and account-closure events, covering the user/event-type/timestamp/outcome/resource fields nginx access logs alone couldn't provide. |

> This document is version-controlled via its git commit history in this repository. Each substantive review or change should be committed as a new entry above and in the commit log, so the revision history is objectively verifiable rather than manually asserted.

## Table of Contents

1. [AWS IAM User Provisioning & Least Privilege Baselines](#1-aws-iam-user-provisioning--least-privilege-baselines)
2. [Production VPC & Network Architecture Setup](#2-production-vpc--network-architecture-setup)
3. [Data Encryption Configuration (KMS at Rest & TLS in Transit)](#3-data-encryption-configuration-kms-at-rest--tls-in-transit)
4. [Log Router & CloudTrail Activation Rules](#4-log-router--cloudtrail-activation-rules)
5. [Baseline Configuration Procedures for New Resources](#5-baseline-configuration-procedures-for-new-resources)

---

## 1. AWS IAM User Provisioning & Least Privilege Baselines

### Human access
- All human access to the AWS account is via **AWS IAM Identity Center (SSO)**, using the `AWSReservedSSO_SystemAdministrator` permission set. There are no long-lived IAM users with console passwords or access keys for day-to-day operations.

### CI/CD access
- GitHub Actions authenticates to AWS via **OIDC federation** (`github-actions-ec2-deploy-role`), not static access keys stored in GitHub. The role's permissions are scoped to what the deploy pipeline actually needs:
  - `ssm-send-command-deploy` — `ssm:SendCommand` restricted to the `AWS-RunShellScript` document; `ssm:GetCommandInvocation` / `ssm:ListCommandInvocations` for reading results.
  - `asg-describe-readonly` — read-only `autoscaling:DescribeAutoScalingGroups`, used to discover current Auto Scaling Group instances at deploy time.
  - `s3-frontend-artifacts-upload` — scoped to the frontend deployment artifacts bucket.
  - The managed policy `AmazonSSMManagedInstanceCore` is attached to support the SSM-based deploy mechanism.

### EC2 instance role
- EC2 instances run under `EC2_SSM_VINRole`, granting `AmazonSSMManagedInstanceCore` (for remote management without SSH/exposed ports) plus a scoped inline policy `vinify-backend-secrets-readonly`, which grants `secretsmanager:GetSecretValue` on exactly two named secrets (the application `.env` contents and the git deploy key) — not broad Secrets Manager access.

### Security group baseline
- The VPC's implicit `default` security group has been stripped of all ingress and egress rules (0 rules), so it grants no implicit trust to any resource that inherits it. All production resources use purpose-named security groups instead (`alb-public-sg`, `app-tier-sg`, `app-to-rds-sg`, `rds-data-tier-sg`).
- Database access is granted by **security-group reference**, not by IP/CIDR — only the application-tier security group is permitted to reach the database security groups on their respective ports. No production database allows inbound access from `0.0.0.0/0`.

---

## 2. Production VPC & Network Architecture Setup

See [architecture-diagram.md](architecture-diagram.md) for a visual topology of everything below.

### VPC
- `vinify-prod-vpc` — `172.31.0.0/16`, single VPC, single AWS account, `us-east-1`.

### Public subnets
- Six public subnets (one per Availability Zone), each with a route to an Internet Gateway. These host:
  - The internet-facing Application Load Balancer (`VIN-instance-loadbalancer`), terminating TLS (see Section 3) and forwarding to the application target group. Currently active in 2 of the 6 AZs (`us-east-1a`, `us-east-1b`).
  - The NAT Gateway used by the private application subnets below.
  - One remaining standalone EC2 instance, kept as a permanent reference/testing box (deliberate decision — see Open Decisions history); scheduled for eventual retirement once the Auto Scaling Group has had sufficient soak time as the sole production compute.

### Private subnets (network segmentation) — migration complete
- Four private subnets, split into two tiers, each spanning the same 2 Availability Zones as the load balancer (`us-east-1a`, `us-east-1b`):
  - **Private application subnets** — route `0.0.0.0/0` via a dedicated NAT Gateway (outbound-only; no direct inbound path from the internet). `production-asg` compute runs here.
  - **Private data subnets** — no internet route at all, not even via NAT. The production RDS instance runs here.
- Both migrations (RDS via snapshot-restore, ASG via `VPCZoneIdentifier` update + instance refresh) are complete and verified — this is the running architecture, not a plan.
- **Known NAT egress quirk**: outbound TCP port 22 is silently dropped somewhere upstream of this VPC's NAT Gateway (confirmed via packet capture — SYNs leave, no reply ever returns, for any destination on port 22, not just GitHub; the NAT Gateway itself reports zero packet drops or errors, so the cause is outside anything inspectable via the AWS API). Git operations from private-app-subnet instances use GitHub's documented SSH-over-443 workaround (`ssh.github.com:443` instead of `github.com:22`) to route around it. Port 443 (HTTPS) is unaffected.

### Database
- The production database (`mvmprod`, PostgreSQL, Multi-AZ) runs in the private-data subnets, is **not publicly accessible** (`PubliclyAccessible: false`), and accepts inbound connections only from the application-tier and RDS Proxy security groups.
- Application connections go through **Amazon RDS Proxy**, not directly to the instance. AWS manages and rotates the database master password on its own schedule (`ManageMasterUserPassword`), into its own Secrets Manager secret; both the proxy's own auth config and the application's deploy/boot process fetch credentials fresh from that native managed secret rather than maintaining a separately-updated static copy, so rotation is a non-event rather than a recurring outage risk. See Section 5 for the exact mechanism.

### Compute elasticity
- The Auto Scaling Group (`production-asg`) has a target-tracking scaling policy (CPU utilization, target 60%), so capacity adjusts automatically to load, with a defined minimum/maximum instance count.
- Health checks use type `EBS,ELB` — an instance is only considered "Healthy" by the ASG once it also passes the load balancer's real HTTP health check, not just an EC2-level status check. This closes a previously-identified gap where the ASG's own "healthy" signal could lag true application readiness.
- Each instance serves both the API (`api.getvinify.com`, reverse-proxied to the Node process) and the frontend (`app.getvinify.com`, static build synced from S3) via host-based nginx virtual hosts — both hostnames are served identically regardless of which instance (ASG or standalone) the load balancer happens to route a given request to.

---

## 3. Data Encryption Configuration (KMS at Rest & TLS in Transit)

### Encryption at rest

All of the below use AES-256 or its direct equivalent (AWS KMS's standard, FIPS 140-2 validated) — no weaker algorithm is in use anywhere in this account.

- **Databases**: the production RDS instance has storage encryption enabled (`StorageEncrypted: true`), AES-256 via the AWS-managed default RDS key (`arn:aws:kms:us-east-1:010526276308:key/1e3d9000-936d-4cdc-be66-7b0cdb70dd2f`).
- **File/disk storage**: all S3 buckets in the account have default server-side encryption enabled (SSE, AES256). All EC2 EBS volumes are encrypted — account-level "encryption by default" enabled 2026-08-10 (`aws/ebs` KMS key, AES-256), applied to the ASG fleet via a rebuilt AMI the same day; verified directly on the current running instance (`Encrypted: true`).
- **Digital backup storage**: the AWS Backup vault (daily RDS backups) is KMS-encrypted (AES-256) and additionally protected by Backup Vault Lock in Compliance mode — recovery points cannot be deleted or altered before their retention period expires, by any principal including root (see `Business-Continuity-and-Recovery-Policy.md`).
- **Secrets**: database credentials and the git deploy key used to provision compute are stored in AWS Secrets Manager (AES-256 via `aws/secretsmanager`), retrieved at instance boot time — never committed to source control or stored in plaintext on disk outside of the running instance's shared configuration directory.
- **Laptop/desktop hard drives**: MDM deployment is currently in progress (not yet complete as of this writing) — full-disk encryption tooling and algorithm (e.g., FileVault/BitLocker) will be confirmed and documented here once rollout finishes. This is an open item, not claimed as done.
- **Removable media / backup tapes**: not applicable — VINify's infrastructure is entirely cloud-native with no physical backup media in use.

### Encryption in transit

- The public-facing load balancer terminates TLS for both `api.getvinify.com` and `app.getvinify.com` (both now DNS-routed through it; see Section 2), with an HTTP listener that redirects to HTTPS.
- **TLS policy**: `ELBSecurityPolicy-TLS13-1-2-Res-PQ-2025-09`, verified directly against the live listener. Protocols: **TLS 1.2 and 1.3 only** — no SSLv2, SSLv3, or TLS 1.0/1.1. Cipher suite: `TLS_AES_128_GCM_SHA256`, `TLS_AES_256_GCM_SHA384`, `TLS_CHACHA20_POLY1305_SHA256`, `ECDHE-ECDSA-AES128-GCM-SHA256`, `ECDHE-RSA-AES128-GCM-SHA256`, `ECDHE-ECDSA-AES256-GCM-SHA384`, `ECDHE-RSA-AES256-GCM-SHA384` — all AEAD ciphers with ECDHE forward secrecy, SHA-256/384 only. This excludes every item on the deprecated list: no RC2/RC4/RC5/DES/3DES/Blowfish/IDEA, no null encryption (eNULL), no TLS-level compression, no SHA-1/SHA-224, no anonymous authentication (aNULL), and no sub-2048-bit RSA (the imported certificate is a standard Let's Encrypt cert, never issued below 2048-bit RSA or as ECDSA).
- **Known risk — certificate does not auto-renew.** The certificate attached to the load balancer is registered in ACM (`arn:aws:acm:us-east-1:010526276308:certificate/e45d31f2-d545-42e9-a801-ffe7cd646d31`), but its ACM `Type` is `IMPORTED`, not `AMAZON_ISSUED` — it's an externally-obtained Let's Encrypt certificate uploaded into ACM, not one ACM issued and manages itself. This is because the domain's DNS is currently hosted at the registrar (Hostinger), not Route 53, so ACM's automatic DNS-validation renewal path isn't available. **Imported certificates do not auto-renew.** Current expiry: **2026-09-09**. Track this date; renewal requires manually obtaining a new certificate and re-importing it (`aws acm import-certificate` with the same `--certificate-arn` updates it in place without requiring a listener change). Migrating DNS to Route 53 would allow requesting a native ACM certificate instead, which would auto-renew indefinitely — tracked as a possible follow-up, not yet done.
- Each EC2 instance also holds its own Let's Encrypt certificate locally (via Certbot) for its own direct hostname-based nginx virtual hosts, as a fallback path independent of the load balancer.
- Outbound connections to third-party services (source control, package registries, external APIs) use TLS by default.

---

## 4. Log Router & CloudTrail Activation Rules

### CloudTrail
- Trail name: `vinify-audit-trail`.
- **Multi-region**: enabled — captures management events across all AWS regions, not just the primary operating region.
- **Encryption**: log files are encrypted with a dedicated KMS key (`arn:aws:kms:us-east-1:010526276308:key/9335e973-f7f0-40e6-88dc-7d062774071a`).
- **Delivery**: logs are delivered to a dedicated, encrypted S3 bucket (`aws-cloudtrail-logs-010526276308-aebc7a08`).
- **Status**: actively logging, confirmed via `IsLogging: true`.

### AWS Config
- The configuration recorder is active and recording, providing the resource-configuration history that Security Hub's checks depend on.

### Security Hub
- Enabled with the **CIS AWS Foundations Benchmark v1.4.0** standard active, providing continuous automated checks against that control set.

### GuardDuty
- Enabled (one active detector), providing continuous threat-detection monitoring across the account.
- Findings are routed automatically: an EventBridge rule (`guardduty-security-alerts`) forwards every finding to the `vinify-security-alerts` SNS topic, which delivers to a confirmed email subscription — findings reach a human reviewer immediately, not on a manual check cycle.

### Database activity logging
- `mvmprod` uses a custom parameter group (`mvmprod-postgres17-logging`, since AWS's own `default.postgres17` group cannot be modified) with `log_connections`, `log_disconnections`, and `log_statement=ddl` enabled — every connection, disconnection, and schema change is logged with the connecting identity, source IP, timestamp, and TLS details.
- These logs are exported to CloudWatch Logs (`/aws/rds/instance/mvmprod/postgresql`) via `EnabledCloudwatchLogsExports`, so they're centrally retained rather than sitting only on the instance's local storage. Verified with real log entries after enabling.

### Server/application activity logging
- Closed 2026-08-07 (previously an open gap): nginx and PM2 logs on every EC2 instance — both `production-asg` members and the standalone instance — are now centrally collected via the CloudWatch agent (`EC2_SSM_VINRole` already had `CloudWatchAgentServerPolicy` attached, so no IAM change was needed). Four log groups (`/vinify/ec2/nginx-access`, `/vinify/ec2/nginx-error`, `/vinify/ec2/pm2-out`, `/vinify/ec2/pm2-error`), 90-day retention, one stream per instance ID.
- Baked into `deploy/asg-bootstrap.sh` so every future instance gets this automatically — not just the currently-running ones. Verified on a genuinely fresh, unattended instance refresh: `cloud-init status: done`, real log entries present in all four log groups immediately after boot.
- One real bug found and fixed along the way: the initial version raced cloud-init's own package management for the `dpkg` frontend lock, which failed outright and (under `set -e`) silently aborted the rest of the boot script on a real instance. Fixed by waiting for the lock to clear before installing, rather than assuming it's free.
- This closes the previous gap where server-level logs lived only on local, ephemeral instance disk and were lost the moment an ASG instance was replaced — log history now survives replacement, since each instance writes to a persistent, centrally-retained stream rather than only its own local disk.

### Application-level user activity logging (KY3P LM02)
- Closed 2026-08-11 (previously an open gap): nginx access logs show *that* a request hit an endpoint with a given status code, but not *which user* — that's in the request body, not the URL. `src/helpers/auditLog.ts` fills this gap with a structured, user-identity-tied event log covering all five elements LM02 asks for: user identification, event type, timestamp, success/fail outcome, and the affected resource.
- Emitted via `console.log` with an `AUDIT ` prefix, so it flows through the existing PM2 stdout → CloudWatch agent pipeline (`/vinify/ec2/pm2-out`) above with no infrastructure changes — filterable by that prefix in CloudWatch Logs Insights.
- Wired into the highest-value security events today: login success, login failure (wrong password, both the bcrypt and legacy-plaintext paths), login blocked on a closed account, and account closure (success and already-closed). Covered by 3 new unit tests for the helper itself plus assertions added to the existing `LoginController`/`CloseAccount` tests (34 tests total, all passing).
- Not yet covered: password reset, profile updates. Real, scoped follow-up work — not claimed as done.

---

## 5. Baseline Configuration Procedures for New Resources

These are the concrete steps engineers must follow when provisioning the resource types below, so that new infrastructure meets the same baseline documented in Sections 1-4 rather than depending on someone remembering to configure it after the fact.

### RDS encryption
1. Set `StorageEncrypted = true` in the instance creation request. **This cannot be changed after creation** — an unencrypted instance can only reach encryption via a snapshot-copy-with-encryption-enabled and restore, so it must be correct at creation time.
2. By default this uses the AWS-managed key `aws/rds`. If a customer-managed KMS key is required (e.g. for centralized rotation policy or cross-account access control), pass `--kms-key-id` explicitly at creation.
3. Verify immediately after creation:
   ```
   aws rds describe-db-instances --db-instance-identifier <name> \
     --query "DBInstances[0].StorageEncrypted"
   ```
   must return `true`.
4. For Multi-AZ instances already running on the AWS-default VPC subnet group: do not attempt to change the DB subnet group via `modify-db-instance` — this trips a known AWS platform restriction. Use a snapshot-restore-and-cutover into the target subnet group instead.

### S3 bucket provisioning
1. Enable default server-side encryption (SSE-S3/AES256, or SSE-KMS) at bucket creation — never leave a new bucket with encryption unset.
2. Enable all four Public Access Block settings (`BlockPublicAcls`, `IgnorePublicAcls`, `BlockPublicPolicy`, `RestrictPublicBuckets`) at creation, unless the bucket is deliberately serving public content.
3. Verify:
   ```
   aws s3api get-bucket-encryption --bucket <name>
   aws s3api get-public-access-block --bucket <name>
   ```

### Security groups for new resources
1. Never attach the VPC's `default` security group to a new resource that needs real network rules — it is intentionally kept at zero rules and must stay that way.
2. Create a purpose-named security group per resource type (e.g. `<service>-sg`) with an explicit description of what it's for.
3. Grant database/internal-service access by **security-group reference** (`--source-group`), never by CIDR block, and never `0.0.0.0/0`.
4. Tag every security group with a `Name` tag matching its purpose — the EC2 `GroupName` field is immutable after creation, so the tag is the only editable label.

### Branch protection (GitHub)
The following is the actual ruleset configuration enforced on production repositories today:
1. Create a repository ruleset targeting the default branch.
2. Block direct pushes and force-pushes to the branch (`non_fast_forward` and `deletion` rules active) — all changes must go through a pull request.
3. Require at least 1 approving review (`required_approving_review_count: 1`).
4. Require review from a code owner (`require_code_owner_review: true`).
5. Require all review conversation threads to be resolved before merge (`required_review_thread_resolution: true`).
6. Leave the ruleset's bypass-actor list empty by default. Bypass access should only ever be added deliberately, for a specific named person, and that addition is itself a change worth reviewing.
7. Verify:
   ```
   gh api repos/<org>/<repo>/rulesets/<id> --jq '.rules'
   ```

### RDS credential handling for compute behind RDS Proxy
1. Enable `ManageMasterUserPassword` on the RDS instance so AWS rotates the master password into its own Secrets Manager secret (`rds!db-<resource-id>-...`) — never set a static master password.
2. Point RDS Proxy's `Auth` config at that same native managed secret (`AuthScheme=SECRETS`, `IAMAuth=DISABLED`), not a separately-maintained copy.
3. On the application side, do not store the database password as a static value in the app's own env-file secret. Instead, at every deploy and instance boot, look up the RDS instance's current `MasterUserSecret.SecretArn` and read the live credentials from it directly:
   ```
   DB_SECRET_ARN=$(aws rds describe-db-instances --db-instance-identifier <name> \
     --query "DBInstances[0].MasterUserSecret.SecretArn" --output text)
   aws secretsmanager get-secret-value --secret-id "$DB_SECRET_ARN" --query SecretString --output text
   ```
   A static copy will inevitably go stale the next time AWS rotates the password — this was the root cause of a real production outage.
4. Grant the compute's IAM role `secretsmanager:GetSecretValue` on `arn:aws:secretsmanager:<region>:<account>:secret:rds!db-*` (wildcard — the specific secret name changes on every instance replacement) and `rds:DescribeDBInstances` scoped to the specific instance ARN, not broader.

### Serving multiple hostnames from the same compute (nginx)
When a single set of instances behind one load balancer needs to serve more than one public hostname (e.g. an API and a static frontend build), use host-based nginx virtual hosts rather than a single catch-all — each hostname gets its own `server_name` block so the same instance behaves identically regardless of which hostname a request arrives for:
1. A `default_server` block (`server_name _`) for the API — this also catches health-check requests from the load balancer, which arrive without a real hostname.
2. An explicit `server_name <frontend-host>` block serving static files, with `try_files $uri /index.html` for SPA routing, immutable long-lived caching on content-hashed build assets, and `Cache-Control: no-cache` on `index.html` specifically (so a browser holding a cached shell can't reference asset filenames a later deploy has already removed).
3. If the AMI these instances launch from was ever snapshotted from another running instance, check `/etc/nginx/sites-enabled/` for stale leftover symlinks (regardless of filename, e.g. a `*.disabled` suffix has no actual meaning to nginx's `sites-enabled/*` include) before adding new site configs — a leftover duplicate `default_server` or duplicate `server_name` declaration will fail `nginx -t` at boot and, if wrapped in a `set -e` script, silently abort every step after it, including ever starting the application process.
4. If these instances sit behind a load balancer that already terminates TLS, do not add a `return 301 https://...` redirect on the plain-HTTP listener the load balancer forwards to — the load balancer has already handled the HTTPS requirement before the request ever reaches the instance, so redirecting again either loops or returns the wrong status code to a fraction of real requests (round-robinned across targets that may not all have the same bug).

---

*This document reflects the AWS account configuration as directly verified via the AWS CLI on 2026-08-01. Subsequent changes to any of the above should be reflected here as part of the change, not retroactively.*
