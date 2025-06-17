# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "Klatsch-Batsch", a German drinking game web application built with React. The game features card-based challenges with animations and supports both standalone HTML deployment and React development workflow.

## Development Commands

### React Development
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject from Create React App (not recommended)
npm run eject
```

### Deployment Options

The project supports two deployment approaches:

1. **Standalone HTML**: The `index.html` file contains a complete self-contained version with inline React code using Babel transpilation
2. **Built React App**: Standard Create React App build process generates optimized production files

## Architecture

### Component Structure
- **App.js**: Main application logic managing game state, card drawing, and player management
- **PlayerSetup.js**: Initial setup screen for adding/removing players (minimum 2 required)
- **GameBoard.js**: Main game interface with card deck animation and current card display
- **ActiveCards.js**: Displays persistent cards that remain active during gameplay
- **Icons.js**: SVG icon components (Users, Dices, ChevronRight, RotateCcw, Plus, X)

### Game Logic
- **Card System**: 20 predefined cards with different challenges, colors, and persistence rules
- **State Management**: Uses React hooks for game state, player management, and card tracking
- **King's Cup Mechanic**: Special card behavior that changes description based on play count
- **Persistent Cards**: Some cards (Questionmaster, Trinkbuddy, etc.) remain active until replaced
- **Card Drawing**: Prevents duplicate cards until all 20 have been drawn, then resets

### Data Structure
- **cards.js**: Central data file containing all 20 game cards with id, title, description, color, and persistence properties
- **Game States**: 'setup' (player configuration) and 'playing' (active game)
- **Player Management**: Dynamic player list with add/remove functionality

### Styling Approach
- CSS modules for component-specific styles
- Dark theme with Material Design influence
- Responsive design supporting both desktop and mobile
- Animation system for card drawing, shuffling, and reveals
- Custom scrollbar styling for webkit browsers

### Key Features
- Card deck visualization with shuffle animations
- Card flip animations when drawing
- Active card management system
- Responsive player display
- Game reset functionality
- Prevent duplicate cards mechanism