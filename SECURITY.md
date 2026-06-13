<!-- markdownlint-disable MD013 -->
# Security Policy

## Supported Versions

| Version                | Supported |
| ---------------------- | --------- |
| Latest (`main` branch) | ✅ Yes    |
| Any previous release   | ❌ No     |

Only the current `main` branch receives security patches. Please ensure you are running the latest version before reporting.

---

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Publicly disclosing a vulnerability before it is fixed puts the entire user community at risk.

### How to Report

Contact the maintainers privately through one of these channels:

| Contact       | Handle                                               |
| ------------- | ---------------------------------------------------- |
| Project Admin | [@S3DFX-CYBER](https://github.com/S3DFX-CYBER)       |
| Mentor        | [@Ayushh-Sharmaa](https://github.com/Ayushh-Sharmaa) |

Send a direct message on GitHub or reach out via the GSSoC Discord (project channel) with the subject line: **[SECURITY] NexaSphere — Vulnerability Report**.

### What to Include

Please provide as much of the following as possible:

- **Description** — A clear description of the vulnerability and its potential impact
- **Affected component** — Frontend, backend API, database layer, authentication, etc.
- **Steps to reproduce** — A minimal proof-of-concept or step-by-step instructions
- **Environment** — Browser/OS/Node.js version if relevant
- **Suggested fix** — Any potential mitigations or patches you are aware of

---

## Response Timeline

| Milestone                              | Target                                                                      |
| -------------------------------------- | --------------------------------------------------------------------------- |
| Acknowledgement of report              | Within **48 hours**                                                         |
| Initial assessment and severity rating | Within **5 business days**                                                  |
| Fix deployed to `main`                 | Depends on severity (Critical: 72h, High: 1 week, Medium/Low: next release) |
| Public disclosure                      | After fix is confirmed deployed                                             |

We follow a **coordinated disclosure** policy. We will credit the reporter in the changelog unless they prefer to remain anonymous.

---

## Scope

The following are **in scope** for vulnerability reports:

- Authentication bypass or privilege escalation
- SQL injection or other database attacks
- Cross-Site Scripting (XSS)
- Cross-Site Request Forgery (CSRF)
- Sensitive data exposure (API keys, user PII)
- Server-Side Request Forgery (SSRF)
- Remote Code Execution (RCE)
- Insecure direct object references

The following are **out of scope**:

- Vulnerabilities in third-party dependencies (report to their maintainers directly)
- Issues requiring physical access to a device
- Social engineering attacks
- Denial of Service without a demonstrated exploit
- Missing security headers that don't have a concrete exploitable impact

---

## Security Best Practices for Contributors

When contributing code, please keep these in mind:

- **Never commit secrets** — no API keys, passwords, or tokens in code (use `.env` files)
- **Validate all inputs** — use Zod schemas on the backend for every external input
- **Keep dependencies updated** — run `npm audit` and address high/critical advisories
- **Follow least-privilege** — request only the permissions your code needs
- **Use parameterised queries** — never concatenate user input into SQL strings

---

## Admin Session Architecture

NexaSphere uses a **shared Redis session store** to manage administrative
authentication across multiple backend services (Java Spring Boot and Node.js
Express). This eliminates the need for cross-service HTTP calls and enables
horizontal scaling.

### How It Works

```text
┌──────────────────┐     ┌──────────────────┐
│  Java Backend    │     │  Node.js Backend  │
│  (Spring Boot)   │     │  (Express)        │
│                  │     │                   │
│  TokenService    │     │  adminAuthMiddle- │
│  .createSession()│────▶│  ware.requireAdmin│
│  .validate()     │     │  ()               │
│  .revoke()       │     │                   │
└────────┬─────────┘     └────────┬──────────┘
         │                        │
         │   ┌──────────────┐     │
         └──▶│  Shared      │◀────┘
             │  Redis       │
             │  Instance    │
             └──────────────┘
```

### Session Key Namespace

Sessions are stored under the Redis key pattern:

```text
session:admin:{sha256_hash_of_token}
```

- **Raw tokens are never stored in Redis.** Only the SHA-256 hash of the bearer
  token is used as the key, preventing token exposure even if the Redis instance
  is compromised.
- The value is a JSON string containing the session metadata:

```json
{
  "token": "<sha256_hash>",
  "email": "admin@example.com",
  "createdAt": "2025-01-01T00:00:00Z",
  "expiresAt": "2025-01-01T08:00:00Z"
}
```

### Session Lifecycle

| Event | Action |
| --- | --- |
| **Login** | A new key is written to Redis with an 8-hour TTL. Node.js backend also writes to PostgreSQL for audit. |
| **Validation** | Both services compute `SHA-256(token)` and perform a Redis `GET`. No cross-service HTTP calls. |
| **Logout** | The Redis key is deleted immediately (`DEL`), revoking the session. PostgreSQL is updated for audit. |
| **Expiry** | Redis TTL automatically evicts expired keys. No scheduled cleanup tasks are required. |

### Configuration

The following environment variables configure the Redis connection:

| Variable | Default | Description |
| --- | --- | --- |
| `REDIS_HOST` | `localhost` | Redis server hostname |
| `REDIS_PORT` | `6379` | Redis server port |
| `REDIS_PASSWORD` | *(empty)* | Redis AUTH password |
| `REDIS_URL` | `redis://localhost:6379` | Full Redis connection URL (Node.js) |

### Security Considerations

- **Token hashing**: All tokens are SHA-256 hashed before being used as Redis
  keys. Raw bearer tokens never persist on disk or in Redis.
- **TTL enforcement**: Sessions auto-expire after 8 hours via Redis TTL, even
  if explicit logout is not performed.
- **Immediate revocation**: Admin logout deletes the Redis key synchronously,
  ensuring the session is revoked across all services immediately.
- **Dual storage**: PostgreSQL retains a full audit trail of admin sessions
  (creation, last-seen, revocation timestamps). Redis serves only as the
  fast-path validation layer.
- **Graceful degradation**: If Redis is unreachable during login, the
  PostgreSQL session is still created. Validation will fail gracefully with a
  500 status until Redis connectivity is restored.
