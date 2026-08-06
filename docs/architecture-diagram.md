# VINify Production Architecture

Reflects the account as directly verified via the AWS CLI on 2026-08-01, after the network segmentation migration. See [AWS-Security-Setup-Guide.md](AWS-Security-Setup-Guide.md) for the full narrative and baseline procedures behind each piece of this.

```mermaid
flowchart TB
    Internet(("Internet"))
    DNS["Hostinger DNS\napi.getvinify.com, app.getvinify.com\n(CNAME → ALB)"]

    Internet --> DNS
    DNS --> ALB

    subgraph VPC["vinify-prod-vpc (172.31.0.0/16) — us-east-1"]
        subgraph Public["Public subnets (us-east-1a / us-east-1b, 6 AZs provisioned)"]
            ALB["Application Load Balancer\nVIN-instance-loadbalancer\nTLS termination (imported cert, exp. 2026-09-09)"]
            NAT["NAT Gateway\n(us-east-1a)"]
        end

        subgraph PrivateApp["Private application subnets (us-east-1a / us-east-1b)"]
            ASG["Auto Scaling Group\nproduction-asg (min 1 / max 5)\nnginx: api.getvinify.com → Node app\n            app.getvinify.com → static frontend"]
        end

        subgraph PrivateData["Private data subnets (us-east-1a / us-east-1b) — no internet route"]
            Proxy["RDS Proxy\nproxy-1749817350410-mvmprod"]
            RDS[("RDS PostgreSQL\nmvmprod — Multi-AZ\nStorageEncrypted, native\nmanaged password rotation")]
        end

        ALB --> ASG
        ASG -->|outbound only| NAT
        NAT --> Internet
        ASG --> Proxy
        Proxy --> RDS
    end

    subgraph AWSServices["Supporting AWS services"]
        SM["Secrets Manager\n- app env-file secret (static config)\n- RDS native managed secret (auto-rotated,\n  fetched fresh at every boot/deploy)"]
        S3F["S3: vinify-frontend-deploy-artifacts"]
        SSM["Systems Manager\n(SendCommand — no SSH/inbound ports)"]
    end

    ASG -.->|reads at boot/deploy| SM
    ASG -.->|frontend build sync| S3F

    subgraph CICD["CI/CD (GitHub Actions, OIDC — no static keys)"]
        BackendCI["vinify-backend deploy.yml"]
        FrontendCI["vinify-frontend deploy.yml"]
    end

    BackendCI -->|SSM RunCommand| SSM
    FrontendCI -->|SSM RunCommand + S3 sync| SSM
    SSM --> ASG
```

## Notes on this diagram

- **NAT egress quirk**: outbound TCP port 22 from the private-app subnets is silently dropped somewhere upstream of the NAT Gateway (confirmed via packet capture; the NAT Gateway itself shows zero drops/errors). Git operations route around it via GitHub's documented SSH-over-443 endpoint instead of the default port 22. Not shown as a separate path above since it uses the same NAT Gateway — only the destination port differs.
- **Certificate risk**: the load balancer's certificate is an imported (not natively ACM-issued) Let's Encrypt certificate, because the domain's DNS is hosted at the registrar (Hostinger) rather than Route 53. It does not auto-renew — see Security Setup Guide, Section 3, for the expiry date and renewal procedure.
