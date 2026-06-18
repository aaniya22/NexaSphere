#!/usr/bin/env bash
# gateway/generate-certs.sh
# ─────────────────────────
# Generates a self-signed SSL certificate for local development.
# Run once from the project root: bash gateway/generate-certs.sh
#
# For production, replace certs/ contents with your CA-signed certificates
# (Let's Encrypt via Certbot, AWS ACM, etc.) and update nginx.conf
# ssl_certificate paths accordingly.

set -euo pipefail

CERTS_DIR="$(dirname "$0")/certs"
mkdir -p "$CERTS_DIR"

echo "Generating self-signed certificate in $CERTS_DIR ..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$CERTS_DIR/localhost.key" \
  -out    "$CERTS_DIR/localhost.crt" \
  -subj   "/C=IN/ST=UP/L=GreaterNoida/O=NexaSphere/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

chmod 600 "$CERTS_DIR/localhost.key"
chmod 644 "$CERTS_DIR/localhost.crt"

echo ""
echo "Done. Files created:"
echo "  $CERTS_DIR/localhost.crt"
echo "  $CERTS_DIR/localhost.key"
echo ""
echo "Start the gateway with: docker compose up gateway"
