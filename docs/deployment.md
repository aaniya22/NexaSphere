# Deployment Guide

This document covers full deployment options for NexaSphere.
For a quick-start, see the [README](../README.md#-deployment).

---

## Frontend → Vercel (Recommended)

The repo ships with a root `vercel.json` pre-configured to serve `website/dist`.

### Steps

1. **Connect** the repo to [Vercel](https://vercel.com) (import from GitHub).
2. Vercel auto-detects `vercel.json` — no build settings needed.
3. **Set environment variables** in the Vercel dashboard:

   | Variable                   | Value                                  |
   | -------------------------- | -------------------------------------- |
   | `VITE_API_BASE`            | Your Render API URL (see below)        |
   | `VITE_ADMIN_DASHBOARD_URL` | Your deployed admin dashboard URL      |
   | `VITE_VAPID_PUBLIC_KEY`    | VAPID public key (push notifications)  |

4. **Deploy** — Vercel rebuilds automatically on every push to `main`.

### Admin Dashboard

Deploy `admin-dashboard/` as a **separate Vercel project**:

- Set **Root Directory** to `admin-dashboard` in Vercel project settings.
- Set `VITE_API_BASE` to your API URL.

---

## Backend API → Render

The repo ships with `render.yaml` pre-configured.

### Steps

1. **Connect** the repo to [Render](https://render.com).
2. Render auto-detects `render.yaml`.
3. **Set all `sync: false` environment variables** in the Render dashboard.
   Refer to `server/.env.example` for the full list. Key variables:

   | Variable                    | Description                            |
   | --------------------------- | -------------------------------------- |
   | `PORT`                      | Server port (Render sets this for you) |
   | `DATABASE_URL`              | PostgreSQL connection string           |
   | `SUPABASE_URL`              | Supabase project URL                   |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key              |
   | `ADMIN_USERNAME`            | Admin login username                   |
   | `ADMIN_PASSWORD`            | Admin login password (≥ 12 chars)      |
   | `ADMIN_EVENT_PASSWORD`      | Password for posting activity events   |
   | `CORS_ORIGIN`               | Comma-separated allowed origins        |

4. The `/health` endpoint is used for Render health checks.

---

## Docker (Backend only)

```bash
cd server
docker build -t nexasphere-api .
docker run -p 8787:8787 --env-file .env nexasphere-api
```

---

## Full Stack with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Stop
docker-compose down
```

The `docker-compose.yml` in the project root starts:

- `server` — Express API on port `8787`
- Any additional services defined in the compose file

---

## Environment Variables Reference

| Variable                    | File                  | Description                          |
| --------------------------- | --------------------- | ------------------------------------ |
| `VITE_API_BASE`             | `website/.env.local`  | Backend API base URL                 |
| `VITE_ADMIN_DASHBOARD_URL`  | `website/.env.local`  | Admin dashboard URL (footer link)    |
| `PORT`                      | `server/.env`         | Server port (default: `8787`)        |
| `CORS_ORIGIN`               | `server/.env`         | Comma-separated allowed origins      |
| `DATABASE_URL`              | `server/.env`         | PostgreSQL connection string         |
| `SUPABASE_URL`              | `server/.env`         | Supabase project URL                 |
| `SUPABASE_SERVICE_ROLE_KEY` | `server/.env`         | Supabase service key                 |
| `ADMIN_USERNAME`            | `server/.env`         | Admin login username                 |
| `ADMIN_PASSWORD`            | `server/.env`         | Admin login password (≥ 12 chars)    |
| `ADMIN_EVENT_PASSWORD`      | `server/.env`         | Password for posting activity events |

See `server/.env.example` and `website/.env.example` for the complete list.
