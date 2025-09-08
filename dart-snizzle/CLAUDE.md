# CLAUDE.md - Dart Snizzle

This file provides guidance to Claude Code when working with the Dart Snizzle project.

## Project Overview

**Dart Snizzle** is a professional Progressive Web App (PWA) for dart games built with React and Node.js. It features comprehensive user management, player statistics, multiple game modes, and social features.

## Architecture

### Backend (Node.js/Express)
- **Port**: 5070 (reserved in PORTS.md)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with manual admin approval system
- **Process Management**: PM2 with ecosystem.config.js

### Frontend (React PWA)
- **Framework**: React 19 with Router v6
- **Styling**: Custom CSS with dark theme specification
- **PWA Features**: Service Worker, Web App Manifest, installable
- **Charts**: Chart.js for statistics visualization

## Key Features Implemented

### 🎯 Dart Game Modes
- **301, 501, 701**: Standard countdown games with double-out
- **Cricket**: Numbers and bull targeting with point accumulation
- **Around the Clock**: Sequential number targeting (1-20)
- **Custom Games**: Configurable starting scores and rules

### 👥 User & Player Management
- **User Accounts**: JWT authentication with admin approval workflow
- **Player Management**: Unlimited players per user with individual stats
- **Friend System**: Search users, send/accept friend requests
- **Admin Panel**: User activation, suspension, role management

### 📊 Statistics & Analytics
- **Comprehensive Stats**: Games played/won, averages, high scores
- **Chart Visualizations**: Performance trends, throw distribution
- **Achievement System**: Unlockable badges and milestones
- **Leaderboards**: Compare performance across game modes

### 🌐 Social Features
- **Online Multiplayer**: Room codes for remote games
- **Spectator Mode**: Watch active games
- **Friend Challenges**: Invite friends to games
- **Game History**: Complete throw-by-throw replay

## File Structure

```
dart-snizzle/
├── backend/
│   ├── models/           # MongoDB schemas (User, Player, Game)
│   ├── routes/          # API endpoints (auth, players, games, stats, admin)
│   ├── middleware/      # Authentication, validation
│   ├── server.js        # Express server setup
│   ├── ecosystem.config.js  # PM2 configuration
│   └── package.json     # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/  # React components by feature
│   │   ├── contexts/    # React context providers
│   │   ├── services/    # API service layer
│   │   └── styles/      # CSS theme system
│   ├── public/
│   │   └── manifest.json # PWA manifest
│   └── package.json     # Frontend dependencies
├── README.md           # Comprehensive documentation
└── CLAUDE.md          # This file
```

## Development Commands

### Backend Development
```bash
cd backend
npm install
npm run dev        # Development with nodemon
npm start         # Production start
pm2 start ecosystem.config.js  # PM2 process management
```

### Frontend Development
```bash
cd frontend
npm install
npm start         # Development server (port 3000)
npm run build     # Production build
```

### Database Setup
- MongoDB must be running on localhost:27017
- Database: `dart-snizzle`
- Collections auto-created by Mongoose
- First user needs manual admin role assignment

## Theme System

The app uses a comprehensive dark theme based on Material Design:

### Color Palette
- **Background Dark**: #2B2E3B
- **Card Background**: #343845  
- **Accent Blue**: #688db1 (primary actions)
- **Accent Green**: #9cb68f (success states)
- **Accent Red**: #e16162 (danger/errors)
- **Text Primary**: #d1d5db
- **Text Secondary**: #9ca3af

### Component System
- **Cards**: Rounded containers with shadows and hover effects
- **Buttons**: Multiple variants (primary, secondary, outline, danger)
- **Forms**: Consistent input styling with focus states
- **Grid Layouts**: Responsive auto-fit grids
- **Mobile Optimization**: Touch-friendly button sizes

## API Architecture

### Authentication Flow
1. User registers → status: 'pending'
2. Admin manually activates → status: 'active'
3. JWT token generated with user ID and role
4. Protected routes check token + status

### Game Flow
1. Create game with selected players and mode
2. Start game → initialize player scores
3. Add throws → update scores and statistics
4. Game completion → update player achievements
5. Save complete game history

### Statistics Calculation
- Real-time average calculation during games
- Game mode specific statistics tracking
- Achievement unlocking based on performance
- Chart data aggregation for visualization

## Deployment Configuration

### VPS Deployment (mrx3k1.de)
- **Backend**: PM2 process on port 5070
- **Frontend**: Static files served by Nginx
- **Database**: MongoDB on localhost
- **SSL**: Let's Encrypt certificate
- **Reverse Proxy**: Nginx configuration for API routes

### Environment Configuration
```env
NODE_ENV=production
PORT=5070
MONGODB_URI=mongodb://localhost:27017/dart-snizzle
JWT_SECRET=secure-random-string
CORS_ORIGIN=https://mrx3k1.de
```

## PWA Features

### Service Worker
- Cache important assets for offline functionality
- Background sync for game data
- Push notifications for multiplayer invites

### Web App Manifest
- Standalone display mode
- Custom icons and splash screens
- Theme colors matching app design
- Installable on desktop and mobile

## Security Considerations

### Backend Security
- bcrypt password hashing (salt rounds: 10)
- JWT token expiration (30 days default)
- Rate limiting on API endpoints
- Input validation with express-validator
- CORS configuration for production

### Frontend Security
- No sensitive data in localStorage
- API token in Authorization header
- Automatic logout on 401 responses
- XSS protection through React's built-in escaping

## Common Development Tasks

### Adding New Game Mode
1. Update Game model with new mode enum
2. Add mode-specific logic in game routes
3. Create frontend component for mode
4. Update statistics calculation
5. Add mode to game setup selection

### Adding New Statistics
1. Extend Player model stats schema
2. Update statistics calculation in Game model methods
3. Add API endpoint in stats routes
4. Create frontend chart component
5. Update dashboard to display new stats

### Modifying User System
1. Update User model schema
2. Modify authentication middleware if needed
3. Update API routes and validation
4. Adjust frontend auth context
5. Test admin approval workflow

## Testing Strategy

### Backend Testing
- Unit tests for model methods
- Integration tests for API endpoints
- Authentication middleware testing
- Database connection testing

### Frontend Testing
- Component unit tests with React Testing Library
- Context provider testing
- API service mocking
- PWA functionality testing

## Performance Optimization

### Backend Optimization
- MongoDB indexing on frequently queried fields
- Pagination for large data sets
- Caching strategies for statistics
- PM2 cluster mode for scalability

### Frontend Optimization
- Code splitting with React.lazy()
- Image optimization and lazy loading
- Service Worker caching strategies
- Bundle size analysis and optimization

## Troubleshooting Guide

### Common Issues
1. **Auth errors**: Check JWT secret and token expiration
2. **Database connection**: Verify MongoDB service status
3. **CORS errors**: Check origin configuration in production
4. **PWA installation**: Verify HTTPS and manifest validity
5. **Statistics not updating**: Check game completion workflow

### Development Setup Issues
1. **Port conflicts**: Ensure 5070 is available
2. **MongoDB not found**: Install and start MongoDB service
3. **NPM install errors**: Check Node.js version compatibility
4. **Build failures**: Verify environment variables

## Future Enhancement Ideas

### Gameplay Features
- Tournament brackets and management
- Team games and relay matches
- Custom scoring systems
- Voice commands for score input
- Dart board camera recognition

### Social Features
- Club/league management
- Global tournaments
- Live streaming integration
- Chat system during games
- Video call integration

### Technical Improvements
- Real-time WebSocket game updates
- Advanced caching strategies
- Machine learning for checkout suggestions
- Mobile app versions
- Desktop app with Electron

---

This project demonstrates a complete full-stack application with modern web technologies, comprehensive user management, and production-ready deployment configuration.