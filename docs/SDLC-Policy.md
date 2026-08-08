# VINify System Development Lifecycle (SDLC) Policy

## Version History

| Version | Date | Author | Summary |
|---|---|---|---|
| 1.0 | 2026-08-08 | Betty Waiyego (Engineering Lead) | Initial version. Documents VINify's actual development lifecycle as practiced, citing real artifacts and tooling rather than an idealized process. |
| 1.1 | 2026-08-08 | Betty Waiyego (Engineering Lead) | Closes the automated-test-suite gap identified in v1.0's Section 6/8 with a real, first increment: Jest configured, wired into CI as a required gate, 15 passing tests covering the security-relevant pure helper logic. Scope of what's still uncovered stated plainly, not left implied as resolved. |
| 1.2 | 2026-08-08 | Betty Waiyego (Engineering Lead) | Adds DAST (dynamic application security testing) to Section 6, with real before/after scan results. Documents a deployment-reliability bug found and fixed during this work (Section 7): `pm2 reload` was not picking up new releases, so multiple prior "successful" deploys had silently not taken effect in production. |

> This document is version-controlled via its git commit history in this repository. Each substantive review or change should be committed as a new entry above.

## 1. Purpose & Scope

This policy describes the lifecycle a change to VINify's application or infrastructure goes through, from initiation to production. It reflects VINify's actual size and process today — a small engineering team using git, GitHub, and CI/CD as the enforcement mechanism — not a larger-organization process VINify doesn't run.

## 2. Initiation

A change is initiated when a need is identified — a bug, a security finding, a compliance requirement, or a planned improvement — and captured as a GitHub issue or directly as a branch/PR for smaller items. Significant changes (see [Change-Management-Policy.md](Change-Management-Policy.md) Section 2 for the definition) are captured as an issue first (e.g., GitHub issue #57 for the BCP/DR test) rather than going straight to a branch, so there's a record of the "why" independent of the eventual diff.

**Being direct**: there is no formal intake/prioritization board today — initiation is informal for routine work, consistent with the team's current size.

## 3. Planning

For significant changes, a written plan is produced before implementation begins. This is a real, exercised practice, not aspirational: the entire network segmentation migration (RDS, ASG, subnet architecture) was planned in `docs/plan.md` before any infrastructure change was made, with explicit scope, sequencing, and success criteria. Routine changes (bug fixes, small features) do not require a written plan — the PR description serves as the planning record for those.

## 4. Design

Design decisions for infrastructure and architecture are documented as they're made — see [AWS-Security-Setup-Guide.md](AWS-Security-Setup-Guide.md) and [architecture-diagram.md](architecture-diagram.md), both of which are updated as part of the change that necessitated them, not retroactively. For application code, design review happens through the pull request process (Section 6) rather than a separate upfront design-review step; the PR template (`.github/PULL_REQUEST_TEMPLATE.md`) requires stating affected components before a change is even opened.

## 5. Secure Coding

- Passwords are hashed with bcrypt, never stored in plaintext (migrated from an earlier plaintext scheme — verified via git history, `security/bcrypt-password-hashing`).
- Database queries use TypeORM's parameterized query methods and query builder (`:param` binding) throughout. The only raw SQL string interpolation in the codebase uses hardcoded, internal values (stored procedure names, TypeORM's own table metadata) — never user-supplied input — verified directly against the codebase.
- Static analysis (GitHub CodeQL) runs automatically against the codebase, scanning for known vulnerability patterns.
- Every PR requires an explicit security-impact statement (Section 6) before merge — not optional, enforced by the PR template.
- Credentials are never committed to source control — retrieved from AWS Secrets Manager at runtime (see Security Setup Guide, Section 3).

## 6. Testing

Type-checking runs in CI on every push, and a post-deploy health check with automatic rollback verifies the deployed release actually works before considering a deploy complete.

**Automated test suite (added 2026-08-08):** Jest is now configured (`jest.config.js`, `tsconfig.test.json`) and runs as a required CI step (`.github/workflows/deploy.yml`, "Run tests") — a failing test blocks deployment, the same as a failing type-check. Initial coverage focuses on `src/helpers/utils.ts`: the AES-256-CBC encrypt/decrypt round-trip (including that it fails loudly on malformed input rather than silently, and that repeated calls produce different ciphertext), token generation, profile-completion scoring, and the VIN-diffing/filtering helpers — 15 tests, all passing.

**Being direct about scope**: this is a genuine first increment, not comprehensive coverage. It covers the pure, security-relevant helper logic that didn't require database mocking. Controller-level logic (login, account closure, the data retention cron job) is not yet covered — extending coverage there is real, ongoing work, not a documentation update.

**DAST (dynamic application security testing, added 2026-08-08):** a weekly OWASP ZAP baseline scan (`.github/workflows/dast-scan.yml`) runs against `https://api.getvinify.com`, plus on-demand via `workflow_dispatch`. The first scan surfaced 12 findings: missing security headers (`X-Content-Type-Options`, anti-clickjacking, HSTS, CSP, `Permissions-Policy`), a leaked `Server` version and `X-Powered-By` framework disclosure, a wildcard CORS policy, and a cross-domain misconfiguration. Remediated via application changes (`app.disable("x-powered-by")`, CORS restricted to `https://app.getvinify.com`) and nginx-level security headers on both production hosts. Verified with a follow-up scan against production: **11 of 12 findings resolved**; the one remaining (`Non-Storable Content`, ZAP rule 10049) is informational, not a security gap — it's ZAP noting the root response *could* be cached for a performance benefit since it holds no sensitive data, which we're intentionally declining in favor of a blanket `no-store` policy across the API.

## 7. Implementation

Every change merges through a pull request enforced by branch protection (minimum 1 approving review, code owner review, all threads resolved — see Security Setup Guide, Section 1) before reaching `main`. Merging triggers GitHub Actions, which deploys via SSM to production compute using an atomic-release pattern: a fresh release directory per deploy, symlink cutover, and automatic rollback to the previous release if the post-deploy health check fails. This rollback mechanism is real and has been exercised in production, not theoretical. Infrastructure changes follow the same pattern where code-managed (Terraform/CDK is not in use; infrastructure changes are made directly via the AWS CLI/console and documented in the Security Setup Guide as part of the change).

**Deployment-reliability bug found and fixed (2026-08-08):** while verifying the DAST fix above, discovered that `deploy/remote-deploy.sh` used `pm2 reload`, which restarts the worker process in place but does not re-resolve its working directory or script path against the new release. Both production hosts were confirmed (via direct process inspection) to still be running releases from 2026-07-25 and 2026-08-06 respectively, despite multiple deploys reporting success in between — the post-deploy health check passed because the *old* code was still healthy, not because the new code was live. Fixed by changing the deploy script to `pm2 delete` + `pm2 start` on every deploy, which forces PM2 to re-resolve the current release. Verified fixed by direct process inspection after the next deploy.

## 8. Open Gaps

| Gap | Status |
|---|---|
| Automated test suite | **Partially closed (2026-08-08).** See Section 6 — real coverage exists and is CI-enforced, but scope is limited to pure helper logic so far. Extending to controller-level logic remains open, ongoing work. |
| DAST / security headers | **Closed (2026-08-08).** See Section 6 — 11 of 12 ZAP findings resolved and verified against production; the remaining one is informational, not a gap. |
| No formal intake/prioritization process | **Open, low priority** given current team size — informal initiation works at this scale but should be revisited if the team grows. |

## 9. Review Cadence

Reviewed whenever the development process changes materially, and at minimum annually alongside [Change-Management-Policy.md](Change-Management-Policy.md). Each review is recorded as a new version-history entry above.

---

*This document reflects VINify's actual development lifecycle as directly verified against the codebase and GitHub configuration on 2026-08-08.*
