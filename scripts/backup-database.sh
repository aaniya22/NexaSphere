#!/bin/bash
# scripts/backup-database.sh
# Dumps, compresses, and encrypts a PostgreSQL database securely.

# Exit immediately if a pipeline command fails
set -o pipefail
set -e

# Ensure required environment variables are set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set." >&2
  exit 1
fi

if [ -z "$ENCRYPTION_KEY" ]; then
  echo "Error: ENCRYPTION_KEY is not set." >&2
  exit 1
fi

# Ensure required tools are installed
command -v pg_dump >/dev/null 2>&1 || { echo "Error: pg_dump is required but not installed." >&2; exit 1; }
command -v gzip >/dev/null 2>&1 || { echo "Error: gzip is required but not installed." >&2; exit 1; }
command -v openssl >/dev/null 2>&1 || { echo "Error: openssl is required but not installed." >&2; exit 1; }

# Generate timestamp and directory structure
TIMESTAMP=$(date +"%Y-%m-%d-%H%M")
BACKUP_DIR="/tmp/nexasphere-backups"
mkdir -p "$BACKUP_DIR"

ENC_BACKUP="$BACKUP_DIR/backup-$TIMESTAMP.sql.gz.enc"

echo "Starting database backup pipeline..." >&2

# Export the encryption key to an environment variable OpenSSL natively recognizes.
# This prevents the key from leaking into process listings (ps aux).
export ""SSLPASS""="$ENCRYPTION_KEY"

# Execute the pipeline: Dump -> Compress -> Encrypt -> Output File
# Because of 'set -o pipefail', if any segment here fails, the whole script aborts safely.
pg_dump --clean --no-owner --no-privileges -d "$DATABASE_URL" \
  | gzip -c \
  | openssl enc -aes-256-cbc -salt -pbkdf2 -pass env:SSLPASS -out "$ENC_BACKUP"

echo "Backup completed successfully." >&2

# Output ONLY the final file path to stdout for Node.js wrapper to capture
echo "$ENC_BACKUP"
