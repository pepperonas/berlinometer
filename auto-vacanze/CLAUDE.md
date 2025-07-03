# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Auto Vacanze is a browser-based vehicle simulator inspired by BeamNG.drive. **IMPORTANT: The project has been simplified from complex soft-body physics to stable rigid-body physics due to stability issues.**

**Current Status**: Using SimpleVehicle.js with single rigid-body chassis and realistic car dynamics.

## Development Commands

```bash
# Start development server
npm start
# or
python3 -m http.server 8080

# Start with live-reload
npm run dev

# Access at: http://localhost:8080
```

## Architecture

### Core Physics System

**Current Implementation (SimpleVehicle.js):**
- **Cannon.js**: Single rigid-body physics with stable car dynamics
- **No soft-body physics**: Simplified approach for stability and predictable movement

Key physics parameters:
- Vehicle mass: 1000kg (adjustable)
- Physics timestep: 1/60 seconds with 3 max substeps
- Solver iterations: 20 (increased for stability)
- Solver tolerance: 0.001

### Module Architecture

```
main.js (Entry point)
├── Game.js (Scene management, game loop)
│   └── SimpleVehicle.js (Current - stable rigid-body physics)
│   └── Vehicle.js (Deprecated - complex soft-body implementation)
├── InputController.js (Input handling)
├── UIManager.js (HUD updates)
└── DebugLogger.js (Performance and state logging)
```

### Current Implementation Details (SimpleVehicle.js)

1. **Chassis System**:
   - Single Cannon.js Box rigid body (1.8m x 1.2m x 4.0m)
   - Mass: 1000kg with realistic damping (linear: 0.2, angular: 0.5)
   - High friction material (0.8) for ground contact
   - Low restitution (0.1) for realistic bouncing

2. **Vehicle Dynamics**:
   - Speed-dependent force application with diminishing returns at high speeds
   - Maximum force: 6000N * speedFactor (reduces as speed increases)
   - Steering only active when moving (speed > 0.3 m/s)
   - Lateral force applied at front of vehicle for realistic steering

3. **Stabilization System**:
   - Anti-flip mechanism with gentle corrective torque
   - Angular velocity limiting to prevent excessive rotation
   - Downforce application at speed (200N per m/s when speed > 2 m/s)
   - Upward velocity limiting to keep vehicle grounded

4. **Visual Components**:
   - Four visual wheels (no separate physics bodies)
   - Wheel rotation based on vehicle speed
   - Mesh deformation: None (rigid visual representation)
   - PBR materials with metalness and roughness

### Deprecated Implementation (Vehicle.js - not currently used)

The original complex soft-body system included:
- Node-beam structure with 200-400 interconnected nodes
- Spring-damper forces between nodes
- Beam breaking simulation at strain thresholds
- Dynamic mesh deformation
- **Status**: Replaced due to stability issues and unpredictable movement

### Vehicle Configuration

**Current SimpleVehicle parameters:**
```javascript
{
    mass: 1000,                                    // kg (default)
    dimensions: { width: 1.8, height: 1.2, length: 4.0 }, // meters
    // No nodeCount - uses single rigid body
}
```

**Previous Vehicle parameters (deprecated):**
```javascript
{
    mass: 1200,                                    // kg
    dimensions: { width: 1.8, height: 1.4, length: 4.2 }, // meters
    nodeCount: 250                                 // soft-body nodes
}
```

### Adding New Features

1. **New Vehicle Types**: Extend SimpleVehicle class, adjust dimensions and mass
2. **New Tracks**: Add to `Game.createTestArena()`, use Cannon.js bodies for collision
3. **Visual Effects**: Modify rendering in SimpleVehicle or Game.js
4. **Physics Tweaks**: Adjust parameters in SimpleVehicle.js (force, damping, etc.)

### Known Limitations

- No audio implementation yet (Web Audio API planned)
- Camera modes limited to chase (cockpit and free camera not implemented)
- No persistence or replay system
- No damage or deformation system (removed with soft-body physics)
- Vehicle movement issues persist despite multiple optimization attempts

### Testing and Debugging

**Current Issues:**
- Vehicle physics still not working properly despite simplified approach
- Car exhibits jerky movement or fails to drive smoothly
- Debug logging available through DebugLogger.js (500ms intervals)

**Testing Tools:**
1. Use 'R' key to reset vehicle position
2. Press F1 to export debug log
3. Press F2 to show debug info in console
4. Monitor console for real-time state logging
5. Check localStorage for detailed debug data

### Common Issues and Fixes

**Fixed Issues:**
1. **Stats.js Import Error**: Use version 16 instead of r17: `stats.js/16/Stats.min.js`
2. **MeshPhysicalMaterial "thickness" Error**: Remove `thickness` property for Three.js r128 compatibility
3. **Velocity Undefined Error**: Ensure proper null checks in UIManager and Vehicle methods
4. **Initialization Timing**: UIManager connects to game with 100ms delay to ensure vehicle is fully created
5. **wheel.body.applyTorque Error**: Replaced with applyForce method compatible with Cannon.js 0.6.2

**Ongoing Issues:**
- Vehicle movement still problematic after switching to SimpleVehicle.js
- Force application and physics parameters need further refinement
- Ground contact and traction simulation requires improvement

### Browser Compatibility

- Chrome/Edge: Best performance (recommended)
- Firefox: Good performance
- Safari: Limited WebGL performance
- Requires modern browser with ES6 module support