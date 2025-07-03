/**
 * VehicleBeam - Spring-damper connection between two VehicleNodes
 * Implements BeamNG-style beam physics with stress simulation and breaking
 */
export class VehicleBeam {
    constructor(nodeA, nodeB, config = {}) {
        this.nodeA = nodeA;
        this.nodeB = nodeB;
        
        // Beam properties
        this.restLength = config.restLength || nodeA.getPosition().distanceTo(nodeB.getPosition());
        this.stiffness = config.stiffness || 10000; // Spring constant (N/m)
        this.damping = config.damping || 100; // Damping coefficient
        this.maxStress = config.maxStress || 2000; // Breaking point
        this.beamType = config.type || 'structural'; // structural, suspension, flexible
        
        // Beam state
        this.currentLength = this.restLength;
        this.currentStress = 0;
        this.isBroken = false;
        this.damageLevel = 0; // 0 = perfect, 1 = completely damaged
        
        // Performance optimization
        this.lastUpdateTime = 0;
        this.updateFrequency = 1; // Update every frame
        
        // Register beam with nodes
        this.nodeA.addConnectedBeam(this);
        this.nodeB.addConnectedBeam(this);
        
        // Visual representation for debugging
        this.visualLine = null;
        
        console.log(`[BEAM_CREATED] ${nodeA.nodeId} <-> ${nodeB.nodeId}, Length: ${this.restLength.toFixed(2)}m`);
    }
    
    /**
     * Update beam physics - apply spring-damper forces
     */
    update(deltaTime) {
        if (this.isBroken) return;
        
        // Get current positions and velocities
        const posA = this.nodeA.getPosition();
        const posB = this.nodeB.getPosition();
        const velA = this.nodeA.getVelocity();
        const velB = this.nodeB.getVelocity();
        
        // Calculate beam vector and current length
        const beamVector = new CANNON.Vec3();
        posB.vsub(posA, beamVector);
        this.currentLength = beamVector.length();
        
        if (this.currentLength < 0.001) return; // Avoid division by zero
        
        // Normalize beam vector
        const beamDirection = beamVector.clone();
        beamDirection.normalize();
        
        // Calculate spring force (Hooke's law)
        const displacement = this.currentLength - this.restLength;
        const springForce = displacement * this.stiffness * (1 - this.damageLevel);
        
        // Calculate relative velocity along beam
        const relativeVelocity = new CANNON.Vec3();
        velB.vsub(velA, relativeVelocity);
        const dampingVelocity = relativeVelocity.dot(beamDirection);
        const dampingForce = dampingVelocity * this.damping * (1 - this.damageLevel);
        
        // Total force magnitude
        const totalForce = springForce + dampingForce;
        
        // Calculate stress
        this.currentStress = Math.abs(totalForce);
        
        // Check for breaking
        if (this.currentStress > this.maxStress) {
            this.addDamage(0.1); // 10% damage per overstress frame
        }
        
        // Apply forces to nodes (Newton's 3rd law)
        const forceVector = beamDirection.scale(totalForce);
        
        // Apply force to nodeB (towards nodeA when compressed)
        this.nodeB.applyForce(forceVector.scale(-1));
        
        // Apply opposite force to nodeA
        this.nodeA.applyForce(forceVector);
        
        // Debugging info (throttled)
        if (this.currentStress > 500 && Math.random() < 0.01) {
            console.log(`[BEAM_STRESS] ${this.nodeA.nodeId}-${this.nodeB.nodeId}: ${this.currentStress.toFixed(0)}N`);
        }
    }
    
    /**
     * Add damage to this beam
     */
    addDamage(amount) {
        this.damageLevel = Math.min(1, this.damageLevel + amount);
        
        if (this.damageLevel > 0.8 && !this.isBroken) {
            this.breakBeam();
        }
    }
    
    /**
     * Break this beam completely
     */
    breakBeam() {
        this.isBroken = true;
        this.damageLevel = 1;
        
        // Reduce max stress of connected nodes
        this.nodeA.maxStress *= 0.8;
        this.nodeB.maxStress *= 0.8;
        
        console.log(`[BEAM_BROKEN] ${this.nodeA.nodeId} <-> ${this.nodeB.nodeId} BROKE! Stress: ${this.currentStress.toFixed(0)}N`);
        
        // Visual feedback
        if (this.visualLine) {
            this.visualLine.material.color.setHex(0xff0000); // Red for broken
        }
    }
    
    /**
     * Take damage from external source
     */
    takeDamage(amount) {
        this.addDamage(amount);
    }
    
    /**
     * Get current stress value
     */
    getCurrentStress() {
        return this.currentStress;
    }
    
    /**
     * Get beam health (0 = broken, 1 = perfect)
     */
    getHealth() {
        return 1 - this.damageLevel;
    }
    
    /**
     * Create visual representation for debugging
     */
    createVisualLine(scene, color = 0x00ff00) {
        const material = new THREE.LineBasicMaterial({ color: color });
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(),
            new THREE.Vector3()
        ]);
        
        this.visualLine = new THREE.Line(geometry, material);
        scene.add(this.visualLine);
        this.updateVisualLine();
    }
    
    /**
     * Update visual line position
     */
    updateVisualLine() {
        if (!this.visualLine) return;
        
        const positions = this.visualLine.geometry.attributes.position.array;
        const posA = this.nodeA.getPosition();
        const posB = this.nodeB.getPosition();
        
        positions[0] = posA.x;
        positions[1] = posA.y;
        positions[2] = posA.z;
        
        positions[3] = posB.x;
        positions[4] = posB.y;
        positions[5] = posB.z;
        
        this.visualLine.geometry.attributes.position.needsUpdate = true;
        
        // Color based on stress
        const stressRatio = this.currentStress / this.maxStress;
        if (this.isBroken) {
            this.visualLine.material.color.setHex(0xff0000); // Red
        } else if (stressRatio > 0.8) {
            this.visualLine.material.color.setHex(0xff8800); // Orange
        } else if (stressRatio > 0.5) {
            this.visualLine.material.color.setHex(0xffff00); // Yellow
        } else {
            this.visualLine.material.color.setHex(0x00ff00); // Green
        }
    }
    
    /**
     * Set beam properties for different types
     */
    setBeamType(type) {
        this.beamType = type;
        
        switch (type) {
            case 'structural':
                this.stiffness = 15000;
                this.damping = 150;
                this.maxStress = 3000;
                break;
            case 'suspension':
                this.stiffness = 8000;
                this.damping = 300;
                this.maxStress = 1500;
                break;
            case 'flexible':
                this.stiffness = 5000;
                this.damping = 100;
                this.maxStress = 1000;
                break;
            case 'reinforcement':
                this.stiffness = 20000;
                this.damping = 200;
                this.maxStress = 5000;
                break;
        }
    }
    
    /**
     * Dispose of beam resources
     */
    dispose(scene = null) {
        // Remove visual line
        if (this.visualLine && scene) {
            scene.remove(this.visualLine);
        }
        
        // Clear node references
        this.nodeA = null;
        this.nodeB = null;
    }
}