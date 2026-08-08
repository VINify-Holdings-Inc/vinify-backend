# VINify Data Retention Policy

## Version History

| Version | Date | Author | Summary |
|---|---|---|---|
| 1.0 | 2026-08-06 | Betty Waiyego (Engineering Lead) | Initial version. Establishes retention periods per data classification tier (see [Data-Governance-and-Classification-Policy.md](Data-Governance-and-Classification-Policy.md)) and documents current enforcement status against them. |
| 1.1 | 2026-08-06 | Betty Waiyego (Engineering Lead) | Closed the CloudTrail log-expiration gap identified in v1.0's Section 3 — applied a lifecycle policy to the live trail's destination bucket. |
| 1.2 | 2026-08-06 | Betty Waiyego (Engineering Lead) | Closed all remaining Section 4 gaps: applied a lifecycle policy to `sensitivedatavin`; built and deployed automated RDS manual-snapshot cleanup (Lambda + daily EventBridge schedule); built the account-closure mechanism and the scheduled job that hard-deletes `User`/`Login`/`ContactUs` data per Section 3's retention periods; increased automated backup retention from 1 to 14 days (see rationale below) and deleted a stale orphaned manual snapshot from an unrelated, no-longer-existing instance. |

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
| N/A | CloudTrail audit logs | 365 days, then deleted (see Section 4 for current enforcement gap). |

## 4. Implementation Status — what's actually enforced today

Being direct about the gap between this policy and current technical enforcement, so it's an accurate record rather than an aspirational claim:

| Control | Status |
|---|---|
| RDS automated backup retention (14 days) | ✅ Enforced — `BackupRetentionPeriod: 14` on `mvmprod` (increased from 1 day 2026-08-06). |
| CloudTrail log expiration (365 days) | ✅ Enforced (fixed 2026-08-06). The live production trail's destination bucket (`aws-cloudtrail-logs-010526276308-aebc7a08`) now has the same 365-day expiration / 90-day IA transition rule already used elsewhere in the account. |
| Automated deletion of `User`/`Login`/`ContactUs` data per the periods in Section 3 | ✅ **Implemented 2026-08-06.** `CloseAccount` endpoint (`POST /api/close-account`) sets `User.deactivatedAt`; `DataRetentionCronJob` runs daily and hard-deletes `User`/`Login` rows 90 days after closure and `ContactUs` rows 2 years after submission. Schema migration applied to production. Pending: normal deploy of this code to production (currently staged, not yet merged/deployed — see note below). |
| RDS manual snapshot cleanup | ✅ **Automated 2026-08-06.** Lambda `rds-manual-snapshot-cleanup`, triggered daily via EventBridge, deletes manual snapshots of `mvmprod` older than 30 days unless tagged `Keep=true`. Test-invoked and confirmed working. |
| `sensitivedatavin` S3 bucket | ✅ Enforced 2026-08-06 — 365-day expiration lifecycle rule applied. |

## 5. Disposal Method

Where deletion is automated (RDS snapshot deletion, S3 lifecycle expiration), AWS's native deletion mechanisms are used — these are not simply "hidden" from the application; the underlying storage is released. For application-level record deletion (once implemented per Section 4's action items), deletion means a hard delete of the row, not a soft-delete flag, for Restricted-tier data specifically.

## 6. Review Cadence

Reviewed whenever retention requirements change (new data type, new regulatory obligation, new business need) and at minimum annually alongside the [Data Governance & Classification Policy](Data-Governance-and-Classification-Policy.md). Each review is recorded as a new version-history entry above, and Section 4's implementation status is updated to reflect what has actually been closed versus what remains open — not left showing stale gaps once they're fixed.

---

*This document reflects VINify's data retention policy and the verified state of its enforcement as of 2026-08-06. Subsequent changes should be reflected here as part of the change, not retroactively.*
