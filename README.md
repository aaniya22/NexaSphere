# NexaSphere

> The official tech community platform for GL Bajaj Group of Institutions, Mathura.
> Built by students, for students — featuring events, activities, team management, portfolios, and more.

[![CI](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/ci.yml/badge.svg)](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/ci.yml)
[![Lint Markdown](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/lint-markdown.yml/badge.svg)](https://github.com/Ayushh-Sharmaa/NexaSphere/actions/workflows/lint-markdown.yml)
[![License](https://img.shields.io/github/license/Ayushh-Sharmaa/NexaSphere)](LICENSE)

---

## Table of Contents

- [✨ Stack](#-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Quick Start](#-quick-start)
- [🧪 Testing](#-testing)
- [🚢 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📚 Documentation](#-documentation)
- [📄 License](#-license)

---

## ✨ Stack

| Layer                  | Technology                                               |
| ---------------------- | -------------------------------------------------------- |
| **Website (Frontend)** | React 18 + Vite 5 + React Router v6                      |
| **Admin Dashboard**    | React 18 + Vite 5                                        |
| **Backend API**        | Node.js 20 + Express 4 (ESM)                             |
| **Database**           | PostgreSQL via Supabase (JSON file fallback for offline) |
| **Real-time**          | Socket.IO                                                |
| **Emails**             | Nodemailer / Resend / SendGrid                           |
| **Auth**               | Session-based admin auth with timing-safe comparison     |
| **Deployment**         | Frontend → Vercel · Backend → Render · Docker supported  |

---

## 📁 Project Structure

```text
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
│   ├── repositories/     # DB access layer (repository pattern)
│   ├── routes/           # Express route definitions
│   ├── services/         # Business logic
│   ├── utils/            # Helpers (Sentry, email, etc.)
│   ├── validators/       # Zod schema validators
│   ├── index.js          # Entry point
│   ├── .env.example      # All required environment variables
│   └── Dockerfile        # Production Docker image
│
├── server-python/        # FastAPI ML/AI microservice (optional)
├── server-java/          # Spring Boot alternative (experimental)
├── google-apps-script/   # Google Sheets / Forms integration scripts
├── docs/                 # Deep-dive documentation
├── e2e/                  # Playwright end-to-end tests
│
├── vercel.json           # Root Vercel config (deploys website/)
├── render.yaml           # Render config (deploys server/)
├── docker-compose.yml    # Local dev with Docker
├── package.json          # Monorepo root (npm workspaces)
└── .github/workflows/    # CI/CD GitHub Actions
```

---

## Node Version Management & Environment Setup

Consistent development environments are crucial for the stability, performance, and scaling of NexaSphere. To prevent compatibility issues among contributors, this project strictly enforces Node.js version **v20** (specifically the LTS "Iron" release stream).

### Why Node.js v20 (LTS)?

*   **LTS (Long Term Support) Stability**: Node.js 20 provides long-term security updates and bug fixes, ensuring that the NexaSphere platform is built on a rock-solid foundation.
*   **Modern Runtime Features**: Node.js 20 includes native features such as the stable `fetch` API, a built-in test runner, and refined ESM (ECMAScript Modules) support, which are heavily utilized across our backend services.
*   **Dependency Compatibility**: Our modern toolchain (including React 18, Vite 5, Express 4, and ESLint) is optimized and tested against Node.js 20. Running older or newer versions might result in unexpected compilation or runtime errors.
*   **Production Alignment**: Since our backend is deployed on Render and Docker containers configured for Node 20, using the exact same version locally prevents environment-specific bugs.

---

### Step-by-Step Installation Guide

We recommend using **NVM (Node Version Manager)** to manage Node versions. NVM allows you to switch between different Node versions effortlessly.

#### A. macOS and Linux

1.  **Install NVM**:
    Run the installation script in your terminal using either `curl` or `wget`:

    ```bash
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    ```
    *OR*
    ```bash
    wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    ```

2.  **Load NVM into the Shell**:
    The installer script should automatically append the loading code to your profile file (such as `~/.zshrc`, `~/.bashrc`, or `~/.bash_profile`). If it doesn't, manually append the following block:

    ```bash
    export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && echo "$HOME/.nvm" || echo "$XDG_CONFIG_HOME/nvm")"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
    ```

3.  **Reload your Profile**:
    Apply the changes by running:
    ```bash
    source ~/.zshrc
    # Or for bash
    source ~/.bashrc
    ```

#### B. Windows

Windows does not natively support the UNIX `nvm` script. Instead, use **nvm-windows**:

1.  **Download the Installer**:
    Go to the [nvm-windows releases page](https://github.com/coreybutler/nvm-windows/releases) and download the latest `nvm-setup.exe` installer.

2.  **Run the Installer**:
    Follow the wizard to complete the installation. Ensure that the installation paths do not contain spaces to prevent issues with Node binaries.

3.  **Verify Installation**:
    Open a new command prompt or PowerShell window and run:
    ```cmd
    nvm version
    ```

---

### Enforcing the Version with `.nvmrc`

NexaSphere includes a `.nvmrc` file in the root directory. When you navigate to the project root, you can configure your shell to automatically switch to the correct version, or you can do it manually.

#### Manual Switch

Run the following commands in the project root:

```bash
# Install the Node.js version specified in .nvmrc (v20)
nvm install 20

# Switch your current terminal session to Node.js v20
nvm use

# Verify that the active version is correct
node -v
```

#### Automatic Version Switching (Optional but Recommended)

You can configure your shell to automatically call `nvm use` whenever you change directories (`cd`) into a folder containing a `.nvmrc` file.

*   **Zsh (~/.zshrc)**:
    Append the following function to your `~/.zshrc` file:
    ```bash
    # Place this at the end of your ~/.zshrc
    autoload -U add-zsh-hook
    load-nvmrc() {
      local nvmrc_path="$(nvm_find_nvmrc)"
      if [ -n "$nvmrc_path" ]; then
        local nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")
        if [ "$nvmrc_node_version" = "N/A" ]; then
          nvm install
        elif [ "$nvmrc_node_version" != "$(nvm current)" ]; then
          nvm use
        fi
      elif [ "$(nvm current)" != "$(nvm version default)" ]; then
        echo "Reverting to nvm default..."
        nvm use default
      fi
    }
    add-zsh-hook chpwd load-nvmrc
    load-nvmrc
    ```

*   **Bash (~/.bashrc)**:
    Append the following block to your `~/.bashrc`:
    ```bash
    cdnvm() {
      cd "$@" || return
      if [ -f .nvmrc ]; then
        nvm use
      fi
    }
    alias cd="cdnvm"
    ```

---

### Alternative: FNM (Fast Node Manager)

If you find NVM slow during shell startup, you can use **FNM**, a fast, Rust-based alternative:

1.  **Installation**:
    *   macOS (via Homebrew): `brew install fnm`
    *   Linux/macOS (via Curl): `curl -fsSL https://fnm.vercel.app/install | bash`
    *   Windows (via Scoop): `scoop install fnm`

2.  **Shell Integration**:
    Add the following to your shell profile configuration (`~/.zshrc`, `~/.bashrc`, or PowerShell profile):
    ```bash
    eval "$(fnm env --use-on-cd)"
    ```
    This automatically checks for the `.nvmrc` file and switches the version seamlessly whenever you navigate into the project directory.

---

### Troubleshooting & Common Errors

#### 1. `command not found: nvm`
This occurs when NVM is installed, but your shell profile has not been reloaded or does not load NVM automatically.
*   **Fix**: Verify that your profile file (`~/.zshrc` for Zsh or `~/.bash_profile` / `~/.bashrc` for Bash) contains the NVM loading script. Then run `source ~/.zshrc` or `source ~/.bashrc` to reload.

#### 2. `nvm use` fails with "N/A version is not installed"
This happens if you run `nvm use` but haven't installed Node v20 locally.
*   **Fix**: Run `nvm install 20` first, then run `nvm use`.

#### 3. Windows PowerShell Execution Policy Error
In PowerShell, running NVM or executing global node scripts may fail due to restricted execution policies.
*   **Fix**: Run PowerShell as an Administrator and execute:
    ```powershell
    Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
    ```

#### 4. Permission Denied (`EACCES` or `EPERM`)
If you find yourself needing to run `sudo npm install`, **stop immediately**. Using `sudo` causes permission mismatches on your project directories.
*   **Fix**: Since NVM installs Node.js and global packages under your user directory (`~/.nvm`), it completely avoids permission issues. Discard the `sudo` command and simply run `npm install` inside the project root with the NVM-managed Node runtime active.

#### 5. Native Module Compilation Failures (node-gyp)
Some dependencies compile native C/C++ code. If compilation fails:
*   **macOS Fix**: Install Xcode Command Line Tools: `xcode-select --install`
*   **Linux Fix**: Install development tools: `sudo apt install build-essential`
*   **Windows Fix**: Run `npm install --global --production windows-build-tools` from an elevated PowerShell command.

---

## 🚀 Quick Start

> **3 steps to get NexaSphere running locally.**

### 1. Clone & Install

```bash
git clone https://github.com/Ayushh-Sharmaa/NexaSphere.git
cd NexaSphere
npm install
```

### 2. Configure Environment

```bash
cp website/.env.example website/.env.local
cp admin-dashboard/.env.example admin-dashboard/.env.local
cp server/.env.example server/.env
```

Minimum values needed in `server/.env`:

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
npm run dev:all     # Start website + admin + API together
```

Or start services individually:

| Command                 | Service          | URL                          |
| ----------------------- | ---------------- | ---------------------------- |
| `npm run dev:website`   | Website          | http://localhost:5175        |
| `npm run dev:admin`     | Admin Dashboard  | http://localhost:5001        |
| `npm run dev:server`    | Backend API      | http://localhost:8787        |
| —                       | API Health Check | http://localhost:8787/health |

> **Tip:** The website works in **offline mode** when `VITE_API_BASE` is empty.
> All data comes from localStorage / static JSON files — no backend needed.

---

## 🧪 Testing

```bash
npm test                # Website unit tests (Vitest)
npm run test:server     # Server unit tests (Node test runner)
npx playwright test     # End-to-end tests (Playwright)
```

---

## 🚢 Deployment

| Target              | Config File       | Notes                                              |
| ------------------- | ----------------- | -------------------------------------------------- |
| Vercel (frontend)   | `vercel.json`     | Connect repo, set `VITE_API_BASE` env var          |
| Render (backend)    | `render.yaml`     | Set `sync: false` env vars in Render dashboard     |
| Docker (backend)    | `server/Dockerfile` | `docker build -t nexasphere-api ./server`        |
| Docker Compose      | `docker-compose.yml` | `docker-compose up --build`                     |

For full deployment instructions see [docs/deployment.md](docs/deployment.md).

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

This project is part of **GSSoC 2026** — check the open issues for tasks labelled `good first issue`.

---

## 📚 Documentation

Deep-dive references live in the [`/docs`](docs/) directory:

| Document                                            | Description                              |
| --------------------------------------------------- | ---------------------------------------- |
| [docs/architecture.md](docs/architecture.md)        | System architecture & component overview |
| [docs/api-reference.md](docs/api-reference.md)      | REST API endpoint reference              |
| [docs/deployment.md](docs/deployment.md)            | Full deployment guide (Vercel / Render / Docker) |
| [docs/database-backups.md](docs/database-backups.md) | Database backup & restore procedures    |
| [docs/DATABASE_MIGRATIONS.md](docs/DATABASE_MIGRATIONS.md) | Running & writing DB migrations   |

---

## 📄 License

[MIT](LICENSE) © NexaSphere Core Team
