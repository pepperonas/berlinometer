import { NodeBeamStructure } from './physics/NodeBeamStructure.js';
import { VehicleVisuals } from './VehicleVisuals.js';

export class Vehicle {
    constructor(scene, world, config = {}) {
        this.scene = scene;
        this.world = world;
        
        // Vehicle configuration
        this.config = {
            mass: config.mass || 1200,
            dimensions: config.dimensions || { width: 2, height: 1.4, length: 4.5 },
            nodeCount: config.nodeCount || 8, // Start with minimal nodes (2x2x2 grid)
            ...config
        };
        
        // Components
        this.nodeBeamStructure = null;
        this.visuals = null;
        this.wheels = [];
        this.engine = {
            power: 150, // kW
            maxRPM: 6500,
            currentRPM: 1000,
            torqueCurve: this.createTorqueCurve()
        };
        
        // State
        this.damage = 0;
        this.speed = 0;
        this.gear = 1;
        this.steerAngle = 0;
        this.isInvulnerable = true;
        this.invulnerabilityTimer = 5000; // 5 seconds in milliseconds
        
        this.init();
    }
    
    init() {
        // Create main chassis body (rigid body)
        this.createChassis();
        
        // Create wheels attached to chassis
        this.createWheels();
        
        // Create simple visual representation (no complex soft-body for now)
        this.createSimpleVisuals();
        
        // Set initial position (just above ground)
        this.setPosition(0, 1.5, 0);
    }
    
    createChassis() {
        // Create main rigid body for the chassis
        const chassisShape = new CANNON.Box(new CANNON.Vec3(
            this.config.dimensions.width / 2,
            this.config.dimensions.height / 2,
            this.config.dimensions.length / 2
        ));
        
        this.chassisBody = new CANNON.Body({
            mass: this.config.mass * 0.8, // 80% of total mass in chassis
            shape: chassisShape,
            position: new CANNON.Vec3(0, 0, 0),
            material: new CANNON.Material({
                friction: 0.7,  // Higher friction for better grip
                restitution: 0.2
            })
        });
        
        // Reduced damping to allow movement
        this.chassisBody.linearDamping = 0.01; // Much lower for movement
        this.chassisBody.angularDamping = 0.1; // Reduced angular damping
        
        this.world.add(this.chassisBody);
    }
    
    createSimpleVisuals() {
        // Simple box visual for the car body
        const carGeo = new THREE.BoxGeometry(
            this.config.dimensions.width,
            this.config.dimensions.height,
            this.config.dimensions.length
        );
        
        const carMat = new THREE.MeshStandardMaterial({
            color: 0x2196F3,
            metalness: 0.6,
            roughness: 0.4
        });
        
        this.carMesh = new THREE.Mesh(carGeo, carMat);
        this.carMesh.castShadow = true;
        this.carMesh.receiveShadow = true;
        this.scene.add(this.carMesh);
    }
    
    createWheels() {
        const wheelPositions = [
            { x: -0.8, y: -0.3, z: 1.5 },  // Front left
            { x: 0.8, y: -0.3, z: 1.5 },   // Front right
            { x: -0.8, y: -0.3, z: -1.5 }, // Rear left
            { x: 0.8, y: -0.3, z: -1.5 }   // Rear right
        ];
        
        wheelPositions.forEach((pos, index) => {
            const wheel = this.createWheel(pos, index < 2);
            this.wheels.push(wheel);
        });
    }
    
    createWheel(position, isFront) {
        // Visual wheel
        const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16);
        const wheelMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const wheelMesh = new THREE.Mesh(wheelGeo, wheelMat);
        wheelMesh.rotation.z = Math.PI / 2;
        wheelMesh.castShadow = true;
        this.scene.add(wheelMesh);
        
        // Rim
        const rimGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.21, 8);
        const rimMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.8,
            roughness: 0.2
        });
        const rimMesh = new THREE.Mesh(rimGeo, rimMat);
        rimMesh.rotation.z = Math.PI / 2;
        wheelMesh.add(rimMesh);
        
        // NO separate wheel body - wheels are part of the chassis
        // This is the key fix - no separate physics bodies for wheels
        
        return {
            mesh: wheelMesh,
            position: position,
            isFront: isFront
        };
    }
    
    createTorqueCurve() {
        // Simplified torque curve
        return {
            getCurve: (rpm) => {
                const normalized = rpm / this.engine.maxRPM;
                return Math.sin(normalized * Math.PI * 0.8) * 300; // Nm
            }
        };
    }
    
    applyThrottle(amount) {
        // Moderate acceleration with ground check
        const maxSpeed = 15; // m/s (54 km/h)
        const acceleration = amount * 0.8; // Balanced acceleration
        
        // Only apply thrust if car is on ground (Y position check)
        if (this.chassisBody.position.y > 3) {
            // Car is airborne, don't add more speed
            return;
        }
        
        // Apply force as impulse to prevent excessive velocity accumulation
        const forward = this.chassisBody.quaternion.vmult(new CANNON.Vec3(0, 0, -acceleration));
        this.chassisBody.velocity.vadd(forward, this.chassisBody.velocity);
        
        // Limit max speed
        const currentSpeed = this.chassisBody.velocity.length();
        if (currentSpeed > maxSpeed) {
            this.chassisBody.velocity.scale(maxSpeed / currentSpeed, this.chassisBody.velocity);
        }
        
        // Keep car grounded (prevent flying)
        if (this.chassisBody.velocity.y > 2) {
            this.chassisBody.velocity.y = 2; // Limit upward velocity
        }
        
        // Update RPM
        this.engine.currentRPM = Math.min(
            this.engine.maxRPM,
            this.engine.currentRPM + amount * 100
        );
    }
    
    applyBrake(amount) {
        // Apply braking directly to chassis
        this.chassisBody.velocity.scale(1 - amount * 0.1, this.chassisBody.velocity);
        this.chassisBody.angularVelocity.scale(1 - amount * 0.1, this.chassisBody.angularVelocity);
    }
    
    applySteering(angle) {
        this.steerAngle = angle * 0.3; // Gentle steering
        
        // Only steer if moving
        const speed = this.chassisBody.velocity.length();
        if (speed > 0.1) {
            // Simple angular velocity steering - works at any speed
            this.chassisBody.angularVelocity.y = this.steerAngle * 2; // Reduced rotation
        }
    }
    
    update(deltaTime) {
        // Update invulnerability timer
        if (this.isInvulnerable) {
            this.invulnerabilityTimer -= deltaTime * 1000; // Convert to milliseconds
            if (this.invulnerabilityTimer <= 0) {
                this.isInvulnerable = false;
            }
        }
        
        // Update car visual to match chassis physics
        this.carMesh.position.copy(this.chassisBody.position);
        this.carMesh.quaternion.copy(this.chassisBody.quaternion);
        
        // Add gentle stability control
        this.updateStability();
        
        // Update wheels
        this.updateWheels();
        
        // Update engine
        this.updateEngine();
    }
    
    updateWheels() {
        this.wheels.forEach(wheel => {
            // Simply move wheel visual to follow chassis position
            const wheelWorldPos = this.chassisBody.position.vadd(
                this.chassisBody.quaternion.vmult(new CANNON.Vec3(...Object.values(wheel.position)))
            );
            
            wheel.mesh.position.copy(wheelWorldPos);
            wheel.mesh.quaternion.copy(this.chassisBody.quaternion);
        });
    }
    
    updateStability() {
        // Anti-flip mechanism - keep vehicle upright
        const upVector = new CANNON.Vec3(0, 1, 0);
        const chassisUp = this.chassisBody.quaternion.vmult(upVector);
        
        // If vehicle is tilting too much, apply corrective torque
        const tiltAngle = Math.acos(chassisUp.dot(upVector));
        
        if (tiltAngle > 0.5) { // 30 degrees tilt threshold
            // Apply gentle corrective torque to straighten vehicle
            const correctionAxis = chassisUp.cross(upVector);
            correctionAxis.normalize();
            
            const correctionTorque = correctionAxis.scale(tiltAngle * 500); // Gentler correction
            this.chassisBody.angularVelocity.vadd(correctionTorque.scale(0.001), this.chassisBody.angularVelocity);
        }
        
        // Limit excessive angular velocity to prevent flipping
        if (this.chassisBody.angularVelocity.length() > 3) {
            this.chassisBody.angularVelocity.scale(0.8, this.chassisBody.angularVelocity);
        }
    }
    
    updateEngine() {
        // Simple RPM decay when not accelerating
        this.engine.currentRPM *= 0.98;
        this.engine.currentRPM = Math.max(1000, this.engine.currentRPM);
    }
    
    updateDamage() {
        // Simple damage based on impact forces (implement later)
        // For now, damage stays at 0
    }
    
    setPosition(x, y, z) {
        this.chassisBody.position.set(x, y, z);
        this.chassisBody.velocity.set(0, 0, 0);
        this.chassisBody.angularVelocity.set(0, 0, 0);
        
        // Update visual position
        this.carMesh.position.set(x, y, z);
    }
    
    reset() {
        // Reset position and velocity
        this.setPosition(0, 1.5, 0);
        
        // Reset state
        this.damage = 0;
        this.engine.currentRPM = 1000;
        this.steerAngle = 0;
        this.isInvulnerable = true;
        this.invulnerabilityTimer = 5000;
    }
    
    getPosition() {
        return this.chassisBody.position;
    }
    
    getVelocity() {
        return this.chassisBody.velocity;
    }
    
    dispose() {
        // Clean up Three.js objects
        this.visuals.dispose();
        
        // Remove chassis
        this.world.remove(this.chassisBody);
        
        // Remove car visual
        this.scene.remove(this.carMesh);
        
        // Remove wheels
        this.wheels.forEach(wheel => {
            this.scene.remove(wheel.mesh);
        });
        
        // No complex physics to clean up
    }
}