import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

export class ParticleEffectsManager {
    constructor(scene, physicsWorld) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        
        // Particle systems
        this.smokeSystems = [];
        this.sparkSystems = [];
        this.dirtSystems = [];
        this.waterSystems = [];
        this.debrisSystems = [];
        
        // Reusable geometries and materials
        this.particleGeometry = new THREE.BufferGeometry();
        this.materials = {};
        
        // Performance settings
        this.maxParticles = 2000;
        this.particlePool = [];
        
        this.init();
    }

    init() {
        this.createMaterials();
        this.setupParticlePool();
    }

    createMaterials() {
        // Smoke material
        this.materials.smoke = new THREE.PointsMaterial({
            color: 0x444444,
            size: 0.5,
            transparent: true,
            opacity: 0.6,
            alphaTest: 0.1,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        // Spark material
        this.materials.spark = new THREE.PointsMaterial({
            color: 0xffaa22,
            size: 0.1,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        
        // Dirt/dust material
        this.materials.dirt = new THREE.PointsMaterial({
            color: 0x8b4513,
            size: 0.2,
            transparent: true,
            opacity: 0.7,
            alphaTest: 0.1
        });
        
        // Water spray material
        this.materials.water = new THREE.PointsMaterial({
            color: 0x87ceeb,
            size: 0.15,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        // Metal debris material
        this.materials.debris = new THREE.PointsMaterial({
            color: 0x888888,
            size: 0.08,
            transparent: true,
            opacity: 1.0
        });
    }

    setupParticlePool() {
        // Pre-allocate particles for performance
        for (let i = 0; i < this.maxParticles; i++) {
            this.particlePool.push(this.createParticle());
        }
    }

    createParticle() {
        return {
            position: new THREE.Vector3(),
            velocity: new THREE.Vector3(),
            acceleration: new THREE.Vector3(),
            life: 0,
            maxLife: 1,
            size: 1,
            color: new THREE.Color(),
            active: false,
            type: 'smoke'
        };
    }

    getParticle() {
        const particle = this.particlePool.find(p => !p.active);
        if (particle) {
            particle.active = true;
            return particle;
        }
        return null; // Pool exhausted
    }

    releaseParticle(particle) {
        particle.active = false;
        particle.life = 0;
    }

    // Tire smoke effect
    createTireSmoke(position, velocity, intensity = 1.0) {
        const particleCount = Math.floor(intensity * 20);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.getParticle();
            if (!particle) break;
            
            particle.type = 'smoke';
            particle.position.copy(position);
            particle.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                Math.random() * 0.2,
                (Math.random() - 0.5) * 0.5
            ));
            
            particle.velocity.copy(velocity);
            particle.velocity.multiplyScalar(0.3);
            particle.velocity.add(new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 3 + 1,
                (Math.random() - 0.5) * 2
            ));
            
            particle.acceleration.set(0, -0.5, 0); // Light gravity
            particle.life = 0;
            particle.maxLife = 2 + Math.random() * 2;
            particle.size = 0.2 + Math.random() * 0.4;
            particle.color.setHex(0x333333 + Math.floor(Math.random() * 0x222222));
        }
    }

    // Impact sparks
    createImpactSparks(position, normal, intensity = 1.0) {
        const particleCount = Math.floor(intensity * 15);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.getParticle();
            if (!particle) break;
            
            particle.type = 'spark';
            particle.position.copy(position);
            
            // Sparks fly away from impact normal
            const direction = normal.clone();
            direction.add(new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random(),
                (Math.random() - 0.5) * 2
            ));
            direction.normalize();
            
            particle.velocity.copy(direction);
            particle.velocity.multiplyScalar(5 + Math.random() * 10);
            
            particle.acceleration.set(0, -9.81, 0); // Gravity
            particle.life = 0;
            particle.maxLife = 0.3 + Math.random() * 0.4;
            particle.size = 0.05 + Math.random() * 0.1;
            particle.color.setHex(0xff6600 + Math.floor(Math.random() * 0x004400));
        }
    }

    // Dirt/dust kicked up by tires
    createDirtSpray(position, velocity, surface = 'dirt') {
        const particleCount = 25;
        const colorMap = {
            dirt: 0x8b4513,
            sand: 0xfad5a5,
            gravel: 0x808080,
            grass: 0x228b22
        };
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.getParticle();
            if (!particle) break;
            
            particle.type = 'dirt';
            particle.position.copy(position);
            particle.position.y += Math.random() * 0.1;
            
            // Spray pattern behind tire
            const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 0.5;
            const speed = 2 + Math.random() * 4;
            
            particle.velocity.set(
                Math.cos(angle) * speed,
                Math.random() * 3 + 1,
                Math.sin(angle) * speed
            );
            
            particle.acceleration.set(0, -9.81, 0);
            particle.life = 0;
            particle.maxLife = 1 + Math.random() * 2;
            particle.size = 0.1 + Math.random() * 0.3;
            particle.color.setHex(colorMap[surface] || colorMap.dirt);
        }
    }

    // Water spray effect
    createWaterSplash(position, velocity, intensity = 1.0) {
        const particleCount = Math.floor(intensity * 30);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.getParticle();
            if (!particle) break;
            
            particle.type = 'water';
            particle.position.copy(position);
            
            // Radial spray pattern
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 5;
            
            particle.velocity.set(
                Math.cos(angle) * speed,
                Math.random() * 4 + 2,
                Math.sin(angle) * speed
            );
            
            particle.acceleration.set(0, -12, 0); // Stronger gravity for water
            particle.life = 0;
            particle.maxLife = 0.8 + Math.random() * 1.2;
            particle.size = 0.08 + Math.random() * 0.2;
            particle.color.setHex(0x87ceeb);
        }
    }

    // Metal debris from collisions
    createMetalDebris(position, normal, intensity = 1.0) {
        const particleCount = Math.floor(intensity * 12);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.getParticle();
            if (!particle) break;
            
            particle.type = 'debris';
            particle.position.copy(position);
            
            // Debris bounces off surface
            const direction = normal.clone();
            direction.add(new THREE.Vector3(
                (Math.random() - 0.5) * 1.5,
                Math.random() * 0.5,
                (Math.random() - 0.5) * 1.5
            ));
            direction.normalize();
            
            particle.velocity.copy(direction);
            particle.velocity.multiplyScalar(3 + Math.random() * 7);
            
            particle.acceleration.set(0, -9.81, 0);
            particle.life = 0;
            particle.maxLife = 2 + Math.random() * 3;
            particle.size = 0.05 + Math.random() * 0.15;
            particle.color.setHex(0x666666 + Math.floor(Math.random() * 0x333333));
        }
    }

    // Engine backfire effect
    createBackfire(position, direction) {
        const particleCount = 8;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = this.getParticle();
            if (!particle) break;
            
            particle.type = 'spark';
            particle.position.copy(position);
            
            particle.velocity.copy(direction);
            particle.velocity.multiplyScalar(8 + Math.random() * 5);
            particle.velocity.add(new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3
            ));
            
            particle.acceleration.set(0, -2, 0);
            particle.life = 0;
            particle.maxLife = 0.2 + Math.random() * 0.3;
            particle.size = 0.1 + Math.random() * 0.2;
            particle.color.setHex(0xff4400);
        }
    }

    update(deltaTime) {
        const activeParticles = this.particlePool.filter(p => p.active);
        
        // Update particle physics
        activeParticles.forEach(particle => {
            particle.life += deltaTime;
            
            if (particle.life >= particle.maxLife) {
                this.releaseParticle(particle);
                return;
            }
            
            // Update physics
            particle.velocity.add(particle.acceleration.clone().multiplyScalar(deltaTime));
            particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
            
            // Apply drag
            const drag = particle.type === 'water' ? 0.98 : 0.995;
            particle.velocity.multiplyScalar(Math.pow(drag, deltaTime * 60));
            
            // Fade out over time
            const lifeRatio = particle.life / particle.maxLife;
            particle.color.lerp(new THREE.Color(0x000000), lifeRatio * 0.5);
        });
        
        // Update visual systems
        this.updateVisualSystems(activeParticles);
    }

    updateVisualSystems(activeParticles) {
        // Group particles by type
        const particlesByType = {
            smoke: [],
            spark: [],
            dirt: [],
            water: [],
            debris: []
        };
        
        activeParticles.forEach(particle => {
            if (particlesByType[particle.type]) {
                particlesByType[particle.type].push(particle);
            }
        });
        
        // Update each particle system
        Object.keys(particlesByType).forEach(type => {
            this.updateParticleSystem(type, particlesByType[type]);
        });
    }

    updateParticleSystem(type, particles) {
        if (particles.length === 0) return;
        
        // Remove old system
        const oldSystem = this[`${type}System`];
        if (oldSystem) {
            this.scene.remove(oldSystem);
        }
        
        // Create new geometry
        const positions = new Float32Array(particles.length * 3);
        const colors = new Float32Array(particles.length * 3);
        const sizes = new Float32Array(particles.length);
        
        particles.forEach((particle, i) => {
            positions[i * 3] = particle.position.x;
            positions[i * 3 + 1] = particle.position.y;
            positions[i * 3 + 2] = particle.position.z;
            
            colors[i * 3] = particle.color.r;
            colors[i * 3 + 1] = particle.color.g;
            colors[i * 3 + 2] = particle.color.b;
            
            sizes[i] = particle.size;
        });
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create material with vertex colors
        const material = this.materials[type].clone();
        material.vertexColors = true;
        
        // Create and add new system
        const system = new THREE.Points(geometry, material);
        this.scene.add(system);
        this[`${type}System`] = system;
    }

    // Environmental effects
    createRainDroplets(vehicle) {
        // Create rain effects when driving through water
        if (Math.random() < 0.3) {
            const position = vehicle.getPosition();
            this.createWaterSplash(
                new THREE.Vector3(position.x, position.y + 0.5, position.z),
                new THREE.Vector3(0, -5, 0),
                0.5
            );
        }
    }

    createSnowSpray(vehicle) {
        // Snow spray when driving through snow
        const velocity = vehicle.getVelocity();
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        
        if (speed > 2) {
            const position = vehicle.getPosition();
            this.createDirtSpray(
                new THREE.Vector3(position.x, position.y, position.z),
                new THREE.Vector3(velocity.x, 0, velocity.z),
                'snow'
            );
        }
    }

    // Performance monitoring
    getActiveParticleCount() {
        return this.particlePool.filter(p => p.active).length;
    }

    getPoolUtilization() {
        return this.getActiveParticleCount() / this.maxParticles;
    }

    destroy() {
        // Clean up all particle systems
        ['smoke', 'spark', 'dirt', 'water', 'debris'].forEach(type => {
            const system = this[`${type}System`];
            if (system) {
                this.scene.remove(system);
                system.geometry.dispose();
                system.material.dispose();
            }
        });
        
        this.particlePool = [];
    }
}