/**
 * VehicleNode - Individual physics point in BeamNG-style vehicle structure
 * Each node has mass, position, and can have forces applied to it
 */
export class VehicleNode {
    constructor(world, position, mass = 10, nodeId = null) {
        this.world = world;
        this.nodeId = nodeId;
        this.initialPosition = position.clone();
        
        // Create physics body for this node
        const shape = new CANNON.Sphere(0.05); // Small sphere for visualization
        this.body = new CANNON.Body({
            mass: mass,
            shape: shape,
            position: position.clone(),
            material: new CANNON.Material({
                friction: 0.3,
                restitution: 0.1
            })
        });
        
        // Node properties
        this.mass = mass;
        this.isFixed = false; // Can be fixed for certain structural nodes
        this.isGroundContact = false; // Special nodes that can touch ground
        
        // Damage system
        this.maxStress = 1000; // Maximum stress this node can handle
        this.currentStress = 0;
        this.isDamaged = false;
        
        // Connected beams (for stress calculation)
        this.connectedBeams = [];
        
        // Add to physics world
        this.world.add(this.body);
        
        // Visual representation (optional - for debugging)
        this.visualMesh = null;
    }
    
    /**
     * Apply force to this node
     */
    applyForce(force, relativePoint = null) {
        if (!this.isFixed) {
            if (relativePoint) {
                this.body.applyForce(force, relativePoint);
            } else {
                this.body.applyForce(force, this.body.position);
            }
        }
    }
    
    /**
     * Apply impulse to this node
     */
    applyImpulse(impulse, relativePoint = null) {
        if (!this.isFixed) {
            if (relativePoint) {
                this.body.applyImpulse(impulse, relativePoint);
            } else {
                this.body.applyImpulse(impulse, this.body.position);
            }
        }
    }
    
    /**
     * Register a beam connected to this node
     */
    addConnectedBeam(beam) {
        this.connectedBeams.push(beam);
    }
    
    /**
     * Calculate stress on this node from all connected beams
     */
    updateStress() {
        this.currentStress = 0;
        
        this.connectedBeams.forEach(beam => {
            this.currentStress += beam.getCurrentStress();
        });
        
        // Check for damage
        if (this.currentStress > this.maxStress && !this.isDamaged) {
            this.takeDamage();
        }
    }
    
    /**
     * Apply damage to this node
     */
    takeDamage() {
        this.isDamaged = true;
        this.maxStress *= 0.5; // Reduce strength after damage
        
        // Damage connected beams
        this.connectedBeams.forEach(beam => {
            beam.takeDamage(0.3); // 30% damage to connected beams
        });
        
        console.log(`[NODE_DAMAGE] Node ${this.nodeId} damaged! Stress: ${this.currentStress.toFixed(0)}`);
    }
    
    /**
     * Fix this node in place (for chassis mounting points)
     */
    setFixed(fixed) {
        this.isFixed = fixed;
        if (fixed) {
            this.body.type = CANNON.Body.KINEMATIC;
            this.body.velocity.set(0, 0, 0);
            this.body.angularVelocity.set(0, 0, 0);
        } else {
            this.body.type = CANNON.Body.DYNAMIC;
        }
    }
    
    /**
     * Get current position
     */
    getPosition() {
        return this.body.position;
    }
    
    /**
     * Get current velocity
     */
    getVelocity() {
        return this.body.velocity;
    }
    
    /**
     * Set position (for initialization)
     */
    setPosition(position) {
        this.body.position.copy(position);
    }
    
    /**
     * Create visual representation for debugging
     */
    createVisualMesh(scene, color = 0xff0000) {
        const geometry = new THREE.SphereGeometry(0.05, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: color });
        this.visualMesh = new THREE.Mesh(geometry, material);
        
        scene.add(this.visualMesh);
        this.updateVisualPosition();
    }
    
    /**
     * Update visual position to match physics
     */
    updateVisualPosition() {
        if (this.visualMesh) {
            this.visualMesh.position.copy(this.body.position);
        }
    }
    
    /**
     * Clean up resources
     */
    dispose(scene = null) {
        // Remove from physics world
        this.world.remove(this.body);
        
        // Remove visual mesh
        if (this.visualMesh && scene) {
            scene.remove(this.visualMesh);
        }
        
        // Clear references
        this.connectedBeams = [];
    }
}