# Port Configuration Overview

This document lists all ports used by applications in this project.

## Backend Services

| Port | Service               | Application        | File Location                          |
|------|-----------------------|--------------------|----------------------------------------|
| 3000 | Keyboard Logger Demo  | browser-key-logger | `browser-key-logger/express_server.js` |
| 3001 | Data Fortress Backend | datenfestung       | `datenfestung/backend/.env`            |
| 4777 | Blog Framework        | blog-framework     | `blog/blog-framework/app.js`           |
| 4800 | WiFi Phishing Demo    | free-wifi          | `free-wifi/server.js`                  |
| 4991 | Object Cut Backend    | objectcut-react    | `objectcut-react/server/server.js`     |
| 4996 | Secret Content Server | secret-content     | `secret-content/server.js`             |
| 4996 | Hidden Content Server | hidden-content     | `hidden-content/server.js`             |
| 5000 | Energy Tracking       | glitter-hue        | `glitter-hue/server/server.js`         |
| 5000 | Challenge Platform    | endeavour          | `endeavour/backend/server.js`          |
| 5005 | Secure Marketplace    | secure-marketplace | `secure-marketplace/backend/server.js` |
| 5007 | Tech Documentation    | techdocs           | `techdocs/server/server.js`            |
| 5009 | File Sharing          | xchange            | `xchange/server.js`                    |
| 5010 | SEO Analytics         | seolytix           | `seolytix/backend/server.js`           |
| 5012 | Security App          | mpsec              | `mpsec/server/.env`                    |
| 5012 | Icon AI Server        | iconif-ai          | `iconif-ai/server/Dockerfile`          |
| 5015 | Social Market Backend | social-market      | `social-market/backend/server.js`      |
| 5024 | Bartender System      | bartender          | `bartender/.env`                       |
| 5033 | Weather API           | weather-tracker    | `api/weather-tracker/weather_api.js`   |
| 5044 | Popular Times API     | popular-times      | `popular-times/server.py`              |
| 5050 | Photo Server          | photos             | `photos/server.js`                     |
| 5060 | MRX Media Scraper     | xxxxxx             | `/xxxxx.js`                            |
| 5063 | Medical AI Reports    | medical-ai-reports | `medical-ai-reports/backend/.env`      |
| 5016 | Cicero Request Monitor| cicero             | `cicero/backend/server.js`             |
| 5070 | Dart Counter PWA      | dart-snizzle       | `dart-snizzle/backend/server.js`       |
| 5080 | Instagram Downloader  | instagram-dl       | `instagram-dl/backend/server.js`       |
| 5081 | PDF Converter         | web2pdf            | `web2pdf/app.js`                       |
| 5090 | Verification API      | kiezform-verification | `kiezform-verification/backend/server.js` |

## Frontend Applications

| Port | Service                | Application  | File Location                     |
|------|------------------------|--------------|-----------------------------------|
| 3002 | Data Fortress Frontend | datenfestung | Referenced in backend CORS config |
| 3003 | Icon AI Client         | iconif-ai    | `iconif-ai/client/Dockerfile`     |

## Database Services

| Port  | Service    | Used By                                        |
|-------|------------|------------------------------------------------|
| 5432  | PostgreSQL | Data Fortress                                  |
| 27017 | MongoDB    | Bartender, Security App, Medical AI, Tech Docs |
| 587   | SMTP       | Data Fortress (email)                          |

## Port Conflicts

⚠️ **Note:** The following ports are used by multiple services:

- **4996**: Used by both secret-content and hidden-content servers
- **5000**: Used by both glitter-hue and endeavour applications
- **5012**: Used by both mpsec security app and iconif-ai server

## Environment Variables

Most services support port configuration via environment variables:

- `PORT` - Standard port environment variable
- `SERVER_PORT` - Used by bartender system
- `SMTP_PORT` - Used for email services

## Production Considerations

- Ensure no port conflicts when running multiple services
- Use reverse proxy (nginx/Apache) for production deployments
- Consider containerization for isolated port management
- All services default to localhost/127.0.0.1 binding