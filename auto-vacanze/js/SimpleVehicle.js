export class SimpleVehicle {
    constructor(scene, world, config = {}) {
        this.scene = scene;
        this.world = world;
        
        // Simple configuration
        this.config = {
            mass: 1000,
            dimensions: { width: 1.8, height: 1.2, length: 4.0 },
            ...config
        };
        
        // Components
        this.chassisBody = null;
        this.carMesh = null;
        this.wheels = [];
        
        // State
        this.speed = 0;
        this.steerAngle = 0; // Current steering wheel angle (-1 to 1)
        this.throttleInput = 0;
        this.brakeInput = 0;
        this.yRotation = 0; // Vehicle body orientation
        
        // Real car physics parameters
        this.wheelBase = 2.6; // Distance between front and rear axles (meters)
        this.frontWheelAngle = 0; // Actual front wheel steering angle (radians)
        this.maxSteerAngle = Math.PI / 6; // 30 degrees max steering
        
        // Logging throttle
        this.lastLogTime = 0;
        this.logInterval = 1000; // Log every 1000ms (1 second)
        
        this.init();
    }
    
    init() {
        this.createChassis();
        this.createVisuals();
        this.createWheels();
        this.setPosition(0, 2, 0); // Higher start position
    }
    
    createChassis() {
        // Simple box chassis
        const chassisShape = new CANNON.Box(new CANNON.Vec3(
            this.config.dimensions.width / 2,
            this.config.dimensions.height / 2,
            this.config.dimensions.length / 2
        ));
        
        this.chassisBody = new CANNON.Body({
            mass: this.config.mass,
            shape: chassisShape,
            position: new CANNON.Vec3(0, 2, 0),
            material: new CANNON.Material({
                friction: 0.0,  // ZERO friction - no ground adhesion
                restitution: 0.1
            })
        });
        
        // NO damping - we handle movement manually
        this.chassisBody.linearDamping = 0.0; // Disable physics damping
        this.chassisBody.angularDamping = 0.0;
        
        this.world.add(this.chassisBody);
    }
    
    createVisuals() {
        // Simple car mesh
        const carGeo = new THREE.BoxGeometry(
            this.config.dimensions.width,
            this.config.dimensions.height,
            this.config.dimensions.length
        );
        
        const carMat = new THREE.MeshStandardMaterial({
            color: 0x3366ff,
            metalness: 0.5,
            roughness: 0.5
        });
        
        this.carMesh = new THREE.Mesh(carGeo, carMat);
        this.carMesh.castShadow = true;
        this.carMesh.receiveShadow = true;
        this.scene.add(this.carMesh);
    }
    
    createWheels() {
        const wheelPositions = [
            { x: -0.7, y: -0.3, z: 1.3 },  // Front left (higher for larger wheels)
            { x: 0.7, y: -0.3, z: 1.3 },   // Front right
            { x: -0.7, y: -0.3, z: -1.3 }, // Rear left
            { x: 0.7, y: -0.3, z: -1.3 }   // Rear right
        ];
        
        wheelPositions.forEach((pos, index) => {
            // Visual wheel - proper proportions (radius, radius, width)
            const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16);
            const wheelMat = new THREE.MeshStandardMaterial({
                color: 0x333333,
                roughness: 0.8
            });
            
            const wheelMesh = new THREE.Mesh(wheelGeo, wheelMat);
            wheelMesh.rotation.z = Math.PI / 2; // Rotate cylinder to lay flat like a real wheel
            wheelMesh.castShadow = true;
            this.scene.add(wheelMesh);
            
            this.wheels.push({
                mesh: wheelMesh,
                position: pos,
                isFront: index < 2
            });
        });
    }
    
    applyThrottle(amount) {
        this.throttleInput = amount;
        
        if (amount > 0) {
            // REAL CAR PHYSICS: Bicycle model
            const speed = amount * 0.2; // 0.2 units per frame
            const deltaTime = 1/60; // Assume 60 FPS
            
            // Calculate front wheel direction (vehicle direction + front wheel angle)
            const frontWheelDirection = this.yRotation + this.frontWheelAngle;
            
            // Movement direction is where the front wheels point
            const moveDirection = new CANNON.Vec3(
                Math.sin(frontWheelDirection),
                0,
                -Math.cos(frontWheelDirection)
            );
            
            const currentPos = this.chassisBody.position;
            
            // Move in front wheel direction
            const movement = moveDirection.scale(speed);
            currentPos.vadd(movement, currentPos);
            
            // Calculate vehicle rotation change (bicycle model)
            if (Math.abs(this.frontWheelAngle) > 0.001 && speed > 0.01) {
                // Angular velocity = (speed * sin(steer_angle)) / wheelbase
                const angularVelocity = (speed * 60) * Math.sin(this.frontWheelAngle) / this.wheelBase;
                this.yRotation += angularVelocity * deltaTime;
                
                // Keep rotation in bounds
                if (this.yRotation > Math.PI) this.yRotation -= 2 * Math.PI;
                if (this.yRotation < -Math.PI) this.yRotation += 2 * Math.PI;
            }
            
            // Force position update
            this.chassisBody.position.copy(currentPos);
            
            // Set velocity for display
            const velocityScale = speed * 60;
            this.chassisBody.velocity.set(
                moveDirection.x * velocityScale,
                0,
                moveDirection.z * velocityScale
            );
            
            // Throttled logging
            const now = Date.now();
            if (now - this.lastLogTime > this.logInterval) {
                console.log(`[CAR_PHYSICS] Body: ${(this.yRotation * 180 / Math.PI).toFixed(1)}°, FrontWheel: ${(frontWheelDirection * 180 / Math.PI).toFixed(1)}°, Speed: ${speed.toFixed(2)}`);
                this.lastLogTime = now;
            }
        } else {
            // Stop movement
            this.chassisBody.velocity.set(0, 0, 0);
        }
    }
    
    applyBrake(amount) {
        this.brakeInput = amount;
        
        // Direct braking - reduce forward speed
        const currentVel = this.chassisBody.velocity;
        const brakeForce = amount * 0.4; // Brake strength
        
        currentVel.z *= (1 - brakeForce); // Reduce Z velocity (forward/backward)
        currentVel.x *= (1 - brakeForce * 0.5); // Slight lateral braking
    }
    
    applySteering(angle) {
        this.steerAngle = angle;
        
        // Calculate front wheel angle from steering input
        this.frontWheelAngle = angle * this.maxSteerAngle;
        
        // Only log significant steering changes
        if (Math.abs(angle) > 0.5) {
            console.log(`[STEERING] Input: ${angle.toFixed(2)}, Wheel Angle: ${(this.frontWheelAngle * 180 / Math.PI).toFixed(1)}°`);
        }
    }
    
    update(deltaTime) {
        // Prevent lateral sliding (like real car tires)
        this.preventLateralSliding();
        
        // Update visual position
        this.carMesh.position.copy(this.chassisBody.position);
        this.carMesh.quaternion.copy(this.chassisBody.quaternion);
        
        // Update wheels
        this.updateWheels();
        
        // Auto-stabilization
        this.stabilize();
        
        // Calculate speed
        this.speed = this.chassisBody.velocity.length();
    }
    
    preventLateralSliding() {
        // Real cars can't slide sideways easily due to tire friction
        const currentVel = this.chassisBody.velocity;
        
        // Calculate vehicle's local axes
        const forward = new CANNON.Vec3(
            Math.sin(this.yRotation),
            0,
            -Math.cos(this.yRotation)
        );
        const right = new CANNON.Vec3(
            Math.cos(this.yRotation),
            0,
            Math.sin(this.yRotation)
        );
        
        // Project velocity onto forward and right directions
        const forwardSpeed = currentVel.dot(forward);
        const lateralSpeed = currentVel.dot(right);
        
        // Reduce lateral velocity (simulate tire grip)
        const lateralReduction = 0.95; // Keep 5% lateral movement
        const newLateralSpeed = lateralSpeed * lateralReduction;
        
        // Reconstruct velocity with reduced lateral component
        const newVelocity = forward.scale(forwardSpeed).vadd(right.scale(newLateralSpeed));
        newVelocity.y = currentVel.y; // Keep Y component for gravity
        
        this.chassisBody.velocity.copy(newVelocity);
    }
    
    updateWheels() {
        this.wheels.forEach(wheel => {
            // Position wheels relative to chassis
            const wheelWorldPos = this.chassisBody.position.vadd(
                this.chassisBody.quaternion.vmult(new CANNON.Vec3(...Object.values(wheel.position)))
            );
            
            wheel.mesh.position.copy(wheelWorldPos);
            wheel.mesh.quaternion.copy(this.chassisBody.quaternion);
            
            // Rotate wheels based on movement
            if (this.speed > 0.1) {
                wheel.mesh.rotation.x += this.speed * 0.01; // Fixed deltaTime usage
            }
        });
    }
    
    stabilize() {
        // Keep car at reasonable ground level
        if (this.chassisBody.position.y < 0.5) {
            this.chassisBody.position.y = 1.0;
        }
        
        // Update visual rotation to match Y-rotation
        this.chassisBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), this.yRotation);
        this.chassisBody.angularVelocity.set(0, 0, 0);
    }
    
    setPosition(x, y, z) {
        this.chassisBody.position.set(x, y, z);
        this.chassisBody.velocity.set(0, 0, 0);
        this.chassisBody.angularVelocity.set(0, 0, 0);
        
        this.carMesh.position.set(x, y, z);
    }
    
    reset() {
        this.setPosition(0, 2, 0);
        this.speed = 0;
        this.steerAngle = 0;
        this.throttleInput = 0;
        this.brakeInput = 0;
        this.yRotation = 0; // Reset body rotation
        this.frontWheelAngle = 0; // Reset wheel angle
    }
    
    getPosition() {
        return this.chassisBody.position;
    }
    
    getVelocity() {
        return this.chassisBody.velocity;
    }
    
    dispose() {
        this.scene.remove(this.carMesh);
        this.world.remove(this.chassisBody);
        
        this.wheels.forEach(wheel => {
            this.scene.remove(wheel.mesh);
        });
    }
}