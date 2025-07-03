/**
 * BeamNGVehicle - Complete BeamNG.drive-style vehicle with node-beam physics
 * Implements realistic vehicle dynamics with soft-body chassis and proper wheel physics
 */
import { VehicleNode } from './VehicleNode.js';
import { VehicleBeam } from './VehicleBeam.js';
import { WheelBody } from './WheelBody.js';

export class BeamNGVehicle {
    constructor(scene, world, config = {}) {
        this.scene = scene;
        this.world = world;
        
        // Vehicle configuration
        this.config = {
            mass: config.mass || 1200,
            dimensions: config.dimensions || { width: 1.8, height: 1.4, length: 4.2 },
            wheelBase: config.wheelBase || 2.6,
            trackWidth: config.trackWidth || 1.5,
            ...config
        };
        
        // Vehicle components
        this.nodes = new Map(); // All chassis nodes
        this.beams = []; // All structural beams
        this.wheels = []; // All wheel bodies
        this.suspensions = []; // Suspension connections
        
        // Vehicle state
        this.throttleInput = 0;
        this.brakeInput = 0;
        this.steerInput = 0;
        this.engineRPM = 800;
        this.speed = 0;
        
        // Engine and drivetrain
        this.engine = {
            maxTorque: 300, // Nm
            maxRPM: 6500,
            idleRPM: 800,
            torqueCurve: this.createTorqueCurve()
        };
        
        this.drivetrain = {
            gearRatios: [3.5, 2.1, 1.4, 1.0, 0.8], // 5-speed
            currentGear: 1,
            finalDriveRatio: 3.9,
            driveType: 'FWD' // FWD, RWD, AWD
        };
        
        // Visual elements
        this.chassisMesh = null;
        this.debugMode = false;
        
        // Performance monitoring
        this.lastUpdateTime = 0;
        this.updateFrequency = 120; // 120Hz physics
        
        console.log('[BEAMNG_VEHICLE] Initializing BeamNG-style vehicle...');
        this.init();
    }
    
    /**
     * Initialize the complete vehicle structure
     */
    init() {
        this.createChassisNodes();
        this.createChassisBeams();
        this.createWheels();
        this.createSuspensions();
        this.createVisuals();
        this.setInitialPosition(0, 2, 0);
        
        console.log(`[BEAMNG_VEHICLE] Created: ${this.nodes.size} nodes, ${this.beams.length} beams, ${this.wheels.length} wheels`);
    }
    
    /**
     * Create the chassis node grid structure
     */
    createChassisNodes() {
        const { width, height, length } = this.config.dimensions;
        const nodeSpacing = 0.8; // Distance between nodes
        
        // Calculate node grid dimensions
        const nodesX = Math.ceil(width / nodeSpacing) + 1;
        const nodesY = Math.ceil(height / nodeSpacing) + 1;
        const nodesZ = Math.ceil(length / nodeSpacing) + 1;
        
        // Create 3D grid of nodes
        for (let x = 0; x < nodesX; x++) {
            for (let y = 0; y < nodesY; y++) {
                for (let z = 0; z < nodesZ; z++) {
                    const position = new CANNON.Vec3(
                        (x / (nodesX - 1) - 0.5) * width,
                        (y / (nodesY - 1)) * height,
                        (z / (nodesZ - 1) - 0.5) * length
                    );
                    
                    // Calculate node mass (distribute total vehicle mass)
                    const nodeMass = this.config.mass / (nodesX * nodesY * nodesZ);
                    
                    // Create node with unique ID
                    const nodeId = `node_${x}_${y}_${z}`;
                    const node = new VehicleNode(this.world, position, nodeMass, nodeId);
                    
                    // Set special properties for specific nodes
                    if (y === 0) {
                        // Bottom nodes - can contact ground
                        node.isGroundContact = true;
                    }
                    
                    if (x === 0 || x === nodesX-1 || y === 0 || y === nodesY-1 || z === 0 || z === nodesZ-1) {
                        // Outer nodes - structural points
                        node.maxStress *= 1.5; // More durable
                    }
                    
                    this.nodes.set(nodeId, node);
                    
                    // Create visual representation in debug mode
                    if (this.debugMode) {
                        node.createVisualMesh(this.scene, 0x00ff00);
                    }
                }
            }
        }
        
        console.log(`[CHASSIS_NODES] Created ${this.nodes.size} chassis nodes`);
    }
    
    /**
     * Create engine torque curve
     */
    createTorqueCurve() {
        return {
            getTorque: (rpm) => {
                const normalizedRPM = rpm / this.engine.maxRPM;
                
                if (normalizedRPM < 0.2) {
                    // Low RPM - linear increase
                    return this.engine.maxTorque * (normalizedRPM / 0.2) * 0.6;
                } else if (normalizedRPM < 0.5) {
                    // Peak torque range
                    return this.engine.maxTorque;
                } else {
                    // High RPM - torque drops off
                    return this.engine.maxTorque * (1 - (normalizedRPM - 0.5) * 0.8);
                }
            }
        };
    }
    
    /**
     * Create wheels and suspension (simplified)
     */
    createWheels() {
        const { wheelBase, trackWidth } = this.config;
        
        const wheelPositions = [
            { x: -trackWidth/2, y: 0.35, z: wheelBase/2, isSteered: true, isDriven: true },  // Front left
            { x: trackWidth/2, y: 0.35, z: wheelBase/2, isSteered: true, isDriven: true },   // Front right
            { x: -trackWidth/2, y: 0.35, z: -wheelBase/2, isSteered: false, isDriven: false }, // Rear left
            { x: trackWidth/2, y: 0.35, z: -wheelBase/2, isSteered: false, isDriven: false }   // Rear right
        ];
        
        wheelPositions.forEach((config, index) => {
            const position = new CANNON.Vec3(config.x, config.y, config.z);
            const wheel = new WheelBody(this.world, position, {
                radius: 0.35,
                width: 0.2,
                mass: 25,
                isSteered: config.isSteered,
                isDriven: config.isDriven
            });
            
            wheel.createVisualMesh(this.scene);
            this.wheels.push(wheel);
        });
        
        console.log(`[WHEELS] Created ${this.wheels.length} wheels`);
    }
    
    createSuspensions() {
        // Connect each wheel to nearest chassis nodes with spring constraints
        this.wheels.forEach((wheel, wheelIndex) => {
            // Find the closest chassis node to this wheel
            let closestNode = null;
            let minDistance = Infinity;
            
            this.nodes.forEach((node, nodeId) => {
                const distance = wheel.body.position.distanceTo(node.body.position);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestNode = node;
                }
            });
            
            if (closestNode) {
                // Create spring constraint between wheel and chassis node
                const constraint = new CANNON.PointToPointConstraint(
                    wheel.body,
                    new CANNON.Vec3(0, 0, 0), // Local point on wheel
                    closestNode.body,
                    new CANNON.Vec3(0, 0, 0)  // Local point on chassis node
                );
                
                this.world.addConstraint(constraint);
                this.suspensions.push(constraint);
                
                console.log(`[SUSPENSION] Connected wheel ${wheelIndex} to chassis node`);
            }
        });
        
        console.log(`[SUSPENSION] Created ${this.suspensions.length} wheel-chassis connections`);
    }
    
    createChassisBeams() {
        // Connect chassis nodes together with spring constraints
        const nodeArray = Array.from(this.nodes.values());
        let beamCount = 0;
        
        // Connect each node to nearby nodes (within reasonable distance)
        for (let i = 0; i < nodeArray.length; i++) {
            for (let j = i + 1; j < nodeArray.length; j++) {
                const nodeA = nodeArray[i];
                const nodeB = nodeArray[j];
                const distance = nodeA.body.position.distanceTo(nodeB.body.position);
                
                // Only connect nodes that are close enough
                if (distance < 1.5) {
                    const constraint = new CANNON.PointToPointConstraint(
                        nodeA.body,
                        new CANNON.Vec3(0, 0, 0),
                        nodeB.body,
                        new CANNON.Vec3(0, 0, 0)
                    );
                    
                    this.world.addConstraint(constraint);
                    this.beams.push(constraint);
                    beamCount++;
                }
            }
        }
        
        console.log(`[CHASSIS_BEAMS] Created ${beamCount} chassis connections`);
    }
    
    /**
     * Create visual representation of the chassis
     */
    createVisuals() {
        // Simple chassis mesh
        const chassisGeo = new THREE.BoxGeometry(
            this.config.dimensions.width,
            this.config.dimensions.height,
            this.config.dimensions.length
        );
        
        const chassisMat = new THREE.MeshStandardMaterial({
            color: 0x2196F3,
            metalness: 0.6,
            roughness: 0.4,
            transparent: true,
            opacity: 0.8
        });
        
        this.chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
        this.chassisMesh.castShadow = true;
        this.chassisMesh.receiveShadow = true;
        this.scene.add(this.chassisMesh);
    }
    
    /**
     * Apply throttle input
     */
    applyThrottle(amount) {
        if (!this.wheels || this.wheels.length === 0) return;
        
        this.throttleInput = amount;
        
        if (amount > 0) {
            // Update engine RPM
            this.engineRPM = Math.min(
                this.engine.maxRPM,
                this.engine.idleRPM + amount * (this.engine.maxRPM - this.engine.idleRPM)
            );
            
            // Calculate engine torque
            const engineTorque = this.engine.torqueCurve.getTorque(this.engineRPM);
            
            // Apply through drivetrain
            const gearRatio = this.drivetrain.gearRatios[this.drivetrain.currentGear - 1];
            const wheelTorque = engineTorque * gearRatio * this.drivetrain.finalDriveRatio;
            const wheelForce = wheelTorque / 0.35; // Wheel radius
            
            // Apply to driven wheels
            const drivenWheelCount = this.getDrivenWheelCount();
            if (drivenWheelCount > 0) {
                this.wheels.forEach(wheel => {
                    if (wheel && wheel.config && wheel.config.isDriven) {
                        wheel.setDriveForce(wheelForce / drivenWheelCount);
                    }
                });
            }
            
            // Debug throttle
            console.log(`[THROTTLE_DEBUG] Amount:${amount.toFixed(2)}, Force:${wheelForce.toFixed(0)}N, Driven wheels:${drivenWheelCount}, Wheels grounded:${this.wheels.filter(w => w && w.isGrounded).length}`);
        } else {
            // Engine idle
            this.engineRPM = this.engine.idleRPM;
            this.wheels.forEach(wheel => {
                if (wheel && wheel.setDriveForce) {
                    wheel.setDriveForce(0);
                }
            });
        }
    }
    
    /**
     * Apply brake input
     */
    applyBrake(amount) {
        this.brakeInput = amount;
        
        const brakeForce = amount * 3000; // Maximum brake force
        
        this.wheels.forEach(wheel => {
            wheel.setBrakeForce(brakeForce);
        });
    }
    
    /**
     * Apply steering input
     */
    applySteering(angle) {
        this.steerInput = angle;
        
        const maxSteerAngle = Math.PI / 6; // 30 degrees
        const steerAngle = angle * maxSteerAngle;
        
        this.wheels.forEach(wheel => {
            if (wheel.config.isSteered) {
                wheel.setSteering(steerAngle);
            }
        });
    }
    
    /**
     * Update vehicle physics
     */
    update(deltaTime) {
        // Update wheels
        this.wheels.forEach(wheel => wheel.update(deltaTime));
        
        // Update chassis mesh position (average of wheel positions)
        this.updateChassisVisual();
        
        // Calculate vehicle speed
        this.updateVehicleSpeed();
    }
    
    /**
     * Update chassis visual position
     */
    updateChassisVisual() {
        if (!this.chassisMesh) return;
        
        // Calculate average position of chassis nodes
        const avgPosition = new CANNON.Vec3();
        let nodeCount = 0;
        
        this.nodes.forEach(node => {
            avgPosition.vadd(node.body.position, avgPosition);
            nodeCount++;
        });
        
        if (nodeCount > 0) {
            avgPosition.scale(1 / nodeCount, avgPosition);
            this.chassisMesh.position.copy(avgPosition);
        }
    }
    
    /**
     * Calculate vehicle speed
     */
    updateVehicleSpeed() {
        if (!this.wheels || this.wheels.length === 0) {
            this.speed = 0;
            return;
        }
        
        // Average wheel speeds
        let totalSpeed = 0;
        let wheelCount = 0;
        
        this.wheels.forEach(wheel => {
            if (wheel && wheel.isGrounded && wheel.body && wheel.body.velocity) {
                totalSpeed += wheel.body.velocity.length();
                wheelCount++;
            }
        });
        
        this.speed = wheelCount > 0 ? totalSpeed / wheelCount : 0;
    }
    
    /**
     * Get number of driven wheels
     */
    getDrivenWheelCount() {
        return this.wheels.filter(wheel => wheel.config.isDriven).length;
    }
    
    /**
     * Set initial vehicle position
     */
    setInitialPosition(x, y, z) {
        const offset = new CANNON.Vec3(x, y, z);
        
        this.wheels.forEach((wheel, index) => {
            const wheelOffset = wheel.body.position.vadd(offset);
            wheel.body.position.copy(wheelOffset);
        });
    }
    
    /**
     * Reset vehicle
     */
    reset() {
        // Reset wheels
        this.wheels.forEach(wheel => {
            wheel.body.velocity.set(0, 0, 0);
            wheel.body.angularVelocity.set(0, 0, 0);
            wheel.spinVelocity = 0;
            wheel.setDriveForce(0);
            wheel.setBrakeForce(0);
            wheel.setSteering(0);
        });
        
        // Reset inputs
        this.throttleInput = 0;
        this.brakeInput = 0;
        this.steerInput = 0;
        this.engineRPM = this.engine.idleRPM;
        
        this.setInitialPosition(0, 2, 0);
    }
    
    /**
     * Get vehicle position (average of wheels)
     */
    getPosition() {
        if (!this.wheels || this.wheels.length === 0) {
            return new CANNON.Vec3(0, 0, 0);
        }
        
        const avgPosition = new CANNON.Vec3();
        this.wheels.forEach(wheel => {
            if (wheel && wheel.body && wheel.body.position) {
                avgPosition.vadd(wheel.body.position, avgPosition);
            }
        });
        avgPosition.scale(1 / this.wheels.length, avgPosition);
        return avgPosition;
    }
    
    /**
     * Get vehicle velocity (average of wheels)
     */
    getVelocity() {
        if (!this.wheels || this.wheels.length === 0) {
            return new CANNON.Vec3(0, 0, 0);
        }
        
        const avgVelocity = new CANNON.Vec3();
        this.wheels.forEach(wheel => {
            if (wheel && wheel.body && wheel.body.velocity) {
                avgVelocity.vadd(wheel.body.velocity, avgVelocity);
            }
        });
        avgVelocity.scale(1 / this.wheels.length, avgVelocity);
        return avgVelocity;
    }
    
    /**
     * Dispose of all vehicle resources
     */
    dispose() {
        // Dispose wheels
        this.wheels.forEach(wheel => wheel.dispose(this.scene));
        
        // Remove chassis mesh
        if (this.chassisMesh) {
            this.scene.remove(this.chassisMesh);
        }
        
        console.log('[BEAMNG_VEHICLE] Vehicle disposed');
    }
}