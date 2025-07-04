# CLAUDE.md - Drive-MP Documentation

This file provides comprehensive guidance for Claude Code when working with the Drive-MP vehicle physics simulation project.

## Project Overview

Drive-MP is a browser-based vehicle physics simulation inspired by BeamNG.drive, featuring advanced soft-body physics, realistic vehicle dynamics, and immersive audiovisual effects. The project uses Three.js for 3D rendering and Cannon-es for physics simulation.

### Key Features
- **Advanced Soft-Body Physics**: 328-node beam structure with progressive damage modeling
- **Realistic Vehicle Dynamics**: RaycastVehicle with custom suspension, tire friction, and engine simulation
- **Particle Effects System**: Tire smoke, sparks, debris, and environmental effects
- **Procedural Audio Engine**: Real-time engine sounds, collision audio, and 3D spatial audio
- **Professional Telemetry**: Real-time monitoring of vehicle performance and structural integrity
- **Multiple Camera Modes**: Chase, orbit, cockpit, and free camera systems

## Architecture

### Core Systems
```
src/
├── core/
│   ├── Game.js          # Main game loop and system orchestration
│   ├── Physics.js       # Cannon-es physics world management
│   └── Renderer.js      # Three.js rendering system
├── vehicle/
│   ├── Vehicle.js                    # Main vehicle class with RaycastVehicle
│   ├── AdvancedNodeBeamStructure.js  # 328-node soft-body physics
│   └── Wheel.js                      # Individual wheel physics and rendering
├── effects/
│   └── ParticleEffectsManager.js     # Particle systems for smoke, sparks, debris
├── audio/
│   └── AudioEngine.js                # Procedural sound generation and 3D audio
├── utils/
│   └── InputManager.js               # Keyboard and gamepad input handling
└── world/
    └── World.js                      # Environment, terrain, and obstacles
```

## Development Commands

### Starting the Development Server
```bash
# Install dependencies (if needed)
npm install

# Start local development server
npm start
# or
npm run dev
# Both run: python3 -m http.server 8080
```

### Accessing the Application
- **Local URL**: http://localhost:8080
- **Entry Point**: index.html
- **Main Module**: src/core/Game.js

### Dependencies
- **Three.js v0.161.0**: 3D rendering engine
- **Cannon-es v0.20.0**: Physics simulation library
- **No build process required**: Uses ES6 modules directly in browser

## Key Implementation Details

### Vehicle Physics System

#### RaycastVehicle Configuration
```javascript
// Vehicle setup in src/vehicle/Vehicle.js:153
const vehicle = new CANNON.RaycastVehicle({
    chassisBody: this.chassis,
    indexRightAxis: 0,   // X-axis points right
    indexForwardAxis: 2, // Z-axis points forward  
    indexUpAxis: 1       // Y-axis points up
});
```

#### Critical Engine Parameters
```javascript
// Engine configuration in Vehicle.js:22-36
this.mass = 1500;           // kg - vehicle mass
this.engineForce = 2000;    // Base engine force
this.currentGear = 2;       // Start in first gear (index 2)
this.gearRatios = [-3.5, 0, 3.8, 2.5, 1.8, 1.3, 1.0, 0.8]; // R, N, 1-6
```

#### Steering Direction Fix
**IMPORTANT**: Steering was corrected in InputManager.js:136-140:
```javascript
// Fixed steering direction
if (action === 'steerLeft') {
    this.emit('steer', value);      // Positive value for left
} else if (action === 'steerRight') {
    this.emit('steer', value * -1); // Negative value for right
}
```

### Advanced Soft-Body Physics

#### Node-Beam Structure
- **328 nodes** distributed across vehicle components
- **Different material properties**: bumper, frame, roof, doors, trunk
- **Progressive damage system**: Beams break under stress, affecting vehicle integrity
- **Stress redistribution**: Forces transfer to remaining beams when others fail

#### Material Configuration
```javascript
// In AdvancedNodeBeamStructure.js
materials = {
    frame: { strength: 15000, flexibility: 0.2 },
    bumper: { strength: 8000, flexibility: 0.4 },
    roof: { strength: 12000, flexibility: 0.3 },
    doors: { strength: 10000, flexibility: 0.35 }
};
```

### Audio System

#### Procedural Engine Sound
```javascript
// AudioEngine.js uses multiple oscillators for realistic engine sound
this.engineOscillators = [
    { type: 'sawtooth', frequency: 80, gain: 0.3 },  // Base rumble
    { type: 'square', frequency: 160, gain: 0.2 },   // Mid-range
    { type: 'triangle', frequency: 320, gain: 0.1 }  // High harmonics
];
```

#### 3D Spatial Audio
- **Positional audio**: Sounds positioned relative to vehicle
- **Doppler effect**: Frequency shifts based on velocity
- **Distance attenuation**: Volume decreases with distance

### Particle Effects System

#### Performance Optimization
- **Object pooling**: Reuses particle objects to avoid garbage collection
- **LOD system**: Reduces particle count based on distance
- **Batch rendering**: Groups similar particles for efficient rendering

#### Effect Types
- **Tire smoke**: Generated based on wheel slip ratios
- **Impact sparks**: Created during collisions
- **Debris**: Metal fragments from vehicle damage
- **Environmental**: Dirt spray, water splash

## Controls and Input

### Keyboard Controls
- **W/↑**: Accelerate
- **S/↓**: Brake/Reverse
- **A/←**: Steer Left
- **D/→**: Steer Right
- **Space**: Handbrake
- **C**: Change Camera Mode
- **R**: Reset Vehicle
- **F**: Toggle Debug Info

### Gamepad Support
- **A Button**: Accelerate
- **B Button**: Brake
- **Left Stick**: Steering
- **Right/Left Triggers**: Analog acceleration/braking

## Performance Considerations

### Physics Optimization
- **Physics timestep**: 120Hz for stability (Physics.js:24)
- **Broadphase**: NaiveBroadphase for small world
- **Contact material**: Optimized friction and restitution values

### Rendering Optimization
- **Shadow casting**: Selective shadow rendering for performance
- **LOD system**: Planned for complex scenes
- **Frustum culling**: Automatic in Three.js

## Common Development Patterns

### Adding New Vehicle Components
1. **Create node configuration** in AdvancedNodeBeamStructure.js
2. **Define material properties** for the component type
3. **Add connection patterns** to integrate with existing structure
4. **Update visual representation** if needed

### Implementing New Effects
1. **Add particle type** to ParticleEffectsManager.js
2. **Create particle pool** for the effect type
3. **Implement update logic** in the effect system
4. **Trigger effects** from vehicle events

### Audio Integration
1. **Define sound parameters** in AudioEngine.js
2. **Create oscillator configuration** for procedural sounds
3. **Implement 3D positioning** for spatial audio
4. **Connect to vehicle events** for trigger conditions

## Debugging and Testing

### Debug Information
- **F key**: Toggles comprehensive debug panel
- **Telemetry panel**: Real-time vehicle performance data
- **Console logging**: Extensive logging for physics and input events

### Performance Monitoring
- **FPS counter**: Real-time frame rate display
- **Physics timing**: Milliseconds per physics step
- **Particle count**: Active particle system load
- **Node integrity**: Structural damage monitoring

### Common Issues and Solutions

#### Vehicle Not Moving
1. **Check gear state**: Ensure not in neutral (gear index 1)
2. **Verify engine force**: Should be 2000 with 0.1 multiplier
3. **Check wheel friction**: Ensure adequate tire grip
4. **Inspect input system**: Verify throttle events are firing

#### Physics Instability
1. **Reduce timestep**: Lower physics frequency if needed
2. **Check constraint limits**: Ensure reasonable suspension values
3. **Verify mass distribution**: Check chassis and wheel masses
4. **Monitor velocity**: Prevent extreme velocities

#### Audio Issues
1. **User interaction required**: Modern browsers require user gesture for audio
2. **Check AudioContext**: Verify context is not suspended
3. **Volume levels**: Ensure reasonable gain values
4. **Browser compatibility**: Test in different browsers

## Future Development

### Planned Features (Todo List)
- **Real-time mesh deformation**: Vertex shader-based visual damage
- **Advanced tire physics**: Pacejka Magic Formula implementation
- **Vehicle mechanics**: Differential, transmission, turbo systems
- **PBR graphics pipeline**: HDR rendering and post-processing
- **Multiplayer system**: WebRTC peer-to-peer racing

### Extension Points
- **Custom vehicles**: Add new vehicle configurations
- **Track editor**: Build custom racing environments
- **Weather system**: Dynamic environmental conditions
- **AI drivers**: Computer-controlled vehicles

## Deployment

### Production Build
- **No build step required**: Direct ES6 module serving
- **Static hosting compatible**: Can be served from any web server
- **HTTPS required**: For gamepad API and audio context
- **Modern browser required**: ES6 modules and WebGL support

### Server Requirements
- **Static file serving**: Any HTTP server
- **No backend needed**: Fully client-side application
- **CORS headers**: May be needed for CDN resources

## Security Considerations

- **CDN dependencies**: Uses jsdelivr.net for Three.js and Cannon-es
- **No external data**: All assets are procedurally generated
- **Local storage**: No sensitive data stored
- **Safe physics**: No dangerous calculations or infinite loops

## Performance Targets

- **60 FPS minimum**: On modern hardware
- **120Hz physics**: For stable simulation
- **<100 active particles**: For smooth rendering
- **<5ms physics time**: Per frame for 60 FPS headroom

This documentation should provide comprehensive guidance for future development of the Drive-MP vehicle physics simulation system.