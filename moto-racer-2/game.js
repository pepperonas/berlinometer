// Moto Racer 2 - Main Game Logic
class MotoRacerGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.world = null;
        this.motorcycle = null;
        this.track = null;
        this.gameState = 'menu';
        this.lastTime = 0;
        this.clock = new THREE.Clock();
        
        // Game settings
        this.settings = {
            shadows: true,
            cameraMode: 'follow', // 'follow', 'cockpit', 'free'
            renderDistance: 500,
            physicsSteps: 60
        };
        
        // Race data
        this.raceData = {
            currentLap: 1,
            totalLaps: 3,
            lapTime: 0,
            bestLapTime: null,
            totalTime: 0,
            checkpoints: [],
            lapTimes: []
        };
        
        // Input handling
        this.keys = {};
        this.touch = {
            steering: 0,
            accelerating: false,
            braking: false
        };
        
        this.init();
    }
    
    async init() {
        try {
            this.showLoadingProgress(10, 'Setting up 3D scene...');
            await this.initThreeJS();
            
            this.showLoadingProgress(30, 'Initializing physics...');
            await this.initPhysics();
            
            this.showLoadingProgress(50, 'Creating motorcycle...');
            await this.initMotorcycle();
            
            this.showLoadingProgress(70, 'Building race track...');
            await this.initTrack();
            
            this.showLoadingProgress(90, 'Setting up controls...');
            await this.initControls();
            
            this.showLoadingProgress(100, 'Ready to race!');
            
            setTimeout(() => {
                this.hideLoading();
                this.showMainMenu();
                this.gameLoop(); // Start the rendering loop
            }, 500);
            
        } catch (error) {
            console.error('Game initialization failed:', error);
            this.showError('Failed to initialize game. Please refresh the page.');
        }
    }
    
    async initThreeJS() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 1000);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            2000
        );
        this.camera.position.set(0, 15, 30);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer setup
        const canvas = document.getElementById('gameCanvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = this.settings.shadows;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        // Lighting setup
        this.setupLighting();
        
        // Environment
        this.setupEnvironment();
        
        // Add test objects to ensure scene is visible
        this.addTestObjects();
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Main directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 1;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
        
        // Hemisphere light for softer lighting
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 0.6);
        this.scene.add(hemisphereLight);
    }
    
    setupEnvironment() {
        // Skybox
        const skyGeometry = new THREE.SphereGeometry(1500, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB,
            side: THREE.BackSide,
            fog: false
        });
        const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(skybox);
        
        // Ground plane (temporary, will be replaced by track)
        const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x228B22,
            transparent: true,
            opacity: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }
    
    addTestObjects() {
        // Add a visible test cube to ensure the scene is working
        const testGeometry = new THREE.BoxGeometry(5, 5, 5);
        const testMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        const testCube = new THREE.Mesh(testGeometry, testMaterial);
        testCube.position.set(0, 2.5, 0);
        testCube.castShadow = true;
        this.scene.add(testCube);
        
        console.log('Test cube added to scene at:', testCube.position);
        console.log('Scene children count:', this.scene.children.length);
    }
    
    async initPhysics() {
        // Initialize Cannon.js physics world
        this.world = new CANNON.World();
        this.world.gravity.set(0, -30, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
        
        // Ground physics body
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.add(groundBody);
    }
    
    async initMotorcycle() {
        this.motorcycle = new Motorcycle(this.scene, this.world);
        await this.motorcycle.init();
        
        // Position motorcycle at start
        const startPos = new THREE.Vector3(0, 2, 0);
        this.motorcycle.bodyPhysics.position.copy(startPos);
        this.motorcycle.group.position.copy(startPos);
        this.motorcycle.group.position.y -= 1.5; // Adjust for visual offset
    }
    
    async initTrack() {
        this.track = new RaceTrack(this.scene, this.world);
        await this.track.init();
        this.raceData.checkpoints = this.track.getCheckpoints();
    }
    
    async initControls() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            this.handleKeyPress(event.code);
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
        
        // Touch controls for mobile
        this.initTouchControls();
        
        // Menu controls
        this.initMenuControls();
        
        // Window resize handling
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    initTouchControls() {
        const joystick = document.getElementById('steerJoystick');
        const joystickInner = joystick.querySelector('.joystick-inner');
        const accelerateBtn = document.getElementById('accelerateBtn');
        const brakeBtn = document.getElementById('brakeBtn');
        
        let isDragging = false;
        let startPos = { x: 0, y: 0 };
        
        // Joystick for steering
        joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDragging = true;
            const rect = joystick.getBoundingClientRect();
            startPos.x = rect.left + rect.width / 2;
            startPos.y = rect.top + rect.height / 2;
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const touch = e.touches[0];
            const rect = joystick.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const deltaX = touch.clientX - centerX;
            const deltaY = touch.clientY - centerY;
            const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), 25);
            const angle = Math.atan2(deltaY, deltaX);
            
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            joystickInner.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
            this.touch.steering = deltaX / 25; // Normalize to -1 to 1
        });
        
        document.addEventListener('touchend', () => {
            isDragging = false;
            joystickInner.style.transform = 'translate(-50%, -50%)';
            this.touch.steering = 0;
        });
        
        // Accelerate and brake buttons
        accelerateBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touch.accelerating = true;
        });
        
        accelerateBtn.addEventListener('touchend', () => {
            this.touch.accelerating = false;
        });
        
        brakeBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touch.braking = true;
        });
        
        brakeBtn.addEventListener('touchend', () => {
            this.touch.braking = false;
        });
    }
    
    initMenuControls() {
        document.getElementById('startRace').addEventListener('click', () => {
            this.startRace();
        });
        
        document.getElementById('toggleControls').addEventListener('click', () => {
            const controls = document.getElementById('controlsHelp');
            controls.style.display = controls.style.display === 'none' ? 'block' : 'none';
        });
        
        document.getElementById('restartRace').addEventListener('click', () => {
            this.restartRace();
        });
        
        document.getElementById('backToMenu').addEventListener('click', () => {
            this.showMainMenu();
        });
    }
    
    handleKeyPress(code) {
        switch(code) {
            case 'KeyC':
                this.cycleCameraMode();
                break;
            case 'KeyR':
                if (this.gameState === 'racing') {
                    this.restartRace();
                }
                break;
            case 'Escape':
                if (this.gameState === 'racing') {
                    this.showMainMenu();
                }
                break;
        }
    }
    
    cycleCameraMode() {
        const modes = ['follow', 'cockpit', 'free'];
        const currentIndex = modes.indexOf(this.settings.cameraMode);
        this.settings.cameraMode = modes[(currentIndex + 1) % modes.length];
    }
    
    startRace() {
        this.gameState = 'racing';
        this.resetRaceData();
        this.hideAllMenus();
        this.motorcycle.reset();
        this.track.resetCheckpoints();
        this.startRaceTimer();
        
        // Set initial camera position for racing
        this.camera.position.set(0, 15, 30);
        this.camera.lookAt(0, 0, 0);
    }
    
    restartRace() {
        this.startRace();
    }
    
    resetRaceData() {
        this.raceData.currentLap = 1;
        this.raceData.lapTime = 0;
        this.raceData.totalTime = 0;
        this.raceData.lapTimes = [];
        this.clock.start();
    }
    
    startRaceTimer() {
        this.clock.start();
    }
    
    update() {
        if (this.gameState !== 'racing') return;
        
        const deltaTime = this.clock.getDelta();
        
        // Update physics
        this.world.step(deltaTime);
        
        // Get input
        const input = this.getInput();
        
        // Update motorcycle
        if (this.motorcycle) {
            this.motorcycle.update(deltaTime, input);
        }
        
        // Update camera
        this.updateCamera();
        
        // Update race logic
        this.updateRace(deltaTime);
        
        // Update UI
        this.updateUI();
    }
    
    getInput() {
        return {
            accelerate: this.keys['ArrowUp'] || this.keys['KeyW'] || this.touch.accelerating,
            brake: this.keys['ArrowDown'] || this.keys['KeyS'] || this.touch.braking,
            steerLeft: this.keys['ArrowLeft'] || this.keys['KeyA'] || this.touch.steering < -0.1,
            steerRight: this.keys['ArrowRight'] || this.keys['KeyD'] || this.touch.steering > 0.1,
            steerAmount: Math.abs(this.touch.steering) > 0.1 ? this.touch.steering : 
                        (this.keys['ArrowLeft'] || this.keys['KeyA'] ? -1 : 
                         this.keys['ArrowRight'] || this.keys['KeyD'] ? 1 : 0)
        };
    }
    
    updateCamera() {
        if (!this.motorcycle) return;
        
        const motorcyclePos = this.motorcycle.getPosition();
        const motorcycleRot = this.motorcycle.getRotation();
        
        switch(this.settings.cameraMode) {
            case 'follow':
                const offset = new THREE.Vector3(0, 8, 15);
                offset.applyQuaternion(motorcycleRot);
                this.camera.position.copy(motorcyclePos).add(offset);
                this.camera.lookAt(motorcyclePos);
                break;
                
            case 'cockpit':
                const cockpitOffset = new THREE.Vector3(0, 2, 1);
                cockpitOffset.applyQuaternion(motorcycleRot);
                this.camera.position.copy(motorcyclePos).add(cockpitOffset);
                const lookTarget = motorcyclePos.clone();
                lookTarget.add(new THREE.Vector3(0, 0, -10).applyQuaternion(motorcycleRot));
                this.camera.lookAt(lookTarget);
                break;
                
            case 'free':
                // Free camera - no automatic movement
                break;
        }
    }
    
    updateRace(deltaTime) {
        this.raceData.lapTime += deltaTime;
        this.raceData.totalTime += deltaTime;
        
        // Check for lap completion
        if (this.track && this.motorcycle) {
            const lapComplete = this.track.checkLapCompletion(this.motorcycle.getPosition());
            if (lapComplete) {
                this.completeLap();
            }
        }
    }
    
    completeLap() {
        this.raceData.lapTimes.push(this.raceData.lapTime);
        
        if (!this.raceData.bestLapTime || this.raceData.lapTime < this.raceData.bestLapTime) {
            this.raceData.bestLapTime = this.raceData.lapTime;
        }
        
        this.raceData.currentLap++;
        this.raceData.lapTime = 0;
        
        if (this.raceData.currentLap > this.raceData.totalLaps) {
            this.finishRace();
        }
    }
    
    finishRace() {
        this.gameState = 'finished';
        this.showRaceResults();
    }
    
    updateUI() {
        if (!this.motorcycle) return;
        
        const speed = this.motorcycle.getSpeed();
        document.getElementById('speedValue').textContent = Math.round(speed);
        document.getElementById('currentLap').textContent = this.raceData.currentLap;
        document.getElementById('totalLaps').textContent = this.raceData.totalLaps;
        document.getElementById('lapTime').textContent = this.formatTime(this.raceData.lapTime);
        
        if (this.raceData.bestLapTime) {
            document.getElementById('bestTime').textContent = this.formatTime(this.raceData.bestLapTime);
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(2);
        return `${mins.toString().padStart(2, '0')}:${secs.padStart(5, '0')}`;
    }
    
    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        } else {
            console.warn('Rendering components missing:', {
                renderer: !!this.renderer,
                scene: !!this.scene,
                camera: !!this.camera
            });
        }
    }
    
    gameLoop() {
        requestAnimationFrame(() => this.gameLoop());
        this.update();
        this.render();
    }
    
    // UI Methods
    showLoadingProgress(percent, message) {
        document.getElementById('loadingProgress').style.width = percent + '%';
        document.getElementById('loadingStatus').textContent = message;
    }
    
    hideLoading() {
        document.getElementById('loadingScreen').style.display = 'none';
    }
    
    showMainMenu() {
        this.gameState = 'menu';
        this.hideAllMenus();
        document.getElementById('gameMenu').style.display = 'flex';
    }
    
    showRaceResults() {
        const avgSpeed = this.raceData.lapTimes.length > 0 ? 
            this.raceData.lapTimes.reduce((a, b) => a + b, 0) / this.raceData.lapTimes.length : 0;
        
        document.getElementById('finalBestLap').textContent = 
            this.raceData.bestLapTime ? this.formatTime(this.raceData.bestLapTime) : '--:--.--';
        document.getElementById('finalTotalTime').textContent = this.formatTime(this.raceData.totalTime);
        document.getElementById('finalAvgSpeed').textContent = Math.round(avgSpeed * 3.6) + ' KM/H';
        
        document.getElementById('raceResults').style.display = 'flex';
    }
    
    hideAllMenus() {
        document.getElementById('gameMenu').style.display = 'none';
        document.getElementById('raceResults').style.display = 'none';
    }
    
    showError(message) {
        alert('Error: ' + message);
    }
    
    onWindowResize() {
        if (this.camera && this.renderer) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }
}

// Initialize game when page loads
let game;
window.addEventListener('load', () => {
    try {
        console.log('Initializing Moto Racer 2...');
        console.log('THREE available:', typeof THREE !== 'undefined');
        console.log('CANNON available:', typeof CANNON !== 'undefined');
        
        game = new MotoRacerGame();
        // Don't start game loop here, let init() handle it
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Error initializing game:', error);
        document.getElementById('loadingStatus').textContent = 'Fehler beim Laden des Spiels: ' + error.message;
    }
});