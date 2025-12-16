# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

This is the React frontend for Berlinometer (berlinometer.de) - a real-time Google Maps occupancy analyzer. The application scrapes location data and displays live/historical occupancy information with user authentication, multi-language support, and theming.

**For backend/deployment documentation, see**: `../CLAUDE.md` in the parent directory.

## Development Commands

### Local Development
```bash
npm install          # Install dependencies
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build → build/
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Deployment Builds

**Standard Build** (for mrx3k1.de/popular-times):
```bash
npm run build
# Output: build/ with base path /popular-times/
```

**Berlinometer Build** (for berlinometer.de root):
```bash
npx vite build --config vite.config.berlinometer.js
# Output: build-berlinometer/ with base path /
```

### Safe Deployment to Production
```bash
./deploy-safe.sh
```
This script:
- Creates backups before deployment
- Uses whitelist approach (only deploys frontend files)
- Never touches backend files (server.py, venv/, *.db, etc.)
- Verifies deployment success
- Auto-rollback on failure

**CRITICAL**: Never use `rsync --delete` for deployment - mixed frontend/backend codebase requires whitelist approach.

## Architecture

### Context Providers (main.jsx)
Application is wrapped in multiple context providers in this order:
1. **GoogleOAuthProvider**: Google authentication (requires VITE_GOOGLE_CLIENT_ID)
2. **LanguageProvider**: i18n support (German/English)
3. **ThemeProvider**: Dark/Light theme system
4. **AuthProvider**: User authentication and JWT token management

### Routing Structure
```javascript
/              → HomePage (main scraping interface)
/insights      → InsightsPage (analytics dashboard)
```

### Key Components Architecture

**Layout Components** (`src/components/layout/`):
- `ActionBar`: Sticky top navigation with hamburger menu
- `SideDrawer`: Slide-in navigation drawer (only for authenticated users)

**UI Components** (`src/components/ui/`):
- `Dialog`: Unified modal dialog with backdrop blur and focus management

**Feature Components**:
- `SearchBar`: Location input with Google OAuth login integration
- `MoodBarometer`: Visual mood/occupancy indicator
- `ResultsDisplay`: Scraped data presentation with filters
- `OccupancyChart`: Historical data visualization
- `UserLocations`: Saved locations management
- `UserProfile`: User settings and theme selector

### State Management

**Global State** (React Context):
- `AuthContext`: User authentication, token, login/logout
- `ThemeContext`: Theme selection (dark/light) with localStorage persistence
- `LanguageContext`: i18n translations (de/en)

**Local State**: Component-level useState for UI state

### API Integration

**Environment Variables**:
```bash
VITE_API_URL=https://berlinometer.de              # Production
VITE_GOOGLE_CLIENT_ID=414227852820-...            # Google OAuth
```

**API Endpoints** (Python Flask backend on port 5044):
- `POST /scrape` - Scrape locations
- `POST /find-locations` - Search near address
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/google` - Google OAuth
- `GET /latest-scraping` - Latest scraping data
- `GET /location-history` - Historical data
- `GET /user-locations` - User's saved locations
- `GET /insights/*` - Analytics endpoints

### Styling System

**CSS Architecture**:
- `index.css`: Global styles, utility classes, base theme variables
- `styles/themes.css`: Theme-specific CSS custom properties
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

**Translation Files**: `src/contexts/LanguageContext.jsx`

**Usage**:
```javascript
import { useLanguage } from '../contexts/LanguageContext'

const { t, language, setLanguage } = useLanguage()
return <h1>{t('welcomeMessage')}</h1>
```

**Adding Translations**:
1. Add key to both `translations.de` and `translations.en` in LanguageContext.jsx
2. Use via `t('yourKey')` in components

## Build Configuration

### Vite Configs

**vite.config.js** (Standard):
- Base path: `/` (for berlinometer.de)
- Output: `build/`
- Dev server: localhost:3000

**vite.config.berlinometer.js**:
- Base path: `./ ` (relative paths)
- Output: `build-berlinometer/`
- Used for berlinometer.de root deployment

**vite.config.mrx3k1.js**:
- Base path: `/popular-times/`
- Output: `build/`
- Used for mrx3k1.de subdirectory deployment

### Environment Files

- `.env`: Default environment variables
- `.env.local`: Local overrides (takes precedence)
- `.env.berlinometer`: Berlinometer-specific config
- `.env.mrx3k1`: mrx3k1.de-specific config

**CRITICAL**: Both `.env` and `.env.local` must have identical `VITE_API_URL` for production.

## Component Patterns

### Dialog Component Usage
All modals use the unified `Dialog` component:

```javascript
import Dialog from '../ui/Dialog'

<Dialog
  isOpen={showDialog}
  onClose={() => setShowDialog(false)}
  title="Dialog Title"
  showCloseButton={true}
  fullscreenOnMobile={false}
>
  {/* Dialog content */}
</Dialog>
```

### Authentication Flow
1. User clicks Login → `AuthDialog` opens
2. Shows `LoginForm` or `RegisterForm` (switchable)
3. Can use email/password or Google OAuth
4. On success: JWT token stored in localStorage
5. `AuthContext` provides user state globally

### Theme Switching
1. User selects theme in `UserProfile` or `SideDrawer`
2. `ThemeContext` updates and persists to localStorage
3. CSS custom properties update via `data-theme` attribute on `<html>`

## Common Development Tasks

### Adding New Component
1. Create component file in `src/components/`
2. Create companion CSS file if needed
3. Use existing utility classes from `index.css`
4. Import and use in parent component

### Adding New Route
1. Create page component in `src/pages/`
2. Add route in `src/App.jsx`:
```javascript
<Route path="/new-page" element={<NewPage />} />
```

### Updating Version
Update version in `package.json` and deployment documentation will reflect it.

## Testing Deployment

**Before deploying**:
1. Build locally: `npm run build`
2. Test build: `npm run preview`
3. Check browser console for errors
4. Verify all assets load (no 404s)

**After deploying**:
```bash
# Website loads
curl -s https://berlinometer.de/ | head -20

# Assets load (check HTTP status)
curl -s -o /dev/null -w '%{http_code}' https://berlinometer.de/assets/index-*.js

# API works
curl -s -o /dev/null -w '%{http_code}' https://berlinometer.de/latest-scraping
```

## Critical Configuration Notes

### Google OAuth Setup
- Client ID must be configured in Google Cloud Console
- Authorized JavaScript origins: `https://berlinometer.de`
- Authorized redirect URIs: `https://berlinometer.de` and `https://berlinometer.de/`
- Backend must have `GOOGLE_CLIENT_ID` environment variable set via PM2 ecosystem.config.js

### CORS Configuration
Backend must allow requests from frontend domain. Nginx handles CORS headers for API routes.

### PM2 Backend Management
Backend runs via PM2 with `ecosystem.config.js`:
```bash
pm2 list                    # Check status
pm2 logs popular-times      # View logs
pm2 restart popular-times   # Restart backend
```

## Known Issues & Solutions

### Issue: White Screen After Deployment
**Cause**: Incorrect Vite base path configuration
**Solution**: Use `vite.config.berlinometer.js` with `base: './'` for relative paths

### Issue: API 404 Errors
**Cause**: `.env.local` overrides `.env` with localhost URL
**Solution**: Ensure both `.env` and `.env.local` have identical `VITE_API_URL=https://berlinometer.de`

### Issue: Assets 404 Errors
**Cause**: Wrong build config used (absolute vs relative paths)
**Solution**: Use correct Vite config for deployment target

### Issue: Google OAuth COOP Error
**Cause**: Missing Cross-Origin-Opener-Policy header
**Solution**: Nginx must set `Cross-Origin-Opener-Policy: same-origin-allow-popups`

## File Structure Reference

```
webapp/
├── src/
│   ├── components/
│   │   ├── layout/          # ActionBar, SideDrawer
│   │   ├── ui/              # Dialog (unified modal)
│   │   ├── insights/        # Analytics components
│   │   └── *.jsx            # Feature components
│   ├── contexts/            # React Context providers
│   ├── pages/               # Route components
│   ├── styles/              # Global theme CSS
│   ├── utils/               # Utility functions
│   ├── App.jsx              # Route configuration
│   └── main.jsx             # App entry point with providers
├── public/                  # Static assets
├── build/                   # Production build output
├── deploy-safe.sh           # Safe deployment script
├── vite.config.js           # Default Vite config
├── vite.config.berlinometer.js  # Berlinometer-specific config
└── package.json             # Dependencies and scripts
```

## Related Documentation

- **Backend & Full System**: See `../CLAUDE.md` in parent directory
- **Deployment Details**: See `../DEPLOYMENT.md`
- **API Documentation**: See backend `server.py` docstrings
- **Scraping System**: See `../SCRAPING-SYSTEM.md`
