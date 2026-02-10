<div align="center">

# Berlinometer

**Real-time occupancy tracker for Berlin's bars and clubs**

[![CI](https://github.com/pepperonas/berlinometer/actions/workflows/ci.yml/badge.svg)](https://github.com/pepperonas/berlinometer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.7.3-blue.svg)](https://github.com/pepperonas/berlinometer)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fberlinometer.de)](https://berlinometer.de)

[![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Repo Size](https://img.shields.io/github/repo-size/pepperonas/berlinometer)](https://github.com/pepperonas/berlinometer)
[![Last Commit](https://img.shields.io/github/last-commit/pepperonas/berlinometer)](https://github.com/pepperonas/berlinometer/commits/main)

[**berlinometer.de**](https://berlinometer.de)

[![Deutsch](https://img.shields.io/badge/lang-Deutsch-blue)](README.md)

</div>

---

Find out where the party is tonight. Berlinometer scrapes Google Maps occupancy data for 100+ bars and clubs across Berlin, showing you real-time and historical crowd levels so you can pick the perfect spot.

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Quick Start](#quick-start)
6. [Available Scripts](#available-scripts)
7. [Frontend Architecture](#frontend-architecture)
8. [API Endpoints](#api-endpoints)
9. [Scraping System](#scraping-system)
10. [Deployment](#deployment)
11. [Configuration](#configuration)
12. [Troubleshooting](#troubleshooting)
13. [Contributing](#contributing)
14. [Legal Notice](#legal-notice)
15. [License](#license)

---

## Features

- **Real-time scraping** - Live occupancy data from Google Maps, auto-refreshed every 10-13 min
- **Historical charts** - 12h / 24h / 48h occupancy trends per location
- **Mood barometer** - City-wide vibe indicator based on aggregate occupancy
- **3 themes** - Dark, Light, Berlin (BVG yellow)
- **2 languages** - German and English
- **Google OAuth** - One-click login alongside email/password auth
- **PWA-ready** - Installable on mobile, works offline with cached data
- **Distance sorting** - Sort locations by distance from your current position
- **Saved locations** - Bookmark and reorder your favourite spots
- **Insights dashboard** - Analytics page with aggregated trends

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, Chart.js, Recharts |
| Backend | Python Flask, MySQL |
| Scraping | Playwright (headless Chromium) |
| Auth | JWT + Google OAuth 2.0 |
| Hosting | Nginx, PM2, Ubuntu VPS |
| CI | GitHub Actions (lint, build, test) |

---

## Architecture

```
Browser  --->  Nginx (reverse proxy)
                  |
            +-----+-----+
            |           |
         Static      Flask API (:5044)
         Files         |
                    MySQL DB
                       |
              Playwright Scraper (cron)
              Google Maps -> occupancy data
```

### System Overview

```
+-----------------------------------------------------------+
|                     SCRAPING SYSTEM                        |
+-----------------------------------------------------------+
|                                                            |
|  Cron --> schedule_scraper.sh --> run_scraper.sh           |
|                                      |                     |
|                                      v                     |
|              gmaps-scraper-fast-robust.py                  |
|              (Playwright / Headless Chromium)               |
|                                      |                     |
|                                      v                     |
|              JSON: occupancy_data_YYYYMMDD_HHMMSS.json     |
|                                      |                     |
|                                      v                     |
|              process_json_to_db.py --> MySQL DB             |
|                                                            |
+-----------------------------------------------------------+
```

---

## Project Structure

```
berlinometer/
├── webapp/                        # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/            # ActionBar, SideDrawer
│   │   │   ├── ui/                # Dialog (unified modal)
│   │   │   ├── insights/          # Analytics components
│   │   │   └── *.jsx              # Feature components
│   │   ├── contexts/              # Auth, Theme, Language providers
│   │   ├── pages/                 # HomePage, InsightsPage
│   │   ├── utils/                 # Distance calc, analytics helpers
│   │   └── styles/                # Theme CSS
│   ├── public/                    # Static assets
│   ├── deploy-safe.sh             # Safe deployment script
│   ├── vite.config.js             # Default Vite config
│   ├── vite.config.berlinometer.js
│   └── package.json
├── server.py                      # Python Flask backend
├── ecosystem.config.js            # PM2 configuration
├── generate-occupancy-chart.sh    # Occupancy chart generator
├── .github/workflows/ci.yml      # GitHub Actions CI
├── README.md                      # German version
└── README_EN.md                   # This file
```

---

## Quick Start

### Frontend

```bash
cd webapp
npm install
npm run dev          # http://localhost:3000
```

Create a `.env.local`:
```
VITE_API_URL=https://berlinometer.de
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Backend

```bash
python3 -m venv venv && source venv/bin/activate
pip install flask flask-cors playwright mysql-connector-python flask-jwt-extended
python server.py     # http://localhost:5044
```

Required environment variables:
```bash
export JWT_SECRET_KEY="your-secret-key"
export GOOGLE_CLIENT_ID="your-google-client-id"
export MYSQL_PASSWORD="your-mysql-password"
```

---

## Available Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

---

## Frontend Architecture

### Context Providers

The application is wrapped in multiple context providers in `main.jsx`:

1. **GoogleOAuthProvider** - Google authentication (requires `VITE_GOOGLE_CLIENT_ID`)
2. **LanguageProvider** - i18n support (German/English)
3. **ThemeProvider** - Dark/Light/Berlin theme system
4. **AuthProvider** - User authentication and JWT token management

### Routing

```
/              -> HomePage (main scraping interface)
/insights      -> InsightsPage (analytics dashboard)
```

### Components

**Layout** (`src/components/layout/`):
- `ActionBar` - Sticky top navigation with hamburger menu
- `SideDrawer` - Slide-in navigation drawer (authenticated users only)

**UI** (`src/components/ui/`):
- `Dialog` - Unified modal dialog with backdrop blur and focus management

**Features**:
- `SearchBar` - Location input with Google OAuth login integration
- `MoodBarometer` - Visual mood/occupancy indicator
- `ResultsDisplay` - Scraped data presentation with filters
- `OccupancyChart` - Historical data visualization
- `UserLocations` - Saved locations management
- `UserProfile` - User settings and theme selector

### State Management

**Global State** (React Context):
- `AuthContext` - User authentication, token, login/logout
- `ThemeContext` - Theme selection (dark/light/berlin) with localStorage persistence
- `LanguageContext` - i18n translations (de/en)

### Styling / Themes

**CSS Architecture**:
- `index.css` - Global styles, utility classes, base theme variables
- `styles/themes.css` - Theme-specific CSS custom properties
- Component-specific CSS files colocated with components

**Theme Variables** (CSS Custom Properties):
```css
--background, --text-primary, --text-secondary
--accent-blue, --accent-green, --border-color
--card-bg, --input-bg, --hover-bg
```

**Utility Classes**:
- `.btn-primary`, `.btn-secondary`, `.btn-success`, `.btn-danger`
- `.backdrop-blur`, `.backdrop-blur-sm/md/lg/xl`
- `.card`, `.container`

### Multi-Language Support

Translation files are in `src/contexts/LanguageContext.jsx`.

```javascript
import { useLanguage } from '../contexts/LanguageContext'

const { t, language, setLanguage } = useLanguage()
return <h1>{t('welcomeMessage')}</h1>
```

Adding new translations:
1. Add key to both `translations.de` and `translations.en` in `LanguageContext.jsx`
2. Use via `t('key')` in components

---

## API Endpoints

The Python Flask backend runs on port 5044.

| Method | Path | Description |
|--------|------|------------|
| `POST` | `/scrape` | Scrape locations |
| `POST` | `/find-locations` | Search near address |
| `POST` | `/auth/login` | User login |
| `POST` | `/auth/register` | User registration |
| `POST` | `/auth/google` | Google OAuth |
| `GET` | `/latest-scraping` | Latest scraping data |
| `GET` | `/location-history` | Historical data |
| `GET` | `/user-locations` | User's saved locations |
| `GET` | `/insights/*` | Analytics endpoints |

---

## Scraping System

### Overview

The scraper uses Playwright (headless Chromium) to collect Google Maps occupancy data at randomized intervals (10-13 minutes) and store it in a MySQL database.

| Component | Function |
|-----------|----------|
| `schedule_scraper.sh` | Scheduling with randomized intervals |
| `run_scraper.sh` | Orchestrates the scraping process |
| `gmaps-scraper-fast-robust.py` | Main scraper using Playwright |
| `process_json_to_db.py` | JSON-to-database import |

### Scraping Pipeline

**1. Scheduling** - Randomized intervals to avoid bot detection:

```bash
MIN_DELAY=$((10 * 60))  # 10 minutes
MAX_DELAY=$((13 * 60))  # 13 minutes
RANDOM_DELAY=$((MIN_DELAY + RANDOM % (MAX_DELAY - MIN_DELAY)))
```

`schedule_scraper.sh` dynamically modifies its own cron entry so intervals are unpredictable.

**2. Execution** - `run_scraper.sh` activates the virtual environment, runs the scraper, and imports results into the database.

**3. Data Output** - JSON files in format `occupancy_data_YYYYMMDD_HHMMSS.json`.

**4. Database Import** - `process_json_to_db.py` validates and imports data via MySQL stored procedure.

### Playwright Browser Automation

#### Why Playwright?

| Feature | Selenium | Puppeteer | Playwright |
|---------|----------|-----------|------------|
| Multi-Browser | yes | no (Chrome only) | yes |
| Auto-Wait | no | partial | yes |
| Network Interception | partial | yes | yes |
| Performance | Slow | Fast | Very fast |
| Python Support | yes | no | yes |

#### Browser Configuration

```python
browser = await playwright.chromium.launch(
    headless=True,
    args=[
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials'
    ]
)

context = await browser.new_context(
    viewport={'width': 1920, 'height': 1080},
    user_agent='Mozilla/5.0 ...',
    locale='de-DE',
    timezone_id='Europe/Berlin'
)
```

| Argument | Purpose |
|----------|---------|
| `--disable-blink-features=AutomationControlled` | Removes `navigator.webdriver` flag |
| `--no-sandbox` | Required for root execution |
| `--disable-dev-shm-usage` | Prevents shared memory issues |
| `--disable-web-security` | Bypasses CORS restrictions |

### Anti-Detection Strategies

#### 1. User-Agent Rotation

```python
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ... Chrome/120.0.0.0 ...',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ... Chrome/119.0.0.0 ...',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (X11; Linux x86_64) ... Chrome/120.0.0.0 ...'
]
```

#### 2. Viewport Variation

```python
VIEWPORTS = [
    {'width': 1280, 'height': 720},
    {'width': 1366, 'height': 768},
    {'width': 1920, 'height': 1080},
    {'width': 1440, 'height': 900}
]
```

#### 3. Timing Randomization

```python
async def human_like_delay():
    """Simulates human-like wait times"""
    base_delay = random.uniform(2, 5)
    micro_delay = random.uniform(0.1, 0.5)
    await asyncio.sleep(base_delay + micro_delay)
```

#### 4. Resource Blocking

```python
async def block_unnecessary_resources(route):
    """Blocks images, fonts, media for faster loading"""
    if route.request.resource_type in ['image', 'media', 'font', 'stylesheet']:
        await route.abort()
    else:
        await route.continue_()
```

#### 5. Cookie Banner Handling

```python
COOKIE_SELECTORS = [
    'button:has-text("Alle akzeptieren")',
    'button:has-text("Accept all")',
    'button:has-text("Akzeptieren")',
    '[aria-label*="Accept"]',
    'form[action*="consent"] button[type="submit"]'
]
```

### Data Extraction

#### Location Name

Cascading selector approach with URL fallback:

```python
NAME_SELECTORS = [
    'h1[data-attrid="title"]',     # Primary
    'h1.DUwDvf',                   # Google Maps standard
    '[data-value="Ort"]',          # Alternative
    'h1.fontHeadlineLarge',        # New Google Maps version
    'h1'                           # Universal fallback
]

# If all selectors fail: extract name from URL
def extract_name_from_url(url):
    decoded_url = urllib.parse.unquote(url)
    place_match = re.search(r'/place/([^/@]+)', decoded_url)
    if place_match:
        return place_match.group(1).replace('+', ' ').strip()
    return "Unknown Location"
```

#### Occupancy Data

```python
OCCUPANCY_SELECTORS = [
    '[class*="section-popular-times-live-value"]',
    '[aria-label*="ausgelastet"]',
    '[aria-label*="busy"]',
    'span:has-text("% ausgelastet")',
    '[data-live-time]'
]
```

Automatically detects whether live data (`"Currently X% busy"`) or historical data is available.

#### Address

```python
ADDRESS_SELECTORS = [
    'button[data-item-id="address"]',
    '[data-tooltip="Adresse kopieren"]',
    'button[aria-label*="Adresse"]',
    '[class*="address"]'
]
```

### Retry Mechanisms

#### Multi-Retry Strategy

Each retry attempt uses different configurations (viewport, user agent, timeouts):

```python
class RetryConfig:
    def __init__(self, attempt):
        self.timeout = 30000 + (attempt * 10000)  # 30s, 40s, 50s
        self.viewport = VIEWPORTS[attempt % len(VIEWPORTS)]
        self.user_agent = USER_AGENTS[attempt % len(USER_AGENTS)]
```

#### Adaptive Timeouts

Timeouts automatically adjust based on success rate:

```python
class AdaptiveTimeout:
    def get_timeout(self):
        failure_rate = self.failure_count / max(1, self.success_count + self.failure_count)
        multiplier = 1 + (failure_rate * 0.5)
        return int(self.base_timeout * multiplier)
```

#### Graceful Degradation

```
Level 1: Full data (name, address, occupancy)
Level 2: Name and address only
Level 3: URL-based data only (100% success rate)
```

### Database Import

#### JSON-to-MySQL Pipeline

```python
def process_json_file(filepath, db_pool):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    # Support both JSON formats
    results = data.get('results', data.get('locations', []))
    for result in results:
        save_to_database(result, db_pool)
```

#### Data Validation

Invalid texts (reviews, photos, descriptions) are filtered. Only validated occupancy patterns are accepted:

```python
VALID_PATTERNS = [
    r'Derzeit zu \d+\s*%.*ausgelastet',
    r'Um \d{2}:\d{2} Uhr zu \d+\s*%.*ausgelastet',
    r'\d+\s*% ausgelastet'
]
```

#### MySQL Stored Procedure

The database uses a stored procedure `insert_occupancy_data` that automatically creates locations (INSERT ... ON DUPLICATE KEY UPDATE) and writes occupancy data to the `occupancy_history` table.

### Performance Metrics

| Metric | Value |
|--------|-------|
| Location name success rate | 100% |
| Occupancy data success rate | 75% |
| Live data detection | 50% |
| Average time per URL | 20s |
| Retry success rate | 85% |

### Recommended Rate Limits

```python
DELAY_BETWEEN_REQUESTS = (4, 8)      # seconds
DELAY_BETWEEN_SESSIONS = (30, 60)    # seconds
MAX_REQUESTS_PER_HOUR = 120          # ~2 per minute
```

---

## Deployment

### Safe Deployment Process

The project uses a safe deployment script (`webapp/deploy-safe.sh`), developed after a critical incident where backend files were accidentally deleted by `rsync --delete`.

```bash
cd webapp
npm run build
./deploy-safe.sh
```

The script:
1. Checks build directory exists
2. Verifies all frontend files are present
3. Creates backup on VPS (timestamped)
4. Deploys ONLY frontend files (whitelist approach)
5. Verifies website loads
6. Verifies backend files still exist
7. Cleans up old backups (keeps last 10)

**NEVER use:**
```bash
# DANGEROUS - Deletes backend files!
rsync -av --delete build/ root@VPS:/var/www/html/popular-times/
```

### Protected Files

These files must NEVER be touched during deployment:

**Backend scripts:**
```
server.py, requirements.txt, schedule_scraper.sh,
run_scraper.sh, process_json_to_db.py, gmaps-scraper-fast-robust.py
```

**Directories:**
```
venv/, analytics/, popular-times-scrapings/, maps-playwrite-scraper/
```

**Config and data files:**
```
.env, ecosystem.config.js, *.db, *.log
```

### Rollback

**Automatic:** The deployment script automatically rolls back if the website doesn't load (HTTP != 200) or protected files are missing.

**Manual:**
```bash
# List available backups
ssh root@VPS "ls -lt /var/www/html/popular-times/deployment-backups/"

# Roll back to specific backup
ssh root@VPS "cp -r /var/www/html/popular-times/deployment-backups/frontend-TIMESTAMP/* /var/www/html/popular-times/"

# Verify
curl https://berlinometer.de/
```

### Deployment Checklist

**Before deployment:**
- [ ] Version updated in `package.json`
- [ ] Frontend built successfully (`npm run build`)
- [ ] Using `deploy-safe.sh` (NOT manual rsync)
- [ ] VPS connection works
- [ ] No ongoing scraping process

**After deployment:**
- [ ] Website loads: https://berlinometer.de
- [ ] Assets load correctly (no 404 errors)
- [ ] API endpoints work: `/latest-scraping`
- [ ] Backend server running: `ps aux | grep server.py`
- [ ] Scraper files exist

---

## Configuration

### Environment Variables

**Frontend** (`.env.local`):
```bash
VITE_API_URL=https://berlinometer.de
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

**Backend** (environment variables or `.env`):
```bash
JWT_SECRET_KEY=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
MYSQL_HOST=localhost
MYSQL_USER=martin
MYSQL_PASSWORD=your-mysql-password
MYSQL_DATABASE=popular_times_db
MYSQL_PORT=3306
```

### Vite Build Configurations

| Config | Base Path | Output | Usage |
|--------|-----------|--------|-------|
| `vite.config.js` | `/` | `build/` | berlinometer.de |
| `vite.config.berlinometer.js` | `./` (relative) | `build-berlinometer/` | berlinometer.de root |
| `vite.config.mrx3k1.js` | `/popular-times/` | `build/` | mrx3k1.de subdirectory |

### Google OAuth Setup

- Configure Client ID in Google Cloud Console
- Authorized JavaScript origins: `https://berlinometer.de`
- Authorized redirect URIs: `https://berlinometer.de` and `https://berlinometer.de/`
- Backend requires `GOOGLE_CLIENT_ID` environment variable

### PM2 Backend Management

```bash
pm2 list                    # Check status
pm2 logs popular-times      # View logs
pm2 restart popular-times   # Restart backend
```

### Monitoring

```bash
# Scraper status
systemctl status popular-times-scraper

# Live logs
tail -f /var/log/scraper.log

# Recent successful scrapings
mysql -u martin -p popular_times_db -e "
SELECT
    DATE(timestamp) as date,
    COUNT(*) as entries,
    COUNT(DISTINCT location_id) as locations
FROM occupancy_history
WHERE timestamp > DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(timestamp)
ORDER BY date DESC;"

# Cron job status
crontab -l | grep schedule_scraper
```

---

## Troubleshooting

### Website shows white screen

**Cause:** Incorrect Vite base path configuration

**Solution:** Use `vite.config.berlinometer.js` with `base: './'`

### API endpoints return HTML instead of JSON

**Cause:** Nginx routing issue

**Check:**
```bash
curl -I https://berlinometer.de/latest-scraping
# Expected: Content-Type: application/json
```

### API 404 errors

**Cause:** `.env.local` overrides `.env` with localhost URL

**Solution:** Both `.env` and `.env.local` must have identical `VITE_API_URL=https://berlinometer.de`

### Google OAuth COOP error

**Cause:** Missing Cross-Origin-Opener-Policy header

**Solution:** Nginx must set `Cross-Origin-Opener-Policy: same-origin-allow-popups`

### Scraping stopped after deployment

**CRITICAL:** Protected files were deleted!

```bash
# Check scraper files
ssh root@VPS "ls -lh /var/www/html/popular-times/*.sh"

# Restore from git
cd /var/www/html/popular-times
git checkout -- schedule_scraper.sh run_scraper.sh

# Manually restart cron job
/var/www/html/popular-times/schedule_scraper.sh
```

### No data being saved

```bash
# Check if scraper is running
ps aux | grep gmaps-scraper

# Check JSON output
ls -la /var/www/html/popular-times/popular-times-scrapings/ | tail -5

# Check latest database entries
mysql -u martin -p popular_times_db -e "SELECT MAX(timestamp) FROM occupancy_history;"
```

### Playwright browser won't start

```bash
# Check Playwright installation
python3 -m playwright install chromium

# Install missing dependencies
sudo apt-get install libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libdbus-1-3 libxkbcommon0 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2
```

### All locations show "Unknown"

**Cause:** Google Maps changed its layout

**Solution:** Update `NAME_SELECTORS` array in the scraper

### Rate Limiting / 429 Errors

```python
# Increase delays
DELAY_BETWEEN_URLS = (6, 12)  # instead of (4, 8)

# Fewer locations per run
MAX_LOCATIONS_PER_RUN = 30  # instead of 50
```

---

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push and open a PR

CI will automatically run lint, build, and tests on your PR.

---

## Legal Notice

Google Maps ToS prohibit automated scraping. This system is:
- For personal/educational purposes only
- Not intended for commercial use
- Rate-limited to minimize server load

**Recommendations:**
1. Use official APIs where possible (Google Places API)
2. Keep scraping frequency low
3. Respect robots.txt
4. Do not store personal data

---

## License

[MIT](LICENSE) - Martin Pfeffer
