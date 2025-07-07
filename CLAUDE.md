# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the mrx3k1.de web application portfolio containing 60+ individual web applications and tools. The project serves as a comprehensive showcase of productivity tools, games, security applications, financial calculators, and educational resources. The main entry point is `index.html` which acts as a central portal to all applications.

## Architecture

### Multi-Application Structure
The codebase is organized as a collection of independent applications, each in its own directory:

- **React Applications**: Full-stack apps with frontend/backend separation (bartender, medical-ai-reports, seolytix, voice-xtract, 5-sekunden, black-stories)
- **Static Web Apps**: Self-contained HTML/CSS/JS applications (entlines, terminal-quiz, pixel-monitor, speech-recognition, beat-sense, wipe-mode)
- **Node.js Services**: Backend APIs and servers (popular-times, xchange, voice-xtract, web2pdf)
- **Hybrid Applications**: Apps with both static and dynamic components (crypto-vault, weather)
- **Vite Applications**: Modern build tool-based apps (popular-times/webapp, kiez-finder)

### Technology Stack Distribution
- **Frontend**: React, Vanilla JavaScript, HTML5 Canvas, CSS Grid/Flexbox, Vite, Tailwind CSS
- **Backend**: Node.js/Express, Python (scraping/AI/audio processing), MongoDB, PostgreSQL
- **Build Tools**: Create React App, Vite, Webpack
- **Deployment**: Static hosting, PM2 process management, Nginx reverse proxy
- **Analytics**: Google Analytics (G-CFB9X06V8L) with custom event tracking and cookie consent management

## Common Development Commands

### React Applications
Most React apps use Create React App structure:
```bash
# Development
npm install
npm start

# Production build
npm run build

# Testing
npm test
```

### Full-Stack Applications
Applications like `bartender`, `seolytix`, `medical-ai-reports`:
```bash
# Frontend development
npm start

# Backend development  
npm run server:dev  # or npm run dev for backend-only apps

# Full development (both frontend and backend)
npm run dev  # runs concurrently in bartender

# Production build
npm run build:prod  # if available, otherwise npm run build
```

### Vite Applications
Modern apps using Vite (popular-times/webapp, kiez-finder):
```bash
# Development
npm install
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Static Applications
Most static apps require no build process - simply open `index.html` in a browser.

### Python Services
Services like `popular-times`:
```bash
# Install dependencies
pip install -r requirements.txt

# Run server
python server.py
```

## Port Management

The `PORTS.md` file documents all port assignments across the ecosystem. Key considerations:
- Port conflicts exist between some services (4996, 5000, 5012)
- Backend services typically run on ports 3000-5081
- Frontend development servers use ports 3001-3003
- Database services use standard ports (5432 PostgreSQL, 27017 MongoDB)
- Voice-xtract uses proxy configuration pointing to port 4992

## Application Categories

### Games & Entertainment
- **entlines/**: Flappy Bird clone with HTML5 Canvas and custom physics
- **5-sekunden/**: React-based party game with timer mechanics
- **klatsch-batsch/**: Drinking game with card system and player management
- **black-stories/**: Mystery solving game with story database
- **billiard/**: 3D pool game with physics simulation (secret app)
- **moto-racer-2/**: 3D motorcycle racing game with realistic physics (secret app)

### Productivity Tools
- **crypto-vault/**: Multi-algorithm encryption tool (AES, RSA, Caesar)
- **objectcut-react/**: AI-powered background removal with Python backend
- **voice-xtract/**: Audio separation using machine learning
- **bartender/**: Complete bar management system with inventory and sales
- **speech-recognition/**: Real-time speech-to-text conversion
- **cliptune/**: Audio trimming tool with waveform visualization
- **beat-sense/**: Real-time BPM detection for music
- **sound-rank/**: Music genre charts explorer (200 tracks per genre)
- **pixel-monitor/**: Real-time screen color change monitoring
- **web-shot/**: Browser-based webcam photo capture
- **wipe-mode/**: Laptop cleaning mode (locks keyboard/touchpad)
- **popular-times/**: Google Maps foot traffic analyzer
- **ticket-generator/**: Event ticket creator with QR codes (secret app)

### Security Applications
- **mpsec/**: 2FA token manager with TOTP implementation
- **zipzap/**: Educational zip bomb demonstration tool
- **browser-key-logger/**: Educational keylogger for security awareness
- **free-wifi/**: Phishing demonstration portal
- **mcfly/**: McDonald's order number display backup app

### Financial Tools
- **freelance-calc/**: Freelancer income calculator with tax calculations
- **immo-calc/**: Real estate investment analysis tool
- **steuerschleuder/**: German tax calculator
- **immo-berlin/**: Berlin real estate analysis with heatmaps

## Database Integration

### MongoDB Applications
- Bartender system (inventory, sales, users)
- Medical AI reports (document storage)
- Tech documentation system
- Security applications (user management)

### File-Based Storage
- Popular times data (JSON exports)
- Photo gallery (file system)
- Xchange file sharing (upload directory)

## Analytics Implementation

The main portal includes Google Analytics (G-CFB9X06V8L) with custom event tracking:
- App launch events capture which applications users access
- Event properties include app name, URL, and category
- All app links automatically trigger tracking events
- Cookie consent banner implementation with localStorage persistence
- Tracking only activates after user consent
- Custom events for search, scroll depth, and category filtering

## Deployment Patterns

### Static Deployment
Single-file applications like `entlines`, `terminal-quiz` can be deployed by copying the HTML file.

### Process Management
Production services use PM2 with ecosystem configuration files for process management and auto-restart. Applications with PM2 configs:
- bartender/ecosystem.config.js
- medical-ai-reports/backend/ecosystem.config.js
- objectcut-react/ecosystem.config.js
- photos/ecosystem.config.js
- seolytix/backend/ecosystem.config.js
- voice-xtract/server/ecosystem.config.js
- web2pdf/ecosystem.config.js

### Reverse Proxy
Nginx configurations handle routing between multiple services and static content serving.

## Security Considerations

### Educational Security Tools
Several applications are designed for security education and testing:
- Always include clear warnings about educational purpose
- Implement proper access controls for demonstration tools
- Follow responsible disclosure practices

### Authentication Systems
Full-stack applications implement JWT-based authentication with:
- Bcrypt password hashing
- Token expiration and refresh
- Role-based access control

## Development Workflow

### Adding New Applications
1. Create directory for the application
2. Update main `index.html` to include new app card
3. Add port assignment to `PORTS.md` if backend service
4. Include analytics tracking for new app links
5. Create application-specific CLAUDE.md if complex

### Testing Applications
- React apps: Use `npm test` for unit tests
- Static apps: Manual testing in multiple browsers
- Backend services: API testing with tools like Postman
- Full-stack: Integration testing across frontend/backend

## Specialized Applications

### Canvas-Based Games
Applications like `entlines` use HTML5 Canvas with:
- Custom physics engines
- Parallax scrolling backgrounds
- Audio synthesis for game music
- Touch and keyboard input handling

### AI/ML Integration
Several applications integrate machine learning:
- Voice extraction using audio separation models (voice-xtract)
- Background removal with computer vision (objectcut-react)
- Medical report analysis with OpenAI integration (medical-ai-reports)
- Speech recognition using Web Speech API (speech-recognition)
- BPM detection algorithms (beat-sense)

### Real-time Applications
- **beat-sense/**: Audio analysis with Web Audio API
- **pixel-monitor/**: Screen capture and color monitoring
- **speech-recognition/**: Live transcription
- **popular-times/**: Live Google Maps data scraping

## File Organization

The repository uses a flat directory structure where each application is self-contained. Shared resources like favicons and images are stored at the root level. The main `index.html` serves as the application launcher with categorized sections for different types of tools.

## Special Features

### Secret Applications
The main portal includes hidden "secret" applications that can be unlocked by holding the heart emoji (❤️) in the footer for 2 seconds:
- **billiard/**: 3D pool game
- **moto-racer-2/**: 3D motorcycle racing
- **ticket-generator/**: Event ticket creation tool

### Animation System
The main portal features multiple background animations selectable via dropdown:
- Code animation (default)
- Sun animation
- Rain animation

### Search and Navigation
- Real-time search across app titles, descriptions, and keywords
- Category filtering with dedicated buttons
- Responsive grid layout with hover effects
- App count display updates dynamically