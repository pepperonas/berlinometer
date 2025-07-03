# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Auto Vacanze is a browser-based vehicle simulator with realistic soft-body physics inspired by BeamNG.drive. The core innovation is a custom node-beam physics system that enables real-time vehicle deformation in the browser.

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

The physics engine uses a hybrid approach:
- **Cannon.js**: Handles rigid-body collisions, world physics, and constraints
- **Custom Node-Beam System**: Implements soft-body deformation through interconnected particles

Key physics parameters:
- Node count per vehicle: 250-300 (configured in Vehicle constructor)
- Physics timestep: 1/60 seconds with 2 substeps per frame
- Beam breaking threshold: 30% strain
- Spring stiffness: 1e6 N/m for structural beams

### Module Architecture

```
main.js (Entry point)
├── Game.js (Scene management, game loop)
│   └── Vehicle.js (Vehicle controller)
│       ├── physics/NodeBeamStructure.js (Soft-body physics)
│       └── VehicleVisuals.js (Mesh deformation, rendering)
├── InputController.js (Input handling)
└── UIManager.js (HUD updates)
```

### Critical Implementation Details

1. **Node-Beam Structure** (`NodeBeamStructure.js`):
   - Nodes are distributed in a 3D grid within vehicle dimensions
   - Each node is a Cannon.js particle with mass distributed from total vehicle mass
   - Beams connect adjacent nodes with DistanceConstraints
   - Additional diagonal beams provide structural integrity
   - Real-time beam breaking when strain exceeds threshold

2. **Mesh Deformation** (`VehicleVisuals.js`):
   - Vertex positions interpolated from nearest 4 physics nodes
   - Deformation weighted by inverse distance
   - Geometry normals recalculated each frame
   - Damage affects material properties (roughness, metalness)

3. **Vehicle Wheels**:
   - Separate Cannon.js sphere bodies
   - Connected via PointToPointConstraints to chassis nodes
   - Custom suspension implementation with spring-damper forces
   - Torque applied directly to wheel bodies for propulsion

4. **Performance Considerations**:
   - Consider Web Workers for physics calculations (TODO item #8)
   - LOD system planned but not yet implemented
   - Current target: 60 FPS with 250 nodes per vehicle

### Vehicle Configuration

When creating vehicles, key parameters:
```javascript
{
    mass: 1200,                                    // kg
    dimensions: { width: 1.8, height: 1.4, length: 4.2 }, // meters
    nodeCount: 250                                 // affects performance vs realism
}
```

### Adding New Features

1. **New Vehicle Types**: Extend Vehicle class, adjust dimensions and node distribution
2. **New Tracks**: Add to `Game.createTestArena()`, use Cannon.js bodies for collision
3. **Visual Effects**: Modify `VehicleVisuals.js`, consider performance impact
4. **Physics Tweaks**: Adjust parameters in `NodeBeamStructure.js`, test stability

### Known Limitations

- No audio implementation yet (Web Audio API planned)
- Camera modes limited to chase (cockpit and free camera not implemented)
- No persistence or replay system
- Performance degrades with multiple vehicles due to physics calculations

### Testing Physics

To test deformation:
1. Drive into obstacles at various speeds
2. Check `vehicle.damage` value (0-100 scale)
3. Monitor FPS counter for performance impact
4. Use 'R' key to reset vehicle position and damage

### Common Issues and Fixes

1. **Stats.js Import Error**: Use version 16 instead of r17: `stats.js/16/Stats.min.js`
2. **MeshPhysicalMaterial "thickness" Error**: Remove `thickness` property for Three.js r128 compatibility
3. **Velocity Undefined Error**: Ensure proper null checks in UIManager and Vehicle methods
4. **Initialization Timing**: UIManager connects to game with 100ms delay to ensure vehicle is fully created

### Browser Compatibility

- Chrome/Edge: Best performance (recommended)
- Firefox: Good performance
- Safari: Limited WebGL performance
- Requires modern browser with ES6 module support