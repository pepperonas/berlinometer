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

</div>

---

Find out where the party is tonight. Berlinometer scrapes Google Maps occupancy data for 100+ bars and clubs across Berlin, showing you real-time and historical crowd levels so you can pick the perfect spot.

## Features

- **Real-time scraping** - Live occupancy data from Google Maps, auto-refreshed every 20-30 min
- **Historical charts** - 12h / 24h / 48h occupancy trends per location
- **Mood barometer** - City-wide vibe indicator based on aggregate occupancy
- **3 themes** - Dark, Light, Berlin (BVG yellow)
- **2 languages** - German and English
- **Google OAuth** - One-click login alongside email/password auth
- **PWA-ready** - Installable on mobile, works offline with cached data
- **Distance sorting** - Sort locations by distance from your current position
- **Saved locations** - Bookmark and reorder your favourite spots
- **Insights dashboard** - Analytics page with aggregated trends

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, Chart.js, Recharts |
| Backend | Python Flask, SQLite |
| Scraping | Playwright (headless Chromium) |
| Auth | JWT + Google OAuth 2.0 |
| Hosting | Nginx, PM2, Ubuntu VPS |
| CI | GitHub Actions (lint, build, test) |

## Architecture

```
Browser  --->  Nginx (reverse proxy)
                  |
            +-----+-----+
            |           |
         Static      Flask API (:5044)
         Files         |
                    SQLite DB
                       |
              Playwright Scraper (cron)
              Google Maps -> occupancy data
```

## Project Structure

```
berlinometer/
├── webapp/                     # React frontend
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── contexts/           # Auth, Theme, Language providers
│   │   ├── pages/              # HomePage, InsightsPage
│   │   ├── utils/              # Distance calc, analytics helpers
│   │   └── styles/             # Theme CSS
│   ├── vite.config.js
│   └── package.json
├── scraper/                    # Playwright scraping scripts
├── .github/workflows/ci.yml   # GitHub Actions CI
└── README.md
```

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
cd scraper
python3 -m venv venv && source venv/bin/activate
pip install flask flask-cors playwright
python server.py     # http://localhost:5044
```

## Available Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment instructions including Nginx config, PM2 setup, and safe deploy scripts.

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push and open a PR

CI will automatically run lint, build, and tests on your PR.

## Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment guide
- [SCRAPING-SYSTEM.md](SCRAPING-SYSTEM.md) - How the scraper works
- [webapp/CLAUDE.md](webapp/CLAUDE.md) - Frontend architecture reference

## License

[MIT](LICENSE) - Martin Pfeffer
