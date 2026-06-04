# Automated Point-in-Time Database Backups

This document outlines the architecture, retention policy, and disaster recovery procedures for the NexaSphere PostgreSQL database.

## Backup Architecture

Our backup system automates the following daily flow:

1. **Schedule**: A GitHub Actions workflow (`.github/workflows/database-backup.yml`) triggers daily at 02:00 UTC.
2. **Database Dump**: `pg_dump` is used to create a clean, timestamped SQL dump.
3. **Compression**: The raw SQL file is compressed using `gzip`.
4. **Encryption**: The compressed file is encrypted via `openssl` with AES-256-CBC using a secure `ENCRYPTION_KEY`.
5. **Upload**: The encrypted archive is uploaded to an S3-compatible cloud storage bucket.
6. **Verification**: The system verifies the uploaded file's size against the local file to ensure integrity.
7. **Retention**: Expired backups are automatically deleted from the bucket.

## Retention Policy

To manage storage costs while ensuring long-term recoverability, we implement the following retention strategy:

- **Daily Backups**: Kept for 30 days.
- **Weekly Backups**: (Sunday backups) Kept for 12 weeks.
- **Monthly Backups**: (1st of the month) Kept for 12 months.

## Disaster Recovery Procedure

If the production database is compromised or data is lost, follow these steps to restore the latest backup.

### Prerequisites

You will need:

- The encrypted backup file (`.sql.gz.enc`) downloaded from the S3 bucket.
- The `ENCRYPTION_KEY` (stored in GitHub Secrets or the team password manager).
- The target `DATABASE_URL` for the database you are restoring to.
- Access to a Unix-like terminal with `psql`, `gzip`, and `openssl` installed.

### Restore Steps

1. **Locate the Restore Script**
   Navigate to the root of the NexaSphere repository:

   ```bash
   cd scripts
   ```

2. **Set Environment Variables**
   Export the required secrets in your terminal session:

   ```bash
   export DATABASE_URL="postgresql://user:pass@host:port/dbname"
   export ENCRYPTION_KEY="your-secure-encryption-key"
   ```

3. **Run the Restore Script**
   Pass the path to your downloaded backup file to the restore script:

   ```bash
   ./restore-backup.sh /path/to/downloaded-backup-2026-06-01-0200.sql.gz.enc
   ```

4. **Verify the Integrity**
   The script will:
   - Decrypt the file using the provided `ENCRYPTION_KEY`.
   - Decompress the gzip archive.
   - Run `psql` to execute the SQL dump against the target database.

> [!WARNING]
> The `pg_dump` uses `--clean`. Restoring a backup will **drop** existing tables before recreating them. Ensure you are connected to the correct database (e.g., a staging database for testing) before running the restore script.

## Monitoring & Alerts

If the automated backup GitHub Action fails, an error will be reported in the Actions run log. Team members subscribed to repository alerts will be notified. Always investigate backup failures immediately to ensure the continuity of our disaster recovery plan.
