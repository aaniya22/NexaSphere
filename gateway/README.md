# NexaSphere API Gateway

This directory contains the Nginx API gateway configuration for routing, rate limiting, request logging, and SSL termination.

## SSL Certificate Setup

Nginx is configured to terminate SSL on port 443 using certificates at `gateway/certs/localhost.crt` and `gateway/certs/localhost.key`.

### Generating Self-Signed Certificates

#### Using OpenSSL (macOS/Linux/Git Bash):
Run the following command in this directory to generate a self-signed certificate:
```bash
mkdir -p certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/localhost.key \
  -out certs/localhost.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

#### Using PowerShell (Windows):
If you have Git installed, OpenSSL is available in your Git installation. Run:
```powershell
& "C:\Program Files\Git\usr\bin\openssl.exe" req -x509 -nodes -days 365 -newkey rsa:2048 -keyout certs/localhost.key -out certs/localhost.crt -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

Otherwise, you can install `mkcert` or configure custom certificates for your local domain.
