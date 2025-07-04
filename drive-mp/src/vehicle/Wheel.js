import * as THREE from 'three';

export class Wheel {
    constructor(scene, radius, width, isFront = false) {
        this.scene = scene;
        this.radius = radius;
        this.width = width;
        this.isFront = isFront;
        
        this.mesh = null;
        this.rimMesh = null;
        this.tireMesh = null;
        
        // Wheel properties
        this.rotation = 0;
        this.steerAngle = 0;
        this.slipRatio = 0;
        this.temperature = 20; // Celsius
        
        // Visual effects
        this.smokeParticles = [];
        this.skidMarks = [];
    }

    init() {
        this.createWheelMesh();
    }

    createWheelMesh() {
        // Create wheel group
        const wheelGroup = new THREE.Group();
        
        // Create tire
        const tireGeometry = new THREE.TorusGeometry(this.radius, this.width/2, 16, 32);
        const tireMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.9,
            metalness: 0.1
        });
        this.tireMesh = new THREE.Mesh(tireGeometry, tireMaterial);
        this.tireMesh.rotation.z = Math.PI / 2; // Rotate 90 degrees around Z-axis
        this.tireMesh.rotation.y = Math.PI / 2; // Rotate 90 degrees around Y-axis
        this.tireMesh.castShadow = true;
        this.tireMesh.receiveShadow = true;
        wheelGroup.add(this.tireMesh);
        
        // Create rim
        const rimGeometry = new THREE.CylinderGeometry(
            this.radius * 0.7,
            this.radius * 0.7,
            this.width * 0.8,
            16
        );
        const rimMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.8,
            roughness: 0.2
        });
        this.rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
        this.rimMesh.rotation.z = Math.PI / 2; // Same as tire: rotate around Z-axis
        this.rimMesh.rotation.y = Math.PI / 2; // Same as tire: rotate around Y-axis
        this.rimMesh.castShadow = true;
        wheelGroup.add(this.rimMesh);
        
        // Add spoke details
        this.createSpokes(wheelGroup);
        
        // Add brake disc
        this.createBrakeDisc(wheelGroup);
        
        // Add tire tread pattern
        this.createTreadPattern();
        
        this.mesh = wheelGroup;
        this.scene.add(this.mesh);
    }

    createSpokes(wheelGroup) {
        const spokeCount = 6;
        const spokeGeometry = new THREE.BoxGeometry(
            this.radius * 0.1,
            this.radius * 0.6,
            this.width * 0.1
        );
        const spokeMaterial = new THREE.MeshStandardMaterial({
            color: 0x999999,
            metalness: 0.8,
            roughness: 0.3
        });
        
        for (let i = 0; i < spokeCount; i++) {
            const spoke = new THREE.Mesh(spokeGeometry, spokeMaterial);
            spoke.position.set(0, 0, 0);
            spoke.rotation.z = Math.PI / 2; // Same as tire: rotate around Z-axis
            spoke.rotation.y = Math.PI / 2; // Same as tire: rotate around Y-axis
            spoke.rotation.x = (i / spokeCount) * Math.PI * 2; // Distribute around X-axis (was Z)
            spoke.castShadow = true;
            wheelGroup.add(spoke);
        }
    }

    createBrakeDisc(wheelGroup) {
        const discGeometry = new THREE.CylinderGeometry(
            this.radius * 0.8,
            this.radius * 0.8,
            this.width * 0.1,
            32
        );
        const discMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.9,
            roughness: 0.1
        });
        const disc = new THREE.Mesh(discGeometry, discMaterial);
        disc.rotation.z = Math.PI / 2; // Same as tire: rotate around Z-axis
        disc.rotation.y = Math.PI / 2; // Same as tire: rotate around Y-axis
        disc.position.z = this.width * 0.3; // Position along Z-axis
        disc.castShadow = true;
        wheelGroup.add(disc);
        
        // Brake caliper
        const caliperGeometry = new THREE.BoxGeometry(
            this.radius * 0.3,
            this.radius * 0.2,
            this.width * 0.4
        );
        const caliperMaterial = new THREE.MeshStandardMaterial({
            color: 0xff4444,
            metalness: 0.6,
            roughness: 0.4
        });
        const caliper = new THREE.Mesh(caliperGeometry, caliperMaterial);
        caliper.position.set(0, -this.radius * 0.3, this.width * 0.2); // Adjust position back to Z-axis
        caliper.castShadow = true;
        wheelGroup.add(caliper);
    }

    createTreadPattern() {
        // Add tread grooves to tire
        const treadGeometry = new THREE.RingGeometry(
            this.radius * 0.95,
            this.radius * 1.05,
            32
        );
        const treadMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            roughness: 1.0,
            metalness: 0
        });
        
        for (let i = 0; i < 8; i++) {
            const tread = new THREE.Mesh(treadGeometry, treadMaterial);
            tread.position.z = (i - 4) * (this.width / 8);
            tread.rotation.z = Math.PI / 16;
            this.tireMesh.add(tread);
        }
    }

    update(deltaTime, wheelInfo) {
        if (!this.mesh || !wheelInfo) return;
        
        // Update wheel rotation
        this.rotation += wheelInfo.deltaRotation || 0;
        
        // Update steering angle for front wheels
        if (this.isFront) {
            this.steerAngle = wheelInfo.steering || 0;
        }
        
        // Update visual rotation
        this.mesh.rotation.y = this.steerAngle;
        this.rimMesh.rotation.x += this.rotation * deltaTime; // Rotate around X-axis for wheel spin
        this.tireMesh.rotation.x += this.rotation * deltaTime; // Rotate around X-axis for tire spin
        
        // Update slip ratio
        this.slipRatio = Math.abs(wheelInfo.slipInfo || 0);
        
        // Update temperature based on slip
        this.temperature += this.slipRatio * 50 * deltaTime;
        this.temperature = Math.max(20, this.temperature - 10 * deltaTime); // Cool down
        
        // Create smoke if slipping
        if (this.slipRatio > 0.3) {
            this.createSmoke();
        }
        
        // Update tire deformation based on load
        this.updateTireDeformation(wheelInfo);
    }

    createSmoke() {
        // Simple smoke effect (in a real implementation, you'd use a particle system)
        if (Math.random() < 0.3) {
            const smokeGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const smokeMaterial = new THREE.MeshBasicMaterial({
                color: 0x666666,
                transparent: true,
                opacity: 0.5
            });
            const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
            smoke.position.copy(this.mesh.position);
            smoke.position.y -= this.radius * 0.8;
            this.scene.add(smoke);
            
            // Animate smoke
            const startTime = Date.now();
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / 2000; // 2 second duration
                
                if (progress >= 1) {
                    this.scene.remove(smoke);
                    smoke.geometry.dispose();
                    smoke.material.dispose();
                    return;
                }
                
                smoke.position.y += 0.02;
                smoke.position.x += (Math.random() - 0.5) * 0.01;
                smoke.position.z += (Math.random() - 0.5) * 0.01;
                smoke.scale.multiplyScalar(1.02);
                smoke.material.opacity = 0.5 * (1 - progress);
                
                requestAnimationFrame(animate);
            };
            animate();
        }
    }

    updateTireDeformation(wheelInfo) {
        // Simulate tire deformation under load
        const suspensionLength = wheelInfo.suspensionLength || 0.5;
        const compression = Math.max(0, 1 - suspensionLength / 0.5);
        
        // Slightly flatten the tire based on compression
        const deformation = 1 - compression * 0.1;
        this.tireMesh.scale.y = deformation;
        
        // Change tire color based on temperature
        if (this.temperature > 80) {
            this.tireMesh.material.color.setHex(0x2a1a1a); // Darker when hot
        } else {
            this.tireMesh.material.color.setHex(0x1a1a1a); // Normal color
        }
    }

    getSlipRatio() {
        return this.slipRatio;
    }

    getTemperature() {
        return this.temperature;
    }

    getGrip() {
        // Calculate grip based on temperature and wear
        const tempFactor = Math.max(0.6, 1 - Math.abs(this.temperature - 60) / 100);
        const slipFactor = Math.max(0.3, 1 - this.slipRatio);
        return tempFactor * slipFactor;
    }

    addSkidMark(position) {
        // Add skid mark to the ground
        const markGeometry = new THREE.PlaneGeometry(0.2, 0.5);
        const markMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.6
        });
        const mark = new THREE.Mesh(markGeometry, markMaterial);
        mark.position.copy(position);
        mark.position.y = 0.01; // Slightly above ground
        mark.rotation.x = -Math.PI / 2;
        this.scene.add(mark);
        
        // Store for cleanup
        this.skidMarks.push(mark);
        
        // Remove old marks
        if (this.skidMarks.length > 100) {
            const oldMark = this.skidMarks.shift();
            this.scene.remove(oldMark);
            oldMark.geometry.dispose();
            oldMark.material.dispose();
        }
    }

    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            
            // Dispose of geometries and materials
            this.mesh.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        
        // Clean up skid marks
        this.skidMarks.forEach(mark => {
            this.scene.remove(mark);
            mark.geometry.dispose();
            mark.material.dispose();
        });
        
        this.skidMarks = [];
    }
}