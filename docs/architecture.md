# Architecture Overview

NexaSphere is a **monorepo** containing three independently deployable applications
plus supporting services.

## High-Level Architecture

```text
                    ┌─────────────────────────────┐
                    │         GitHub Actions        │
                    │  (CI / lint / deploy / bots)  │
                    └─────────────┬───────────────┘
                                  │
         ┌────────────────────────┼─────────────────────────┐
         │                        │                          │
   ┌─────▼──────┐          ┌──────▼──────┐          ┌───────▼──────┐
   │  website/   │          │   server/   │          │admin-dash/   │
   │ React+Vite  │◄────────►│  Express API│◄────────►│  React+Vite  │
   │  (Vercel)   │  REST+WS │  (Render)   │  REST    │  (Vercel)    │
   └────────────┘          └──────┬──────┘          └──────────────┘
                                  │
                    ┌─────────────┼──────────────┐
                    │             │              │
             ┌──────▼──┐  ┌──────▼──┐  ┌────────▼────┐
             │Supabase │  │ Socket  │  │  File-based │
             │(Postgres)│  │   IO    │  │  JSON store │
             └─────────┘  └─────────┘  └─────────────┘
```

## Components

| Component            | Technology        | Deployed To |
| -------------------- | ----------------- | ----------- |
| `website/`           | React 18 + Vite 5 | Vercel      |
| `admin-dashboard/`   | React 18 + Vite 5 | Vercel      |
| `server/`            | Node.js + Express | Render      |
| `server-python/`     | FastAPI           | Optional    |
| `server-java/`       | Spring Boot       | Experimental |

## Data Flow

1. **Public website** fetches content from the Express API over REST.
2. **Real-time events** (activity updates, notifications) stream via Socket.IO.
3. **Admin dashboard** authenticates with session-based auth and manages content
   through the same REST API.
4. **Database** is PostgreSQL (Supabase) in production; falls back to a local
   JSON file (`server/data/content.json`) when Supabase is not configured.

## Key Design Decisions

- **Repository pattern** — all DB access goes through `server/repositories/`.
- **Zod schemas** — all API input is validated with Zod validators in
  `server/validators/`.
- **ESM throughout** — the server uses native ES modules (`"type": "module"`).
- **Offline-first website** — the website renders from localStorage / static
  JSON when `VITE_API_BASE` is empty, enabling zero-backend Vercel deploys.

For workflow-level details (branching, CI, review process) see
[docs/guides/WORKFLOWS.md](guides/WORKFLOWS.md).

For the full deep-dive architecture guide see
[docs/guides/ARCHITECTURE.md](guides/ARCHITECTURE.md).
