// Physics System - Additional physics utilities and track physics
class PhysicsManager {
    constructor(world) {
        this.world = world;
        this.materials = {};
        this.contactMaterials = {};
        this.bodies = [];
        
        this.setupMaterials();
    }
    
    setupMaterials() {
        // Define different material types
        this.materials.ground = new CANNON.Material({ friction: 0.8, restitution: 0.1 });
        this.materials.track = new CANNON.Material({ friction: 1.2, restitution: 0.1 });
        this.materials.barrier = new CANNON.Material({ friction: 0.3, restitution: 0.8 });
        this.materials.wheel = new CANNON.Material({ friction: 1.5, restitution: 0.1 });
        this.materials.body = new CANNON.Material({ friction: 0.1, restitution: 0.3 });
        
        // Create contact materials (interaction between different material types)
        this.contactMaterials.wheelTrack = new CANNON.ContactMaterial(
            this.materials.wheel,
            this.materials.track,
            { friction: 1.8, restitution: 0.1 }
        );
        
        this.contactMaterials.wheelGround = new CANNON.ContactMaterial(
            this.materials.wheel,
            this.materials.ground,
            { friction: 1.2, restitution: 0.2 }
        );
        
        this.contactMaterials.bodyBarrier = new CANNON.ContactMaterial(
            this.materials.body,
            this.materials.barrier,
            { friction: 0.1, restitution: 0.9 }
        );
        
        // Add contact materials to world
        Object.values(this.contactMaterials).forEach(material => {
            this.world.addContactMaterial(material);
        });
    }
    
    createBarrier(position, size, rotation = { x: 0, y: 0, z: 0 }) {
        const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
        const body = new CANNON.Body({ mass: 0 });
        body.addShape(shape);
        body.position.set(position.x, position.y, position.z);
        body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotation.y);
        body.material = this.materials.barrier;
        
        this.world.add(body);
        this.bodies.push(body);
        
        return body;
    }
    
    createTrackSurface(vertices, indices) {
        // Create a simple box for track surface instead of trimesh
        const shape = new CANNON.Box(new CANNON.Vec3(50, 0.1, 50));
        const body = new CANNON.Body({ mass: 0 });
        body.addShape(shape);
        body.material = this.materials.track;
        
        this.world.add(body);
        this.bodies.push(body);
        
        return body;
    }
    
    createRamp(position, size, angle) {
        const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
        const body = new CANNON.Body({ mass: 0 });
        body.addShape(shape);
        body.position.set(position.x, position.y, position.z);
        body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), angle);
        body.material = this.materials.track;
        
        this.world.add(body);
        this.bodies.push(body);
        
        return body;
    }
    
    createCheckpoint(position, size) {
        // Checkpoints are invisible trigger zones
        const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
        const body = new CANNON.Body({ 
            mass: 0,
            isTrigger: true
        });
        body.addShape(shape);
        body.position.set(position.x, position.y, position.z);
        body.material = new CANNON.Material({ friction: 0, restitution: 0 });
        
        // Don't add to world collision detection, we'll handle manually
        body.isCheckpoint = true;
        this.bodies.push(body);
        
        return body;
    }
    
    addParticleEffect(position, velocity, count = 10) {
        // Create particle system for effects like dust, sparks, etc.
        const particles = [];
        
        for (let i = 0; i < count; i++) {
            const particleShape = new CANNON.Sphere(0.05);
            const particle = new CANNON.Body({ mass: 0.1 });
            particle.addShape(particleShape);
            
            // Random position around effect point
            particle.position.set(
                position.x + (Math.random() - 0.5) * 2,
                position.y + Math.random() * 2,
                position.z + (Math.random() - 0.5) * 2
            );
            
            // Random velocity
            particle.velocity.set(
                velocity.x + (Math.random() - 0.5) * 10,
                velocity.y + Math.random() * 10,
                velocity.z + (Math.random() - 0.5) * 10
            );
            
            particle.material = new CANNON.Material({ friction: 0.1, restitution: 0.3 });
            particle.linearDamping = 0.9;
            
            this.world.add(particle);
            particles.push(particle);
            
            // Remove particle after 2 seconds
            setTimeout(() => {
                this.world.remove(particle);
            }, 2000);
        }
        
        return particles;
    }
    
    detectCollision(body1, body2) {
        // Simplified collision detection between two bodies
        const distance = body1.position.distanceTo(body2.position);
        const minDistance = 2; // Adjust based on object sizes
        
        return distance < minDistance;
    }
    
    applyExplosionForce(center, radius, force) {
        // Apply explosion force to all bodies within radius
        this.bodies.forEach(body => {
            if (body.mass === 0) return; // Skip static bodies
            
            const distance = body.position.distanceTo(center);
            if (distance < radius) {
                const direction = new CANNON.Vec3();
                direction.copy(body.position).vsub(center);
                direction.normalize();
                
                const strength = force * (1 - distance / radius);
                direction.scale(strength);
                
                body.velocity.vadd(direction, body.velocity);
            }
        });
    }
    
    createSpring(bodyA, bodyB, restLength, stiffness, damping) {
        // Create a spring constraint between two bodies
        const spring = new CANNON.Spring(bodyA, bodyB, {
            restLength: restLength,
            stiffness: stiffness,
            damping: damping
        });
        
        return spring;
    }
    
    raycast(from, to, options = {}) {
        // Perform a raycast and return hit information
        const raycastResult = new CANNON.RaycastResult();
        const hasHit = this.world.raycastClosest(from, to, options, raycastResult);
        
        return {
            hasHit: hasHit,
            hitPoint: raycastResult.hitPointWorld,
            hitNormal: raycastResult.hitNormalWorld,
            distance: raycastResult.distance,
            body: raycastResult.body
        };
    }
    
    getGroundHeight(x, z) {
        // Get ground height at a specific x,z coordinate
        const from = new CANNON.Vec3(x, 100, z);
        const to = new CANNON.Vec3(x, -100, z);
        
        const result = this.raycast(from, to);
        return result.hasHit ? result.hitPoint.y : 0;
    }
    
    cleanup() {
        // Remove all created bodies from the world
        this.bodies.forEach(body => {
            this.world.remove(body);
        });
        this.bodies = [];
    }
}

// Utility functions for physics calculations
class PhysicsUtils {
    static calculateFriction(velocity, frictionCoefficient) {
        const friction = velocity.clone();
        friction.scale(-frictionCoefficient);
        return friction;
    }
    
    static calculateAirResistance(velocity, dragCoefficient, area = 1) {
        const speed = velocity.length();
        const resistance = velocity.clone();
        resistance.normalize();
        resistance.scale(-dragCoefficient * area * speed * speed);
        return resistance;
    }
    
    static calculateDownforce(velocity, downforceCoefficient) {
        const speed = velocity.length();
        return downforceCoefficient * speed * speed;
    }
    
    static smoothDamp(current, target, velocity, smoothTime, deltaTime) {
        // Smooth damping function for gradual value changes
        const omega = 2 / smoothTime;
        const x = omega * deltaTime;
        const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
        
        const change = current - target;
        const originalTo = target;
        const maxChange = Infinity;
        
        const clampedChange = Math.max(-maxChange, Math.min(change, maxChange));
        target = current - clampedChange;
        
        const temp = (velocity + omega * clampedChange) * deltaTime;
        velocity = (velocity - omega * temp) * exp;
        let output = target + (clampedChange + temp) * exp;
        
        if (originalTo - current > 0 === output > originalTo) {
            output = originalTo;
            velocity = (output - originalTo) / deltaTime;
        }
        
        return { value: output, velocity: velocity };
    }
    
    static interpolateVector3(a, b, t) {
        return new CANNON.Vec3(
            a.x + (b.x - a.x) * t,
            a.y + (b.y - a.y) * t,
            a.z + (b.z - a.z) * t
        );
    }
    
    static vectorToEuler(vector) {
        // Convert a direction vector to Euler angles
        const pitch = Math.atan2(-vector.y, Math.sqrt(vector.x * vector.x + vector.z * vector.z));
        const yaw = Math.atan2(vector.x, vector.z);
        return { pitch: pitch, yaw: yaw, roll: 0 };
    }
    
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    static lerp(a, b, t) {
        return a + (b - a) * t;
    }
}

// Performance monitor for physics debugging
class PhysicsDebugger {
    constructor(world) {
        this.world = world;
        this.debugRenderer = null;
        this.enabled = false;
    }
    
    enable(scene) {
        if (this.enabled) return;
        
        this.enabled = true;
        this.debugRenderer = new THREE.Group();
        scene.add(this.debugRenderer);
    }
    
    disable() {
        if (!this.enabled) return;
        
        this.enabled = false;
        if (this.debugRenderer && this.debugRenderer.parent) {
            this.debugRenderer.parent.remove(this.debugRenderer);
        }
    }
    
    update() {
        if (!this.enabled || !this.debugRenderer) return;
        
        // Clear existing debug geometry
        while (this.debugRenderer.children.length > 0) {
            this.debugRenderer.remove(this.debugRenderer.children[0]);
        }
        
        // Render physics bodies as wireframes
        this.world.bodies.forEach(body => {
            body.shapes.forEach((shape, i) => {
                let geometry;
                
                if (shape instanceof CANNON.Sphere) {
                    geometry = new THREE.SphereGeometry(shape.radius, 8, 6);
                } else if (shape instanceof CANNON.Box) {
                    geometry = new THREE.BoxGeometry(
                        shape.halfExtents.x * 2,
                        shape.halfExtents.y * 2,
                        shape.halfExtents.z * 2
                    );
                } else if (shape instanceof CANNON.Plane) {
                    geometry = new THREE.PlaneGeometry(100, 100);
                }
                
                if (geometry) {
                    const material = new THREE.MeshBasicMaterial({
                        color: body.mass === 0 ? 0xff0000 : 0x00ff00,
                        wireframe: true,
                        transparent: true,
                        opacity: 0.3
                    });
                    
                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.position.copy(body.position);
                    mesh.quaternion.copy(body.quaternion);
                    
                    this.debugRenderer.add(mesh);
                }
            });
        });
    }
}