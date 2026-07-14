# ZATCA IT Portfolio

Enterprise **IT Portfolio & Access Management** platform for ZATCA.

- **Backend:** Laravel 13 (PHP 8.4+) API with Sanctum, Spatie Permission, Activity Log
- **Frontend:** React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui
- **Deploy:** Docker + Nginx + PHP-FPM + Supervisor (Coolify-ready)

Repository: [https://github.com/mosmohamed/zatca-apps-mgmt](https://github.com/mosmohamed/zatca-apps-mgmt)

---

## Table of contents

1. [Project structure](#1-project-structure)
2. [Local development setup](#2-local-development-setup)
3. [Docker local stack](#3-docker-local-stack)
4. [Version control (GitHub)](#4-version-control-github)
5. [VPS & Coolify installation](#5-vps--coolify-installation)
6. [Deploy with Coolify](#6-deploy-with-coolify)
7. [Environment variables](#7-environment-variables)
8. [Operations cheat sheet](#8-operations-cheat-sheet)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Project structure

```text
.
├── backend/                 # Laravel API (/api/v1)
├── frontend/                # React SPA (Vite)
├── docker/
│   ├── entrypoint.sh        # migrate / cache / start processes
│   ├── supervisord.conf     # php-fpm + nginx + queue + scheduler
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── default.conf     # SPA + API reverse proxy
│   └── php/
│       ├── php.ini
│       └── www.conf
├── Dockerfile               # Multi-stage production image
├── docker-compose.yml       # Local full stack (app + MySQL + Redis)
├── docker-compose.coolify.yml
├── .env.docker.example
├── .dockerignore
└── README.md
```

Runtime request flow in production:

```text
Browser -> Nginx:80
  ├── /api/* , /sanctum/*  -> PHP-FPM (Laravel)
  ├── /storage/*           -> Laravel public storage
  └── /*                   -> React SPA (frontend/dist)
```

---

## 2. Local development setup

### Prerequisites

- PHP 8.4+, Composer 2
- Node.js 22+, npm
- MySQL 8+

### Backend

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
# Configure DB_* in .env
php artisan migrate --seed
php artisan serve
```

API base: `http://127.0.0.1:8000/api/v1`

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Vite proxies `/api` to Laravel (`vite.config.ts`).

---

## 3. Docker local stack

### Build & run

```bash
cp .env.docker.example .env.docker
# Edit secrets, especially APP_KEY / DB passwords / SUPER_ADMIN_*

# Generate a Laravel key (one-time):
docker run --rm php:8.4-cli php -r "echo 'base64:'.base64_encode(random_bytes(32)), PHP_EOL;"
# Paste into APP_KEY=base64:...

docker compose up -d --build
```

App URL: `http://localhost:8080` (override with `APP_HTTP_PORT`)

### Useful commands

```bash
docker compose logs -f app
docker compose exec app php artisan migrate --force
docker compose exec app php artisan db:seed --force
docker compose down
```

---

## 4. Version control (GitHub)

Run these from the project root  
`c:\Users\mosmo\OneDrive\Desktop\it-portfolio-system`  
(or your Linux/macOS checkout).

> Ensure GitHub auth works (`gh auth login` or SSH keys) before pushing.

```bash
cd /path/to/it-portfolio-system

# 1) Initialize repository
git init
git branch -M main

# 2) Add remote
git remote add origin https://github.com/mosmohamed/zatca-apps-mgmt.git

# 3) Stage files (respects .gitignore — no .env / vendor / node_modules)
git add .
git status

# 4) First commit
git commit -m "$(cat <<'EOF'
chore: initial commit of ZATCA IT Portfolio with Docker deployment stack

EOF
)"

# 5) Push
git push -u origin main
```

### PowerShell (Windows) alternative for commit message

```powershell
git commit -m "chore: initial commit of ZATCA IT Portfolio with Docker deployment stack"
git push -u origin main
```

If the remote already has commits (README created on GitHub):

```bash
git pull origin main --rebase
git push -u origin main
```

---

## 5. VPS & Coolify installation

Target VPS: **`169.58.18.79`**

### 5.1 SSH into the server

```bash
ssh root@169.58.18.79
```

### 5.2 Baseline hardening (recommended)

```bash
apt update && apt upgrade -y
apt install -y curl ufw fail2ban

# Allow SSH + HTTP/HTTPS + Coolify UI
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8000/tcp   # Coolify UI default until you put it behind domain/proxy
ufw --force enable
```

### 5.3 Install Coolify (official installer)

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

After install:

1. Open `http://169.58.18.79:8000`
2. Create the Coolify admin account
3. Complete onboarding wizard
4. (Recommended) Add a domain for Coolify itself and enable HTTPS via Coolify proxy

### 5.4 Create managed databases in Coolify

In Coolify UI:

1. **Create Resource → Database → MySQL 8**
   - Note host/port/db/user/password (Coolify internal network host)
2. **Create Resource → Database → Redis** (optional but recommended)
   - Note host/port

Keep these credentials ready for the app environment.

---

## 6. Deploy with Coolify

### Option A — Docker Compose resource (recommended)

1. Coolify → **Projects** → create project `zatca-apps-mgmt`
2. **+ New** → **Docker Compose**
3. **Source** → GitHub
   - Connect GitHub App / OAuth
   - Select `mosmohamed/zatca-apps-mgmt`
   - Branch: `main`
   - Compose file: `docker-compose.coolify.yml`  
     (uses Coolify-managed MySQL/Redis via env vars)
4. Configure **Environment Variables** (see section 7)
5. **Ports / Domains**
   - Map domain (example: `apps.your-domain.gov.sa`) to the `app` service port **80**
   - Enable HTTPS (Let's Encrypt) in Coolify
6. Set:

   - `APP_URL=https://apps.your-domain.gov.sa`
   - `SANCTUM_STATEFUL_DOMAINS=apps.your-domain.gov.sa`

7. Deploy → watch build logs
8. After green health check, open the domain

### Option B — Dockerfile resource

1. **+ New** → **Dockerfile**
2. Repository + branch `main`
3. Dockerfile path: `/Dockerfile`
4. Port: `80`
5. Same env vars as below
6. Attach volumes (optional but recommended):

   - `/var/www/html/storage/app`
   - `/var/www/html/storage/logs`

7. Deploy

### First boot behavior (`entrypoint.sh`)

On every container start:

1. Wait for MySQL
2. `php artisan migrate --force` (if `RUN_MIGRATIONS=true`)
3. Optional seeders (`RUN_SEEDERS=true` — use carefully)
4. `config:cache`, `route:cache`, `view:cache`
5. Start Supervisor (nginx + php-fpm + queue worker + scheduler)

### Auto-deploy from GitHub

In Coolify resource settings, enable **Auto Deploy** on push to `main`.  
Then each successful push rebuilds and redeploys.

---

## 7. Environment variables

Minimum production set for Coolify:

| Key | Example | Notes |
|-----|---------|-------|
| `APP_NAME` | `ZATCA IT Portfolio` | |
| `APP_ENV` | `production` | |
| `APP_DEBUG` | `false` | Must be false |
| `APP_KEY` | `base64:...` | Required |
| `APP_URL` | `https://your-domain` | Match Coolify domain |
| `LOG_CHANNEL` | `stderr` | Coolify log streaming |
| `DB_CONNECTION` | `mysql` | |
| `DB_HOST` | Coolify MySQL hostname | Internal DNS |
| `DB_PORT` | `3306` | |
| `DB_DATABASE` | `zatca_portfolio` | |
| `DB_USERNAME` | `...` | |
| `DB_PASSWORD` | `...` | Strong secret |
| `REDIS_HOST` | Coolify Redis hostname | |
| `REDIS_PORT` | `6379` | |
| `CACHE_STORE` | `redis` | |
| `QUEUE_CONNECTION` | `redis` | |
| `SESSION_DRIVER` | `redis` | |
| `SESSION_SECURE_COOKIE` | `true` | HTTPS |
| `SANCTUM_STATEFUL_DOMAINS` | `your-domain` | No protocol |
| `RUN_MIGRATIONS` | `true` | First deploys |
| `RUN_SEEDERS` | `false` | Enable once if needed |
| `SUPER_ADMIN_EMAIL` | `admin@...` | Seeder only |
| `SUPER_ADMIN_PASSWORD` | `...` | Seeder only |

Generate `APP_KEY`:

```bash
php -r "echo 'base64:'.base64_encode(random_bytes(32)), PHP_EOL;"
```

Frontend API URL is compiled at image build time as `/api/v1` (same origin). No public VITE env is required in Coolify.

---

## 8. Operations cheat sheet

```bash
# Coolify app container shell (name varies)
php artisan migrate --force
php artisan queue:restart
php artisan optimize:clear && php artisan config:cache

# One-time seed (production caution)
RUN_SEEDERS=true  # or:
php artisan db:seed --force
```

Health endpoint: `GET /up`

API sample: `GET /api/v1/dashboard` (authenticated)

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| 502 Bad Gateway | PHP-FPM not ready | Check supervisord / app logs |
| SPA blank page | Wrong asset paths / failed frontend build | Rebuild image; verify `/assets/*` |
| API 500 / Artisan parse error on Request.php | PHP 8.3 vs Symfony 8 (needs 8.4+) | Rebuild with `php:8.4-fpm` image |
| Database is not ready after N attempts | Wrong `DB_HOST` or services not networked | Set Coolify MySQL hostname; join same network |
| CORS/auth cookie issues | Domains mismatch | Align `APP_URL` + `SANCTUM_STATEFUL_DOMAINS` |
| Migrate failures | DB not reachable | Verify Coolify DB host/network |
| Uploaded files missing after redeploy | Ephemeral storage | Persist `/var/www/html/storage/app` volume |

View logs in Coolify **Deployments → Logs**, or:

```bash
docker logs <container> -f
```

---

## License

Proprietary — ZATCA internal use unless otherwise stated.
