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
        
        // Power charging system
        this.isCharging = false;
        this.chargeStartTime = 0;
        this.chargePower = 0;
        this.chargeDirection = 1; // 1 for increasing, -1 for decreasing
        this.chargeSpeed = 80; // Power units per second
        this.maxChargePower = 100;
        
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
        
        // Debug-Modus für Kollisionsboxen
        this.debugMode = false;
        this.setupDebugMode();
        
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
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Advanced shadow settings
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;
        
        // Post-processing effects
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.8; // Brighter exposure
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
        // Professional lighting setup
        this.renderer.physicallyCorrectLights = true;
        
        // Scene background with gradient
        this.createSceneBackground();
    }
    
    setupCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        
        // Professional camera positioning for optimal table view
        this.camera.position.set(0, 4.5, 4);
        this.camera.lookAt(0, 0, 0);
        
        // Add camera smoothing
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
        this.cameraSmoothing = 0.05;
    }
    
    setupLights() {
        // Bright ambient lighting for good visibility
        const ambientLight = new THREE.AmbientLight(0x8a7868, 0.7);
        this.scene.add(ambientLight);
        
        // Main overhead pool table light (much brighter)
        const mainLight = new THREE.SpotLight(0xffffff, 3.5, 12, Math.PI / 5, 0.2, 1.5);
        mainLight.position.set(0, 6, 0);
        mainLight.target.position.set(0, 0, 0);
        mainLight.castShadow = true;
        
        // Professional shadow settings
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 1;
        mainLight.shadow.camera.far = 10;
        mainLight.shadow.bias = -0.0001;
        mainLight.shadow.normalBias = 0.01;
        
        this.scene.add(mainLight);
        this.scene.add(mainLight.target);
        
        // Bright directional lights for even illumination
        const fillLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
        fillLight1.position.set(-5, 8, -3);
        this.scene.add(fillLight1);
        
        const fillLight2 = new THREE.DirectionalLight(0xffffff, 1.2);
        fillLight2.position.set(5, 8, 3);
        this.scene.add(fillLight2);
        
        // Additional overhead lighting
        const topLight = new THREE.PointLight(0xffffff, 1.5, 20);
        topLight.position.set(0, 10, 0);
        this.scene.add(topLight);
        
        // Hemisphere light for natural fill
        const roomLight = new THREE.HemisphereLight(0xffffff, 0x8a7868, 0.8);
        this.scene.add(roomLight);
        
        // Add pool hall ceiling lamp visual
        this.createPoolLamp();
    }
    
    setupControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        
        // Professional camera controls
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.enableRotate = true;
        
        // Optimal viewing constraints
        this.controls.minDistance = 2.5;
        this.controls.maxDistance = 12;
        this.controls.maxPolarAngle = Math.PI / 2.1;
        this.controls.minPolarAngle = Math.PI / 8;
        
        // Smooth camera movement
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 0.5;
        
        // Professional target positioning
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }
    
    createTable() {
        const tableGeometry = new THREE.BoxGeometry(2.74, 0.1, 1.47);
        const textureLoader = new THREE.TextureLoader();
        
        // Authentic pool table felt (Championship Green - brighter)
        const feltMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a9a2a,
            roughness: 0.7,
            metalness: 0.0,
            normalScale: new THREE.Vector2(0.4, 0.4)
        });
        
        // Create realistic felt texture
        this.createRealisticFeltTexture(feltMaterial);
        
        // Rich mahogany wood for rails
        const woodMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a2c17,
            roughness: 0.25,
            metalness: 0.0,
            normalScale: new THREE.Vector2(0.6, 0.6)
        });
        
        // Create mahogany wood texture
        this.createMahoganyTexture(woodMaterial);
        
        const tableMesh = new THREE.Mesh(tableGeometry, feltMaterial);
        tableMesh.position.y = -0.05;
        tableMesh.receiveShadow = true;
        this.scene.add(tableMesh);
        
        const railThickness = 0.08;
        const railHeight = 0.08;
        
        // Enhanced rail material with metal inlays
        const railMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a3c28,
            roughness: 0.2,
            metalness: 0.1,
            normalScale: new THREE.Vector2(0.8, 0.8)
        });
        
        this.createMahoganyTexture(railMaterial); // Premium mahogany for rails
        
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
        
        // Store rail positions for physics correlation
        this.railPositions = [
            { pos: new THREE.Vector3(0, railHeight/2, 0.785), size: { x: 2.74, y: railHeight, z: railThickness } },
            { pos: new THREE.Vector3(0, railHeight/2, -0.785), size: { x: 2.74, y: railHeight, z: railThickness } },
            { pos: new THREE.Vector3(1.42, railHeight/2, 0), size: { x: railThickness, y: railHeight, z: 1.67 } },
            { pos: new THREE.Vector3(-1.42, railHeight/2, 0), size: { x: railThickness, y: railHeight, z: 1.67 } }
        ];
        
        const pocketPositions = [
            { x: -1.22, z: -0.61 },
            { x: 0, z: -0.63 },
            { x: 1.22, z: -0.61 },
            { x: -1.22, z: 0.61 },
            { x: 0, z: 0.63 },
            { x: 1.22, z: 0.61 }
        ];
        
        // Realistic leather pocket design
        pocketPositions.forEach((pos, index) => {
            this.createRealisticPocket(pos, index);
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
            roughness: 0.1,
            metalness: 0.0,
            envMapIntensity: 1.0,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
        });
        
        // Add subtle surface details to cue ball
        this.addBallSurfaceDetails(cueBallMaterial);
        
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
                    roughness: 0.15,
                    metalness: 0.0,
                    envMapIntensity: 0.8,
                    clearcoat: 0.9,
                    clearcoatRoughness: 0.2
                });
                
                // Add surface details to each ball
                this.addBallSurfaceDetails(material, ballData.color);
                
                const ballMesh = new THREE.Mesh(ballGeometry, material);
                ballMesh.position.copy(position);
                ballMesh.castShadow = true;
                ballMesh.receiveShadow = true;
                
                if (ballData.stripe) {
                    // Professional stripe pattern
                    this.createStripePattern(ballMesh, ballData.color, ballRadius);
                }
                
                // Add number to all balls
                this.addNumberToBall(ballMesh, ballData.number, ballRadius, ballData.stripe);
                
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
        
        // Add professional table details
        this.addTableDetails();
        
        // Add scene enhancements
        this.addSceneEnhancements();
    }
    
    createSceneBackground() {
        // Bright, friendly pool hall atmosphere
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        // Lighter, friendlier gradient
        const gradient = ctx.createRadialGradient(512, 200, 0, 512, 512, 800);
        gradient.addColorStop(0, '#6b5b47'); // Light warm brown center
        gradient.addColorStop(0.3, '#5a4a36'); // Medium warm brown
        gradient.addColorStop(0.7, '#3d3025'); // Darker brown
        gradient.addColorStop(1, '#2a1f15');   // Deep brown
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1024, 1024);
        
        // Add subtle wood grain texture to walls (lighter)
        ctx.globalAlpha = 0.15;
        for (let i = 0; i < 100; i++) {
            ctx.strokeStyle = '#8a7660';
            ctx.lineWidth = Math.random() * 2 + 1;
            ctx.beginPath();
            ctx.moveTo(Math.random() * 1024, 0);
            ctx.lineTo(Math.random() * 1024, 1024);
            ctx.stroke();
        }
        
        const bgTexture = new THREE.CanvasTexture(canvas);
        this.scene.background = bgTexture;
    }
    
    createRealisticFeltTexture(material) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        // Championship green base
        const baseColor = { r: 30, g: 126, b: 30 };
        ctx.fillStyle = `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`;
        ctx.fillRect(0, 0, 1024, 1024);
        
        // Create felt fiber texture
        for (let i = 0; i < 15000; i++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 1024;
            const brightness = Math.random() * 30 - 15;
            
            const r = Math.max(0, Math.min(255, baseColor.r + brightness));
            const g = Math.max(0, Math.min(255, baseColor.g + brightness));
            const b = Math.max(0, Math.min(255, baseColor.b + brightness));
            
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(x, y, Math.random() * 2 + 1, Math.random() * 2 + 1);
        }
        
        // Add subtle directional fiber pattern
        ctx.globalAlpha = 0.1;
        for (let i = 0; i < 200; i++) {
            ctx.strokeStyle = '#2a8a2a';
            ctx.lineWidth = 1;
            ctx.beginPath();
            const x = Math.random() * 1024;
            const y = Math.random() * 1024;
            const angle = Math.random() * Math.PI;
            const length = Math.random() * 20 + 10;
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
            ctx.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(3, 3);
        
        material.map = texture;
        
        // Create detailed normal map for felt
        this.createFeltNormalMap(material);
    }
    
    createFeltNormalMap(material) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Create subtle normal variations
        for (let x = 0; x < 256; x++) {
            for (let y = 0; y < 256; y++) {
                const nx = (Math.random() - 0.5) * 0.3 + 0.5;
                const ny = (Math.random() - 0.5) * 0.3 + 0.5;
                const nz = 0.8;
                
                ctx.fillStyle = `rgb(${Math.floor(nx * 255)}, ${Math.floor(ny * 255)}, ${Math.floor(nz * 255)})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        
        const normalTexture = new THREE.CanvasTexture(canvas);
        normalTexture.wrapS = THREE.RepeatWrapping;
        normalTexture.wrapT = THREE.RepeatWrapping;
        normalTexture.repeat.set(4, 4);
        
        material.normalMap = normalTexture;
    }
    
    createMahoganyTexture(material) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        // Rich mahogany base
        const baseColor = { r: 74, g: 44, b: 23 };
        ctx.fillStyle = `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`;
        ctx.fillRect(0, 0, 1024, 1024);
        
        // Create wood grain rings
        const centerX = 512;
        const centerY = 512;
        
        for (let ring = 0; ring < 15; ring++) {
            const radius = ring * 35 + Math.random() * 20;
            const thickness = Math.random() * 8 + 2;
            
            ctx.strokeStyle = `rgba(${baseColor.r - 10}, ${baseColor.g - 6}, ${baseColor.b - 3}, 0.3)`;
            ctx.lineWidth = thickness;
            ctx.beginPath();
            ctx.arc(centerX + Math.random() * 100 - 50, centerY + Math.random() * 100 - 50, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Add fine wood grain lines
        for (let i = 0; i < 300; i++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 1024;
            const length = Math.random() * 80 + 20;
            const angle = Math.random() * 0.3 - 0.15; // Slight variation in grain direction
            
            ctx.strokeStyle = `rgba(${baseColor.r + Math.random() * 20 - 10}, ${baseColor.g + Math.random() * 12 - 6}, ${baseColor.b + Math.random() * 8 - 4}, 0.4)`;
            ctx.lineWidth = Math.random() * 2 + 0.5;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
            ctx.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1.5, 1.5);
        
        material.map = texture;
    }
    
    // Removed - replaced with createRealisticPocket
    
    addSceneEnhancements() {
        // Light atmospheric haze for depth (much lighter)
        this.scene.fog = new THREE.Fog(0x6b5b47, 25, 100);
    }
    
    createPoolLamp() {
        // Classic pool hall lamp shade
        const lampGeometry = new THREE.ConeGeometry(0.8, 0.3, 8);
        const lampMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a4d1a,
            roughness: 0.7,
            metalness: 0.1
        });
        
        const lampShade = new THREE.Mesh(lampGeometry, lampMaterial);
        lampShade.position.set(0, 5.5, 0);
        lampShade.rotation.x = Math.PI;
        this.scene.add(lampShade);
        
        // Lamp chain
        for (let i = 0; i < 5; i++) {
            const chainGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.1, 8);
            const chainMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
            const chainLink = new THREE.Mesh(chainGeometry, chainMaterial);
            chainLink.position.set(0, 6 + i * 0.1, 0);
            this.scene.add(chainLink);
        }
    }
    
    createRealisticPocket(position, index) {
        // Main pocket hole with proper depth
        const pocketGeometry = new THREE.CylinderGeometry(0.08, 0.085, 0.15, 32);
        const pocketMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.9,
            metalness: 0.0
        });
        
        const pocketHole = new THREE.Mesh(pocketGeometry, pocketMaterial);
        pocketHole.position.set(position.x, -0.075, position.z);
        pocketHole.receiveShadow = true;
        this.scene.add(pocketHole);
        
        // Leather pocket rim
        const rimGeometry = new THREE.TorusGeometry(0.09, 0.015, 8, 16);
        const leatherMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a2317,
            roughness: 0.8,
            metalness: 0.0
        });
        
        const pocketRim = new THREE.Mesh(rimGeometry, leatherMaterial);
        pocketRim.position.set(position.x, 0.005, position.z);
        pocketRim.rotation.x = -Math.PI / 2;
        this.scene.add(pocketRim);
        
        // Pocket net bag
        const netGeometry = new THREE.SphereGeometry(0.06, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const netMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            transparent: true,
            opacity: 0.6,
            roughness: 0.9
        });
        
        const pocketNet = new THREE.Mesh(netGeometry, netMaterial);
        pocketNet.position.set(position.x, -0.05, position.z);
        pocketNet.rotation.x = Math.PI;
        this.scene.add(pocketNet);
    }
    
    addTableDetails() {
        // Table manufacturer logo/brand
        this.addTableBrand();
        
        // Professional diamond markers
        this.addDiamondMarkers();
        
        // Table legs
        this.addTableLegs();
    }
    
    addTableBrand() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#4a2c17';
        ctx.fillRect(0, 0, 256, 64);
        
        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 24px serif';
        ctx.textAlign = 'center';
        ctx.fillText('BRUNSWICK', 128, 40);
        
        const brandTexture = new THREE.CanvasTexture(canvas);
        const brandMaterial = new THREE.MeshStandardMaterial({ map: brandTexture });
        
        const brandGeometry = new THREE.PlaneGeometry(0.3, 0.08);
        const brandPlate = new THREE.Mesh(brandGeometry, brandMaterial);
        brandPlate.position.set(0, 0.01, -0.6);
        brandPlate.rotation.x = -Math.PI / 2;
        this.scene.add(brandPlate);
    }
    
    addDiamondMarkers() {
        const diamondGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.005, 4);
        const diamondMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.1,
            metalness: 0.1
        });
        
        // Side diamonds
        const sidePositions = [
            [-1.15, 0.005, -0.48], [-1.15, 0.005, -0.24], [-1.15, 0.005, 0], [-1.15, 0.005, 0.24], [-1.15, 0.005, 0.48],
            [1.15, 0.005, -0.48], [1.15, 0.005, -0.24], [1.15, 0.005, 0], [1.15, 0.005, 0.24], [1.15, 0.005, 0.48]
        ];
        
        // End diamonds
        const endPositions = [
            [-0.64, 0.005, -0.6], [-0.32, 0.005, -0.6], [0, 0.005, -0.6], [0.32, 0.005, -0.6], [0.64, 0.005, -0.6],
            [-0.64, 0.005, 0.6], [-0.32, 0.005, 0.6], [0, 0.005, 0.6], [0.32, 0.005, 0.6], [0.64, 0.005, 0.6]
        ];
        
        [...sidePositions, ...endPositions].forEach(pos => {
            const diamond = new THREE.Mesh(diamondGeometry, diamondMaterial);
            diamond.position.set(pos[0], pos[1], pos[2]);
            diamond.rotation.y = Math.PI / 4;
            this.scene.add(diamond);
        });
    }
    
    addTableLegs() {
        const legGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.8, 16);
        const legMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a2317,
            roughness: 0.4,
            metalness: 0.1
        });
        
        const legPositions = [
            [-1.2, -0.4, -0.55],
            [1.2, -0.4, -0.55],
            [-1.2, -0.4, 0.55],
            [1.2, -0.4, 0.55]
        ];
        
        legPositions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(pos[0], pos[1], pos[2]);
            leg.castShadow = true;
            leg.receiveShadow = true;
            this.scene.add(leg);
        });
    }
    
    createCueStick() {
        // Create cue stick geometry - cylinder by default is vertical (Y-axis)
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
        // Position tip at the front of the cue
        cueTip.position.y = 0.76;
        this.cueStick.add(cueTip);
    }
    
    addNumberToBall(ballMesh, number, ballRadius, isStripe = false) {
        if (number === 0) return; // No number on cue ball
        
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // High-quality circle background
        ctx.fillStyle = isStripe ? '#ffffff' : '#f8f8f8';
        ctx.beginPath();
        ctx.arc(128, 128, 80, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add subtle shadow for depth
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.arc(132, 132, 76, 0, 2 * Math.PI);
        ctx.fill();
        
        // Main number
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number.toString(), 128, 128);
        
        const numberTexture = new THREE.CanvasTexture(canvas);
        const numberMaterial = new THREE.MeshStandardMaterial({
            map: numberTexture,
            transparent: true,
            roughness: 0.2,
            metalness: 0.0,
            alphaTest: 0.1
        });
        
        const numberGeometry = new THREE.PlaneGeometry(ballRadius * 0.6, ballRadius * 0.6);
        const numberMesh = new THREE.Mesh(numberGeometry, numberMaterial);
        numberMesh.position.set(0, 0, ballRadius * 0.995);
        ballMesh.add(numberMesh);
    }
    
    createStripePattern(ballMesh, baseColor, ballRadius) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Create gradient stripe
        const gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, `#${baseColor.toString(16).padStart(6, '0')}`);
        gradient.addColorStop(0.35, `#${baseColor.toString(16).padStart(6, '0')}`);
        gradient.addColorStop(0.4, '#ffffff');
        gradient.addColorStop(0.6, '#ffffff');
        gradient.addColorStop(0.65, `#${baseColor.toString(16).padStart(6, '0')}`);
        gradient.addColorStop(1, `#${baseColor.toString(16).padStart(6, '0')}`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 256);
        
        const stripeTexture = new THREE.CanvasTexture(canvas);
        stripeTexture.wrapS = THREE.RepeatWrapping;
        stripeTexture.wrapT = THREE.ClampToEdgeWrapping;
        
        const stripeMaterial = new THREE.MeshStandardMaterial({
            map: stripeTexture,
            roughness: 0.15,
            metalness: 0.0,
            envMapIntensity: 0.8,
            clearcoat: 0.9,
            clearcoatRoughness: 0.2
        });
        
        // Create sphere slightly larger than the ball
        const stripeGeometry = new THREE.SphereGeometry(ballRadius * 1.001, 32, 16);
        const stripeMesh = new THREE.Mesh(stripeGeometry, stripeMaterial);
        ballMesh.add(stripeMesh);
    }
    
    addBallSurfaceDetails(material, color = 0xffffff) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Subtle surface variations
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, 128, 128);
        
        // Add micro-scratches and surface details
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 128;
            const y = Math.random() * 128;
            const intensity = Math.random() * 30 + 100;
            
            ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
            ctx.fillRect(x, y, 1, 1);
        }
        
        const surfaceTexture = new THREE.CanvasTexture(canvas);
        material.roughnessMap = surfaceTexture;
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
    
    showToast(message, type = 'info', duration = 3000) {
        // Remove existing toast if any
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        // Add to body
        document.body.appendChild(toast);
        
        // Show toast with animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Hide and remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
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
        shootButton.addEventListener('mousedown', (e) => {
            e.preventDefault();
            console.log('Shoot button pressed - starting charge');
            this.startCharging();
        });
        
        shootButton.addEventListener('mouseup', (e) => {
            e.preventDefault();
            console.log('Shoot button released - shooting');
            this.shoot();
        });
        
        // Prevent context menu on right click
        shootButton.addEventListener('contextmenu', (e) => e.preventDefault());
        
        const newGameButton = document.getElementById('new-game-button');
        newGameButton.addEventListener('click', () => this.resetGame());
        
        this.renderer.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.renderer.domElement.addEventListener('mouseup', () => this.onMouseUp());
        
        // Power charging system
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.startCharging();
            }
            
            // Toggle Debug Mode with 'D' key
            if (e.code === 'KeyD') {
                this.toggleDebugMode();
            }
        });
        
        document.addEventListener('keyup', (e) => {
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
                const cueDistance = 0.35 + (1 - power) * 0.3;
                
                // Position cue stick horizontally behind the cue ball, aligned with aim line
                const cuePosition = cueBallPos.clone().add(direction.clone().multiplyScalar(-cueDistance));
                cuePosition.y = cueBallPos.y + 0.05; // Slightly above table level
                
                this.cueStick.position.copy(cuePosition);
                
                // Rotate cue stick to be horizontal and aligned with the aim direction
                const angle = Math.atan2(-direction.x, -direction.z);
                this.cueStick.rotation.set(0, angle + Math.PI / 2, Math.PI / 2);
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
            this.showToast('⏳ Warte bis alle Kugeln stillstehen!', 'warning');
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
        
        // Toast für Bestätigung
        this.showToast('🎯 Schuss ausgeführt!', 'success', 2000);
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
                        this.showToast('⚪ Weiße Kugel eingelocht! Zurückgesetzt.', 'warning', 3000);
                    }
                }
            }
        }
    }
    
    assignBallTypes(isStripe) {
        this.playerBallTypes[this.currentPlayer] = isStripe ? 'stripes' : 'solids';
        this.playerBallTypes[this.currentPlayer === 1 ? 2 : 1] = isStripe ? 'solids' : 'stripes';
        
        const ballType = this.playerBallTypes[this.currentPlayer] === 'solids' ? 'Volle' : 'Halbe';
        
        document.getElementById('ball-type').classList.remove('hidden');
        document.getElementById('ball-type').textContent = ballType;
        document.getElementById('ball-type').className = this.playerBallTypes[this.currentPlayer];
        
        this.showToast(`🎯 Spieler ${this.currentPlayer}: ${ballType}`, 'info', 3000);
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
        // Use toast instead of the old message system
        this.showToast(text, type);
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
        
        // Update power charging system
        this.updatePowerCharging();
        
        // Professional camera smoothing
        this.updateCameraSmoothing();
        
        // Update debug info if active
        this.updateDebugInfo();
        
        this.renderer.render(this.scene, this.camera);
    }
    
    setupDebugMode() {
        // Create debug meshes for physics bodies
        this.debugMeshes = [];
        
        // Debug info div
        const debugDiv = document.createElement('div');
        debugDiv.id = 'debug-info';
        debugDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.7);
            color: #0f0;
            padding: 10px;
            font-family: monospace;
            font-size: 12px;
            display: none;
            max-width: 300px;
            z-index: 1000;
        `;
        document.body.appendChild(debugDiv);
    }
    
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        const debugDiv = document.getElementById('debug-info');
        
        if (this.debugMode) {
            this.showToast('🐛 Debug-Modus aktiviert (D zum Ausschalten)', 'info', 2000);
            debugDiv.style.display = 'block';
            this.createDebugVisuals();
        } else {
            this.showToast('Debug-Modus deaktiviert', 'info', 2000);
            debugDiv.style.display = 'none';
            this.removeDebugVisuals();
        }
    }
    
    createDebugVisuals() {
        // Create wireframe boxes for cushions
        const cushionGeometry = new THREE.BoxGeometry(1, 1, 1);
        const cushionMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00, 
            wireframe: true,
            opacity: 0.5,
            transparent: true
        });
        
        // Add debug visuals for physics cushions
        this.physics.world.bodies.forEach((body, index) => {
            if (body.mass === 0 && body.shapes[0] instanceof CANNON.Box) { // Static bodies (cushions)
                const mesh = new THREE.Mesh(cushionGeometry, cushionMaterial);
                const shape = body.shapes[0];
                
                mesh.scale.set(
                    shape.halfExtents.x * 2,
                    shape.halfExtents.y * 2,
                    shape.halfExtents.z * 2
                );
                mesh.position.copy(body.position);
                
                this.scene.add(mesh);
                this.debugMeshes.push(mesh);
            }
        });
        
        // Add ball collision spheres
        const ballMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, 
            wireframe: true,
            opacity: 0.3,
            transparent: true
        });
        
        this.balls.forEach(ball => {
            const sphereGeometry = new THREE.SphereGeometry(0.028575, 16, 8);
            const mesh = new THREE.Mesh(sphereGeometry, ballMaterial);
            mesh.userData.ballIndex = this.balls.indexOf(ball);
            this.scene.add(mesh);
            this.debugMeshes.push(mesh);
        });
    }
    
    removeDebugVisuals() {
        this.debugMeshes.forEach(mesh => {
            this.scene.remove(mesh);
        });
        this.debugMeshes = [];
    }
    
    updateDebugInfo() {
        if (!this.debugMode) return;
        
        const debugDiv = document.getElementById('debug-info');
        let debugText = '<b>PHYSICS DEBUG INFO</b>\n';
        debugText += `FPS: ${Math.round(1000 / 16.67)}\n`;
        debugText += `Balls: ${this.balls.length}\n`;
        debugText += `Physics bodies: ${this.physics.world.bodies.length}\n`;
        debugText += `\n<b>CUE BALL:</b>\n`;
        
        if (this.cueBall && this.cueBall.body) {
            const vel = this.cueBall.body.velocity;
            const pos = this.cueBall.body.position;
            debugText += `Pos: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})\n`;
            debugText += `Vel: ${vel.length().toFixed(3)} m/s\n`;
            debugText += `Sleep: ${this.cueBall.body.sleepState === 2 ? 'YES' : 'NO'}\n`;
        }
        
        debugText += `\n<b>TABLE BOUNDS:</b>\n`;
        debugText += `Width: ${this.physics.tableBounds.width}m\n`;
        debugText += `Height: ${this.physics.tableBounds.height}m\n`;
        
        debugText += `\n<b>CONTROLS:</b>\n`;
        debugText += `D - Toggle Debug\n`;
        debugText += `Space - Shoot\n`;
        
        debugDiv.innerHTML = debugText.replace(/\n/g, '<br>');
        
        // Update debug mesh positions
        let debugMeshIndex = this.physics.world.bodies.filter(b => b.mass === 0).length;
        this.balls.forEach((ball, i) => {
            if (this.debugMeshes[debugMeshIndex]) {
                this.debugMeshes[debugMeshIndex].position.copy(ball.body.position);
                debugMeshIndex++;
            }
        });
    }
    
    updateCameraSmoothing() {
        // Smooth camera following for dynamic shots
        if (this.isAiming && this.cueBall) {
            const targetPos = this.cueBall.mesh.position.clone();
            targetPos.y += 0.5; // Slightly above the ball
            
            this.cameraTarget.lerp(targetPos, this.cameraSmoothing);
            this.controls.target.lerp(this.cameraTarget, this.cameraSmoothing);
        }
        
        this.controls.update();
    }
    
    startCharging() {
        if (this.physics.isMoving()) {
            this.showToast('⏳ Warte bis alle Kugeln stillstehen!', 'warning');
            return;
        }
        
        if (this.isCharging) return; // Already charging
        
        console.log('🔋 Power charging started');
        this.isCharging = true;
        this.chargeStartTime = performance.now();
        this.chargePower = 0;
        this.chargeDirection = 1;
        
        // Visual feedback
        this.showToast('💪 Kraft aufladen... Taste loslassen zum Schießen!', 'info', 1000);
        
        // Update UI
        const shootButton = document.getElementById('shoot-button');
        shootButton.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
        shootButton.textContent = 'AUFLADEN...';
    }
    
    shoot() {
        if (!this.isCharging) return;
        
        console.log('🎯 === SCHUSS MIT KRAFT', this.chargePower.toFixed(1), '% ===');
        
        // Stop charging
        this.isCharging = false;
        
        // Ensure we have an aim direction
        if (!this.aimDirection) {
            console.log('⚠️ Keine Zielrichtung - setze Standard');
            this.aimDirection = new THREE.Vector3(1, 0, 0);
        }
        
        const power = this.chargePower / 100; // Convert to 0-1 range
        console.log('💪 Finale Schießkraft:', power);
        console.log('🎯 Richtung:', this.aimDirection);
        
        // Apply force
        this.physics.applyCueForce(this.cueBall.body, this.aimDirection, power);
        
        // Visual effects
        this.aimLine.visible = false;
        this.cueStick.visible = false;
        
        setTimeout(() => {
            this.aimLine.visible = true;
            this.cueStick.visible = true;
        }, 1000);
        
        // Reset UI
        const shootButton = document.getElementById('shoot-button');
        shootButton.style.background = '';
        shootButton.textContent = 'STOßEN';
        shootButton.disabled = true;
        
        // Success feedback
        const powerText = this.chargePower < 30 ? 'Sanft' : this.chargePower < 70 ? 'Mittel' : 'Kraftvoll';
        this.showToast(`🎯 ${powerText}er Schuss (${this.chargePower.toFixed(0)}%)!`, 'success', 2000);
        
        // Reset charge
        this.chargePower = 0;
        this.updatePowerDisplay();
    }
    
    updatePowerCharging() {
        if (!this.isCharging) return;
        
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.chargeStartTime) / 1000; // Convert to seconds
        
        // Update charge power with oscillation
        this.chargePower += this.chargeDirection * this.chargeSpeed * (1/60); // 60 FPS assumption
        
        // Bounce between 0 and max power
        if (this.chargePower >= this.maxChargePower) {
            this.chargePower = this.maxChargePower;
            this.chargeDirection = -1;
        } else if (this.chargePower <= 0) {
            this.chargePower = 0;
            this.chargeDirection = 1;
        }
        
        // Update visual feedback
        this.updatePowerDisplay();
        this.updateCueStickPower();
    }
    
    updatePowerDisplay() {
        const powerSlider = document.getElementById('power-slider');
        const powerValue = document.getElementById('power-value');
        
        powerSlider.value = this.chargePower;
        powerValue.textContent = this.chargePower.toFixed(0) + '%';
        
        // Color coding for power levels
        if (this.chargePower < 30) {
            powerValue.style.color = '#4CAF50'; // Green for low power
        } else if (this.chargePower < 70) {
            powerValue.style.color = '#FF9800'; // Orange for medium power
        } else {
            powerValue.style.color = '#F44336'; // Red for high power
        }
        
        // Charging animation
        if (this.isCharging) {
            powerSlider.style.background = `linear-gradient(90deg, 
                #4CAF50 0%, 
                #4CAF50 ${this.chargePower}%, 
                #2d2d2d ${this.chargePower}%, 
                #2d2d2d 100%)`;
        } else {
            powerSlider.style.background = '';
        }
    }
    
    updateCueStickPower() {
        if (!this.cueStick.visible || !this.aimDirection) return;
        
        const cueBallPos = this.cueBall.mesh.position;
        const power = this.chargePower / 100;
        
        // Move cue stick based on power (further back = more power)
        const baseCueDistance = 0.35;
        const maxCueDistance = 0.7;
        const cueDistance = baseCueDistance + (maxCueDistance - baseCueDistance) * power;
        
        // Position cue stick horizontally behind the cue ball, aligned with aim line
        const cuePosition = cueBallPos.clone().add(this.aimDirection.clone().multiplyScalar(-cueDistance));
        cuePosition.y = cueBallPos.y + 0.05; // Slightly above table level
        
        this.cueStick.position.copy(cuePosition);
        
        // Rotate cue stick to be horizontal and aligned with the aim direction
        const angle = Math.atan2(-this.aimDirection.x, -this.aimDirection.z);
        this.cueStick.rotation.set(0, angle + Math.PI / 2, Math.PI / 2);
        
        // Add slight shake effect for high power
        if (this.chargePower > 80) {
            const shakeIntensity = (this.chargePower - 80) / 20 * 0.01;
            this.cueStick.position.x += (Math.random() - 0.5) * shakeIntensity;
            this.cueStick.position.z += (Math.random() - 0.5) * shakeIntensity;
        }
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