# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a Flappy Bird clone web game implemented as a single-page application. The entire game is contained in one `index.html` file with inline CSS and JavaScript. No build process or external dependencies are required.

## Technology Stack
- **HTML5 Canvas** - All game graphics rendered via Canvas API
- **Vanilla JavaScript** - No frameworks or libraries
- **Inline CSS** - All styles embedded in the HTML file
- **German UI** - Game interface is in German

## Running the Game
Simply open `index.html` in any modern web browser. No server or build process required.

## Game Architecture

### Core Game Objects
- **Bird** (line 111): Player character with physics properties
  - Position, velocity, gravity mechanics
  - Rotation based on velocity for realistic animation
  - Wing flapping animation using sine wave

### Key Game Mechanics
- **Collision Detection** (line 211-217): Rectangle-based collision between bird and pipes
- **Scoring System** (line 205-209): Points awarded when passing pipes
- **Game States**: Not started, playing, game over
- **Input Handling**: Spacebar or click to jump

### Visual Elements
- **Background Layers**: Parallax scrolling with mountains, trees, clouds
- **Pipe Generation** (line 161): Random height obstacles at regular intervals
- **Canvas Rendering**: All graphics drawn each frame in `draw()` function

## Common Modifications

### Adjusting Game Difficulty
- **Gravity**: `bird.gravity` (line 117) - increase for harder game
- **Jump Force**: `bird.jump` (line 118) - adjust jump strength
- **Pipe Gap**: `pipeGap` (line 132) - space between upper/lower pipes
- **Pipe Speed**: `pipeSpeed` (line 133) - horizontal movement speed

### Visual Customization
- **Background Gradient**: Lines 30-35 define sky/ground gradient
- **Bird Colors**: Lines 333-372 in `drawBird()` function
- **Pipe Colors**: Lines 384-387 define pipe gradient

## Code Organization
Since everything is in one file, the structure is:
1. HTML structure (lines 1-105)
2. CSS styles (lines 7-83)
3. JavaScript game logic (lines 106-461)
   - Variable declarations
   - Event handlers
   - Update functions
   - Drawing functions
   - Game loop

## Testing
No automated tests. Test by playing the game and checking:
- Bird physics feel natural
- Collision detection works correctly
- Score increments properly
- Game restart functions correctly

## Deployment
Upload the single `index.html` file to any web server or open locally.