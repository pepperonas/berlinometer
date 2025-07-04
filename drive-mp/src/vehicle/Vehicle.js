import * as THREE from 'three';
import * as CANNON from 'cannon-es';
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
        this.engineForce = 5000; // Increased for better acceleration with advanced physics
        this.brakeForce = 50;
        this.steeringAngle = 0.4; // Increased for better steering response
        this.currentSteering = 0;
        this.currentThrottle = 0;
        this.currentBrake = 0;
        this.handbrake = false;
        
        // Advanced physics
        this.suspension = {
            frontStiffness: 60,
            rearStiffness: 55,
            frontDamping: 4.4,
            rearDamping: 4.0,
            frontCompression: 2.3,
            rearCompression: 2.1,
            antiRollBar: 0.3
        };
        
        // Tire physics
        this.tires = [
            { temperature: 20, wear: 0, pressure: 2.2, compound: 'medium' },
            { temperature: 20, wear: 0, pressure: 2.2, compound: 'medium' },
            { temperature: 20, wear: 0, pressure: 2.2, compound: 'medium' },
            { temperature: 20, wear: 0, pressure: 2.2, compound: 'medium' }
        ];
        
        this.tireCompounds = {
            soft: { grip: 1.2, wearRate: 2.0, optimalTemp: 85 },
            medium: { grip: 1.0, wearRate: 1.0, optimalTemp: 75 },
            hard: { grip: 0.8, wearRate: 0.5, optimalTemp: 65 }
        };
        
        // Aerodynamics
        this.aero = {
            dragCoefficient: 0.32,
            frontalArea: 2.5,
            downforceCoefficient: 0.15,
            centerOfPressure: -0.5 // Behind center of mass
        };
        
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
        
        // Mark chassis for collision detection
        this.chassis.userData = { 
            isVehicle: true, 
            vehicleInstance: this 
        };
        
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
            const isFront = index < 2;
            const wheelInfo = {
                radius: 0.4,
                directionLocal: new CANNON.Vec3(0, -1, 0),
                suspensionStiffness: isFront ? this.suspension.frontStiffness : this.suspension.rearStiffness,
                suspensionRestLength: 0.5, // Reduced for better ground contact
                frictionSlip: this.calculateTireFriction(index),
                dampingRelaxation: isFront ? this.suspension.frontCompression : this.suspension.rearCompression,
                dampingCompression: isFront ? this.suspension.frontDamping : this.suspension.rearDamping,
                maxSuspensionForce: 250000, // Increased for better response
                rollInfluence: 0.01,
                axleLocal: new CANNON.Vec3(1, 0, 0),
                chassisConnectionPointLocal: new CANNON.Vec3(pos.x, pos.y, pos.z),
                maxSuspensionTravel: 0.4, // Reduced for stability
                customSlidingRotationalSpeed: -50, // Increased for better control
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
        
        // Update advanced physics systems
        this.updateTirePhysics(deltaTime);
        this.updateAerodynamics(deltaTime);
        this.updateSuspension(deltaTime);
        
        // Update engine RPM
        this.updateEngine(deltaTime);
        
        // Apply forces
        const engineForce = this.calculateEngineForce();
        const brakeForce = this.currentBrake * this.brakeForce;
        
        // Removed debug spam
        
        // Apply forces using RaycastVehicle
        if (this.vehicle) {
            // Apply steering to front wheels with speed-dependent steering
            const speed = this.getSpeed();
            const speedFactor = Math.max(0.3, 1 - speed * 0.01); // Reduce steering at high speed
            const finalSteering = this.currentSteering * this.steeringAngle * speedFactor;
            
            this.vehicle.setSteeringValue(finalSteering, 0);
            this.vehicle.setSteeringValue(finalSteering, 1);
            
            // Apply engine force
            const scaledForce = engineForce * 1.0; // Increased to full force
            this.vehicle.applyEngineForce(scaledForce, 2); // Rear left
            this.vehicle.applyEngineForce(scaledForce, 3); // Rear right
            
            // Debug log when throttle is pressed
            if (this.currentThrottle > 0) {
                console.log(`Applying force: ${scaledForce}, RPM: ${this.rpm}, Gear: ${this.currentGear}, Throttle: ${this.currentThrottle}`);
                console.log(`Engine force calc: gearRatio=${this.gearRatios[this.currentGear]}, engineForce=${this.engineForce}`);
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
        if (this.currentGear === 1) return 0; // Neutral (index 1 = gear N)
        
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
        console.log(`Vehicle setThrottle called: ${value} -> ${this.currentThrottle}`);
        
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

    // Advanced physics methods
    calculateTireFriction(wheelIndex) {
        const tire = this.tires[wheelIndex];
        const compound = this.tireCompounds[tire.compound];
        
        // Base friction from compound
        let friction = compound.grip;
        
        // Temperature effect
        const tempDiff = Math.abs(tire.temperature - compound.optimalTemp);
        const tempFactor = Math.max(0.3, 1 - (tempDiff / 50));
        friction *= tempFactor;
        
        // Wear effect
        const wearFactor = Math.max(0.4, 1 - tire.wear);
        friction *= wearFactor;
        
        // Pressure effect
        const pressureFactor = Math.max(0.7, 1 - Math.abs(tire.pressure - 2.2) / 2.2);
        friction *= pressureFactor;
        
        return friction * 3.0; // Increased base multiplier for better initial grip
    }
    
    updateTirePhysics(deltaTime) {
        if (!this.vehicle.wheelInfos) return;
        
        this.vehicle.wheelInfos.forEach((wheel, index) => {
            const tire = this.tires[index];
            
            // Calculate tire slip
            const slip = wheel.slipInfo || 0;
            const slipMagnitude = Math.abs(slip);
            
            // Update temperature based on slip and speed
            const speed = this.getSpeed();
            const heatGeneration = slipMagnitude * 20 + speed * 0.5;
            const cooling = (tire.temperature - 20) * 0.02; // Ambient cooling
            
            tire.temperature += (heatGeneration - cooling) * deltaTime;
            tire.temperature = Math.max(20, Math.min(150, tire.temperature));
            
            // Update wear based on slip and temperature
            const compound = this.tireCompounds[tire.compound];
            const wearRate = compound.wearRate * (1 + tire.temperature / 100);
            tire.wear += slipMagnitude * wearRate * deltaTime * 0.001;
            tire.wear = Math.min(1.0, tire.wear);
            
            // Update friction in real-time
            wheel.frictionSlip = this.calculateTireFriction(index);
        });
    }
    
    updateAerodynamics(deltaTime) {
        const velocity = this.chassis.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        
        if (speed < 0.1) return;
        
        // Calculate drag force
        const dragForce = 0.5 * 1.225 * this.aero.dragCoefficient * this.aero.frontalArea * speed * speed;
        
        // Calculate drag direction (normalize velocity and negate)
        const dragDirection = new CANNON.Vec3(
            -velocity.x / speed,
            0,
            -velocity.z / speed
        );
        
        // Apply drag
        this.chassis.force.x += dragDirection.x * dragForce;
        this.chassis.force.z += dragDirection.z * dragForce;
        
        // Calculate downforce
        const downforce = 0.5 * 1.225 * this.aero.downforceCoefficient * this.aero.frontalArea * speed * speed;
        this.chassis.force.y -= downforce;
        
        // Apply pitching moment from downforce
        const pitchMoment = downforce * this.aero.centerOfPressure;
        this.chassis.torque.x += pitchMoment;
    }
    
    updateSuspension(deltaTime) {
        if (!this.vehicle.wheelInfos) return;
        
        // Calculate anti-roll bar effect
        const frontRollDiff = this.vehicle.wheelInfos[0].suspensionLength - this.vehicle.wheelInfos[1].suspensionLength;
        const rearRollDiff = this.vehicle.wheelInfos[2].suspensionLength - this.vehicle.wheelInfos[3].suspensionLength;
        
        const antiRollForce = this.suspension.antiRollBar * 10000;
        
        // Apply anti-roll forces to front wheels
        if (Math.abs(frontRollDiff) > 0.01) {
            const force = frontRollDiff * antiRollForce;
            this.chassis.force.y += force * 0.1;
            this.chassis.torque.z += force * 0.8; // Roll moment
        }
        
        // Apply anti-roll forces to rear wheels
        if (Math.abs(rearRollDiff) > 0.01) {
            const force = rearRollDiff * antiRollForce;
            this.chassis.force.y += force * 0.1;
            this.chassis.torque.z += force * 1.3; // Roll moment
        }
    }
    
    // Getters for advanced telemetry
    getTireTemperatures() {
        return this.tires.map(tire => tire.temperature);
    }
    
    getTireWear() {
        return this.tires.map(tire => tire.wear * 100);
    }
    
    getTirePressures() {
        return this.tires.map(tire => tire.pressure);
    }
    
    getAerodynamicForces() {
        const velocity = this.chassis.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        
        const drag = 0.5 * 1.225 * this.aero.dragCoefficient * this.aero.frontalArea * speed * speed;
        const downforce = 0.5 * 1.225 * this.aero.downforceCoefficient * this.aero.frontalArea * speed * speed;
        
        return { drag, downforce };
    }
    
    setSuspensionSettings(settings) {
        Object.assign(this.suspension, settings);
        
        // Update existing wheels
        if (this.vehicle && this.vehicle.wheelInfos) {
            this.vehicle.wheelInfos.forEach((wheel, index) => {
                const isFront = index < 2;
                wheel.suspensionStiffness = isFront ? this.suspension.frontStiffness : this.suspension.rearStiffness;
                wheel.dampingRelaxation = isFront ? this.suspension.frontCompression : this.suspension.rearCompression;
                wheel.dampingCompression = isFront ? this.suspension.frontDamping : this.suspension.rearDamping;
            });
        }
    }
    
    setTireCompound(wheelIndex, compound) {
        if (wheelIndex >= 0 && wheelIndex < 4 && this.tireCompounds[compound]) {
            this.tires[wheelIndex].compound = compound;
            this.tires[wheelIndex].wear = 0; // Reset wear when changing compound
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
    
    // Collision handler for physics system
    onCollision(collisionData) {
        const { vehicleBody, otherBody, force, damage, position, normal } = collisionData;
        
        // Apply damage to node-beam structure
        if (this.nodeBeamStructure) {
            // Convert CANNON position to THREE position
            const impactPoint = new THREE.Vector3(position.x, position.y, position.z);
            const impactNormal = new THREE.Vector3(normal.x, normal.y, normal.z);
            
            // Apply localized damage based on impact point
            this.nodeBeamStructure.applyDamage(impactPoint, damage, force);
        }
        
        // Update vehicle damage
        this.damage = Math.min(this.damage + damage, this.maxDamage);
        
        // Log significant collisions
        if (force > 10) {
            console.log(`Vehicle collision: force=${force.toFixed(1)}, damage=${damage.toFixed(1)}, total=${this.damage.toFixed(1)}%`);
        }
    }
}