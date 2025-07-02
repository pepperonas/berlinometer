class BilliardPhysics {
    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 15;
        this.world.allowSleep = true;
        
        this.createMaterials();
        
        this.ballBodies = [];
        this.tableBounds = {
            width: 2.54,
            height: 1.27,
            cushionHeight: 0.05
        };
        
        this.pockets = [
            { x: -1.22, z: -0.61, radius: 0.06 },
            { x: 0, z: -0.63, radius: 0.06 },
            { x: 1.22, z: -0.61, radius: 0.06 },
            { x: -1.22, z: 0.61, radius: 0.06 },
            { x: 0, z: 0.63, radius: 0.06 },
            { x: 1.22, z: 0.61, radius: 0.06 }
        ];
        
        this.setupTable();
    }
    
    createMaterials() {
        this.ballMaterial = new CANNON.Material('ball');
        this.tableMaterial = new CANNON.Material('table');
        this.cushionMaterial = new CANNON.Material('cushion');
        
        const ballBallContact = new CANNON.ContactMaterial(
            this.ballMaterial,
            this.ballMaterial,
            {
                friction: 0.1,
                restitution: 0.95,
                contactEquationStiffness: 1e7,
                contactEquationRelaxation: 4
            }
        );
        
        const ballTableContact = new CANNON.ContactMaterial(
            this.ballMaterial,
            this.tableMaterial,
            {
                friction: 0.3,
                restitution: 0.1,
                contactEquationStiffness: 1e7,
                contactEquationRelaxation: 4
            }
        );
        
        const ballCushionContact = new CANNON.ContactMaterial(
            this.ballMaterial,
            this.cushionMaterial,
            {
                friction: 0.2,
                restitution: 0.8,
                contactEquationStiffness: 1e7,
                contactEquationRelaxation: 4
            }
        );
        
        this.world.addContactMaterial(ballBallContact);
        this.world.addContactMaterial(ballTableContact);
        this.world.addContactMaterial(ballCushionContact);
    }
    
    setupTable() {
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({
            mass: 0,
            shape: groundShape,
            position: new CANNON.Vec3(0, 0, 0),
            material: this.tableMaterial
        });
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(groundBody);
        
        const cushionThickness = 0.05;
        const cushionHeight = 0.05;
        const tableHeight = 0.05;
        
        const createCushion = (position, size) => {
            const cushionShape = new CANNON.Box(new CANNON.Vec3(size.x, size.y, size.z));
            const cushionBody = new CANNON.Body({
                mass: 0,
                shape: cushionShape,
                position: position,
                material: this.cushionMaterial
            });
            this.world.addBody(cushionBody);
            return cushionBody;
        };
        
        const halfWidth = this.tableBounds.width / 2;
        const halfHeight = this.tableBounds.height / 2;
        
        createCushion(
            new CANNON.Vec3(0, tableHeight / 2, -halfHeight - cushionThickness / 2),
            { x: halfWidth, y: cushionHeight / 2, z: cushionThickness / 2 }
        );
        
        createCushion(
            new CANNON.Vec3(0, tableHeight / 2, halfHeight + cushionThickness / 2),
            { x: halfWidth, y: cushionHeight / 2, z: cushionThickness / 2 }
        );
        
        createCushion(
            new CANNON.Vec3(-halfWidth - cushionThickness / 2, tableHeight / 2, 0),
            { x: cushionThickness / 2, y: cushionHeight / 2, z: halfHeight }
        );
        
        createCushion(
            new CANNON.Vec3(halfWidth + cushionThickness / 2, tableHeight / 2, 0),
            { x: cushionThickness / 2, y: cushionHeight / 2, z: halfHeight }
        );
    }
    
    createBall(position, radius = 0.028575) {
        const ballShape = new CANNON.Sphere(radius);
        const ballBody = new CANNON.Body({
            mass: 0.17,
            shape: ballShape,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: this.ballMaterial,
            linearDamping: 0.08,
            angularDamping: 0.08
        });
        
        this.world.addBody(ballBody);
        this.ballBodies.push(ballBody);
        
        return ballBody;
    }
    
    applyCueForce(ballBody, direction, power) {
        console.log('🎱 Applying cue force:');
        console.log('  - Ball body position:', ballBody.position);
        console.log('  - Direction type:', typeof direction);
        console.log('  - Direction:', direction);
        console.log('  - Power:', power);
        
        // Ensure we have a valid direction
        let dirX = 1, dirZ = 0;
        
        if (direction && typeof direction === 'object') {
            dirX = direction.x || 1;
            dirZ = direction.z || 0;
        }
        
        console.log('  - Using direction X:', dirX, 'Z:', dirZ);
        
        const forceMagnitude = power * 50; // Much higher force
        
        console.log('  - Ball velocity BEFORE:', ballBody.velocity.x, ballBody.velocity.y, ballBody.velocity.z);
        console.log('  - Ball sleeping:', ballBody.sleepState);
        
        // Wake up the ball
        ballBody.wakeUp();
        
        // Apply direct velocity instead of impulse
        ballBody.velocity.set(
            dirX * forceMagnitude,
            0,
            dirZ * forceMagnitude
        );
        
        console.log('  - Ball velocity AFTER:', ballBody.velocity.x, ballBody.velocity.y, ballBody.velocity.z);
        
        // Add some spin
        ballBody.angularVelocity.set(
            dirZ * power * 5,
            0,
            -dirX * power * 5
        );
        
        console.log('  - Angular velocity set to:', ballBody.angularVelocity.x, ballBody.angularVelocity.y, ballBody.angularVelocity.z);
    }
    
    checkPockets(ballBody, ballIndex) {
        const ballPos = ballBody.position;
        
        for (let i = 0; i < this.pockets.length; i++) {
            const pocket = this.pockets[i];
            const distance = Math.sqrt(
                Math.pow(ballPos.x - pocket.x, 2) + 
                Math.pow(ballPos.z - pocket.z, 2)
            );
            
            if (distance < pocket.radius) {
                return i;
            }
        }
        
        return -1;
    }
    
    update(deltaTime) {
        // Step the physics world
        this.world.step(deltaTime);
        
        // Debug: Check if any balls are moving
        let movingBalls = 0;
        for (let i = 0; i < this.ballBodies.length; i++) {
            const ballBody = this.ballBodies[i];
            
            const speed = ballBody.velocity.length();
            if (speed > 0.01) {
                movingBalls++;
            }
            
            // Reset balls that fall off the table
            if (ballBody.position.y < -0.5) {
                ballBody.velocity.set(0, 0, 0);
                ballBody.angularVelocity.set(0, 0, 0);
                ballBody.position.y = 0.1;
            }
        }
        
        // Log occasionally for debugging
        if (Math.random() < 0.01) { // 1% chance per frame
            console.log('Physics update - moving balls:', movingBalls, 'total balls:', this.ballBodies.length);
        }
    }
    
    reset() {
        for (const body of this.ballBodies) {
            this.world.removeBody(body);
        }
        this.ballBodies = [];
    }
    
    isMoving() {
        const velocityThreshold = 0.03;
        const angularThreshold = 0.1;
        
        for (const ballBody of this.ballBodies) {
            const velocity = ballBody.velocity.length();
            const angularVelocity = ballBody.angularVelocity.length();
            
            if (velocity > velocityThreshold || angularVelocity > angularThreshold) {
                return true;
            }
        }
        
        return false;
    }
}