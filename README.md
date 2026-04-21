# NexaSphere — GL Bajaj Group of Institutions, Mathura

> The official website & community platform for NexaSphere — connecting GL Bajaj students with opportunities across Tech and Non-Tech domains.

**🌐 Live Site:** https://nexasphere-glbajaj.netlify.app  
**📧 Email:** nexasphere@glbajajgroup.org  
**💼 LinkedIn:** https://www.linkedin.com/showcase/glbajaj-nexasphere/  
**💬 WhatsApp Community:** https://chat.whatsapp.com/Jjc5cuUKENu0RC1vWSEs20

---

## ⚡ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 5 |
| Styling | Vanilla CSS (globals · animations · components) |
| Hosting | Netlify (auto-deploy on push to `main`) |
| Form backend | Google Apps Script → Google Sheets |
| Fonts | Orbitron · Rajdhani · Space Mono · Inter (Google Fonts) |

---

## 📁 Project Structure

```
NexaSphere-1/
├── google-apps-script/         # Apps Script files (NOT auto-deployed)
│   └── Code.gs                 # Membership form handler → Google Sheets
├── public/                     # Static assets served as-is
├── src/
│   ├── App.jsx                 # Root component — routing & page switching
│   ├── assets/
│   │   └── images/
│   │       ├── logos/          # nexasphere-logo.png, glbajaj-logo.png
│   │       └── team/           # Circular profile photos (300×300px)
│   ├── data/                   # All site content (edit here — no component changes needed)
│   │   ├── teamData.js         # Core team members
│   │   ├── activitiesData.js   # Activity card grid data
│   │   ├── eventsData.js       # Home page + Events page timeline
│   │   └── activities/         # Per-activity detail pages
│   │       ├── index.js        # Activity registry
│   │       ├── insightSession.js
│   │       ├── workshop.js
│   │       ├── hackathon.js
│   │       └── ...
│   ├── pages/
│   │   ├── home/               # HeroSection
│   │   ├── activities/         # ActivitiesPage + ActivityDetailPage
│   │   ├── events/             # EventsPage + EventDetailPage
│   │   ├── about/              # AboutPage
│   │   ├── team/               # TeamPage + TeamSection
│   │   ├── contact/            # ContactPage
│   │   ├── recruitment/        # RecruitmentPage  (Core Team Application — 7-step form)
│   │   └── membership/         # MembershipPage   (Join as Member — 2-section form)
│   ├── shared/                 # Navbar, Footer, Icons, ParticleBackground, etc.
│   └── styles/
│       ├── globals.css         # CSS variables, body reset, layout utilities
│       ├── animations.css      # @keyframes + scroll-reveal classes
│       └── components.css      # Every component's styles
├── index.html
├── vite.config.js
├── netlify.toml
└── package.json
```

---

## 🚀 Development

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # Production build → dist/
npm run preview    # Preview the production build locally
```

---

## 🌍 Deployment

Push to `main` → Netlify auto-builds and deploys via `netlify.toml`.

```toml
# netlify.toml
[build]
  command   = "npm run build"
  publish   = "dist"
```

---

## 📝 Forms & Google Sheets Integration

NexaSphere uses **Google Apps Script Web Apps** for form submissions. Data stays in Google Sheets — no backend server required.

### Form 1 — Core Team Recruitment (7-step)

| Item | Detail |
|---|---|
| File | `src/pages/recruitment/RecruitmentPage.jsx` |
| Constant | `APPS_SCRIPT_URL` (line ~883) |
| Script project | Separate Apps Script project (Core Team sheet) |
| Sheet tab | `Responses` |
| Deployed URL | *(stored in the constant above)* |

### Form 2 — Join as Member (2-section)

| Item | Detail |
|---|---|
| File | `src/pages/membership/MembershipPage.jsx` |
| Constant | `MEMBERSHIP_SCRIPT_URL` (line ~33) |
| Script project | **"NexaSphere Membership"** Apps Script project |
| Sheet tab | `Membership` (auto-created on first submission) |
| Deployment ID | `AKfycbyRQOW3Xjv13vXvft8ezD9sJdvjV3kf-VHm1l_mImHRDUAEqsilK0wb5QBD5GOkixwe` |
| Deployed URL | `https://script.google.com/macros/s/AKfycbyRQOW3Xjv13vXvft8ez.../exec` |
| Script file | `google-apps-script/Code.gs` |

> Both forms use `mode: 'no-cors'` + `Content-Type: text/plain` to bypass CORS on Google's servers. The Apps Script parses the plain-text body as JSON.

---

## ✏️ Common Content Changes

| Task | File to edit |
|---|---|
| Add / update team member | `src/data/teamData.js` |
| Add activity event | `src/data/activities/<name>.js` |
| Add KSS / Insight Session | `src/data/activities/insightSession.js` |
| Update home page stats | `src/pages/home/HeroSection.jsx` → `StatsBar` |
| Update contact details | `src/pages/contact/ContactPage.jsx` → constants at top |
| Add team member photo | `src/assets/images/team/<name>.png` (300×300px, transparent) |
| Change site colors | `src/styles/globals.css` → `:root {}` |

---

## 🔗 Key Links

| Resource | URL |
|---|---|
| Core Team Application | In-built form (opens from "Apply" / "Core Team" buttons) |
| Join as Member | In-built form (opens from "Join as Member" hero button) |
| Code of Conduct | https://tinyurl.com/NexaSphere-COD |
| Community Rules | https://tinyurl.com/NexaSphere-Rules |
| LinkedIn Page | https://www.linkedin.com/showcase/glbajaj-nexasphere/ |
| WhatsApp Community | https://chat.whatsapp.com/Jjc5cuUKENu0RC1vWSEs20 |

---

*NexaSphere — GL Bajaj Group of Institutions · Built with React + Vite*
