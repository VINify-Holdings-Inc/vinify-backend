# VINify Business Continuity and Recovery Policy

## Version History

| Version | Date | Author | Summary |
|---|---|---|---|
| 1.0 | 2026-08-08 | Betty Waiyego (Engineering Lead) | Initial version. Documents VINify's actual recovery mechanisms and test history as practiced, citing real artifacts (GitHub issue #57, AWS Backup, RDS Multi-AZ) rather than an idealized process. |
| 1.1 | 2026-08-08 | Betty Waiyego (Engineering Lead) | Adds Section 7, addressing cloud portability, interoperability, and exit strategy per KY3P BCOR32 — states real AWS lock-in plainly rather than overclaiming portability. |
| 1.2 | 2026-08-08 | Betty Waiyego (Engineering Lead) | Closes the untested-exit-runbook gap from v1.1: executed and verified a full production database export (`pg_dump`, all 15 tables), confirming data-export capability is real, not theoretical. |
| 1.3 | 2026-08-08 | Betty Waiyego (Engineering Lead) | Closes the untested-RPO gap from Section 3/6: executed a real write-loss test across a forced Multi-AZ failover (300 writes, 1 unacknowledged during the ~24s disruption, 0 acknowledged writes lost). RPO is now demonstrated, not just inferred. |
| 1.4 | 2026-08-12 | Betty Waiyego (Engineering Lead) | Closes the full-restore-test gap (distinct from failover, per KY3P BCOR30/BCOR12): restored the latest backup to a separate temporary instance via point-in-time restore, verified exact data integrity, measured real restore time (17m10s). Previous restore-test evidence (2026-07-25) no longer existed as an artifact; this is a fresh, current test. |

> This document is version-controlled via its git commit history in this repository. Each substantive review or change should be committed as a new entry above.

## 1. Purpose & Scope

This policy describes how VINify recovers from infrastructure failure, data loss, and service disruption for the systems that collect, store, process, or transfer client data — the production API, its database, and supporting infrastructure. It reflects what is actually built and tested today, not an aspirational future state.

## 2. Recovery Mechanisms

| Failure scenario | Mechanism | Source |
|---|---|---|
| Database instance/AZ failure | RDS Multi-AZ automatic failover to a synchronously-replicated standby | Confirmed live; measured failover time 24s (see Section 3) |
| Application instance failure | Auto Scaling Group detects and replaces the instance automatically, gated by real ALB/target-group health (not just EC2 status) | `AWS-Security-Setup-Guide.md` Section 2 |
| Data loss / corruption | Point-in-time recovery via continuous automated RDS backups (14-day window) plus daily AWS Backup snapshots (35-day retention, immutable) | `Data-Retention-Policy.md`; Vault Lock confirmed active 2026-08-08 |
| Backup deletion (accidental or malicious) | AWS Backup Vault Lock in Compliance mode — recovery points cannot be deleted or shortened by any principal, including root, before retention expires | Confirmed live 2026-08-08, lock permanent as of 2026-08-11 |
| Bad deploy / regression | Atomic-release deploy pattern with automated post-deploy health check and automatic rollback to the previous release | `Change-Management-Policy.md` Section 8 |
| Distributed denial of service | AWS Shield Standard (always-on, automatic) plus AWS WAF rate-based and managed rules on the load balancer | `AWS-Security-Setup-Guide.md` |

## 3. Recovery Objectives

Rather than state untested target numbers, this section reports what has actually been measured:

- **RDS Multi-AZ failover time (RTO):** 24 seconds, measured directly against the current network architecture (GitHub issue #57, 2026-07-31 re-test). An earlier test against the pre-migration architecture measured 243 seconds — the improvement reflects the completed network segmentation work, not a change in AWS's underlying mechanism.
- **RDS Multi-AZ data loss (RPO):** Tested 2026-08-08. A continuous write loop (300 inserts, one every 0.5s, against a disposable test table) ran through a forced Multi-AZ failover triggered mid-loop. Result: 299 of 300 writes were acknowledged as committed; the 1 failure was a client-side connection error during the ~21-second disruption window (consistent with the measured 24-second failover time), never acknowledged as committed in the first place. All 299 acknowledged writes were confirmed present in the table after the failover — zero data loss among confirmed commits. RPO is effectively 0, now demonstrated rather than only inferred from Multi-AZ's synchronous-replication design.
- **ASG self-healing time:** 123 seconds from instance termination to verified real application readiness (2026-07-31 re-test), with ASG's own health signal now accurate (health check type `EBS,ELB`) rather than lagging true readiness as it did in the first test.
- **Full backup restore time (RTO, backup-file scenario):** 17 minutes 10 seconds, measured 2026-08-12 — this is the distinct, slower recovery path used when the primary data itself is bad (corruption, ransomware, accidental deletion), where Multi-AZ failover doesn't help since the standby would carry the same corruption. Data integrity verified directly (exact row counts and field-level match against production), not assumed from a successful instance launch. See Section 4 for full detail.

## 4. Testing

A live failure-simulation test is conducted at least annually, covering RDS Multi-AZ failover and ASG self-healing at minimum. This is a real, exercised practice:

- **2026-07-27** — first test (GitHub issue #57). Both mechanisms passed. One finding: ASG health checks were EC2-level only, creating a ~131-second gap between AWS's "healthy" signal and true application readiness.
- **2026-07-31** — re-test against the completed network architecture. The prior finding was fully resolved (health check type upgraded to `EBS,ELB`); RDS failover time improved from 243s to 24s.
- **2026-08-12** — full backup restore test, distinct from failover: proves recovery from a backup *file* works, which is the scenario that matters when the primary data itself is bad (corruption, ransomware, accidental deletion) rather than just an AZ outage. Restored the latest automated backup of `mvmprod` to a separate, temporary RDS instance via point-in-time restore — never touched production. Total time from restore start to `available`: **17 minutes 10 seconds** (14:47:25 UTC → 15:04:35 UTC). Verified data integrity directly, not just that the instance turned on: row counts for `User`, `Login`, and `VinData` matched production exactly, and a full field-level comparison of the `User` record (userId, emailId, createdAt) matched byte-for-byte. Temporary instance deleted immediately after verification, no final snapshot retained (nothing to preserve beyond this record). **Outcome: Pass.**
- **Next scheduled test: 2027-07** (failover/self-healing), with a full restore test now included in that same annual cycle going forward rather than tested once and left undocumented.

Sign-off: Betty Waiyego (Engineering Lead) confirmed both tests' results as accurate. CEO sign-off (Bethanie Nonami) is requested on each test but has not yet been recorded as of this writing.

## 5. Roles & Responsibilities

- **Engineering Lead (Betty Waiyego):** owns this policy, conducts and documents the annual test, implements recovery mechanisms and remediates findings.
- **CEO (Bethanie Nonami):** named stakeholder for test sign-off, informed of any significant recovery-affecting change per `Change-Management-Policy.md` Section 5.

There is no separate, larger incident-response team today, consistent with VINify's current size — this is not a gap being hidden, it is the actual structure.

## 6. Known Limitations

- **Standalone instance (`i-065704b19bce21f09`) has no failover path.** DNS resolves to it directly rather than through the load balancer, so it is explicitly excluded from destructive failure testing — simulating its failure would cause a real outage, not exercise a recovery mechanism. This instance is planned for retirement.
- **No recurring cadence existed prior to this document** — the 2027-07 commitment in Section 4 is new as of this version.

## 7. Cloud Portability, Interoperability, and Exit Strategy

**Portable today:** the production database is standard RDS PostgreSQL (engine `postgres`, not Aurora) — no proprietary storage layer, exportable via native `pg_dump`/`pg_restore` to any PostgreSQL-compatible target. The application itself is standard Node.js/Express/TypeORM, with no AWS-proprietary runtime dependency in the request path.

**Real lock-in, stated plainly:** VINify's operational and security posture is deeply AWS-native — RDS Proxy, Secrets Manager credential rotation, GuardDuty/Security Hub/Inspector, AWS Backup Vault Lock, and the SSM-based access and deploy model. `deploy/remote-deploy.sh` calls the AWS CLI directly (e.g., to fetch rotated database credentials from Secrets Manager). Migrating to another provider would require rebuilding this operational layer, not just moving application code and data. Infrastructure is provisioned manually via the AWS CLI/console rather than as code (Terraform/CDK is not in use — see `SDLC-Policy.md`), so there is no automated, portable infrastructure definition to redeploy elsewhere; rebuilding would follow `AWS-Security-Setup-Guide.md`'s manual procedures.

**Exit capability — tested 2026-08-08:** a full logical export of the production database was executed and verified: `pg_dump` (client v17.10, matched to the server's v17.9 to avoid version-skew failures) against `mvmprod`, producing a complete, standard SQL dump of all 15 tables (104KB). Exit code 0, no errors. The dump file was verified and then securely deleted (`shred -u`) immediately after verification, consistent with not persisting a full export of client data at rest outside of the controlled backup mechanisms in Section 2. This confirms the data-export half of an exit plan is real and working, not theoretical.

Infrastructure recreation is the remaining half: `deploy/asg-bootstrap.sh` is itself a portable, non-AWS-proprietary artifact (bash, nginx, PM2, npm) that could be adapted to boot on another provider's compute with modification to the handful of AWS CLI calls it makes (fetching CloudWatch config and rotated DB credentials); `AWS-Security-Setup-Guide.md` Section 5 documents the manual provisioning steps for the AWS-specific pieces (security groups, RDS, IAM). Neither has been executed end-to-end against a non-AWS target — that remains the honest scope of what's not yet proven, distinct from data portability, which now is.

## 8. Review Cadence

Reviewed at minimum annually, timed to coincide with the BCP/DR test in Section 4, and whenever the underlying infrastructure changes materially (e.g., the standalone instance's retirement, which will remove the Section 6 limitation). Each review is recorded as a new version-history entry above.
