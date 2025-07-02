class BilliardGame {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.physics = new BilliardPhysics();
        
        this.balls = [];
        this.ballMeshes = [];
        this.cueBall = null;
        this.cueStick = null;
        
        this.currentPlayer = 1;
        this.playerBallTypes = { 1: null, 2: null };
        this.pocketedBalls = { 1: [], 2: [] };
        
        this.isAiming = false;
        this.isShooting = false;
        this.aimLine = null;
        this.aimDirection = null;
        
        this.init();
    }
    
    init() {
        this.setupRenderer();
        this.setupCamera();
        this.setupLights();
        this.setupControls();
        this.createTable();
        this.createBalls();
        this.createAimLine();  // Move this after createBalls so cueBall exists
        this.createCueStick();
        this.setupEventListeners();
        
        document.getElementById('loading-screen').classList.add('hidden');
        
        // Force aim line to be visible and enable immediate aiming
        setTimeout(() => {
            console.log('Setting up aim mode');
            this.aimLine.visible = true;
            this.cueStick.visible = true;
            this.isAiming = true;  // Always in aim mode for easier control
            this.controls.enabled = false;  // Disable orbit controls
            console.log('Aim line visible:', this.aimLine.visible);
            console.log('Ready to aim! Move mouse to control direction.');
        }, 1000);
        
        this.animate();
    }
    
    setupRenderer() {
        const canvas = document.getElementById('game-canvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.scene.background = new THREE.Color(0x1a1a1a);
    }
    
    setupCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
        this.camera.position.set(0, 3, 3);
        this.camera.lookAt(0, 0, 0);
    }
    
    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -5;
        directionalLight.shadow.camera.right = 5;
        directionalLight.shadow.camera.top = 5;
        directionalLight.shadow.camera.bottom = -5;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.bias = -0.0005;
        directionalLight.shadow.normalBias = 0.02;
        this.scene.add(directionalLight);
        
        const pointLight = new THREE.PointLight(0xffffff, 0.5, 10);
        pointLight.position.set(0, 5, 0);
        this.scene.add(pointLight);
    }
    
    setupControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 8;
        this.controls.maxPolarAngle = Math.PI / 2.2;
    }
    
    createTable() {
        const tableGeometry = new THREE.BoxGeometry(2.74, 0.1, 1.47);
        const tableLoader = new THREE.TextureLoader();
        
        const feltMaterial = new THREE.MeshStandardMaterial({
            color: 0x0d7e0d,
            roughness: 0.8,
            metalness: 0.1
        });
        
        const woodMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.6,
            metalness: 0.2
        });
        
        const tableMesh = new THREE.Mesh(tableGeometry, feltMaterial);
        tableMesh.position.y = -0.05;
        tableMesh.receiveShadow = true;
        this.scene.add(tableMesh);
        
        const railThickness = 0.1;
        const railHeight = 0.1;
        const railMaterial = woodMaterial;
        
        const createRail = (width, height, depth, position) => {
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const mesh = new THREE.Mesh(geometry, railMaterial);
            mesh.position.copy(position);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
        };
        
        createRail(2.74, railHeight, railThickness, new THREE.Vector3(0, railHeight/2, 0.785));
        createRail(2.74, railHeight, railThickness, new THREE.Vector3(0, railHeight/2, -0.785));
        createRail(railThickness, railHeight, 1.67, new THREE.Vector3(1.42, railHeight/2, 0));
        createRail(railThickness, railHeight, 1.67, new THREE.Vector3(-1.42, railHeight/2, 0));
        
        const pocketPositions = [
            { x: -1.22, z: -0.61 },
            { x: 0, z: -0.63 },
            { x: 1.22, z: -0.61 },
            { x: -1.22, z: 0.61 },
            { x: 0, z: 0.63 },
            { x: 1.22, z: 0.61 }
        ];
        
        const pocketGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.1, 16);
        const pocketMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            roughness: 0.9
        });
        
        pocketPositions.forEach(pos => {
            const pocketMesh = new THREE.Mesh(pocketGeometry, pocketMaterial);
            pocketMesh.position.set(pos.x, -0.05, pos.z);
            this.scene.add(pocketMesh);
        });
    }
    
    createBalls() {
        const ballRadius = 0.028575;
        const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 16);
        const tableHeight = 0.01;
        
        const ballColors = [
            { color: 0xffffff, number: 0 },
            { color: 0xffff00, number: 1 },
            { color: 0x0000ff, number: 2 },
            { color: 0xff0000, number: 3 },
            { color: 0x800080, number: 4 },
            { color: 0xff8800, number: 5 },
            { color: 0x008800, number: 6 },
            { color: 0x8b0000, number: 7 },
            { color: 0x000000, number: 8 },
            { color: 0xffff00, number: 9, stripe: true },
            { color: 0x0000ff, number: 10, stripe: true },
            { color: 0xff0000, number: 11, stripe: true },
            { color: 0x800080, number: 12, stripe: true },
            { color: 0xff8800, number: 13, stripe: true },
            { color: 0x008800, number: 14, stripe: true },
            { color: 0x8b0000, number: 15, stripe: true }
        ];
        
        const cueBallPosition = new THREE.Vector3(-0.635, ballRadius + tableHeight, 0);
        const cueBallMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.2,
            metalness: 0.1
        });
        
        const cueBallMesh = new THREE.Mesh(ballGeometry, cueBallMaterial);
        cueBallMesh.position.copy(cueBallPosition);
        cueBallMesh.castShadow = true;
        cueBallMesh.receiveShadow = true;
        this.scene.add(cueBallMesh);
        
        const cueBallBody = this.physics.createBall(cueBallPosition);
        this.balls.push({ mesh: cueBallMesh, body: cueBallBody, number: 0 });
        this.ballMeshes.push(cueBallMesh);
        this.cueBall = { mesh: cueBallMesh, body: cueBallBody };
        
        const rackPosition = new THREE.Vector3(0.635, ballRadius + tableHeight, 0);
        const ballSpacing = ballRadius * 2.1;
        let ballIndex = 1;
        
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col <= row; col++) {
                if (ballIndex > 15) break;
                
                const x = rackPosition.x + row * ballSpacing * Math.sqrt(3) / 2;
                const z = rackPosition.z + (col - row / 2) * ballSpacing;
                const position = new THREE.Vector3(x, ballRadius + tableHeight, z);
                
                const ballData = ballColors[ballIndex];
                const material = new THREE.MeshStandardMaterial({
                    color: ballData.color,
                    roughness: 0.3,
                    metalness: 0.1
                });
                
                const ballMesh = new THREE.Mesh(ballGeometry, material);
                ballMesh.position.copy(position);
                ballMesh.castShadow = true;
                ballMesh.receiveShadow = true;
                
                if (ballData.stripe) {
                    const stripeMaterial = new THREE.MeshStandardMaterial({
                        color: 0xffffff,
                        roughness: 0.3,
                        metalness: 0.1
                    });
                    
                    const stripeGeometry = new THREE.RingGeometry(
                        ballRadius * 0.7, 
                        ballRadius * 0.9, 
                        32
                    );
                    const stripeMesh = new THREE.Mesh(stripeGeometry, stripeMaterial);
                    stripeMesh.rotation.x = Math.PI / 2;
                    ballMesh.add(stripeMesh);
                }
                
                this.scene.add(ballMesh);
                
                const ballBody = this.physics.createBall(position);
                this.balls.push({ 
                    mesh: ballMesh, 
                    body: ballBody, 
                    number: ballData.number,
                    stripe: ballData.stripe || false
                });
                this.ballMeshes.push(ballMesh);
                
                ballIndex++;
            }
        }
    }
    
    createCueStick() {
        const cueGeometry = new THREE.CylinderGeometry(0.006, 0.008, 1.5, 16);
        const cueMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.7,
            metalness: 0.1
        });
        
        this.cueStick = new THREE.Mesh(cueGeometry, cueMaterial);
        this.cueStick.castShadow = true;
        this.cueStick.visible = false;
        this.scene.add(this.cueStick);
        
        const tipGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.02, 16);
        const tipMaterial = new THREE.MeshStandardMaterial({
            color: 0x4169e1,
            roughness: 0.5,
            metalness: 0.2
        });
        
        const cueTip = new THREE.Mesh(tipGeometry, tipMaterial);
        cueTip.position.y = 0.76;
        this.cueStick.add(cueTip);
    }
    
    createAimLine() {
        const points = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(1, 0, 0)
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: 0xff0000,
            opacity: 1.0,
            transparent: false,
            linewidth: 5
        });
        this.aimLine = new THREE.Line(geometry, material);
        this.aimLine.visible = true;  // Make it visible by default for testing
        this.scene.add(this.aimLine);
        
        // Set initial position to cue ball
        const cueBallPos = this.cueBall ? this.cueBall.mesh.position : new THREE.Vector3(-0.635, 0.038575, 0);
        const defaultDirection = new THREE.Vector3(1, 0, 0);
        const linePoints = [
            cueBallPos.clone(),
            cueBallPos.clone().add(defaultDirection.multiplyScalar(0.5))
        ];
        this.aimLine.geometry.setFromPoints(linePoints);
        this.aimDirection = defaultDirection;
        
        console.log('Aim line created and positioned at:', cueBallPos);
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
        
        const powerSlider = document.getElementById('power-slider');
        const powerValue = document.getElementById('power-value');
        powerSlider.addEventListener('input', (e) => {
            powerValue.textContent = e.target.value + '%';
            
            if (this.isAiming && this.aimDirection) {
                const power = e.target.value / 100;
                const cueDistance = 0.15 + (1 - power) * 0.3;
                const cueBallPos = this.cueBall.mesh.position;
                const cuePosition = cueBallPos.clone().add(this.aimDirection.clone().multiplyScalar(-cueDistance));
                
                this.cueStick.position.copy(cuePosition);
            }
        });
        
        const shootButton = document.getElementById('shoot-button');
        shootButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Shoot button event triggered');
            this.shoot();
        });
        
        const newGameButton = document.getElementById('new-game-button');
        newGameButton.addEventListener('click', () => this.resetGame());
        
        this.renderer.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.renderer.domElement.addEventListener('mouseup', () => this.onMouseUp());
        
        // Add keyboard shortcut for shooting
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.shoot();
            }
        });
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    onMouseDown(event) {
        if (this.physics.isMoving()) return;
        
        // Check if clicking on UI elements
        if (event.target.closest('#ui-overlay')) return;
        
        console.log('Mouse down on game area - activating aim mode');
        
        this.isAiming = true;
        this.controls.enabled = false;
        this.aimLine.visible = true;
        this.cueStick.visible = true;
        
        // Immediately update aim direction based on mouse position
        this.onMouseMove(event);
        
        console.log('Aim mode active, controls disabled');
    }
    
    onMouseMove(event) {
        // Always allow mouse movement to control aim, not just when isAiming
        console.log('Mouse move - isAiming:', this.isAiming);
        
        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.038575);
        const intersection = new THREE.Vector3();
        const intersectResult = raycaster.ray.intersectPlane(plane, intersection);
        
        if (!intersectResult) {
            console.log('No plane intersection');
            return;
        }
        
        const cueBallPos = this.cueBall.mesh.position;
        const direction = new THREE.Vector3()
            .subVectors(intersection, cueBallPos)
            .normalize();
        
        // Only update if we have a valid direction
        if (direction.length() > 0) {
            const linePoints = [
                cueBallPos.clone(),
                cueBallPos.clone().add(direction.clone().multiplyScalar(0.5))
            ];
            
            this.aimLine.geometry.setFromPoints(linePoints);
            this.aimDirection = direction;
            
            // Update cue stick position
            if (this.cueStick.visible) {
                const power = document.getElementById('power-slider').value / 100;
                const cueDistance = 0.15 + (1 - power) * 0.3;
                const cuePosition = cueBallPos.clone().add(direction.clone().multiplyScalar(-cueDistance));
                
                this.cueStick.position.copy(cuePosition);
                this.cueStick.lookAt(cueBallPos);
                this.cueStick.rotateZ(Math.PI / 2);
            }
            
            console.log('Aim updated - direction:', direction);
        }
    }
    
    onMouseUp() {
        if (this.isAiming) {
            this.isAiming = false;
            this.controls.enabled = true;
            this.cueStick.visible = false;
        }
    }
    
    shoot() {
        console.log('🎯 === SCHUSS WIRD AUSGEFÜHRT ===');
        console.log('Kugeln bewegen sich:', this.physics.isMoving());
        console.log('Zielrichtung vorhanden:', !!this.aimDirection);
        
        if (this.physics.isMoving()) {
            console.log('❌ Kann nicht schießen: Kugeln bewegen sich noch');
            alert('Warte bis alle Kugeln stillstehen!');
            return;
        }
        
        // Sicherstellen, dass wir eine Zielrichtung haben
        if (!this.aimDirection) {
            console.log('⚠️ Keine Zielrichtung - setze Standard');
            this.aimDirection = new THREE.Vector3(1, 0, 0);
        }
        
        const power = document.getElementById('power-slider').value / 100;
        console.log('💪 Schießkraft:', power);
        console.log('🎯 Richtung:', this.aimDirection);
        
        // Schießen!
        this.physics.applyCueForce(this.cueBall.body, this.aimDirection, power);
        
        // Kurz verstecken, dann wieder zeigen
        this.aimLine.visible = false;
        this.cueStick.visible = false;
        
        setTimeout(() => {
            this.aimLine.visible = true;
            this.cueStick.visible = true;
        }, 1000);
        
        document.getElementById('shoot-button').disabled = true;
        console.log('✅ SCHUSS AUSGEFÜHRT!');
        
        // Alert für Bestätigung
        setTimeout(() => alert('Schuss ausgeführt!'), 100);
    }
    
    checkPocketedBalls() {
        for (let i = 0; i < this.balls.length; i++) {
            const ball = this.balls[i];
            if (!ball.pocketed) {
                const pocketIndex = this.physics.checkPockets(ball.body, i);
                if (pocketIndex !== -1) {
                    ball.pocketed = true;
                    ball.mesh.visible = false;
                    
                    if (ball.number !== 0) {
                        this.pocketedBalls[this.currentPlayer].push(ball.number);
                        this.updatePocketedBallsUI();
                        
                        if (!this.playerBallTypes[this.currentPlayer] && ball.number !== 8) {
                            this.assignBallTypes(ball.stripe);
                        }
                        
                        if (ball.number === 8) {
                            this.checkWinCondition();
                        }
                    } else {
                        this.respawnCueBall();
                    }
                }
            }
        }
    }
    
    assignBallTypes(isStripe) {
        this.playerBallTypes[this.currentPlayer] = isStripe ? 'stripes' : 'solids';
        this.playerBallTypes[this.currentPlayer === 1 ? 2 : 1] = isStripe ? 'solids' : 'stripes';
        
        document.getElementById('ball-type').classList.remove('hidden');
        document.getElementById('ball-type').textContent = 
            this.playerBallTypes[this.currentPlayer] === 'solids' ? 'Volle' : 'Halbe';
        document.getElementById('ball-type').className = this.playerBallTypes[this.currentPlayer];
    }
    
    updatePocketedBallsUI() {
        const player1Balls = document.getElementById('player1-balls');
        const player2Balls = document.getElementById('player2-balls');
        
        player1Balls.innerHTML = '<h4>Spieler 1:</h4>';
        player2Balls.innerHTML = '<h4>Spieler 2:</h4>';
        
        this.pocketedBalls[1].forEach(num => {
            const ballIcon = document.createElement('div');
            ballIcon.className = 'ball-icon';
            ballIcon.style.backgroundColor = this.getBallColor(num);
            ballIcon.textContent = num;
            player1Balls.appendChild(ballIcon);
        });
        
        this.pocketedBalls[2].forEach(num => {
            const ballIcon = document.createElement('div');
            ballIcon.className = 'ball-icon';
            ballIcon.style.backgroundColor = this.getBallColor(num);
            ballIcon.textContent = num;
            player2Balls.appendChild(ballIcon);
        });
    }
    
    getBallColor(number) {
        const colors = {
            1: '#ffff00', 2: '#0000ff', 3: '#ff0000', 4: '#800080',
            5: '#ff8800', 6: '#008800', 7: '#8b0000', 8: '#000000',
            9: '#ffff00', 10: '#0000ff', 11: '#ff0000', 12: '#800080',
            13: '#ff8800', 14: '#008800', 15: '#8b0000'
        };
        return colors[number] || '#ffffff';
    }
    
    respawnCueBall() {
        const cueBallPosition = new THREE.Vector3(-0.635, 0.028575 + 0.01, 0);
        this.cueBall.mesh.position.copy(cueBallPosition);
        this.cueBall.mesh.visible = true;
        this.cueBall.body.position.copy(cueBallPosition);
        this.cueBall.body.velocity.set(0, 0, 0);
        this.cueBall.body.angularVelocity.set(0, 0, 0);
        this.balls[0].pocketed = false;
    }
    
    checkWinCondition() {
        const playerBalls = this.pocketedBalls[this.currentPlayer];
        const ballType = this.playerBallTypes[this.currentPlayer];
        
        let allBallsPocketed = true;
        for (let i = 1; i <= 15; i++) {
            if (i === 8) continue;
            
            const ball = this.balls.find(b => b.number === i);
            if ((ballType === 'solids' && i <= 7 && !ball.pocketed) ||
                (ballType === 'stripes' && i >= 9 && !ball.pocketed)) {
                allBallsPocketed = false;
                break;
            }
        }
        
        if (allBallsPocketed) {
            this.showMessage(`Spieler ${this.currentPlayer} gewinnt!`, 'success');
        } else {
            this.showMessage(`Spieler ${this.currentPlayer === 1 ? 2 : 1} gewinnt!`, 'success');
        }
    }
    
    showMessage(text, type = 'info') {
        const messageEl = document.getElementById('message');
        messageEl.textContent = text;
        messageEl.className = type;
        messageEl.classList.remove('hidden');
        
        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, 3000);
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        document.getElementById('current-player').textContent = `Spieler ${this.currentPlayer}`;
        
        if (this.playerBallTypes[this.currentPlayer]) {
            document.getElementById('ball-type').textContent = 
                this.playerBallTypes[this.currentPlayer] === 'solids' ? 'Volle' : 'Halbe';
            document.getElementById('ball-type').className = this.playerBallTypes[this.currentPlayer];
        }
    }
    
    resetGame() {
        this.physics.reset();
        
        this.balls.forEach(ball => {
            this.scene.remove(ball.mesh);
        });
        this.balls = [];
        this.ballMeshes = [];
        
        this.currentPlayer = 1;
        this.playerBallTypes = { 1: null, 2: null };
        this.pocketedBalls = { 1: [], 2: [] };
        
        document.getElementById('current-player').textContent = 'Spieler 1';
        document.getElementById('ball-type').classList.add('hidden');
        document.getElementById('player1-balls').innerHTML = '<h4>Spieler 1:</h4>';
        document.getElementById('player2-balls').innerHTML = '<h4>Spieler 2:</h4>';
        
        this.createBalls();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.controls.update();
        
        this.physics.update(1/60);
        
        for (let i = 0; i < this.balls.length; i++) {
            const ball = this.balls[i];
            if (!ball.pocketed) {
                ball.mesh.position.copy(ball.body.position);
                ball.mesh.quaternion.copy(ball.body.quaternion);
            }
        }
        
        this.checkPocketedBalls();
        
        if (!this.physics.isMoving()) {
            document.getElementById('shoot-button').disabled = false;
            if (this.wasShooting) {
                this.wasShooting = false;
                // Uncomment to enable player switching
                // this.switchPlayer();
            }
        } else {
            this.wasShooting = true;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

window.addEventListener('load', () => {
    try {
        console.log('Starting billiard game...');
        console.log('THREE available:', typeof THREE !== 'undefined');
        console.log('CANNON available:', typeof CANNON !== 'undefined');
        
        const game = new BilliardGame();
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Error initializing game:', error);
        document.getElementById('loading-screen').innerHTML = '<p>Fehler beim Laden des Spiels: ' + error.message + '</p>';
    }
});