# NexaSphere

> The official tech community platform for GL Bajaj Group of Institutions, Mathura.
> Built by students, for students — featuring events, activities, team management, portfolios, and more.

[![CI](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/ci.yml/badge.svg)](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/Ayushh-Sharmaa/NexaSphere)](LICENSE)

## ✨ Stack

| Layer | Technology |
|---|---|
| **Website (Frontend)** | React 18 + Vite 5 + React Router v6 |
| **Admin Dashboard** | React 18 + Vite 5 |
| **Backend API** | Node.js 20 + Express 4 (ESM) |
| **Database** | PostgreSQL via Supabase (JSON file fallback for offline) |
| **Real-time** | Socket.IO |
| **Emails** | Nodemailer / Resend / SendGrid |
| **Auth** | Session-based admin auth with timing-safe comparison |
| **Deployment** | Frontend → Vercel · Backend → Render · Docker supported |

## 📁 Project Structure

```
NexaSphere/
├── website/              # Main public website (React + Vite)
│   ├── src/
│   │   ├── assets/       # Images, fonts, icons
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # React context providers
│   │   ├── data/         # Static data (events, activities)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Route-level page components
│   │   ├── shared/       # Shared UI primitives (Navbar, Footer, etc.)
│   │   ├── styles/       # Global CSS + theme tokens
│   │   └── utils/        # API client, helpers, PWA utils
│   ├── .env.example      # Required environment variables
│   ├── vite.config.js
│   └── vercel.json       # Website-specific Vercel overrides
│
├── admin-dashboard/      # Admin UI (React + Vite, separate deploy)
│   ├── src/
│   ├── .env.example
│   └── vite.config.js
│
├── server/               # Express.js REST API + Socket.IO
│   ├── config/           # DB, socket, and service config
│   ├── controllers/      # Route handler functions
│   ├── middleware/        # Auth, rate limiting, error handling
│   ├── migrations/        # Database migration files
│   ├── models/           # Data models
│   ├── repositories/     # DB access layer (repository pattern)
│   ├── routes/           # Express route definitions
│   ├── services/         # Business logic
│   ├── utils/            # Helpers (Sentry, email, etc.)
│   ├── validators/       # Zod schema validators
│   ├── index.js          # Entry point
│   ├── .env.example      # All required environment variables
│   ├── Dockerfile        # Production Docker image
│   └── vercel.json       # Serverless function adapter (optional)
│
├── server-python/        # FastAPI ML/AI microservice (optional)
├── server-java/          # Spring Boot alternative (experimental)
├── google-apps-script/   # Google Sheets / Forms integration scripts
├── docs/                 # Documentation
├── e2e/                  # Playwright end-to-end tests
│
├── vercel.json           # Root Vercel config (deploys website/)
├── render.yaml           # Render config (deploys server/)
├── docker-compose.yml    # Local dev with Docker
├── package.json          # Monorepo root (npm workspaces)
└── .github/workflows/    # CI/CD GitHub Actions
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** `>= 20.0.0` — [Download](https://nodejs.org/)
- **npm** `>= 9.0.0` (included with Node 20)

### 1. Clone & Install

```bash
git clone https://github.com/Ayushh-Sharmaa/NexaSphere.git
cd NexaSphere

# Install all workspace dependencies
npm install
```

### 2. Configure Environment Variables

```bash
# Website
cp website/.env.example website/.env.local

# Admin Dashboard
cp admin-dashboard/.env.example admin-dashboard/.env.local

# Backend API
cp server/.env.example server/.env
```

Then open each `.env` file and fill in your values. At minimum for local dev:

**`website/.env.local`:**
```env
VITE_API_BASE=http://localhost:8787
```

**`server/.env`:**
```env
PORT=8787
NODE_ENV=development
CORS_ORIGIN=http://localhost:5175,http://localhost:5001
ADMIN_USERNAME=your-admin
ADMIN_PASSWORD=YourPass123!
ADMIN_EVENT_PASSWORD=EventPass456!
```

### 3. Run Development Servers

```bash
# Website only (port 5175)
npm run dev:website

# Admin Dashboard only (port 5001)
npm run dev:admin

# Backend API only (port 8787)
npm run dev:server

# All three concurrently (recommended)
npm run dev:all
```

| Service | URL |
|---|---|
| Website | http://localhost:5175 |
| Admin Dashboard | http://localhost:5001 |
| Backend API | http://localhost:8787 |
| API Health Check | http://localhost:8787/health |

### 4. Running Without a Backend

The website works in **offline mode** when `VITE_API_BASE` is empty. All data comes from localStorage / static JSON files. This is how it runs on Vercel without a backend.

## 🏗️ Building for Production

```bash
# Build website
npm run build:website    # output → website/dist/

# Build admin dashboard
npm run build:admin      # output → admin-dashboard/dist/

# Build both
npm run build:all
```

## 🧪 Testing

```bash
# Website unit tests (Vitest)
npm test

# Server unit tests (Node test runner)
npm run test:server

# End-to-end tests (Playwright)
npx playwright test
```

## 🚢 Deployment

### Frontend → Vercel (Automatic)

The repo is pre-configured for Vercel deployment:

1. Connect the repo to Vercel
2. Vercel auto-detects `vercel.json` at the root
3. Set environment variables in the Vercel dashboard:
   - `VITE_API_BASE` → your Render API URL (e.g. `https://nexasphere-api.onrender.com`)
   - `VITE_ADMIN_DASHBOARD_URL` → your admin dashboard URL
   - `VITE_VAPID_PUBLIC_KEY` → your VAPID key (for push notifications)
4. Deploy! The `website/dist` folder is served with SPA fallback.

### Backend API → Render (via `render.yaml`)

1. Connect the repo to Render
2. Render auto-detects `render.yaml`
3. Set all `sync: false` environment variables in the Render dashboard (see `server/.env.example` for the full list)
4. The `/health` endpoint is used for health checks

### Backend API → Docker

```bash
# Build the image
cd server
docker build -t nexasphere-api .

# Run locally
docker run -p 8787:8787 --env-file .env nexasphere-api
```

### Full Stack with Docker Compose

```bash
# Start all services
docker-compose up --build

# Stop
docker-compose down
```

## 🔑 Environment Variables Reference

| Variable | Where | Description |
|---|---|---|
| `VITE_API_BASE` | `website/.env.local` | Backend API base URL |
| `VITE_ADMIN_DASHBOARD_URL` | `website/.env.local` | Admin dashboard URL (footer link) |
| `PORT` | `server/.env` | Server port (default: 8787) |
| `CORS_ORIGIN` | `server/.env` | Comma-separated allowed origins |
| `DATABASE_URL` | `server/.env` | PostgreSQL connection string |
| `SUPABASE_URL` | `server/.env` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `server/.env` | Supabase service key |
| `ADMIN_USERNAME` | `server/.env` | Admin login username |
| `ADMIN_PASSWORD` | `server/.env` | Admin login password (≥12 chars) |
| `ADMIN_EVENT_PASSWORD` | `server/.env` | Password for posting activity events |

See `server/.env.example` and `website/.env.example` for the complete list.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

This project is part of **GSSoC 2026** — check the open issues for tasks labelled `good first issue`.

## 📄 License

[MIT](LICENSE) © NexaSphere Core Team
