# VINify AWS & System Security Setup Guide

## Version History

| Version | Date | Author | Summary |
|---|---|---|---|
| 1.0 | 2026-07-20 | Betty Waiyego (Engineering Lead) | Initial version. Documents the AWS security configuration as implemented and verified in the production account as of this date. |

> This document is version-controlled via its git commit history in this repository. Each substantive review or change should be committed as a new entry above and in the commit log, so the revision history is objectively verifiable rather than manually asserted.

## Table of Contents

1. [AWS IAM User Provisioning & Least Privilege Baselines](#1-aws-iam-user-provisioning--least-privilege-baselines)
2. [Production VPC & Network Architecture Setup](#2-production-vpc--network-architecture-setup)
3. [Data Encryption Configuration (KMS at Rest & TLS in Transit)](#3-data-encryption-configuration-kms-at-rest--tls-in-transit)
4. [Log Router & CloudTrail Activation Rules](#4-log-router--cloudtrail-activation-rules)

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
- **RDS**: the production database has storage encryption enabled (`StorageEncrypted: true`), backed by a customer KMS key (`arn:aws:kms:us-east-1:010526276308:key/1e3d9000-936d-4cdc-be66-7b0cdb70dd2f`).
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

*This document reflects the AWS account configuration as directly verified via the AWS CLI on 2026-07-27. Subsequent changes to any of the above should be reflected here as part of the change, not retroactively.*
