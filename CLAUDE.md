# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Berlinometer (berlinometer.de) is a real-time occupancy tracker for Berlin's bars and clubs. It scrapes Google Maps occupancy data via Playwright, stores it in MySQL, and serves it through a Flask API to a React frontend.

## Commands

### Frontend (run from `webapp/`)
```bash
npm install               # Install dependencies
npm run dev               # Dev server on localhost:3000
npm run build             # Production build → build/
npm run lint              # ESLint
npm run test              # Vitest (all 46 tests)
npm run test -- --run src/utils/analytics.test.js  # Single test file
```

### Backend
```bash
python3 -m venv venv && source venv/bin/activate
pip install flask flask-cors playwright mysql-connector-python python-dotenv PyJWT bcrypt
python server.py          # Flask on port 5044
```

### Deployment
```bash
cd webapp && npm run build && ./deploy-safe.sh   # Frontend (whitelist-based, safe)
scp server.py root@berlinometer.de:/var/www/html/popular-times/   # Backend
ssh root@berlinometer.de "pm2 restart popular-times-api --update-env"
```

**CRITICAL**: Never use `rsync --delete` — the VPS has mixed frontend/backend files. Always use `deploy-safe.sh`.

### CI (GitHub Actions)
Runs on push/PR to `main` when `webapp/**` changes: lint, build, test (Node 20).

## Architecture

```
Browser → Nginx (reverse proxy) → Flask API (:5044) → MySQL
                                        ↑
                              PM2 manages both API + scraper

Scraper: PM2 "berlinometer-scraper" → scraper-loop.sh (7-12 min intervals)
         → run_scraper.sh → gmaps-scraper-fast-robust.py (Playwright)
         → writes JSON to popular-times-scrapings/
         → /latest-scraping endpoint picks best file (lowest error rate) from last 5
```

### Backend: `server.py` (~4800 lines, monolith)

Single Flask file containing everything:
- **Lines ~1-30**: Imports
- **Lines ~1600-1720**: DB pool creation + migrations (run on startup)
- **Lines ~1735-1850**: Auth helpers (hash_password, JWT, token_required decorator, send_verification_email)
- **Lines ~3270-3600**: Auth endpoints (/auth/register, /auth/verify-email, /auth/login, /auth/google, /auth/profile)
- **Lines ~3600+**: Admin endpoints, scraping endpoints, location endpoints

Key patterns:
- DB connections via `db_pool.get_connection()` with manual `cursor.close()` / `conn.close()` in try/finally
- Context manager `get_db_connection()` exists but not used everywhere
- JWT tokens (7-day expiry), bcrypt passwords, Google OAuth
- Roles: `user`, `admin`, `location_owner`
- Auth decorators: `@token_required`, `@admin_required`, `@location_owner_or_admin_required`

### Frontend: React 19 + Vite

**Context Providers** (wrapped in `main.jsx` in this order):
1. GoogleOAuthProvider → LanguageProvider → ThemeProvider → AuthProvider

**Routes**: `/` (HomePage), `/admin` (AdminPage, role-gated via `canAccessAdmin()`)

**State**: React Context only (AuthContext, ThemeContext, LanguageContext). No Redux.

**Translations**: All in `webapp/src/contexts/LanguageContext.jsx` — add keys to both `translations.de` and `translations.en`, use via `t('key')`.

**Styling**: CSS custom properties for theming (`--background`, `--card-bg`, `--text-color`, etc.), component-colocated CSS files.

**Dialogs**: All modals use unified `Dialog` component from `src/components/ui/Dialog`.

## Database

MySQL with connection pooling (20 connections). Key tables:

| Table | Purpose |
|-------|---------|
| `users` | Auth (username, email, password_hash, is_active, role, google_id, email_verification_token) |
| `locations` | Scraped locations (name, address, google_maps_url) |
| `occupancy_history` | Time-series occupancy data per location |
| `opening_hours_history` | Per-location hours (weekday, open_time, close_time, is_closed, is_24h) |
| `user_sessions` | Login tracking |
| `user_locations` | User's saved/bookmarked locations |
| `user_filters` | User's custom filters |
| `map_clicks` | Analytics for map interactions |
| `location_owners` | B2B access: links users to locations they own |

### Migration Pattern

Migrations run on server startup. Always check before altering:
```python
_cursor.execute("""
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'users' AND COLUMN_NAME = 'new_column'
""", (db_config['database'],))
if _cursor.fetchone()[0] == 0:
    _cursor.execute("ALTER TABLE users ADD COLUMN new_column VARCHAR(255) DEFAULT NULL")
```
Wrap in try/except with `logger.warning()`.

## Server Environment

- **VPS**: `root@berlinometer.de` (69.62.121.168)
- **Project path**: `/var/www/html/popular-times/`
- **Secrets**: `/var/www/html/popular-times/.env` (gitignored) — MYSQL_PASSWORD, SMTP_*, GOOGLE_CLIENT_ID
- **PM2 processes**: `popular-times-api` (Flask), `berlinometer-scraper` (scraper loop)
- **Env vars to PM2**: `ecosystem.config.js` uses `process.env.*` — never hardcode secrets

## Scraping Infrastructure

- PM2 `berlinometer-scraper` runs `scraper-loop.sh` with randomized 7-12 min intervals + lock file
- `run_scraper.sh` → `gmaps-scraper-fast-robust.py` (Playwright headless Chromium)
- Output: `scraping_*.json` in `popular-times-scrapings/`
- `/latest-scraping` endpoint picks the best file (lowest error rate) from last 5, not just newest
- `validate_occupancy_text` filters garbage: only accepts patterns like "Derzeit zu X% ausgelastet"
- systemd timers are DISABLED (caused duplicate scraping + browser crashes)

## Auth Flow

- **Email registration**: User registers → verification email sent via SMTP → click link → account activated + auto-login via JWT in redirect URL
- **Google OAuth**: Auto-activated (`is_active = 1`) on first login
- **Login**: Returns JWT token, stored in localStorage as `auth_token` + `user_info`
- **Unverified login attempt**: Returns 403 with "check your email" message

## Important Gotchas

- `opening_hours_history` table (NOT `opening_hours`) — columns: weekday, open_time, close_time, is_closed, is_24h
- `close_time < open_time` means overnight operation (e.g., 20:00 - 05:00) — this is normal for Berlin bars
- Frontend `.env` AND `.env.local` must both have `VITE_API_URL=https://berlinometer.de` — `.env.local` overrides `.env`
- Chunk size warning on build is expected (recharts is large)
- Nginx must set `Cross-Origin-Opener-Policy: same-origin-allow-popups` for Google OAuth
