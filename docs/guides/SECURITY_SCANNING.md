# Security Vulnerability Scanning

## Overview
This guide outlines the automated security scanning mechanisms in place for NexaSphere to detect vulnerable dependencies, insecure code patterns, hardcoded secrets, and misconfigurations before they reach production.

## 1. Automated CI Pipeline
We have integrated a centralized Security Scanning Workflow (`.github/workflows/security-scanning.yml`) that runs on every Pull Request, on pushes to the main branch, and automatically every night.

### Dependency Scanning
- **NPM Audit**: Fails the build if there are any `high` or `critical` vulnerabilities in our Node.js dependency tree.
- **Dependabot**: Automatically scans and creates Pull Requests to update vulnerable packages.

### Code Scanning (SAST)
- **GitHub CodeQL**: Automatically analyzes JavaScript and TypeScript code for insecure code patterns such as SQL injection, Cross-Site Scripting (XSS), and insecure data handling. Vulnerabilities are highlighted directly in the PR review.

### Secret Scanning
- **TruffleHog**: We use TruffleHog to deeply scan the git history of every Pull Request to ensure no API keys, database credentials, or secret tokens are accidentally committed. Verified secrets will cause the build to fail immediately.

### Container Scanning
- **Trivy**: Trivy scans the Docker container layers built from our `Dockerfile`. It checks the base OS layers and installed packages, blocking the deployment pipeline if any `HIGH` or `CRITICAL` vulnerabilities with known fixes are found.

### Infrastructure as Code (IaC) Scanning
- **Checkov**: All Terraform configurations and CloudFormation templates are statically analyzed to ensure cloud security best practices (e.g., ensuring S3 buckets are not public, databases are encrypted).

## 2. Response & Remediation
- **Critical Vulnerabilities**: Must be fixed immediately. A PR with a critical vulnerability will be blocked from merging.
- **Exposed Secrets**: If TruffleHog detects an exposed secret, the secret **must be rotated immediately** in the respective provider's console. You cannot just remove it from the code; the leaked credential is permanently compromised.
- **False Positives**: Can be suppressed using the respective inline comments for Checkov or CodeQL, but they require a review from a Project Admin.
