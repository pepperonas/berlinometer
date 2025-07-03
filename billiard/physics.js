class BilliardPhysics {
    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        
        // Professional physics solver settings
        this.world.solver.iterations = 20;
        this.world.solver.tolerance = 0.0001;
        this.world.allowSleep = true;
        this.world.sleepSpeedLimit = 0.05;
        this.world.sleepTimeLimit = 0.5;
        
        // Advanced collision detection
        this.world.defaultContactMaterial.contactEquationStiffness = 1e9;
        this.world.defaultContactMaterial.contactEquationRelaxation = 4;
        this.world.defaultContactMaterial.frictionEquationStiffness = 1e9;
        this.world.defaultContactMaterial.frictionEquationRelaxation = 3;
        
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
        // Professional billiard material definitions
        this.ballMaterial = new CANNON.Material('ball');
        this.tableMaterial = new CANNON.Material('felt');
        this.cushionMaterial = new CANNON.Material('rubber');
        
        // Ultra-realistic ball-to-ball physics
        const ballBallContact = new CANNON.ContactMaterial(
            this.ballMaterial,
            this.ballMaterial,
            {
                friction: 0.02,                    // Minimal friction for smooth transfer
                restitution: 0.95,                 // High elasticity
                contactEquationStiffness: 5e8,     // Very stiff contact
                contactEquationRelaxation: 3,      // Quick relaxation
                frictionEquationStiffness: 2e8,    // Friction handling
                frictionEquationRelaxation: 3
            }
        );
        
        // Ball-to-felt physics (realistic table friction)
        const ballTableContact = new CANNON.ContactMaterial(
            this.ballMaterial,
            this.tableMaterial,
            {
                friction: 0.6,                     // Pool table felt friction
                restitution: 0.05,                 // Minimal bounce on felt
                contactEquationStiffness: 2e8,
                contactEquationRelaxation: 4,
                frictionEquationStiffness: 1e8,
                frictionEquationRelaxation: 4
            }
        );
        
        // Ball-to-cushion physics (rubber bumpers)
        const ballCushionContact = new CANNON.ContactMaterial(
            this.ballMaterial,
            this.cushionMaterial,
            {
                friction: 0.1,                     // Low cushion friction
                restitution: 0.88,                 // Good bounce without energy loss
                contactEquationStiffness: 3e8,     // Firm but responsive
                contactEquationRelaxation: 3,
                frictionEquationStiffness: 1.5e8,
                frictionEquationRelaxation: 3
            }
        );
        
        this.world.addContactMaterial(ballBallContact);
        this.world.addContactMaterial(ballTableContact);
        this.world.addContactMaterial(ballCushionContact);
        
        // Add collision event listeners for sound effects
        this.setupCollisionEvents();
        
        console.log('🎱 Professional billiard physics initialized:');
        console.log('  ⚪ Ball-Ball: friction=0.02, restitution=0.95');
        console.log('  🟢 Ball-Felt: friction=0.6, restitution=0.05');
        console.log('  🔴 Ball-Cushion: friction=0.1, restitution=0.88');
    }
    
    setupCollisionEvents() {
        // Add collision sound effects and visual feedback
        this.world.addEventListener('postStep', () => {
            // Check for recent collisions
            for (let contact of this.world.contacts) {
                if (contact.bi && contact.bj) {
                    const bodyA = contact.bi;
                    const bodyB = contact.bj;
                    
                    // Calculate collision intensity
                    const relativeVelocity = bodyA.velocity.distanceTo(bodyB.velocity);
                    
                    if (relativeVelocity > 0.5) {
                        // Trigger collision effect
                        this.onCollision(bodyA, bodyB, relativeVelocity);
                    }
                }
            }
        });
    }
    
    onCollision(bodyA, bodyB, intensity) {
        // Professional collision handling
        const collisionType = this.getCollisionType(bodyA, bodyB);
        
        // Log significant collisions for debugging
        if (intensity > 1.0) {
            console.log(`🎯 ${collisionType} collision - intensity: ${intensity.toFixed(2)}`);
        }
        
        // Could add sound effects here in the future
        // this.playCollisionSound(collisionType, intensity);
    }
    
    getCollisionType(bodyA, bodyB) {
        const isBallA = bodyA.material && bodyA.material.name === 'ball';
        const isBallB = bodyB.material && bodyB.material.name === 'ball';
        
        if (isBallA && isBallB) return 'ball-ball';
        if ((isBallA || isBallB) && (bodyA.material?.name === 'rubber' || bodyB.material?.name === 'rubber')) return 'ball-cushion';
        if ((isBallA || isBallB) && (bodyA.material?.name === 'felt' || bodyB.material?.name === 'felt')) return 'ball-table';
        
        return 'unknown';
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
        
        const cushionThickness = 0.1;  // Dickere Banden
        const cushionHeight = 0.12;     // Höhere Banden
        const tableHeight = 0.05;
        
        console.log('Setting up table with cushion dimensions:');
        console.log('- Thickness:', cushionThickness);
        console.log('- Height:', cushionHeight);
        
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
        
        console.log('Table bounds:');
        console.log('- Width:', this.tableBounds.width, 'm');
        console.log('- Height:', this.tableBounds.height, 'm');
        console.log('- Half width:', halfWidth, 'm');
        console.log('- Half height:', halfHeight, 'm');
        
        // Top cushion
        createCushion(
            new CANNON.Vec3(0, cushionHeight / 2, -halfHeight - cushionThickness / 2),
            { x: halfWidth, y: cushionHeight / 2, z: cushionThickness / 2 }
        );
        
        // Bottom cushion
        createCushion(
            new CANNON.Vec3(0, cushionHeight / 2, halfHeight + cushionThickness / 2),
            { x: halfWidth, y: cushionHeight / 2, z: cushionThickness / 2 }
        );
        
        // Left cushion
        createCushion(
            new CANNON.Vec3(-halfWidth - cushionThickness / 2, cushionHeight / 2, 0),
            { x: cushionThickness / 2, y: cushionHeight / 2, z: halfHeight }
        );
        
        // Right cushion
        createCushion(
            new CANNON.Vec3(halfWidth + cushionThickness / 2, cushionHeight / 2, 0),
            { x: cushionThickness / 2, y: cushionHeight / 2, z: halfHeight }
        );
        
        // Debug: Show cushion positions
        console.log('\nCushion positions:');
        console.log('- Top cushion Z:', -halfHeight - cushionThickness / 2);
        console.log('- Bottom cushion Z:', halfHeight + cushionThickness / 2);
        console.log('- Left cushion X:', -halfWidth - cushionThickness / 2);
        console.log('- Right cushion X:', halfWidth + cushionThickness / 2);
        
        // Add invisible walls as backup
        const wallHeight = 1.0;
        const wallThickness = 0.1;
        const wallDistance = halfWidth + 0.5;
        
        // Invisible boundary walls
        createCushion(
            new CANNON.Vec3(0, wallHeight / 2, -(halfHeight + wallDistance)),
            { x: halfWidth + wallDistance, y: wallHeight / 2, z: wallThickness / 2 }
        );
        
        createCushion(
            new CANNON.Vec3(0, wallHeight / 2, halfHeight + wallDistance),
            { x: halfWidth + wallDistance, y: wallHeight / 2, z: wallThickness / 2 }
        );
        
        createCushion(
            new CANNON.Vec3(-(halfWidth + wallDistance), wallHeight / 2, 0),
            { x: wallThickness / 2, y: wallHeight / 2, z: halfHeight + wallDistance }
        );
        
        createCushion(
            new CANNON.Vec3(halfWidth + wallDistance, wallHeight / 2, 0),
            { x: wallThickness / 2, y: wallHeight / 2, z: halfHeight + wallDistance }
        );
    }
    
    createBall(position, radius = 0.028575) {
        const ballShape = new CANNON.Sphere(radius);
        const ballBody = new CANNON.Body({
            mass: 0.17,  // Official pool ball mass in kg
            shape: ballShape,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: this.ballMaterial,
            linearDamping: 0.15,    // Realistic felt damping
            angularDamping: 0.18    // Slightly higher rotational damping
        });
        
        // Professional sleep parameters
        ballBody.sleepSpeedLimit = 0.08;    // Balls stop when very slow
        ballBody.sleepTimeLimit = 0.3;      // Quick sleep transition
        
        // Set moment of inertia for realistic ball physics
        ballBody.updateMassProperties();
        
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
        
        const forceMagnitude = Math.max(power * 20, 2); // Ensure minimum force of 2
        
        console.log('  - Ball velocity BEFORE:', ballBody.velocity.x, ballBody.velocity.y, ballBody.velocity.z);
        console.log('  - Ball sleeping:', ballBody.sleepState);
        
        // Professional cue force application
        ballBody.wakeUp();
        ballBody.sleepState = 0; // Force awake state
        
        // Ensure minimum force for movement
        const minForce = 1.0;
        const finalForce = Math.max(forceMagnitude, minForce);
        
        console.log('  - Original force:', forceMagnitude, 'Final force:', finalForce);
        
        // Direct velocity application for guaranteed movement
        ballBody.velocity.set(
            dirX * finalForce,
            0,
            dirZ * finalForce
        );
        
        console.log('  - Ball velocity AFTER direct set:', ballBody.velocity.x, ballBody.velocity.y, ballBody.velocity.z);
        
        // Realistic cue-induced spin
        const spinFactor = power * 4;
        ballBody.angularVelocity.set(
            dirZ * spinFactor,     // Side spin from angle
            0,                     // No y-axis spin
            -dirX * spinFactor     // Forward/back spin
        );
        
        // Force update mass properties to ensure physics consistency
        ballBody.updateMassProperties();
        
        console.log('  - Angular velocity applied:', ballBody.angularVelocity.x, ballBody.angularVelocity.y, ballBody.angularVelocity.z);
        console.log('  - Ball sleep state:', ballBody.sleepState);
    }
    
    checkPockets(ballBody, ballIndex) {
        const ballPos = ballBody.position;
        
        // Only check if ball is at table level or below
        if (ballPos.y > 0.1) return -1;
        
        for (let i = 0; i < this.pockets.length; i++) {
            const pocket = this.pockets[i];
            const distance = Math.sqrt(
                Math.pow(ballPos.x - pocket.x, 2) + 
                Math.pow(ballPos.z - pocket.z, 2)
            );
            
            // More accurate pocket detection
            const pocketRadius = pocket.radius * 0.9; // Slightly smaller for realism
            
            if (distance < pocketRadius && ballPos.y < 0.05) {
                console.log(`🕳️ Ball ${ballIndex} pocketed at distance ${distance.toFixed(3)} from pocket ${i}`);
                return i;
            }
        }
        
        return -1;
    }
    
    update(deltaTime) {
        // Professional physics stepping with fixed timestep
        const fixedTimeStep = 1/120; // 120 Hz for professional accuracy
        const maxSubSteps = 3;
        
        this.world.step(fixedTimeStep, deltaTime, maxSubSteps);
        
        // Check table boundaries and reset balls
        for (let i = 0; i < this.ballBodies.length; i++) {
            const ballBody = this.ballBodies[i];
            const pos = ballBody.position;
            
            // Check if ball is off the table
            const tableWidth = this.tableBounds.width;
            const tableHeight = this.tableBounds.height;
            const margin = 0.15;  // Slightly larger margin
            
            let needsReset = false;
            let resetPosition = { x: -0.635, y: 0.039, z: 0 }; // Default cue ball position
            
            // Check Y (fell through table)
            if (pos.y < -0.2) {
                needsReset = true;
                console.log('Ball fell through table at index:', i);
            }
            
            // Check X boundaries
            if (pos.x < -(tableWidth/2 + margin) || pos.x > (tableWidth/2 + margin)) {
                needsReset = true;
                console.log('Ball left table X boundary at index:', i);
            }
            
            // Check Z boundaries
            if (pos.z < -(tableHeight/2 + margin) || pos.z > (tableHeight/2 + margin)) {
                needsReset = true;
                console.log('Ball left table Z boundary at index:', i);
            }
            
            if (needsReset) {
                // Professional ball reset handling
                if (i === 0) {
                    // Cue ball - reset to starting position
                    ballBody.position.set(resetPosition.x, resetPosition.y, resetPosition.z);
                    ballBody.velocity.set(0, 0, 0);
                    ballBody.angularVelocity.set(0, 0, 0);
                    ballBody.wakeUp();
                    console.log('⚪ Cue ball professionally reset');
                } else {
                    // Other balls - handle as pocketed
                    ballBody.position.set(0, -5, 0); // Remove from play area
                    ballBody.velocity.set(0, 0, 0);
                    ballBody.angularVelocity.set(0, 0, 0);
                    ballBody.sleep(); // Put to sleep
                    console.log(`🎱 Ball ${i} professionally pocketed`);
                }
            }
        }
    }
    
    reset() {
        for (const body of this.ballBodies) {
            this.world.removeBody(body);
        }
        this.ballBodies = [];
    }
    
    isMoving() {
        const velocityThreshold = 0.08;   // Professional threshold
        const angularThreshold = 0.15;    // Professional threshold
        
        let movingBalls = 0;
        
        for (const ballBody of this.ballBodies) {
            const velocity = ballBody.velocity.length();
            const angularVelocity = ballBody.angularVelocity.length();
            
            // Professional ball stopping - gradual velocity reduction
            if (velocity < 0.05 && velocity > 0.01) {
                ballBody.velocity.scale(0.95, ballBody.velocity);
            } else if (velocity <= 0.01) {
                ballBody.velocity.set(0, 0, 0);
            }
            
            if (angularVelocity < 0.1 && angularVelocity > 0.02) {
                ballBody.angularVelocity.scale(0.9, ballBody.angularVelocity);
            } else if (angularVelocity <= 0.02) {
                ballBody.angularVelocity.set(0, 0, 0);
            }
            
            if (velocity > velocityThreshold || angularVelocity > angularThreshold) {
                movingBalls++;
            }
        }
        
        return movingBalls > 0;
    }
}