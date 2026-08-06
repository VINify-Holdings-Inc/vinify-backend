# VINify Data Governance & Classification Policy

## Version History

| Version | Date | Author | Summary |
|---|---|---|---|
| 1.0 | 2026-08-06 | Betty Waiyego (Engineering Lead) | Initial version. Establishes VINify's data classification tiers, maps them to the actual data held in production, identifies applicable regulatory obligations, and assigns data ownership. |

> This document is version-controlled via its git commit history in this repository. Each substantive review or change should be committed as a new entry above.

## 1. Purpose & Scope

This policy governs how VINify classifies, handles, and protects the data it processes, and assigns ownership for that data. It applies to all production data stores, backups, and any system with access to them (see [AWS-Security-Setup-Guide.md](AWS-Security-Setup-Guide.md) for the technical controls enforcing this policy).

## 2. Data Classification Levels

VINify classifies data into four levels, based on sensitivity and the impact of unauthorized disclosure:

| Level | Definition | Handling baseline |
|---|---|---|
| **Public** | Information intended for public consumption; no confidentiality requirement. | No special controls required. |
| **Internal** | Non-sensitive operational data; disclosure would cause minor business impact but no harm to individuals. | Access limited to authenticated internal systems/staff; not exposed publicly. |
| **Confidential** | Business data whose disclosure could cause meaningful harm (competitive, operational, or reputational). | Access restricted by role; encrypted at rest and in transit. |
| **Restricted** | Personal information and regulated data whose disclosure could cause harm to an individual or violate a specific legal obligation. | Strictest access control (least privilege, security-group-scoped), encrypted at rest and in transit, access logged, retained only as long as necessary. |

## 3. Data Inventory & Classification Mapping

The following maps VINify's actual production data (as implemented in `mvmprod`) to the levels above:

| Data / table | Classification | Why |
|---|---|---|
| `User` — name, email, secondary email, phone, physical address, company, title | **Restricted** | Personal information identifying an individual. |
| `Login` — email, password hash, login token | **Restricted** | Authentication credentials. Passwords are hashed with bcrypt, not stored in plaintext (migrated from an earlier plaintext scheme — see git history, `security/bcrypt-password-hashing`). |
| `ContactUs` — name, email, phone, message | **Restricted** | Personal information submitted by inquirers. |
| `VinData` / `vehicle_data` — VIN, title brand alerts (lien, impound, export, etc.), associated dates | **Restricted** | Vehicle title/history data sourced via NMVTIS (AAMVA) — see Section 4, this is subject to specific federal handling obligations, independent of whether it identifies a person directly. |
| `master_brand`, `master_url`, `master_state` — reference/lookup tables | **Internal** | Static reference data with no personal or regulated content. |
| `DashboardDataList`, `LastFileProcess`, `SingleSoapDataToPdf`, `VinCreateList`, temp processing tables | **Internal** | Operational/processing state, not independently sensitive beyond the classification of the data they reference. |
| Application source code, infrastructure configuration | **Confidential** | Business-sensitive; access limited to authorized engineers via the controls in the Security Setup Guide. |

## 4. Regulatory Considerations

- **Driver's Privacy Protection Act (DPPA, 18 U.S.C. § 2721 et seq.)** — VINify integrates with the National Motor Vehicle Title Information System (NMVTIS, operated by AAMVA) to source vehicle title brand history (`VinData`/`vehicle_data`). DPPA governs the permissible use and redisclosure of personal information obtained from motor vehicle records. VinData handling is scoped to VINify's permitted use case under its NMVTIS access agreement; this data is not redisclosed outside that permitted use.
- **General personal information handling** — `User`, `Login`, and `ContactUs` data (names, emails, phone numbers, physical addresses, credentials) is treated as Restricted regardless of a specific named statute, consistent with standard data protection practice: collected only for the purpose provided, access-limited, encrypted, and not sold or shared with third parties outside the service's operation.
- This section reflects VINify's current data flows as verified in this document's version above. If VINify begins operating in a jurisdiction with a specific applicable data protection statute (e.g., a state privacy law), this section should be updated to reflect that assessment rather than left as-is.

## 5. Data Ownership & Responsibilities

- **Engineering Lead (Betty Waiyego)** is the data owner and steward for all production data described in Section 3 — accountable for classification accuracy, access-control enforcement, and this policy's currency.
- **Access control enforcement**: implemented via the technical controls documented in [AWS-Security-Setup-Guide.md](AWS-Security-Setup-Guide.md) — IAM least privilege, security-group-scoped database access (no direct internet access to `mvmprod`), Secrets Manager for all credentials, and encryption at rest (RDS/S3) and in transit (TLS).
- **Any new data type or table added to production** must be classified per Section 2 and added to Section 3's inventory as part of that change, not retroactively.

## 6. Review Cadence

This policy is reviewed whenever the data inventory changes materially (new data types, new regulatory exposure, new integrations) and at minimum annually. Each review is recorded as a new version-history entry above.

---

*This document reflects VINify's data governance policy and the production data model as directly verified in the codebase and database on 2026-08-06.*
