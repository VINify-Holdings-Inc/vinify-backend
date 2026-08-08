# VINify Change Management Policy

## Version History

| Version | Date | Author | Summary |
|---|---|---|---|
| 1.0 | 2026-08-06 | Betty Waiyego (Engineering Lead) | Initial version. Documents the actual change management mechanism enforced today (git, pull requests, CI/CD, CloudTrail) and identifies what is not yet formally captured. |
| 1.1 | 2026-08-06 | Betty Waiyego (Engineering Lead) | Closed two of the three gaps identified in v1.0's Open Gaps section: added a PR template (both repos) requiring security impact, affected components, testing performed, and rollback plan on every future change; removed the redundant, weaker branch protection ruleset on `vinify-backend`. The automated-test-suite gap remains open. |
| 1.2 | 2026-08-08 | Betty Waiyego (Engineering Lead) | Documents a deployment-reliability bug found and fixed during DAST remediation (Section 7): `pm2 reload` was not actually loading new releases, so the post-deploy health check had been passing against stale code across multiple prior deploys. Also closes the DAST/security-headers gap with real before/after evidence (Section 10). |
| 1.2 | 2026-08-06 | Betty Waiyego (Engineering Lead) | Added a definition of significant change, segregation-of-duties requirements, and notification requirements, per compliance review. Disclosed a real segregation-of-duties limitation rather than claiming it's fully solved (Section 4). |
| 1.3 | 2026-08-08 | Betty Waiyego (Engineering Lead) | Partially closes the automated-test-suite gap from v1.1: Jest configured and wired into CI as a required, enforced gate, with real (not placeholder) initial coverage — see Section 7 and Section 10 for the honestly-scoped remaining work. |

> This document is version-controlled via its git commit history in this repository. Each substantive review or change should be committed as a new entry above.

## 1. Purpose & Scope

This policy describes how changes to VINify's application code and AWS infrastructure are defined, authorized, tested, deployed, rolled back if needed, and recorded, and identifies the audit trail each of those steps produces.

## 2. What Counts as a Significant Change

Not every change carries the same risk, and this policy doesn't treat them identically. A change is **significant** if it meets any of the following:

- Affects production availability or introduces planned downtime
- Changes how customer or personal data is accessed, stored, or transmitted (e.g., network/database architecture changes, encryption configuration, credential handling)
- Changes authentication, authorization, or access-control behavior
- Introduces a new third-party integration or dependency with access to production data
- Changes infrastructure architecture (network segmentation, compute topology, DNS)
- Cannot be fully reverted by the standard automatic rollback (Section 7) — e.g., a database schema migration

Everything else (routine bug fixes, UI changes, dependency patches without behavioral impact, documentation) is a routine change — it still goes through the standard PR process (Section 3), but does not require the additional notification step (Section 5).

## 3. Change Authorization

Every change to `main` in either repository must go through a pull request enforced by a repository ruleset (verified via `gh api repos/<org>/<repo>/rulesets`):
- At least 1 approving review required
- Review from a code owner required (`CODEOWNERS`)
- All review conversation threads must be resolved before merge
- Direct pushes and force-pushes to `main` are blocked

This satisfies advance authorization by a designated reviewer before any change reaches production — no change merges without it, enforced by GitHub, not by convention.

## 4. Segregation of Duties

Policy requirement: the person who authors a change must not be the same person who approves it. This is enforced technically, not just by convention — GitHub blocks a PR author from approving their own pull request, and branch protection requires a code-owner approval before merge (Section 3).

**Being direct about a real current limitation, not claiming this is fully solved:** `vinify-backend` currently has exactly two accounts with repository access — Betty Waiyego's own account and a legacy account (`FraudStopperVIN`) that she also personally controls, which `CODEOWNERS` names as the sole reviewer for the entire repository. GitHub's technical control prevents one *account* from approving its own PR, but it cannot prevent one *person* from authoring under one account and approving under a second account they also control. For a team of this size today, that means segregation of duties is enforced at the account level but not fully at the individual level. This is a known, disclosed limitation — not something to claim is fully resolved. As the team grows, `CODEOWNERS` should be updated to reflect actual distinct individuals per area of ownership, and the legacy shared-access account's role should be revisited (tracked separately, not yet done).

## 5. Notification Prior to Significant Change

For any change meeting the Section 2 definition of significant: internal notification (to the Engineering Lead and, for changes affecting availability or data handling, to the CEO) is required in advance, via the PR description's security-impact field (Section 9) at minimum, before merge.

**Customer notification**: VINify does not yet have live customer traffic, so this requirement has not yet been exercised in practice. The policy commitment going forward is: customers will be notified in advance of any significant change with a reasonably foreseeable impact on their access to the service (e.g., planned downtime), with the notice period scaled to the impact — this needs a defined channel (status page, email, etc.) to be established before there are real customers depending on it, which is a genuine open item, not yet built.

## 6. The Audit Trail — what actually records every change

| Change type | Audit trail |
|---|---|
| Application code | Git commit history (author, timestamp, diff) — immutable, in [vinify-backend](https://github.com/VINify-Holdings-Inc/vinify-backend) and [vinify-frontend](https://github.com/VINify-Holdings-Inc/vinify-frontend). |
| Pull request review/approval | GitHub PR history — records who approved, when, and any review comments/thread resolutions, permanently tied to the merge commit. |
| Deployment to production | GitHub Actions workflow run history — every deploy is a timestamped run tied to a specific commit SHA, with pass/fail recorded. |
| AWS infrastructure changes | AWS CloudTrail (`vinify-audit-trail`, multi-region, always logging) — records the specific API call, the identity that made it, the source, and the timestamp for every change made via the CLI or console. See [AWS-Security-Setup-Guide.md](AWS-Security-Setup-Guide.md) Section 4. |

## 7. Testing Prior to Implementation

Being direct about what this actually covers today:

- ✅ **Type-checking** runs in CI on every push (`npx tsc --noEmit`) — catches type errors before deploy.
- ✅ **Post-deploy health check with automatic rollback** — `deploy/remote-deploy.sh` polls the newly-deployed release for a healthy HTTP response after cutover; if it fails, the previous release is automatically restored and the failed deploy is marked failed. This is real and has been exercised in production, not theoretical.

  **Known limitation found and fixed (2026-08-08):** this health check cannot distinguish "new code is healthy" from "old code is still healthy" — which is exactly what happened. The deploy script used `pm2 reload`, which restarts the worker in place without re-resolving its working directory against the new release symlink. Direct process inspection on both production hosts found them still running releases from 2026-07-25 and 2026-08-06 respectively, despite several deploys reporting success in between. Fixed by switching to `pm2 delete` + `pm2 start` on every deploy, which forces a fresh resolution of the current release; verified by direct process inspection after the next deploy, not by trusting the health check alone.
- ✅ **Automated test suite (added 2026-08-08)** — Jest, configured and CI-enforced (a failing test blocks deployment, same as a failing type-check). Initial coverage is real, not placeholder: 15 passing tests over the security-relevant pure helper logic (encryption round-trips, token generation, data-diffing helpers). Scope is a genuine first increment, not comprehensive — controller-level logic isn't covered yet, which remains real, ongoing work rather than a documentation update.
- ✅ **DAST scanning (added 2026-08-08)** — weekly OWASP ZAP baseline scan against production (`.github/workflows/dast-scan.yml`). First scan found 12 findings (missing security headers, framework/version disclosure, wildcard CORS); a follow-up scan against production confirmed 11 of 12 resolved, with the last one being informational rather than a real gap (see SDLC-Policy.md Section 6 for the full breakdown).

## 8. Rollback Procedure

Defined and already proven in production: `deploy/remote-deploy.sh` keeps the previous release directory intact during every deploy. If the post-deploy health check fails, the symlink is repointed back to the previous release and the application is reloaded — automatically, without manual intervention. The failed release directory is retained (not deleted) for investigation. This mechanism has been exercised for real during this project (see BCP/DR test results, GitHub issue #57, for the related but distinct ASG self-healing test).

## 9. Security Impact Analysis & Affected-Component Identification

Closed 2026-08-06: both repositories (`vinify-backend`, `vinify-frontend`) now have a `.github/PULL_REQUEST_TEMPLATE.md` that requires every PR to explicitly state its security impact, list affected components, describe testing performed, and confirm a rollback plan before it can be opened with a filled-in description. This applies to every change from this point forward; it does not retroactively apply to past PRs, which is why Section 6's audit trail for older changes won't show this level of structure.

## 10. Open Gaps

| Gap | Status |
|---|---|
| Automated test suite | **Partially closed (2026-08-08).** See Section 7 — real, CI-enforced coverage now exists for pure helper logic. Extending coverage to controller-level business logic remains open. |
| DAST / security headers | **Closed (2026-08-08).** See Section 7 — 11 of 12 findings resolved and verified against production. |
| Segregation of duties enforced at account level only, not individual level | **Open.** See Section 4 — the sole code owner account is also accessible by the same individual who authors most changes. Needs a distinct second reviewer as the team grows. |
| No established customer notification channel for significant changes | **Open.** See Section 5 — not yet needed since there's no live customer traffic, but not yet built either. |

## 11. Review Cadence

Reviewed whenever the deploy/CI process changes materially, and at minimum annually. Each review is recorded as a new version-history entry above, and Section 10 is updated to reflect what has actually been closed versus what remains open.

---

*This document reflects VINify's change management process and its actual current enforcement as verified on 2026-08-06. Subsequent changes should be reflected here as part of the change, not retroactively.*
