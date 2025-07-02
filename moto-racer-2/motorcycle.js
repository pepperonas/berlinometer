// Motorcycle Class - 3D Model and Physics
class Motorcycle {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        
        // 3D Model components
        this.group = new THREE.Group();
        this.body = null;
        this.frontWheel = null;
        this.rearWheel = null;
        
        // Physics bodies
        this.bodyPhysics = null;
        this.frontWheelPhysics = null;
        this.rearWheelPhysics = null;
        this.constraints = [];
        
        // Motorcycle properties
        this.enginePower = 800;
        this.maxSpeed = 200; // km/h
        this.brakeForce = 50;
        this.steerAngle = 0;
        this.maxSteerAngle = Math.PI / 6; // 30 degrees
        
        // Current state
        this.speed = 0;
        this.rpm = 0;
        this.gear = 1;
        this.isAccelerating = false;
        this.isBraking = false;
        
        // Audio (will be implemented later)
        this.engineSound = null;
        
        this.scene.add(this.group);
    }
    
    async init() {
        this.createVisualModel();
        this.createPhysicsModel();
        this.setupConstraints();
    }
    
    createVisualModel() {
        // Main body (motorcycle frame)
        const bodyGeometry = new THREE.BoxGeometry(2, 1, 4);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.set(0, 0.5, 0);
        this.body.castShadow = true;
        this.group.add(this.body);
        
        // Seat
        const seatGeometry = new THREE.BoxGeometry(1.2, 0.3, 1.5);
        const seatMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(0, 1.1, 0.2);
        seat.castShadow = true;
        this.group.add(seat);
        
        // Handlebars
        const handlebarGeometry = new THREE.BoxGeometry(2, 0.1, 0.1);
        const handlebarMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const handlebars = new THREE.Mesh(handlebarGeometry, handlebarMaterial);
        handlebars.position.set(0, 1.5, -1.5);
        handlebars.castShadow = true;
        this.group.add(handlebars);
        
        // Front wheel
        const wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 16);
        const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
        
        this.frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.frontWheel.position.set(0, 0.8, -2);
        this.frontWheel.rotation.z = Math.PI / 2;
        this.frontWheel.castShadow = true;
        this.frontWheel.receiveShadow = true;
        this.group.add(this.frontWheel);
        
        // Rear wheel
        this.rearWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.rearWheel.position.set(0, 0.8, 2);
        this.rearWheel.rotation.z = Math.PI / 2;
        this.rearWheel.castShadow = true;
        this.rearWheel.receiveShadow = true;
        this.group.add(this.rearWheel);
        
        // Exhaust pipe
        const exhaustGeometry = new THREE.CylinderGeometry(0.1, 0.15, 2, 8);
        const exhaustMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
        exhaust.position.set(0.8, 0.3, 1);
        exhaust.rotation.z = Math.PI / 2;
        exhaust.castShadow = true;
        this.group.add(exhaust);
        
        // Headlight
        const headlightGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const headlightMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffffcc,
            emissive: 0x444400
        });
        const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        headlight.position.set(0, 1.2, -2.5);
        headlight.castShadow = true;
        this.group.add(headlight);
        
        // Tail light
        const taillightGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const taillightMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xff0000,
            emissive: 0x220000
        });
        const taillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
        taillight.position.set(0, 1, 2.5);
        taillight.castShadow = true;
        this.group.add(taillight);
        
        // Rider (simple representation)
        this.createRider();
    }
    
    createRider() {
        const riderGroup = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        const riderBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        riderBody.position.set(0, 2, 0.2);
        riderBody.castShadow = true;
        riderGroup.add(riderBody);
        
        // Head (helmet)
        const headGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const riderHead = new THREE.Mesh(headGeometry, headMaterial);
        riderHead.position.set(0, 2.8, 0.2);
        riderHead.castShadow = true;
        riderGroup.add(riderHead);
        
        // Arms
        const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 6);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.8, 2.2, -0.5);
        leftArm.rotation.z = -Math.PI / 4;
        leftArm.castShadow = true;
        riderGroup.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.8, 2.2, -0.5);
        rightArm.rotation.z = Math.PI / 4;
        rightArm.castShadow = true;
        riderGroup.add(rightArm);
        
        this.group.add(riderGroup);
    }
    
    createPhysicsModel() {
        // Main body physics
        const bodyShape = new CANNON.Sphere(1.5);
        this.bodyPhysics = new CANNON.Body({ mass: 200 });
        this.bodyPhysics.addShape(bodyShape);
        this.bodyPhysics.position.set(0, 2, 0);
        this.bodyPhysics.material = new CANNON.Material({ friction: 0.1, restitution: 0.3 });
        this.world.add(this.bodyPhysics);
        
        // Front wheel physics
        const wheelShape = new CANNON.Sphere(0.8);
        this.frontWheelPhysics = new CANNON.Body({ mass: 20 });
        this.frontWheelPhysics.addShape(wheelShape);
        this.frontWheelPhysics.position.set(0, 0.8, -2);
        this.frontWheelPhysics.material = new CANNON.Material({ friction: 1.5, restitution: 0.1 });
        this.world.add(this.frontWheelPhysics);
        
        // Rear wheel physics
        this.rearWheelPhysics = new CANNON.Body({ mass: 25 });
        this.rearWheelPhysics.addShape(wheelShape);
        this.rearWheelPhysics.position.set(0, 0.8, 2);
        this.rearWheelPhysics.material = new CANNON.Material({ friction: 1.5, restitution: 0.1 });
        this.world.add(this.rearWheelPhysics);
    }
    
    setupConstraints() {
        // Connect body to wheels with point-to-point constraints
        const frontConstraint = new CANNON.PointToPointConstraint(
            this.bodyPhysics,
            new CANNON.Vec3(0, -1, -2),
            this.frontWheelPhysics,
            new CANNON.Vec3(0, 0, 0)
        );
        this.world.addConstraint(frontConstraint);
        this.constraints.push(frontConstraint);
        
        const rearConstraint = new CANNON.PointToPointConstraint(
            this.bodyPhysics,
            new CANNON.Vec3(0, -1, 2),
            this.rearWheelPhysics,
            new CANNON.Vec3(0, 0, 0)
        );
        this.world.addConstraint(rearConstraint);
        this.constraints.push(rearConstraint);
        
        // Add some damping to prevent excessive bouncing
        this.bodyPhysics.linearDamping = 0.1;
        this.bodyPhysics.angularDamping = 0.3;
        this.frontWheelPhysics.linearDamping = 0.2;
        this.rearWheelPhysics.linearDamping = 0.2;
    }
    
    update(deltaTime, input) {
        this.handleInput(input, deltaTime);
        this.updatePhysics(deltaTime);
        this.updateVisuals();
        this.updateAudio();
    }
    
    handleInput(input, deltaTime) {
        const force = new CANNON.Vec3();
        const torque = new CANNON.Vec3();
        
        // Acceleration
        if (input.accelerate) {
            this.isAccelerating = true;
            const forwardForce = this.enginePower * (1 - Math.min(this.speed / this.maxSpeed, 1));
            const direction = new CANNON.Vec3(0, 0, -forwardForce);
            this.bodyPhysics.quaternion.vmult(direction, direction);
            this.bodyPhysics.force.vadd(direction, this.bodyPhysics.force);
        } else {
            this.isAccelerating = false;
        }
        
        // Braking
        if (input.brake) {
            this.isBraking = true;
            const velocity = this.bodyPhysics.velocity.clone();
            velocity.scale(-this.brakeForce);
            this.bodyPhysics.force.vadd(velocity, this.bodyPhysics.force);
        } else {
            this.isBraking = false;
        }
        
        // Steering
        let targetSteerAngle = 0;
        if (input.steerLeft) {
            targetSteerAngle = -this.maxSteerAngle * Math.abs(input.steerAmount || 1);
        } else if (input.steerRight) {
            targetSteerAngle = this.maxSteerAngle * Math.abs(input.steerAmount || 1);
        }
        
        // Smooth steering
        this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, targetSteerAngle, deltaTime * 5);
        
        // Apply steering torque (simplified)
        if (this.speed > 1) {
            const steerTorque = new CANNON.Vec3(0, this.steerAngle * this.speed * 0.1, 0);
            this.bodyPhysics.torque.vadd(steerTorque, this.bodyPhysics.torque);
        }
        
        // Gyroscopic stabilization (prevent easy tipping)
        const uprightTorque = new CANNON.Vec3();
        const up = new CANNON.Vec3(0, 1, 0);
        const bodyUp = new CANNON.Vec3(0, 1, 0);
        this.bodyPhysics.quaternion.vmult(bodyUp, bodyUp);
        up.cross(bodyUp, uprightTorque);
        uprightTorque.scale(50 * Math.min(this.speed, 10));
        this.bodyPhysics.torque.vadd(uprightTorque, this.bodyPhysics.torque);
    }
    
    updatePhysics(deltaTime) {
        // Calculate current speed
        this.speed = this.bodyPhysics.velocity.length() * 3.6; // Convert to km/h
        
        // Update RPM based on speed and gear
        this.rpm = Math.min(8000, (this.speed / this.gear) * 100 + (this.isAccelerating ? 1000 : 0));
        
        // Simple automatic transmission
        if (this.speed > 30 && this.gear === 1) this.gear = 2;
        else if (this.speed > 60 && this.gear === 2) this.gear = 3;
        else if (this.speed > 90 && this.gear === 3) this.gear = 4;
        else if (this.speed < 25 && this.gear > 1) this.gear--;
        
        // Apply air resistance
        const airResistance = this.bodyPhysics.velocity.clone();
        airResistance.scale(-0.1 * this.speed * 0.01);
        this.bodyPhysics.force.vadd(airResistance, this.bodyPhysics.force);
    }
    
    updateVisuals() {
        // Update main group position and rotation
        this.group.position.copy(this.bodyPhysics.position);
        this.group.quaternion.copy(this.bodyPhysics.quaternion);
        
        // Adjust visual position (body is offset from physics center)
        this.group.position.y -= 1.5;
        
        // Rotate wheels based on movement
        if (this.frontWheel && this.rearWheel) {
            const wheelRotation = Date.now() * 0.01 * (this.speed / 50);
            this.frontWheel.rotation.x = wheelRotation;
            this.rearWheel.rotation.x = wheelRotation;
            
            // Steer front wheel
            this.frontWheel.rotation.y = this.steerAngle;
        }
        
        // Lean motorcycle into turns
        const leanAngle = this.steerAngle * 0.5;
        this.group.rotation.z = leanAngle;
    }
    
    updateAudio() {
        // Audio implementation would go here
        // For now, we'll just track the state
    }
    
    reset() {
        // Reset physics
        this.bodyPhysics.position.set(0, 2, 0);
        this.bodyPhysics.quaternion.set(0, 0, 0, 1);
        this.bodyPhysics.velocity.set(0, 0, 0);
        this.bodyPhysics.angularVelocity.set(0, 0, 0);
        this.bodyPhysics.force.set(0, 0, 0);
        this.bodyPhysics.torque.set(0, 0, 0);
        
        this.frontWheelPhysics.position.set(0, 0.8, -2);
        this.frontWheelPhysics.quaternion.set(0, 0, 0, 1);
        this.frontWheelPhysics.velocity.set(0, 0, 0);
        this.frontWheelPhysics.angularVelocity.set(0, 0, 0);
        
        this.rearWheelPhysics.position.set(0, 0.8, 2);
        this.rearWheelPhysics.quaternion.set(0, 0, 0, 1);
        this.rearWheelPhysics.velocity.set(0, 0, 0);
        this.rearWheelPhysics.angularVelocity.set(0, 0, 0);
        
        // Reset state
        this.speed = 0;
        this.rpm = 0;
        this.gear = 1;
        this.steerAngle = 0;
        this.isAccelerating = false;
        this.isBraking = false;
    }
    
    getPosition() {
        return this.bodyPhysics.position.clone();
    }
    
    getRotation() {
        return this.bodyPhysics.quaternion.clone();
    }
    
    getSpeed() {
        return this.speed;
    }
    
    getRPM() {
        return this.rpm;
    }
    
    getGear() {
        return this.gear;
    }
    
    destroy() {
        // Remove from physics world
        if (this.bodyPhysics) {
            this.world.remove(this.bodyPhysics);
        }
        if (this.frontWheelPhysics) {
            this.world.remove(this.frontWheelPhysics);
        }
        if (this.rearWheelPhysics) {
            this.world.remove(this.rearWheelPhysics);
        }
        
        // Remove constraints
        this.constraints.forEach(constraint => {
            this.world.removeConstraint(constraint);
        });
        
        // Remove from scene
        this.scene.remove(this.group);
    }
}