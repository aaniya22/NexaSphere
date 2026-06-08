#!/bin/bash
# scripts/restore-backup.sh
# Decrypts, decompresses, and restores a PostgreSQL database backup.

set -e

# Ensure required arguments and environment variables are set
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path-to-encrypted-backup.sql.gz.enc>" >&2
    exit 1
fi

ENC_BACKUP="$1"

if [ ! -f "$ENC_BACKUP" ]; then
  echo "Error: File $ENC_BACKUP not found." >&2
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set." >&2
  exit 1
fi

if [ -z "$ENCRYPTION_KEY" ]; then
  echo "Error: ENCRYPTION_KEY is not set." >&2
  exit 1
fi

# Ensure required tools are installed
command -v psql >/dev/null 2>&1 || { echo "Error: psql is required but not installed." >&2; exit 1; }
command -v gzip >/dev/null 2>&1 || { echo "Error: gzip is required but not installed." >&2; exit 1; }
command -v openssl >/dev/null 2>&1 || { echo "Error: openssl is required but not installed." >&2; exit 1; }

# Strip .enc extension
GZ_BACKUP="${ENC_BACKUP%.enc}"
# Strip .gz extension
RAW_BACKUP="${GZ_BACKUP%.gz}"

echo "Decrypting backup..." >&2
openssl enc -d -aes-256-cbc -salt -pbkdf2 -in "$ENC_BACKUP" -out "$GZ_BACKUP" -k "$ENCRYPTION_KEY"
if [ $? -ne 0 ]; then
  echo "Error: Decryption failed. Incorrect ENCRYPTION_KEY?" >&2
  exit 1
fi

echo "Decompressing backup..." >&2
gzip -d -f "$GZ_BACKUP"

echo "Restoring database..." >&2
# Run psql
psql -d "$DATABASE_URL" -f "$RAW_BACKUP"
if [ $? -ne 0 ]; then
  echo "Error: Database restore failed." >&2
  exit 1
fi

# Clean up raw backup
rm "$RAW_BACKUP"

echo "Database restored successfully." >&2
