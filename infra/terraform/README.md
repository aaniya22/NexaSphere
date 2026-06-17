# NexaSphere - Infrastructure as Code (IaC)

This directory contains Terraform configurations for provisioning and managing NexaSphere's AWS infrastructure.

## Architecture Overview

```
                   ┌──────────────┐
                   │  CloudFront  │
                   │     CDN      │
                   └──────┬───────┘
                          │
              ┌───────────┴────────────┐
              │     Application LB     │
              │   (ALB) - Ingress      │
              └───────────┬────────────┘
                          │
              ┌───────────┴────────────┐
              │   EKS Cluster (K8s)    │
              │  - API (Express)       │
              │  - Frontend (React)    │
              │  - Python microservice │
              └───────────┬────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
   ┌──────┴──────┐  ┌─────┴──────┐  ┌────┴────┐
   │  RDS (PG16) │  │   Redis    │  │   S3    │
   │  + Replica  │  │  (Elasti)  │  │ Media & │
   │  (HA/Multi) │  │            │  │ Backups │
   └─────────────┘  └────────────┘  └─────────┘
```

## Directory Structure

```
infra/terraform/
├── modules/                     # Reusable Terraform modules
│   ├── vpc/                     # VPC, subnets, NAT gateways, routing
│   ├── rds/                     # PostgreSQL RDS (primary + read replica)
│   ├── s3/                      # Media, backup, and state buckets
│   ├── cloudfront/              # CDN distribution for static assets
│   ├── eks/                     # Kubernetes cluster + node groups
│   ├── iam/                     # IAM roles, policies, KMS keys
│   └── security/                # Security groups for all tiers
├── env/                         # Environment-specific configurations
│   ├── dev/                     # Development environment
│   ├── staging/                 # Staging/QA environment
│   └── production/              # Production environment
├── scripts/
│   └── bootstrap.sh             # One-time setup for state backend
├── providers.tf                 # AWS provider configuration
├── backend.tf                   # S3 remote state backend config
├── versions.tf                  # Terraform & provider version pins
├── variables.tf                 # Global variables (shared defaults)
├── outputs.tf                   # Global outputs
├── state-backend.tf             # DynamoDB lock table + S3 state bucket
└── .gitignore
```

## Environments

| Environment | VPC CIDR    | RDS Class    | RDS Storage | Multi-AZ | EKS Nodes       | Backup Retention |
| ----------- | ----------- | ------------ | ----------- | -------- | --------------- | ---------------- |
| dev         | 10.0.0.0/16 | db.t3.small  | 20 GB       | No       | 1-3 (spot)      | 7 days           |
| staging     | 10.1.0.0/16 | db.t3.medium | 40 GB       | No       | 1-4 (spot)      | 14 days          |
| production  | 10.2.0.0/16 | db.r6g.large | 100 GB      | Yes      | 2-8 (on-demand) | 30 days          |

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/downloads) >= 1.6
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- An AWS account with permissions to create the resources above

## Getting Started

### 1. Bootstrap the State Backend

Run this once to create the S3 bucket and DynamoDB table for remote state:

```bash
cd infra/terraform
chmod +x scripts/bootstrap.sh
./scripts/bootstrap.sh
```

### 2. Select an Environment

```bash
cd infra/terraform/env/dev
```

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Review the Plan

```bash
terraform plan -out=tfplan
```

### 5. Apply

```bash
terraform apply tfplan
```

## CI/CD Pipeline

The `.github/workflows/terraform.yml` workflow runs on PRs and merges:

| Event              | Action                                  | Environment               |
| ------------------ | --------------------------------------- | ------------------------- |
| PR to any branch   | `terraform validate` + `terraform plan` | Inferred from base branch |
| Merge to `develop` | `terraform apply`                       | staging                   |
| Merge to `main`    | `terraform apply`                       | production                |

The plan output is posted as a PR comment automatically.

## State Management

- **Backend**: S3 bucket `nexasphere-terraform-state` with versioning and encryption
- **Locking**: DynamoDB table `nexasphere-terraform-locks` (PAY_PER_REQUEST)
- **State files** are isolated per workspace/environment

## Drift Detection

A scheduled GitHub Actions workflow runs `terraform plan` daily. If drift is detected:

1. The plan output is logged as an issue
2. The DevOps team is alerted
3. Drift must be resolved before the next apply

## Disaster Recovery

### Backup Strategy

| Resource        | Backup Method                                         | Retention            |
| --------------- | ----------------------------------------------------- | -------------------- |
| RDS             | Automated snapshots + manual pre-deployment snapshots | 30 days (production) |
| S3 Media        | Cross-region replication (CRR)                        | 90 days              |
| S3 Backups      | Versioning + lifecycle                                | 90 days              |
| Terraform State | S3 versioning                                         | Indefinite           |

### Recovery Runbook

1. **RDS Failure**: Promote read replica or restore from latest snapshot
2. **EKS Cluster Loss**: `terraform apply` will recreate; restore apps from Helm/GitOps
3. **S3 Data Loss**: Recover from versioning or cross-region replica
4. **Full Region Outage**: Deploy from backup region using state file copy

## Common Tasks

### Adding a new environment

1. Copy `env/dev/` to `env/<name>/`
2. Update `terraform.tfvars` with environment-specific values
3. Update the CI/CD workflow's workspace mapping

### Updating EKS node instance type

```bash
cd infra/terraform/env/production
terraform plan -var="eks_node_instance_types=[\"t3.xlarge\"]" -out=tfplan
terraform apply tfplan
```

### Rotating RDS password

1. Update `TF_VAR_db_password` in GitHub Secrets
2. Run `terraform plan` to detect the change
3. Apply

## Security

- All S3 buckets are private with blocked public access
- RDS is in private subnets with no direct internet access
- EKS API endpoint is private in production
- Secrets are encrypted at rest (KMS for EKS, AES256 for S3, encrypted for RDS)
- IAM roles follow least-privilege principle
- State files are encrypted at rest and in transit
