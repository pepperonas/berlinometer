import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';
import { AdvancedNodeBeamStructure } from './AdvancedNodeBeamStructure.js';
import { Wheel } from './Wheel.js';

export class Vehicle {
    constructor(physicsWorld, scene) {
        this.physicsWorld = physicsWorld;
        this.scene = scene;
        
        // Vehicle components
        this.chassis = null;
        this.chassisMesh = null;
        this.nodeBeamStructure = null;
        this.wheels = [];
        this.wheelMeshes = [];
        
        // Physics vehicle
        this.vehicle = null;
        
        // Vehicle properties
        this.mass = 1500; // kg - heavier for stability
        this.engineForce = 2000; // Increased back to 2000 for better acceleration
        this.brakeForce = 50;
        this.steeringAngle = 0.35;
        this.currentSteering = 0;
        this.currentThrottle = 0;
        this.currentBrake = 0;
        this.handbrake = false;
        
        // Engine properties
        this.rpm = 800; // idle RPM
        this.maxRPM = 7000;
        this.currentGear = 2; // Start in first gear (index 2)
        this.gearRatios = [-3.5, 0, 3.8, 2.5, 1.8, 1.3, 1.0, 0.8]; // R, N, 1-6
        this.finalDriveRatio = 3.5;
        
        // Damage
        this.damage = 0;
        this.maxDamage = 100;
    }

    async init() {
        // Create chassis
        this.createChassis();
        
        // Create node-beam structure
        this.createNodeBeamStructure();
        
        // Create wheels
        this.createWheels();
        
        // Setup vehicle
        this.setupVehicle();
    }

    createChassis() {
        // Chassis dimensions
        const chassisWidth = 1.8;
        const chassisHeight = 0.8;
        const chassisLength = 4.2;
        
        // Visual chassis (simplified car body)
        const chassisGroup = new THREE.Group();
        
        // Main body
        const bodyGeometry = new THREE.BoxGeometry(chassisWidth, chassisHeight, chassisLength);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x2196F3,
            metalness: 0.7,
            roughness: 0.3
        });
        const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        bodyMesh.position.y = 0.2;
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        chassisGroup.add(bodyMesh);
        
        // Cabin
        const cabinGeometry = new THREE.BoxGeometry(chassisWidth * 0.9, chassisHeight * 0.7, chassisLength * 0.4);
        const cabinMesh = new THREE.Mesh(cabinGeometry, bodyMaterial);
        cabinMesh.position.set(0, chassisHeight * 0.7, -chassisLength * 0.1);
        cabinMesh.castShadow = true;
        chassisGroup.add(cabinMesh);
        
        // Windows
        const windowMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x88ccff,
            metalness: 0,
            roughness: 0,
            transmission: 0.9,
            thickness: 0.5,
            opacity: 0.3,
            transparent: true
        });
        
        // Front window
        const frontWindowGeometry = new THREE.PlaneGeometry(chassisWidth * 0.8, chassisHeight * 0.5);
        const frontWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
        frontWindow.position.set(0, chassisHeight * 0.9, -chassisLength * 0.3);
        frontWindow.rotation.x = -0.3;
        chassisGroup.add(frontWindow);
        
        this.chassisMesh = chassisGroup;
        this.scene.add(this.chassisMesh);
        
        // Physics chassis
        const chassisShape = new CANNON.Box(new CANNON.Vec3(chassisWidth/2, chassisHeight/2, chassisLength/2));
        this.chassis = new CANNON.Body({
            mass: this.mass,
            shape: chassisShape,
            material: this.physicsWorld.materials?.vehicleBody
        });
        // Don't set position here, will be set later
    }

    createNodeBeamStructure() {
        // Create advanced node-beam structure for realistic soft-body simulation
        this.nodeBeamStructure = new AdvancedNodeBeamStructure(
            this.physicsWorld,
            this.scene,
            this.chassis,
            this.chassisMesh
        );
        this.nodeBeamStructure.init();
    }

    createWheels() {
        // Wheel configuration
        const wheelRadius = 0.4;
        const wheelWidth = 0.3;
        const wheelPositions = [
            { x: -0.8, y: -0.5, z: -1.3 }, // Front left
            { x: 0.8, y: -0.5, z: -1.3 },  // Front right
            { x: -0.8, y: -0.5, z: 1.3 },  // Rear left
            { x: 0.8, y: -0.5, z: 1.3 }    // Rear right
        ];
        
        // Create wheel meshes and physics
        wheelPositions.forEach((pos, index) => {
            const wheel = new Wheel(
                this.scene,
                wheelRadius,
                wheelWidth,
                index < 2 // isFront
            );
            wheel.init();
            this.wheels.push(wheel);
            this.wheelMeshes.push(wheel.mesh);
        });
    }

    setupVehicle() {
        // Add chassis to physics world
        this.physicsWorld.addBody(this.chassis);
        
        // Create raycast vehicle with correct axes
        const vehicle = new CANNON.RaycastVehicle({
            chassisBody: this.chassis,
            indexRightAxis: 0,  // X-axis points right
            indexForwardAxis: 2, // Z-axis points forward  
            indexUpAxis: 1      // Y-axis points up
        });
        
        // Add wheels to vehicle
        const wheelPositions = [
            { x: -0.8, y: -0.5, z: -1.3 }, // Front left
            { x: 0.8, y: -0.5, z: -1.3 },  // Front right
            { x: -0.8, y: -0.5, z: 1.3 },  // Rear left
            { x: 0.8, y: -0.5, z: 1.3 }    // Rear right
        ];
        
        wheelPositions.forEach((pos, index) => {
            const wheelInfo = {
                radius: 0.4,
                directionLocal: new CANNON.Vec3(0, -1, 0),
                suspensionStiffness: 60,
                suspensionRestLength: 0.6,
                frictionSlip: 2.0, // Increased friction
                dampingRelaxation: 2.3,
                dampingCompression: 4.4,
                maxSuspensionForce: 200000, // Increased
                rollInfluence: 0.01, // Reduced for stability
                axleLocal: new CANNON.Vec3(1, 0, 0),
                chassisConnectionPointLocal: new CANNON.Vec3(pos.x, pos.y, pos.z),
                maxSuspensionTravel: 0.5,
                customSlidingRotationalSpeed: -30,
                useCustomSlidingRotationalSpeed: true
            };
            
            vehicle.addWheel(wheelInfo);
        });
        
        vehicle.addToWorld(this.physicsWorld);
        this.vehicle = vehicle;
        
        console.log('Vehicle added to physics world:', this.vehicle);
        console.log('Chassis body:', this.chassis);
        console.log('Vehicle wheelInfos:', this.vehicle.wheelInfos.length);
        
        // Set wheel materials
        this.vehicle.wheelInfos.forEach(wheel => {
            wheel.material = this.physicsWorld.materials?.tire;
        });
    }

    update(deltaTime) {
        if (!this.vehicle) return;
        
        // Update engine RPM
        this.updateEngine(deltaTime);
        
        // Apply forces
        const engineForce = this.calculateEngineForce();
        const brakeForce = this.currentBrake * this.brakeForce;
        
        // Removed debug spam
        
        // Apply forces using RaycastVehicle
        if (this.vehicle) {
            // Apply steering to front wheels
            this.vehicle.setSteeringValue(this.currentSteering * this.steeringAngle, 0);
            this.vehicle.setSteeringValue(this.currentSteering * this.steeringAngle, 1);
            
            // Apply engine force
            const scaledForce = engineForce * 0.1; // Increased from 0.01
            this.vehicle.applyEngineForce(scaledForce, 2); // Rear left
            this.vehicle.applyEngineForce(scaledForce, 3); // Rear right
            
            // Debug log when throttle is pressed
            if (this.currentThrottle > 0) {
                console.log(`Applying force: ${scaledForce}, RPM: ${this.rpm}, Gear: ${this.currentGear}`);
            }
            
            // Apply brakes
            if (this.handbrake) {
                this.vehicle.setBrake(this.brakeForce * 2, 2);
                this.vehicle.setBrake(this.brakeForce * 2, 3);
            } else {
                for (let i = 0; i < 4; i++) {
                    this.vehicle.setBrake(brakeForce, i);
                }
            }
        }
        
        // Update visual wheels
        this.updateWheelMeshes();
        
        // Update chassis mesh
        this.chassisMesh.position.copy(this.chassis.position);
        this.chassisMesh.quaternion.copy(this.chassis.quaternion);
        
        // Update node-beam structure
        if (this.nodeBeamStructure) {
            this.nodeBeamStructure.update(deltaTime);
            this.damage = this.nodeBeamStructure.getDamage();
        }
    }

    updateEngine(deltaTime) {
        const wheelSpeed = this.getAverageWheelSpeed();
        const targetRPM = this.calculateTargetRPM(wheelSpeed);
        
        if (this.currentThrottle > 0) {
            this.rpm += (targetRPM - this.rpm) * deltaTime * 5;
        } else {
            this.rpm -= 1000 * deltaTime; // Engine braking
        }
        
        this.rpm = Math.max(800, Math.min(this.maxRPM, this.rpm));
    }

    calculateEngineForce() {
        if (this.currentGear === 1) return 0; // Neutral
        
        const gearRatio = this.gearRatios[this.currentGear] || 1;
        const totalRatio = Math.abs(gearRatio) * this.finalDriveRatio;
        
        // Simple torque curve
        const normalizedRPM = this.rpm / this.maxRPM;
        const torqueMultiplier = Math.max(0.3, 1 - Math.pow(normalizedRPM - 0.5, 2));
        
        const engineTorque = this.engineForce * torqueMultiplier * this.currentThrottle;
        const wheelForce = (engineTorque * totalRatio) / 0.4; // wheel radius
        
        const finalForce = this.currentGear === 0 ? -wheelForce * 0.5 : wheelForce; // Reverse gear
        return finalForce;
    }

    calculateTargetRPM(wheelSpeed) {
        const gearRatio = this.gearRatios[this.currentGear] || 1;
        const totalRatio = Math.abs(gearRatio * this.finalDriveRatio);
        const wheelRPM = (wheelSpeed * 60) / (2 * Math.PI * 0.4);
        return 800 + Math.abs(wheelRPM * totalRatio);
    }

    getAverageWheelSpeed() {
        let totalSpeed = 0;
        let count = 0;
        
        // Get rear wheel speeds (drive wheels)
        [2, 3].forEach(i => {
            const wheel = this.vehicle.wheelInfos[i];
            if (wheel) {
                totalSpeed += Math.abs(wheel.deltaRotation || 0);
                count++;
            }
        });
        
        return count > 0 ? totalSpeed / count : 0;
    }

    updateWheelMeshes() {
        this.vehicle.wheelInfos.forEach((wheel, index) => {
            const wheelMesh = this.wheelMeshes[index];
            if (wheelMesh) {
                wheelMesh.position.copy(wheel.worldTransform.position);
                wheelMesh.quaternion.copy(wheel.worldTransform.quaternion);
                
                // Add wheel rotation
                const rotationAxis = new THREE.Vector3(1, 0, 0);
                wheelMesh.rotateOnAxis(rotationAxis, wheel.rotation);
            }
        });
    }

    setThrottle(value) {
        this.currentThrottle = Math.max(0, Math.min(1, value));
        // Throttle updated
        
        // Auto gear shifting
        if (this.currentThrottle > 0 && this.currentGear > 1) {
            if (this.rpm > this.maxRPM * 0.9 && this.currentGear < this.gearRatios.length - 1) {
                this.currentGear++;
            } else if (this.rpm < this.maxRPM * 0.3 && this.currentGear > 2) {
                this.currentGear--;
            }
        }
    }

    setBrake(value) {
        this.currentBrake = Math.max(0, Math.min(1, value));
        
        // Shift to reverse if stopped and brake is held
        const speed = this.getSpeed();
        if (speed < 0.5 && this.currentBrake > 0.5 && this.currentGear > 0) {
            this.currentGear = 0; // Reverse
        } else if (speed < 0.5 && this.currentThrottle > 0 && this.currentGear === 0) {
            this.currentGear = 2; // First gear
        }
    }

    setSteering(value) {
        this.currentSteering = Math.max(-1, Math.min(1, value));
    }

    setHandbrake(value) {
        this.handbrake = value > 0.5;
    }

    getPosition() {
        return this.chassis.position;
    }

    getVelocity() {
        return this.chassis.velocity;
    }

    getAngularVelocity() {
        return this.chassis.angularVelocity;
    }

    getRotation() {
        return this.chassis.quaternion;
    }

    getSpeed() {
        const velocity = this.chassis.velocity;
        return Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
    }

    getRPM() {
        return this.rpm;
    }

    getCurrentGear() {
        // Convert gear index to display gear
        if (this.currentGear === 0) return -1; // Reverse
        if (this.currentGear === 1) return 0;  // Neutral
        return this.currentGear - 1; // Gears 1-6
    }

    getWheelSlipRatios() {
        return this.vehicle.wheelInfos.map(wheel => {
            const slipRatio = wheel.slipInfo || 0;
            return Math.min(Math.abs(slipRatio), 1);
        });
    }

    getNodeCount() {
        return this.nodeBeamStructure ? this.nodeBeamStructure.nodes.length : 0;
    }

    getDamagePercentage() {
        return (this.damage / this.maxDamage) * 100;
    }

    setPosition(x, y, z) {
        this.chassis.position.set(x, y, z);
        this.chassis.velocity.set(0, 0, 0);
        this.chassis.angularVelocity.set(0, 0, 0);
    }

    setRotation(x, y, z) {
        this.chassis.quaternion.setFromEuler(x, y, z);
    }

    reset() {
        // Reset physics
        this.chassis.velocity.set(0, 0, 0);
        this.chassis.angularVelocity.set(0, 0, 0);
        this.chassis.quaternion.set(0, 0, 0, 1);
        
        // Reset vehicle state
        this.currentSteering = 0;
        this.currentThrottle = 0;
        this.currentBrake = 0;
        this.handbrake = false;
        this.rpm = 800;
        this.currentGear = 2; // First gear
        
        // Reset damage
        if (this.nodeBeamStructure) {
            this.nodeBeamStructure.reset();
        }
        this.damage = 0;
        
        // Reset wheels
        if (this.vehicle && this.vehicle.wheelInfos) {
            this.vehicle.wheelInfos.forEach(wheel => {
                wheel.rotation = 0;
                wheel.deltaRotation = 0;
                wheel.suspensionLength = wheel.suspensionRestLength;
            });
        }
    }

    destroy() {
        // Remove from physics world
        if (this.vehicle) {
            this.vehicle.removeFromWorld();
        }
        if (this.chassis) {
            this.physicsWorld.removeBody(this.chassis);
        }
        
        // Remove meshes
        if (this.chassisMesh) {
            this.scene.remove(this.chassisMesh);
        }
        this.wheelMeshes.forEach(wheel => {
            if (wheel) this.scene.remove(wheel);
        });
        
        // Destroy node-beam structure
        if (this.nodeBeamStructure) {
            this.nodeBeamStructure.destroy();
        }
    }
}