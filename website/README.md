# NexaSphere Website

The public-facing NexaSphere web application — a React + Vite PWA for the GL Bajaj tech community.

## Structure

```text
website/
├── src/           # All React source code
│   ├── App.jsx
│   ├── main.jsx
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── context/
│   ├── services/
│   ├── store/
│   ├── utils/
│   └── styles/
├── public/        # Static assets (PWA icons, favicon, etc.)
├── index.html
├── vite.config.js
├── package.json
└── vercel.json    # Standalone Vercel deployment config
```text

## Development

```bash
cd website
npm install
npm run dev       # Starts at http://localhost:5175
```text

## Build

```bash
npm run build     # Outputs to website/dist/
```text

## Deployment (Vercel)

Configure a Vercel project pointing to the **`website/`** directory as the root.

- **Root Directory**: `website`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## Environment Variables

Copy `.env.example` from the repo root and configure:

```env
VITE_API_URL=https://your-api.vercel.app
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SENTRY_AUTH_TOKEN=...  # Optional — only needed for sourcemap uploads
```text
