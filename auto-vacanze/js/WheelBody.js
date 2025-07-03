/**
 * WheelBody - Individual wheel with realistic tire physics and ground contact
 * Implements BeamNG-style wheel physics with traction, slip, and tire deformation
 */
export class WheelBody {
    constructor(world, position, config = {}) {
        this.world = world;
        this.config = {
            radius: config.radius || 0.35,
            width: config.width || 0.2,
            mass: config.mass || 20,
            isSteered: config.isSteered || false,
            isDriven: config.isDriven || false,
            ...config
        };
        
        // Create wheel physics body
        const wheelShape = new CANNON.Cylinder(this.config.radius, this.config.radius, this.config.width, 8);
        this.body = new CANNON.Body({
            mass: this.config.mass,
            shape: wheelShape,
            position: position.clone(),
            material: new CANNON.Material({
                friction: 0.8,
                restitution: 0.3
            })
        });
        
        // Rotate cylinder to be a wheel (around X axis)
        this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
        
        // Wheel state
        this.steerAngle = 0; // Current steering angle
        this.spinVelocity = 0; // Rotational velocity
        this.driveForce = 0; // Applied drive force
        this.brakeForce = 0; // Applied brake force
        this.isGrounded = false; // Is wheel touching ground
        this.groundContactPoint = null;
        this.groundNormal = null;
        
        // Tire physics
        this.tireProperties = {
            staticFriction: 1.2,
            kineticFriction: 0.8,
            rollingResistance: 0.02,
            sidewallStiffness: 5000,
            maxSlipAngle: Math.PI / 6, // 30 degrees
            maxSlipRatio: 0.3
        };
        
        // Current tire state
        this.slipAngle = 0; // Angle between wheel direction and velocity
        this.slipRatio = 0; // Difference between wheel speed and ground speed
        this.lateralForce = new CANNON.Vec3();
        this.longitudinalForce = new CANNON.Vec3();
        
        // Suspension connection
        this.suspensionAttachmentPoint = null;
        this.suspensionNode = null;
        
        // Add to physics world
        this.world.add(this.body);
        
        // Visual representation
        this.visualMesh = null;
        
        console.log(`[WHEEL_CREATED] R:${this.config.radius}m, Steered:${this.config.isSteered}, Driven:${this.config.isDriven}`);
    }
    
    /**
     * Update wheel physics each frame
     */
    update(deltaTime) {
        this.updateGroundContact();
        this.updateTirePhysics(deltaTime);
        this.updateWheelRotation(deltaTime);
        this.applyForces();
        
        if (this.visualMesh) {
            this.updateVisualMesh();
        }
    }
    
    /**
     * Check for ground contact and calculate contact properties
     */
    updateGroundContact() {
        // Simple ground contact check (Y < wheel radius)
        const wheelBottom = this.body.position.y - this.config.radius;
        
        if (wheelBottom <= 0) {
            this.isGrounded = true;
            this.groundContactPoint = new CANNON.Vec3(
                this.body.position.x,
                this.config.radius,
                this.body.position.z
            );
            this.groundNormal = new CANNON.Vec3(0, 1, 0);
            
            // Keep wheel on ground surface
            if (this.body.position.y < this.config.radius) {
                this.body.position.y = this.config.radius;
            }
        } else {
            this.isGrounded = false;
            this.groundContactPoint = null;
            this.groundNormal = null;
        }
    }
    
    /**
     * Calculate and apply tire physics forces (simplified)
     */
    updateTirePhysics(deltaTime) {
        if (!this.isGrounded) {
            this.lateralForce.set(0, 0, 0);
            this.longitudinalForce.set(0, 0, 0);
            return;
        }
        
        // Simplified physics - just apply drive force directly
        const wheelDirection = this.getWheelDirection();
        
        // Reset forces
        this.lateralForce.set(0, 0, 0);
        this.longitudinalForce.set(0, 0, 0);
        
        // Apply drive force in wheel direction
        if (this.driveForce !== 0) {
            this.longitudinalForce = wheelDirection.scale(this.driveForce);
        }
        
        // Simple brake force
        if (this.brakeForce > 0) {
            const velocity = this.body.velocity;
            if (velocity.length() > 0.1) {
                const brakeDirection = velocity.clone().normalize().scale(-1);
                this.longitudinalForce.vadd(brakeDirection.scale(this.brakeForce), this.longitudinalForce);
            }
        }
    }
    
    /**
     * Calculate normal force (weight on this wheel)
     */
    calculateNormalForce() {
        // Simplified: use wheel mass + portion of vehicle weight
        const baseForce = this.config.mass * 9.82; // Wheel weight
        const vehicleForce = 2500; // Portion of vehicle weight (simplified)
        
        return baseForce + vehicleForce;
    }
    
    /**
     * Update wheel rotation based on movement (simplified)
     */
    updateWheelRotation(deltaTime) {
        if (this.isGrounded) {
            // Simple wheel rotation based on velocity
            const speed = this.body.velocity.length();
            this.spinVelocity = speed / this.config.radius;
        }
    }
    
    /**
     * Apply all calculated forces to the wheel
     */
    applyForces() {
        if (!this.isGrounded) return;
        
        // Apply tire forces at contact point
        const totalForce = new CANNON.Vec3();
        totalForce.vadd(this.lateralForce, totalForce);
        totalForce.vadd(this.longitudinalForce, totalForce);
        
        this.body.applyForce(totalForce, this.groundContactPoint);
        
        // Debug forces being applied
        if (this.driveForce > 0) {
            console.log(`[WHEEL_DEBUG] Drive:${this.driveForce.toFixed(0)}N, Total:${totalForce.length().toFixed(0)}N, Grounded:${this.isGrounded}, Position:${this.body.position.y.toFixed(2)}`);
        }
    }
    
    /**
     * Get wheel's forward direction
     */
    getWheelDirection() {
        const direction = new CANNON.Vec3(0, 0, -1); // Forward in local coordinates
        this.body.quaternion.vmult(direction, direction);
        return direction;
    }
    
    /**
     * Get wheel's right direction
     */
    getWheelRight() {
        const right = new CANNON.Vec3(1, 0, 0); // Right in local coordinates
        this.body.quaternion.vmult(right, right);
        return right;
    }
    
    /**
     * Apply steering angle to this wheel
     */
    setSteering(angle) {
        if (this.config.isSteered) {
            this.steerAngle = angle;
            
            // Apply steering rotation around Y axis
            const steerQuat = new CANNON.Quaternion();
            steerQuat.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle);
            
            // Combine with base wheel orientation
            const baseQuat = new CANNON.Quaternion();
            baseQuat.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
            
            this.body.quaternion = baseQuat.mult(steerQuat);
        }
    }
    
    /**
     * Apply drive force to this wheel
     */
    setDriveForce(force) {
        if (this.config.isDriven) {
            this.driveForce = force;
        }
    }
    
    /**
     * Apply brake force to this wheel
     */
    setBrakeForce(force) {
        this.brakeForce = force;
    }
    
    /**
     * Create visual representation
     */
    createVisualMesh(scene) {
        const wheelGeo = new THREE.CylinderGeometry(this.config.radius, this.config.radius, this.config.width, 16);
        const wheelMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8
        });
        
        this.visualMesh = new THREE.Mesh(wheelGeo, wheelMat);
        this.visualMesh.rotation.z = Math.PI / 2;
        this.visualMesh.castShadow = true;
        
        // Add rim
        const rimGeo = new THREE.CylinderGeometry(this.config.radius * 0.7, this.config.radius * 0.7, this.config.width * 1.1, 8);
        const rimMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.8,
            roughness: 0.2
        });
        const rimMesh = new THREE.Mesh(rimGeo, rimMat);
        rimMesh.rotation.z = Math.PI / 2;
        this.visualMesh.add(rimMesh);
        
        scene.add(this.visualMesh);
        this.updateVisualMesh();
    }
    
    /**
     * Update visual mesh to match physics
     */
    updateVisualMesh() {
        if (!this.visualMesh) return;
        
        this.visualMesh.position.copy(this.body.position);
        this.visualMesh.quaternion.copy(this.body.quaternion);
        
        // Rotate wheel based on spin velocity
        this.visualMesh.rotateZ(this.spinVelocity * 0.016); // Approximate frame time
    }
    
    /**
     * Get current wheel data for debugging
     */
    getWheelData() {
        return {
            position: this.body.position,
            velocity: this.body.velocity,
            isGrounded: this.isGrounded,
            slipAngle: this.slipAngle * 180 / Math.PI,
            slipRatio: this.slipRatio,
            spinVelocity: this.spinVelocity,
            lateralForce: this.lateralForce.length(),
            longitudinalForce: this.longitudinalForce.length()
        };
    }
    
    /**
     * Dispose of wheel resources
     */
    dispose(scene = null) {
        this.world.remove(this.body);
        
        if (this.visualMesh && scene) {
            scene.remove(this.visualMesh);
        }
    }
}