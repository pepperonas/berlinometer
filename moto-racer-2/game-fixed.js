// Moto Racer 2 - Clean Game Implementation
class MotoRacerGame {
    constructor() {
        console.log('🏍️ Moto Racer 2 starting...');
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.world = null;
        this.motorcycle = null;
        this.gameState = 'menu';
        this.clock = new THREE.Clock();
        
        // Input handling
        this.keys = {};
        
        this.init();
    }
    
    async init() {
        try {
            console.log('Initializing 3D scene...');
            this.initThreeJS();
            
            console.log('Initializing physics...');
            this.initPhysics();
            
            console.log('Creating test scene...');
            this.createTestScene();
            
            console.log('Setting up controls...');
            this.initControls();
            
            console.log('Starting game loop...');
            this.gameLoop();
            
            // Hide loading and show menu
            setTimeout(() => {
                document.getElementById('loadingScreen').style.display = 'none';
                document.getElementById('gameMenu').style.display = 'flex';
            }, 1000);
            
        } catch (error) {
            console.error('Game initialization failed:', error);
        }
    }
    
    initThreeJS() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 10, 20);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer
        const canvas = document.getElementById('gameCanvas');
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(50, 50, 25);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);
        
        console.log('✅ Three.js initialized');
    }
    
    initPhysics() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        
        // Ground
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.add(groundBody);
        
        console.log('✅ Physics initialized');
    }
    
    createTestScene() {
        // Ground plane
        const groundGeometry = new THREE.PlaneGeometry(500, 500);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Create a more detailed motorcycle
        this.createMotorcycle();
        
        // Create a simple race track
        this.createTrack();
        
        // Add environment objects
        this.createEnvironment();
        
        console.log('✅ Racing scene created');
        console.log('Scene children count:', this.scene.children.length);
    }
    
    createMotorcycle() {
        this.motorcycle = new THREE.Group();
        
        // Main body
        const bodyGeometry = new THREE.BoxGeometry(1.5, 0.8, 3);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        body.castShadow = true;
        this.motorcycle.add(body);
        
        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 12);
        const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        
        const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        frontWheel.position.set(0, 0.6, -1.2);
        frontWheel.rotation.z = Math.PI / 2;
        frontWheel.castShadow = true;
        this.motorcycle.add(frontWheel);
        
        const rearWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        rearWheel.position.set(0, 0.6, 1.2);
        rearWheel.rotation.z = Math.PI / 2;
        rearWheel.castShadow = true;
        this.motorcycle.add(rearWheel);
        
        // Handlebars
        const handlebarGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.1);
        const handlebarMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const handlebars = new THREE.Mesh(handlebarGeometry, handlebarMaterial);
        handlebars.position.set(0, 1.2, -1);
        handlebars.castShadow = true;
        this.motorcycle.add(handlebars);
        
        // Rider
        const riderGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 8);
        const riderMaterial = new THREE.MeshLambertMaterial({ color: 0x0066cc });
        const rider = new THREE.Mesh(riderGeometry, riderMaterial);
        rider.position.set(0, 1.5, 0.2);
        rider.castShadow = true;
        this.motorcycle.add(rider);
        
        // Helmet
        const helmetGeometry = new THREE.SphereGeometry(0.35, 8, 6);
        const helmetMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.set(0, 2.2, 0.2);
        helmet.castShadow = true;
        this.motorcycle.add(helmet);
        
        this.motorcycle.position.set(0, 0, 0);
        this.scene.add(this.motorcycle);
        
        // Store wheels for animation
        this.frontWheel = frontWheel;
        this.rearWheel = rearWheel;
    }
    
    createTrack() {
        // Simple oval track with barriers
        const trackRadius = 50;
        const trackWidth = 8;
        
        // Track surface
        const trackPoints = [];
        for (let i = 0; i <= 64; i++) {
            const angle = (i / 64) * Math.PI * 2;
            const x = Math.cos(angle) * trackRadius;
            const z = Math.sin(angle) * trackRadius;
            trackPoints.push(new THREE.Vector3(x, 0.1, z));
        }
        
        // Inner and outer barriers
        for (let i = 0; i < trackPoints.length - 1; i++) {
            const point = trackPoints[i];
            const next = trackPoints[i + 1];
            const direction = new THREE.Vector3().subVectors(next, point).normalize();
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
            
            // Inner barrier
            const innerBarrier = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 3, 2),
                new THREE.MeshLambertMaterial({ color: 0xff4444 })
            );
            const innerPos = point.clone().add(perpendicular.clone().multiplyScalar(-trackWidth/2));
            innerBarrier.position.copy(innerPos);
            innerBarrier.position.y = 1.5;
            innerBarrier.castShadow = true;
            this.scene.add(innerBarrier);
            
            // Outer barrier
            const outerBarrier = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 3, 2),
                new THREE.MeshLambertMaterial({ color: 0xff4444 })
            );
            const outerPos = point.clone().add(perpendicular.clone().multiplyScalar(trackWidth/2));
            outerBarrier.position.copy(outerPos);
            outerBarrier.position.y = 1.5;
            outerBarrier.castShadow = true;
            this.scene.add(outerBarrier);
        }
    }
    
    createEnvironment() {
        // Add some trees around the track
        for (let i = 0; i < 20; i++) {
            const tree = new THREE.Group();
            
            // Trunk
            const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 4, 8);
            const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = 2;
            trunk.castShadow = true;
            tree.add(trunk);
            
            // Foliage
            const foliageGeometry = new THREE.SphereGeometry(2, 8, 6);
            const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.y = 5;
            foliage.castShadow = true;
            tree.add(foliage);
            
            // Random position outside track
            const angle = Math.random() * Math.PI * 2;
            const distance = 80 + Math.random() * 50;
            tree.position.set(
                Math.cos(angle) * distance,
                0,
                Math.sin(angle) * distance
            );
            
            this.scene.add(tree);
        }
        
        // Add some clouds
        for (let i = 0; i < 10; i++) {
            const cloudGeometry = new THREE.SphereGeometry(5 + Math.random() * 10, 8, 6);
            const cloudMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xffffff,
                transparent: true,
                opacity: 0.8
            });
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloud.position.set(
                (Math.random() - 0.5) * 400,
                30 + Math.random() * 20,
                (Math.random() - 0.5) * 400
            );
            this.scene.add(cloud);
        }
    }
    
    initControls() {
        // Keyboard events
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
        
        // Menu buttons
        document.getElementById('startRace').addEventListener('click', () => {
            this.startRace();
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        console.log('✅ Controls initialized');
    }
    
    startRace() {
        this.gameState = 'racing';
        document.getElementById('gameMenu').style.display = 'none';
        console.log('🏁 Race started!');
    }
    
    update() {
        const deltaTime = this.clock.getDelta();
        
        // Update physics
        this.world.step(deltaTime);
        
        // Handle input for motorcycle
        if (this.gameState === 'racing' && this.motorcycle) {
            this.speed = this.speed || 0;
            this.rotation = this.rotation || 0;
            
            const maxSpeed = 50;
            const acceleration = 30;
            const deceleration = 20;
            const turnSpeed = 2;
            
            // Acceleration/Deceleration
            if (this.keys['ArrowUp'] || this.keys['KeyW']) {
                this.speed = Math.min(this.speed + acceleration * deltaTime, maxSpeed);
            } else if (this.keys['ArrowDown'] || this.keys['KeyS']) {
                this.speed = Math.max(this.speed - deceleration * deltaTime, -maxSpeed * 0.5);
            } else {
                // Natural deceleration
                if (this.speed > 0) {
                    this.speed = Math.max(this.speed - deceleration * 0.5 * deltaTime, 0);
                } else {
                    this.speed = Math.min(this.speed + deceleration * 0.5 * deltaTime, 0);
                }
            }
            
            // Steering
            if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
                this.rotation += turnSpeed * deltaTime * (this.speed / maxSpeed);
                this.motorcycle.rotation.z = Math.min(this.motorcycle.rotation.z + deltaTime * 2, 0.3);
            } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
                this.rotation -= turnSpeed * deltaTime * (this.speed / maxSpeed);
                this.motorcycle.rotation.z = Math.max(this.motorcycle.rotation.z - deltaTime * 2, -0.3);
            } else {
                // Return to upright position
                this.motorcycle.rotation.z *= 0.9;
            }
            
            // Apply movement
            this.motorcycle.position.x += Math.sin(this.rotation) * this.speed * deltaTime;
            this.motorcycle.position.z += Math.cos(this.rotation) * this.speed * deltaTime;
            this.motorcycle.rotation.y = this.rotation;
            
            // Animate wheels
            if (this.frontWheel && this.rearWheel) {
                const wheelRotation = this.speed * deltaTime * 0.5;
                this.frontWheel.rotation.x += wheelRotation;
                this.rearWheel.rotation.x += wheelRotation;
            }
            
            // Update camera to follow motorcycle
            const cameraDistance = 15;
            const cameraHeight = 8;
            const targetX = this.motorcycle.position.x - Math.sin(this.rotation) * cameraDistance;
            const targetZ = this.motorcycle.position.z - Math.cos(this.rotation) * cameraDistance;
            
            // Smooth camera movement
            this.camera.position.x += (targetX - this.camera.position.x) * deltaTime * 5;
            this.camera.position.z += (targetZ - this.camera.position.z) * deltaTime * 5;
            this.camera.position.y = cameraHeight;
            this.camera.lookAt(this.motorcycle.position);
        }
        
        // Update UI
        if (this.motorcycle && this.speed !== undefined) {
            document.getElementById('speedValue').textContent = Math.round(Math.abs(this.speed * 3.6)); // Convert to km/h
        }
    }
    
    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    gameLoop() {
        requestAnimationFrame(() => this.gameLoop());
        this.update();
        this.render();
    }
}

// Initialize when page loads
let game;
window.addEventListener('load', () => {
    console.log('🚀 Initializing Moto Racer 2...');
    game = new MotoRacerGame();
});