# VINify AWS & System Security Setup Guide

## Version History

| Version | Date | Author | Summary |
|---|---|---|---|
| 1.0 | 2026-07-27 | Betty Waiyego (Engineering Lead) | Initial version. Documents the AWS security configuration as implemented and verified in the production account as of this date. |

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

### VPC
- `vinify-prod-vpc` — `172.31.0.0/16`, single VPC, single AWS account, `us-east-1`.

### Public subnets
- Six public subnets (one per Availability Zone), each with a route to an Internet Gateway. These host:
  - The internet-facing Application Load Balancer (`VIN-instance-loadbalancer`), terminating TLS (see Section 3) and forwarding to the application target group. Currently active in 2 of the 6 AZs.
  - Production EC2 compute (a long-running reference instance plus Auto Scaling Group members).

### Private subnets (network segmentation)
- Four additional private subnets have been provisioned, split into two tiers, each spanning 2 Availability Zones:
  - **Private application subnets** — route `0.0.0.0/0` via a dedicated NAT Gateway (outbound-only internet access for package installs, source control, and third-party API calls; no direct inbound path from the internet).
  - **Private data subnets** — no internet route at all, not even via NAT.
- Migration of the production database and Auto Scaling Group compute into these private subnets is in progress as part of an active network-segmentation project.

### Database
- The production database (`mvmprod`, PostgreSQL, Multi-AZ) is **not publicly accessible** (`PubliclyAccessible: false`) and accepts inbound connections only from the application-tier security group.

### Compute elasticity
- The Auto Scaling Group (`production-asg`) has a target-tracking scaling policy (CPU utilization, target 60%), so capacity adjusts automatically to load, with a defined minimum/maximum instance count.

---

## 3. Data Encryption Configuration (KMS at Rest & TLS in Transit)

### Encryption at rest
- **RDS**: the production database has storage encryption enabled (`StorageEncrypted: true`), backed by the AWS-managed default RDS key (`arn:aws:kms:us-east-1:010526276308:key/1e3d9000-936d-4cdc-be66-7b0cdb70dd2f`).
- **S3**: all buckets in the account (CloudTrail log buckets, frontend deployment artifacts, and any bucket holding sensitive data) have default server-side encryption enabled (AES256).
- **Secrets**: database credentials and the git deploy key used to provision compute are stored in **AWS Secrets Manager**, retrieved at instance boot time — never committed to source control or stored in plaintext on disk outside of the running instance's shared configuration directory.

### Encryption in transit
- The public-facing load balancer terminates TLS using an **AWS Certificate Manager (ACM)**-issued certificate (covering both the application and API domains), with an HTTP listener that redirects to HTTPS.
- Where a host is not yet reached through the load balancer, TLS is terminated locally using a Let's Encrypt certificate (via Certbot).
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

---

*This document reflects the AWS account configuration as directly verified via the AWS CLI on 2026-07-27. Subsequent changes to any of the above should be reflected here as part of the change, not retroactively.*
