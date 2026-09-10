# VINify Data Retention Policy

## Version History

| Version | Date | Author | Summary |
|---|---|---|---|
| 1.0 | 2026-08-06 | Betty Waiyego (Engineering Lead) | Initial version. Establishes retention periods per data classification tier (see [Data-Governance-and-Classification-Policy.md](Data-Governance-and-Classification-Policy.md)) and documents current enforcement status against them. |
| 1.1 | 2026-08-06 | Betty Waiyego (Engineering Lead) | Closed the CloudTrail log-expiration gap identified in v1.0's Section 3 — applied a lifecycle policy to the live trail's destination bucket. |
| 1.2 | 2026-08-06 | Betty Waiyego (Engineering Lead) | Closed all remaining Section 4 gaps: applied a lifecycle policy to `sensitivedatavin`; built and deployed automated RDS manual-snapshot cleanup (Lambda + daily EventBridge schedule); built the account-closure mechanism and the scheduled job that hard-deletes `User`/`Login`/`ContactUs` data per Section 3's retention periods; increased automated backup retention from 1 to 14 days (see rationale below) and deleted a stale orphaned manual snapshot from an unrelated, no-longer-existing instance. |
| 1.3 | 2026-08-08 | Betty Waiyego (Engineering Lead) | Corrects a stale claim in Section 4: the account-closure/retention-cron code was recorded as "staged, not yet deployed," but had since actually been merged and deployed (PR #67) — confirmed live via direct process inspection. Documentation now matches reality. |
| 1.4 | 2026-09-07 | Betty Waiyego (Engineering Lead) | Closed a defect in the S3 expiration rules. All three buckets are versioned, so the 365-day expiration rule only wrote delete markers — prior versions persisted indefinitely and storage was never released. Added `NoncurrentVersionExpiration` (30 days) to each. Also disabled a self-referential access-logging loop on `aws-cloudtrail-logs-010526276308-84f7f580`, and recorded that bucket in Section 4 (previously undocumented). |
| 1.5 | 2026-09-08 | Betty Waiyego (Engineering Lead) | Stops claiming the 90-day Standard-IA transition as a control. The rule exists but does not fire: the objects are far below the bucket's 128 KB minimum transition size. Retention rests on the 365-day expiration alone, which is unaffected. |

> This document is version-controlled via its git commit history in this repository. Each substantive review or change should be committed as a new entry above.

## 1. Purpose & Scope

This policy defines how long VINify retains data, by classification tier, and when/how it is disposed of. It covers production application data, database backups, and audit logs.

## 2. Applicable Legal & Regulatory Requirements

- **Driver's Privacy Protection Act (DPPA, 18 U.S.C. § 2721 et seq.) / NMVTIS access agreement** — governs `VinData`/vehicle title records sourced via the National Motor Vehicle Title Information System (AAMVA). Retention for this data is scoped to VINify's permitted use under its NMVTIS access agreement; VINify does not hold this data longer than that agreement permits, independent of any internally-set retention period.
- **Audit log retention baseline** — CloudTrail audit logs are retained 365 days, aligned with the common minimum retention window expected under standard security/compliance frameworks (e.g., SOC 2-style continuous monitoring evidence) for security-relevant audit trails.
- **General personal information (`User`, `Login`, `ContactUs`)** — no specific named statute currently applies beyond DPPA's scope above; retention periods for this data (Section 3) are set by internal policy following standard data-minimization practice (retain only as long as needed for the purpose collected), not a specific external mandate. If VINify begins operating in a jurisdiction with its own applicable data retention/deletion statute (e.g., a state privacy law), this section should be updated to reflect that assessment rather than left as-is.

## 3. Retention Periods by Classification

| Classification | Data | Retention |
|---|---|---|
| Restricted | `User`, `Login` (account/credential data) | Retained for the life of the account, plus 90 days after account closure/deletion request, then permanently deleted. |
| Restricted | `ContactUs` (inquiry submissions) | Retained 2 years from submission, then permanently deleted, unless part of an active support matter. |
| Restricted | `VinData` / vehicle title records (NMVTIS-sourced) | Retained per VINify's permitted use under its NMVTIS/AAMVA access agreement; not held longer than that agreement permits. |
| Internal | Reference/lookup tables (`master_brand`, `master_url`, `master_state`) | Retained indefinitely — not personal or regulated data, and represents current operational reference state, not a historical record. |
| Confidential | Source code, infrastructure configuration | Retained indefinitely in version control (git history is the record of change, not a disposal candidate). |
| N/A | RDS automated backups | 14 days (AWS automated backup retention setting) — chosen to cover realistic detection lag for a logical data-loss incident (e.g., a bad deploy or bad query not noticed until after a weekend), not just the technical point-in-time-recovery capability, which works to any second within the window regardless of length. |
| N/A | RDS manual snapshots | 30 days by default, then automatically deleted, unless tagged `Keep=true` for a deliberate exception (e.g., a long-term archival snapshot). |
| N/A | CloudTrail audit logs | 365 days, then deleted (see Section 4). |

## 4. Implementation Status — what's actually enforced today

Being direct about the gap between this policy and current technical enforcement, so it's an accurate record rather than an aspirational claim:

| Control | Status |
|---|---|
| RDS automated backup retention (14 days) | ✅ Enforced — `BackupRetentionPeriod: 14` on `mvmprod` (increased from 1 day 2026-08-06). |
| CloudTrail log expiration (365 days) | ✅ Enforced (fixed 2026-08-06). The live production trail's destination bucket (`aws-cloudtrail-logs-010526276308-aebc7a08`) has a 365-day expiration rule, plus `NoncurrentVersionExpiration` (30 days) added 2026-09-07 — the bucket is versioned, so expiration alone did not release storage. The rule also carries a 90-day Standard-IA transition, but this is inert and is not claimed as a control: CloudTrail objects here average ~10.7 KB against the bucket's 128 KB minimum transition size, so they do not qualify. Forcing them to transition would cost more than it saves, since Standard-IA bills a 128 KB minimum per object. |
| Automated deletion of `User`/`Login`/`ContactUs` data per the periods in Section 3 | ✅ **Implemented 2026-08-06, deployed and verified live 2026-08-08.** `CloseAccount` endpoint (`POST /api/close-account`) sets `User.deactivatedAt`; `DataRetentionCronJob` runs daily and hard-deletes `User`/`Login` rows 90 days after closure and `ContactUs` rows 2 years after submission. Schema migration applied to production; deployed via PR #67 and confirmed running via direct process inspection on both production hosts (previously staged but not deployed — closed the same deploy-staleness bug documented in `Change-Management-Policy.md` Section 7 prevented this exact code from taking effect until it was found and fixed). |
| RDS manual snapshot cleanup | ✅ **Automated 2026-08-06.** Lambda `rds-manual-snapshot-cleanup`, triggered daily via EventBridge, deletes manual snapshots of `mvmprod` older than 30 days unless tagged `Keep=true`. Test-invoked and confirmed working. |
| `sensitivedatavin` S3 bucket | ✅ Enforced 2026-08-06 — 365-day expiration lifecycle rule, plus `NoncurrentVersionExpiration` (30 days) added 2026-09-07 for the same reason. |
| `aws-cloudtrail-logs-010526276308-84f7f580` | ✅ Same 365-day expiration rule and noncurrent-version expiration as the live trail bucket. Despite the name, this bucket holds S3 server access logs, not CloudTrail logs — no trail writes to it. It had been configured to log its own access back to itself; that loop was disabled 2026-09-07. Pre-existing objects age out under the rules above. |

## 5. Disposal Method

Where deletion is automated (RDS snapshot deletion, S3 lifecycle expiration), AWS's native deletion mechanisms are used — these are not simply "hidden" from the application; the underlying storage is released.

On a versioned bucket this requires `NoncurrentVersionExpiration` alongside the expiration rule: expiration on its own writes a delete marker and the prior version persists. Every S3 bucket covered by this policy is versioned and now carries both. For application-level record deletion (implemented per Section 4), deletion means a hard delete of the row, not a soft-delete flag, for Restricted-tier data specifically.

## 6. Review Cadence

Reviewed whenever retention requirements change (new data type, new regulatory obligation, new business need) and at minimum annually alongside the [Data Governance & Classification Policy](Data-Governance-and-Classification-Policy.md). Each review is recorded as a new version-history entry above, and Section 4's implementation status is updated to reflect what has actually been closed versus what remains open — not left showing stale gaps once they're fixed.

---

*This document reflects VINify's data retention policy and the verified state of its enforcement as of 2026-09-08. Subsequent changes should be reflected here as part of the change, not retroactively.*
