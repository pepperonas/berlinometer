// Moto Racer 2 - Premium 3D Racing Experience
class PremiumMotoRacer {
    constructor() {
        console.log('🏍️ Initializing Premium Moto Racer 2...');
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.world = null;
        this.motorcycle = null;
        this.gameState = 'menu';
        this.clock = new THREE.Clock();
        this.cameraMode = 'chase'; // chase, cockpit, cinematic, overhead
        this.cameraTransition = 0;
        
        // Advanced rendering settings
        this.settings = {
            shadows: true,
            reflections: true,
            particles: true,
            bloom: true,
            ssao: true
        };
        
        // Input handling
        this.keys = {};
        this.speed = 0;
        this.rotation = 0;
        
        this.init();
    }
    
    async init() {
        try {
            console.log('Setting up premium 3D renderer...');
            this.initAdvancedRenderer();
            
            console.log('Creating photorealistic motorcycle...');
            this.createPhotorealisticMotorcycle();
            
            console.log('Building cinematic race track...');
            this.createCinematicTrack();
            
            console.log('Adding atmospheric effects...');
            this.createAtmosphericEffects();
            
            console.log('Setting up advanced controls...');
            this.initControls();
            
            console.log('Starting premium game loop...');
            this.gameLoop();
            
            setTimeout(() => {
                document.getElementById('loadingScreen').style.display = 'none';
                document.getElementById('gameMenu').style.display = 'flex';
            }, 1000);
            
        } catch (error) {
            console.error('Premium game initialization failed:', error);
        }
    }
    
    initAdvancedRenderer() {
        // Scene with fog and advanced lighting
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 300);
        
        // Advanced camera with cinematic settings
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 8, 15);
        this.camera.lookAt(0, 0, 0);
        
        // Premium renderer with advanced features
        const canvas = document.getElementById('gameCanvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Advanced shadow mapping
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;
        
        // Tone mapping for HDR-like appearance
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        
        // Physics world
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        
        // Ground physics
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.add(groundBody);
        
        // Professional lighting setup
        this.setupProfessionalLighting();
    }
    
    setupProfessionalLighting() {
        // Ambient light for base illumination
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        
        // Main directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
        sunLight.position.set(100, 80, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.camera.near = 1;
        sunLight.shadow.camera.far = 200;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        sunLight.shadow.bias = -0.0001;
        this.scene.add(sunLight);
        
        // Secondary fill light
        const fillLight = new THREE.DirectionalLight(0x87CEEB, 0.4);
        fillLight.position.set(-50, 40, -30);
        fillLight.castShadow = true;
        fillLight.shadow.mapSize.width = 2048;
        fillLight.shadow.mapSize.height = 2048;
        this.scene.add(fillLight);
        
        // Hemisphere light for realistic sky lighting
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B7355, 0.6);
        this.scene.add(hemisphereLight);
        
        // Point lights for track lighting
        this.createTrackLighting();
    }
    
    createTrackLighting() {
        const lightPositions = [
            { x: -30, z: -30 }, { x: 30, z: -30 },
            { x: -30, z: 30 }, { x: 30, z: 30 },
            { x: 0, z: -45 }, { x: 0, z: 45 },
            { x: -45, z: 0 }, { x: 45, z: 0 }
        ];
        
        lightPositions.forEach(pos => {
            const pointLight = new THREE.PointLight(0xffffff, 0.5, 50);
            pointLight.position.set(pos.x, 12, pos.z);
            pointLight.castShadow = true;
            pointLight.shadow.mapSize.width = 1024;
            pointLight.shadow.mapSize.height = 1024;
            this.scene.add(pointLight);
            
            // Light pole
            const poleGeometry = new THREE.CylinderGeometry(0.1, 0.15, 12, 8);
            const poleMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x444444,
                metalness: 0.8,
                roughness: 0.2
            });
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(pos.x, 6, pos.z);
            pole.castShadow = true;
            pole.receiveShadow = true;
            this.scene.add(pole);
        });
    }
    
    createPhotorealisticMotorcycle() {
        this.motorcycle = new THREE.Group();
        
        // Premium materials
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x0066cc,
            metalness: 0.9,
            roughness: 0.1,
            envMapIntensity: 1.5
        });
        
        const chromeMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 1.0,
            roughness: 0.05,
            envMapIntensity: 2.0
        });
        
        const seatMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.1,
            roughness: 0.8
        });
        
        // Realistic motorcycle frame (no more box!)
        this.createRealisticFrame(bodyMaterial, chromeMaterial);
        
        // Realistic fuel tank
        this.createFuelTank(bodyMaterial);
        
        // Detailed engine
        this.createDetailedEngine();
        
        // Realistic wheels
        this.createRealisticWheels();
        
        // Handlebars and controls
        this.createDetailedHandlebars(chromeMaterial);
        
        // Seat
        this.createMotorcycleSeat(seatMaterial);
        
        // Exhaust system
        this.createRealisticExhaust(chromeMaterial);
        
        // Detailed rider
        this.createDetailedRider();
        
        // Fixed LED headlights
        this.createLEDHeadlights();
        
        // Fairings and body panels
        this.createFairings(bodyMaterial);
        
        // Position motorcycle
        this.motorcycle.position.set(0, 0, 0);
        this.scene.add(this.motorcycle);
    }
    
    createRealisticWheels() {
        const rimMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 1.0,
            roughness: 0.1,
            envMapIntensity: 2.0
        });
        
        const tireMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.0,
            roughness: 0.9
        });
        
        // Front wheel - steerable
        const frontWheelGroup = new THREE.Group();
        
        // Front tire with proper orientation
        const frontTireGeometry = new THREE.TorusGeometry(0.6, 0.12, 12, 24);
        const frontTire = new THREE.Mesh(frontTireGeometry, tireMaterial);
        frontTire.rotation.y = Math.PI / 2; // Rotate 90 degrees around Y-axis
        frontTire.castShadow = true;
        frontWheelGroup.add(frontTire);
        
        // Front rim
        const frontRimGeometry = new THREE.CylinderGeometry(0.48, 0.48, 0.15, 20);
        const frontRim = new THREE.Mesh(frontRimGeometry, rimMaterial);
        frontRim.rotation.z = Math.PI / 2; // Cylinder oriented for wheel
        frontRim.castShadow = true;
        frontWheelGroup.add(frontRim);
        
        // Front brake disc
        const frontDiscGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.01, 20);
        const discMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 });
        const frontDisc = new THREE.Mesh(frontDiscGeometry, discMaterial);
        frontDisc.position.x = 0.08;
        frontDisc.rotation.z = Math.PI / 2; // Oriented with wheel
        frontWheelGroup.add(frontDisc);
        
        frontWheelGroup.position.set(0, 0.6, -1.5);
        this.motorcycle.add(frontWheelGroup);
        this.frontWheel = frontWheelGroup; // This is the front wheel (steerable)
        this.frontWheelRim = frontRim; // For rotation animation
        
        // Rear wheel - fixed orientation, no steering
        const rearWheelGroup = new THREE.Group();
        
        // Rear tire (larger)
        const rearTireGeometry = new THREE.TorusGeometry(0.65, 0.15, 12, 24);
        const rearTire = new THREE.Mesh(rearTireGeometry, tireMaterial);
        rearTire.rotation.y = Math.PI / 2; // Rotate 90 degrees around Y-axis
        rearTire.castShadow = true;
        rearWheelGroup.add(rearTire);
        
        // Rear rim
        const rearRimGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.18, 20);
        const rearRim = new THREE.Mesh(rearRimGeometry, rimMaterial);
        rearRim.rotation.z = Math.PI / 2; // Cylinder oriented for wheel
        rearRim.castShadow = true;
        rearWheelGroup.add(rearRim);
        
        // Rear brake disc
        const rearDisc = new THREE.Mesh(frontDiscGeometry, discMaterial);
        rearDisc.position.x = -0.1;
        rearDisc.rotation.z = Math.PI / 2; // Oriented with wheel
        rearWheelGroup.add(rearDisc);
        
        // Chain sprocket
        const sprocketGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.03, 16);
        const sprocket = new THREE.Mesh(sprocketGeometry, rimMaterial);
        sprocket.position.x = -0.12;
        sprocket.rotation.z = Math.PI / 2; // Oriented with wheel
        rearWheelGroup.add(sprocket);
        
        rearWheelGroup.position.set(0, 0.6, 1.6);
        this.motorcycle.add(rearWheelGroup);
        this.rearWheel = rearWheelGroup; // This is the rear wheel (non-steerable)
        this.rearWheelRim = rearRim; // For rotation animation
    }
    
    createHandlebars(chromeMaterial) {
        // Main handlebar
        const handlebarGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8);
        const handlebar = new THREE.Mesh(handlebarGeometry, chromeMaterial);
        handlebar.position.set(0, 1.3, -1.5);
        handlebar.rotation.z = Math.PI / 2;
        handlebar.castShadow = true;
        this.motorcycle.add(handlebar);
        
        // Handlebar grips
        const gripGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 8);
        const gripMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        
        const leftGrip = new THREE.Mesh(gripGeometry, gripMaterial);
        leftGrip.position.set(-0.75, 1.3, -1.5);
        leftGrip.rotation.z = Math.PI / 2;
        this.motorcycle.add(leftGrip);
        
        const rightGrip = new THREE.Mesh(gripGeometry, gripMaterial);
        rightGrip.position.set(0.75, 1.3, -1.5);
        rightGrip.rotation.z = Math.PI / 2;
        this.motorcycle.add(rightGrip);
        
        // Brake/clutch levers
        const leverGeometry = new THREE.BoxGeometry(0.15, 0.02, 0.02);
        const leftLever = new THREE.Mesh(leverGeometry, chromeMaterial);
        leftLever.position.set(-0.6, 1.35, -1.45);
        this.motorcycle.add(leftLever);
        
        const rightLever = new THREE.Mesh(leverGeometry, chromeMaterial);
        rightLever.position.set(0.6, 1.35, -1.45);
        this.motorcycle.add(rightLever);
    }
    
    createExhaustSystem(chromeMaterial) {
        // Main exhaust pipe
        const exhaustGeometry = new THREE.CylinderGeometry(0.08, 0.10, 2.5, 12);
        const exhaust = new THREE.Mesh(exhaustGeometry, chromeMaterial);
        exhaust.position.set(0.6, 0.3, 1.2);
        exhaust.rotation.z = Math.PI / 2;
        exhaust.rotation.x = -0.1;
        exhaust.castShadow = true;
        this.motorcycle.add(exhaust);
        
        // Exhaust tip
        const tipGeometry = new THREE.CylinderGeometry(0.12, 0.08, 0.3, 12);
        const tip = new THREE.Mesh(tipGeometry, chromeMaterial);
        tip.position.set(1.2, 0.25, 1.4);
        tip.rotation.z = Math.PI / 2;
        tip.castShadow = true;
        this.motorcycle.add(tip);
    }
    
    createDetailedRider() {
        const riderGroup = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.8, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1e40af,
            roughness: 0.7,
            metalness: 0.1
        });
        const riderBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        riderBody.position.set(0, 1.8, 0.3);
        riderBody.castShadow = true;
        riderGroup.add(riderBody);
        
        // Head with helmet
        const helmetGeometry = new THREE.SphereGeometry(0.35, 16, 12);
        const helmetMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            metalness: 0.9,
            roughness: 0.1
        });
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.set(0, 2.6, 0.3);
        helmet.castShadow = true;
        riderGroup.add(helmet);
        
        // Helmet visor
        const visorGeometry = new THREE.SphereGeometry(0.36, 16, 8);
        visorGeometry.scale(1, 0.7, 1);
        const visorMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x444444,
            metalness: 0.1,
            roughness: 0.0,
            transmission: 0.8,
            transparent: true,
            opacity: 0.7
        });
        const visor = new THREE.Mesh(visorGeometry, visorMaterial);
        visor.position.set(0, 2.65, 0.15);
        riderGroup.add(visor);
        
        // Arms
        const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6);
        
        const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
        leftArm.position.set(-0.4, 1.9, -0.3);
        leftArm.rotation.z = -0.5;
        leftArm.rotation.x = 0.3;
        leftArm.castShadow = true;
        riderGroup.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
        rightArm.position.set(0.4, 1.9, -0.3);
        rightArm.rotation.z = 0.5;
        rightArm.rotation.x = 0.3;
        rightArm.castShadow = true;
        riderGroup.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 6);
        
        const leftLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        leftLeg.position.set(-0.2, 1.2, 0.8);
        leftLeg.rotation.x = 0.5;
        leftLeg.castShadow = true;
        riderGroup.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, bodyMaterial);
        rightLeg.position.set(0.2, 1.2, 0.8);
        rightLeg.rotation.x = 0.5;
        rightLeg.castShadow = true;
        riderGroup.add(rightLeg);
        
        this.motorcycle.add(riderGroup);
    }
    
    createLEDHeadlights() {
        // Main headlight housing
        const housingGeometry = new THREE.SphereGeometry(0.2, 16, 12);
        const housingMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.9,
            roughness: 0.1
        });
        const housing = new THREE.Mesh(housingGeometry, housingMaterial);
        housing.position.set(0, 1.1, -1.8);
        housing.castShadow = true;
        this.motorcycle.add(housing);
        
        // LED lens
        const lensGeometry = new THREE.SphereGeometry(0.15, 16, 12);
        const lensMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0.0,
            roughness: 0.0,
            transmission: 0.95,
            transparent: true,
            opacity: 0.9,
            emissive: 0x222244
        });
        const lens = new THREE.Mesh(lensGeometry, lensMaterial);
        lens.position.set(0, 1.1, -1.75);
        this.motorcycle.add(lens);
        
        // Headlight beam - FIXED to point forward
        const headlight = new THREE.SpotLight(0xffffff, 3, 150, Math.PI / 8, 0.3);
        headlight.position.set(0, 1.1, -1.8);
        // Create a group to properly orient the light
        const headlightGroup = new THREE.Group();
        headlightGroup.add(headlight);
        headlightGroup.add(headlight.target);
        // Target positioned FAR FORWARD in world coordinates
        headlight.target.position.set(0, 0, -20); // Relative to headlight
        // Rotate the entire group to point forward
        headlightGroup.rotation.y = Math.PI;
        headlight.castShadow = true;
        headlight.shadow.mapSize.width = 2048;
        headlight.shadow.mapSize.height = 2048;
        this.motorcycle.add(headlightGroup);
        
        // Store reference for updates
        this.headlight = headlight;
    }
    
    createRealisticFrame(bodyMaterial, chromeMaterial) {
        // Main frame tubes
        const tubeGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8);
        
        // Main backbone
        const backbone = new THREE.Mesh(tubeGeometry, chromeMaterial);
        backbone.position.set(0, 0.8, 0);
        backbone.rotation.z = -0.2;
        backbone.castShadow = true;
        this.motorcycle.add(backbone);
        
        // Down tube
        const downTube = new THREE.Mesh(tubeGeometry, chromeMaterial);
        downTube.position.set(0, 0.4, -0.6);
        downTube.rotation.z = -0.8;
        downTube.castShadow = true;
        this.motorcycle.add(downTube);
        
        // Seat post
        const seatPost = new THREE.Mesh(tubeGeometry, chromeMaterial);
        seatPost.position.set(0, 0.9, 0.8);
        seatPost.rotation.z = 0.3;
        seatPost.castShadow = true;
        this.motorcycle.add(seatPost);
    }
    
    createFuelTank(bodyMaterial) {
        // Realistic teardrop tank shape
        const tankGeometry = new THREE.SphereGeometry(0.6, 16, 12);
        tankGeometry.scale(1.3, 0.8, 1.8);
        const tank = new THREE.Mesh(tankGeometry, bodyMaterial);
        tank.position.set(0, 1.0, -0.2);
        tank.castShadow = true;
        this.motorcycle.add(tank);
        
        // Fuel cap
        const capGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16);
        const capMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 });
        const fuelCap = new THREE.Mesh(capGeometry, capMaterial);
        fuelCap.position.set(0, 1.4, -0.2);
        fuelCap.castShadow = true;
        this.motorcycle.add(fuelCap);
    }
    
    createDetailedEngine() {
        const engineMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.3
        });
        
        // Main engine block
        const engineGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.8);
        const engine = new THREE.Mesh(engineGeometry, engineMaterial);
        engine.position.set(0, 0.3, 0.2);
        engine.castShadow = true;
        this.motorcycle.add(engine);
        
        // Cylinder head
        const headGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.6);
        const head = new THREE.Mesh(headGeometry, engineMaterial);
        head.position.set(0, 0.7, 0.2);
        head.castShadow = true;
        this.motorcycle.add(head);
        
        // Cooling fins
        for (let i = 0; i < 5; i++) {
            const finGeometry = new THREE.BoxGeometry(0.65, 0.02, 0.65);
            const fin = new THREE.Mesh(finGeometry, engineMaterial);
            fin.position.set(0, 0.6 + i * 0.05, 0.2);
            this.motorcycle.add(fin);
        }
    }
    
    createDetailedHandlebars(chromeMaterial) {
        // Main bar
        const barGeometry = new THREE.CylinderGeometry(0.015, 0.015, 1.2, 8);
        const handlebar = new THREE.Mesh(barGeometry, chromeMaterial);
        handlebar.position.set(0, 1.3, -1.4);
        handlebar.rotation.z = Math.PI / 2;
        handlebar.castShadow = true;
        this.motorcycle.add(handlebar);
        
        // Grips
        const gripGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.12, 8);
        const gripMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
        
        const leftGrip = new THREE.Mesh(gripGeometry, gripMaterial);
        leftGrip.position.set(-0.55, 1.3, -1.4);
        leftGrip.rotation.z = Math.PI / 2;
        this.motorcycle.add(leftGrip);
        
        const rightGrip = new THREE.Mesh(gripGeometry, gripMaterial);
        rightGrip.position.set(0.55, 1.3, -1.4);
        rightGrip.rotation.z = Math.PI / 2;
        this.motorcycle.add(rightGrip);
    }
    
    createMotorcycleSeat(seatMaterial) {
        const seatGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.8);
        seatGeometry.translate(0, 0, 0.1); // Slight curve
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(0, 1.0, 0.6);
        seat.castShadow = true;
        this.motorcycle.add(seat);
    }
    
    createRealisticExhaust(chromeMaterial) {
        // Main exhaust pipe
        const pipeGeometry = new THREE.CylinderGeometry(0.04, 0.04, 1.5, 8);
        const pipe = new THREE.Mesh(pipeGeometry, chromeMaterial);
        pipe.position.set(0.3, 0.2, 0.8);
        pipe.rotation.z = -0.3;
        pipe.castShadow = true;
        this.motorcycle.add(pipe);
        
        // Exhaust tip
        const tipGeometry = new THREE.CylinderGeometry(0.06, 0.04, 0.15, 8);
        const tip = new THREE.Mesh(tipGeometry, chromeMaterial);
        tip.position.set(0.7, -0.1, 1.4);
        tip.rotation.z = -0.3;
        tip.castShadow = true;
        this.motorcycle.add(tip);
    }
    
    createFairings(bodyMaterial) {
        // Front fairing
        const fairingGeometry = new THREE.SphereGeometry(0.4, 12, 8);
        fairingGeometry.scale(1.2, 0.8, 0.6);
        const frontFairing = new THREE.Mesh(fairingGeometry, bodyMaterial);
        frontFairing.position.set(0, 1.1, -1.2);
        frontFairing.castShadow = true;
        this.motorcycle.add(frontFairing);
        
        // Side fairings
        const sideFairingGeometry = new THREE.BoxGeometry(0.3, 0.6, 1.0);
        const leftFairing = new THREE.Mesh(sideFairingGeometry, bodyMaterial);
        leftFairing.position.set(-0.4, 0.7, 0);
        leftFairing.castShadow = true;
        this.motorcycle.add(leftFairing);
        
        const rightFairing = new THREE.Mesh(sideFairingGeometry, bodyMaterial);
        rightFairing.position.set(0.4, 0.7, 0);
        rightFairing.castShadow = true;
        this.motorcycle.add(rightFairing);
    }
    
    createCinematicTrack() {
        // Realistic asphalt road surface
        this.createAsphaltRoad();
        
        // Professional road markings
        this.createRoadMarkings();
        
        // Realistic barriers
        this.createGuardRails();
        
        // Enhanced environment
        this.createRealisticEnvironment();
    }
    
    createAsphaltRoad() {
        // Create texture for asphalt
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Base asphalt color
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, 512, 512);
        
        // Add noise for realistic asphalt texture
        for (let i = 0; i < 10000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const size = Math.random() * 3;
            const brightness = Math.random() * 60 + 30;
            ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
            ctx.fillRect(x, y, size, size);
        }
        
        const asphaltTexture = new THREE.CanvasTexture(canvas);
        asphaltTexture.wrapS = THREE.RepeatWrapping;
        asphaltTexture.wrapT = THREE.RepeatWrapping;
        asphaltTexture.repeat.set(20, 20);
        
        // Track geometry - oval shape
        const trackRadius = 60;
        const trackWidth = 12;
        const segments = 128;
        
        // Create track curve
        const curve = new THREE.EllipseCurve(
            0, 0,
            trackRadius, trackRadius * 0.8,
            0, 2 * Math.PI,
            false,
            0
        );
        
        const points = curve.getPoints(segments);
        const track3DPoints = points.map(p => new THREE.Vector3(p.x, 0, p.y));
        
        // Create road surface
        const roadGeometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        const normals = [];
        const uvs = [];
        
        for (let i = 0; i < track3DPoints.length; i++) {
            const point = track3DPoints[i];
            const nextPoint = track3DPoints[(i + 1) % track3DPoints.length];
            
            const direction = new THREE.Vector3().subVectors(nextPoint, point).normalize();
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
            
            const leftEdge = point.clone().add(perpendicular.clone().multiplyScalar(trackWidth / 2));
            const rightEdge = point.clone().add(perpendicular.clone().multiplyScalar(-trackWidth / 2));
            
            vertices.push(leftEdge.x, leftEdge.y, leftEdge.z);
            vertices.push(rightEdge.x, rightEdge.y, rightEdge.z);
            
            normals.push(0, 1, 0);
            normals.push(0, 1, 0);
            
            const u = i / track3DPoints.length;
            uvs.push(0, u);
            uvs.push(1, u);
            
            if (i < track3DPoints.length - 1) {
                const baseIndex = i * 2;
                indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
                indices.push(baseIndex + 1, baseIndex + 3, baseIndex + 2);
            }
        }
        
        roadGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        roadGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        roadGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        roadGeometry.setIndex(indices);
        
        const roadMaterial = new THREE.MeshStandardMaterial({
            map: asphaltTexture,
            roughness: 0.9,
            metalness: 0.1,
            normalScale: new THREE.Vector2(0.5, 0.5)
        });
        
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.receiveShadow = true;
        this.scene.add(road);
        
        // Store track points for other systems
        this.trackPoints = track3DPoints;
    }
    
    createRoadMarkings() {
        // Center line
        const lineGeometry = new THREE.BoxGeometry(0.1, 0.01, 2);
        const lineMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            emissive: 0x222222
        });
        
        for (let i = 0; i < this.trackPoints.length; i += 8) {
            const point = this.trackPoints[i];
            const nextPoint = this.trackPoints[(i + 1) % this.trackPoints.length];
            const direction = new THREE.Vector3().subVectors(nextPoint, point).normalize();
            
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.position.copy(point);
            line.position.y = 0.01;
            line.rotation.y = Math.atan2(direction.x, direction.z);
            this.scene.add(line);
        }
    }
    
    createGuardRails() {
        const trackWidth = 12;
        
        for (let i = 0; i < this.trackPoints.length; i += 2) {
            const point = this.trackPoints[i];
            const nextPoint = this.trackPoints[(i + 1) % this.trackPoints.length];
            const direction = new THREE.Vector3().subVectors(nextPoint, point).normalize();
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
            
            // Modern barrier design
            const barrierGeometry = new THREE.BoxGeometry(0.3, 1.2, 3);
            const barrierMaterial = new THREE.MeshStandardMaterial({
                color: 0xe0e0e0,
                metalness: 0.7,
                roughness: 0.3
            });
            
            // Inner barrier
            const innerBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
            const innerPos = point.clone().add(perpendicular.clone().multiplyScalar(-(trackWidth / 2 + 2)));
            innerBarrier.position.copy(innerPos);
            innerBarrier.position.y = 0.6;
            innerBarrier.rotation.y = Math.atan2(direction.x, direction.z);
            innerBarrier.castShadow = true;
            innerBarrier.receiveShadow = true;
            this.scene.add(innerBarrier);
            
            // Outer barrier
            const outerBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
            const outerPos = point.clone().add(perpendicular.clone().multiplyScalar(trackWidth / 2 + 2));
            outerBarrier.position.copy(outerPos);
            outerBarrier.position.y = 0.6;
            outerBarrier.rotation.y = Math.atan2(direction.x, direction.z);
            outerBarrier.castShadow = true;
            outerBarrier.receiveShadow = true;
            this.scene.add(outerBarrier);
        }
    }
    
    createRealisticEnvironment() {
        // Realistic sky
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB,
            side: THREE.BackSide,
            fog: false
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
        
        // Detailed ground
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a5f3a,
            roughness: 0.8,
            metalness: 0.0
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Realistic trees with detailed models
        this.createRealisticTrees();
        
        // Mountains in the distance
        this.createMountainRange();
        
        // Realistic clouds
        this.createVolumetricClouds();
    }
    
    createRealisticTrees() {
        for (let i = 0; i < 50; i++) {
            const tree = new THREE.Group();
            
            // Trunk with realistic proportions
            const trunkHeight = 8 + Math.random() * 4;
            const trunkGeometry = new THREE.CylinderGeometry(
                0.2 + Math.random() * 0.1,
                0.4 + Math.random() * 0.2,
                trunkHeight,
                8
            );
            const trunkMaterial = new THREE.MeshStandardMaterial({
                color: 0x4a3728,
                roughness: 0.9,
                metalness: 0.0
            });
            const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.y = trunkHeight / 2;
            trunk.castShadow = true;
            tree.add(trunk);
            
            // Multiple foliage layers
            for (let j = 0; j < 3; j++) {
                const foliageGeometry = new THREE.SphereGeometry(
                    2 + Math.random() * 1.5,
                    12, 8
                );
                const foliageMaterial = new THREE.MeshStandardMaterial({
                    color: new THREE.Color().setHSL(0.25 + Math.random() * 0.1, 0.7, 0.3 + Math.random() * 0.2),
                    roughness: 0.8,
                    metalness: 0.0
                });
                const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
                foliage.position.y = trunkHeight * 0.7 + j * 1.5;
                foliage.position.x = (Math.random() - 0.5) * 1;
                foliage.position.z = (Math.random() - 0.5) * 1;
                foliage.castShadow = true;
                tree.add(foliage);
            }
            
            // Position trees around track
            const angle = Math.random() * Math.PI * 2;
            const distance = 80 + Math.random() * 100;
            tree.position.set(
                Math.cos(angle) * distance,
                0,
                Math.sin(angle) * distance
            );
            
            this.scene.add(tree);
        }
    }
    
    createMountainRange() {
        for (let i = 0; i < 8; i++) {
            const mountainGeometry = new THREE.ConeGeometry(
                20 + Math.random() * 30,
                40 + Math.random() * 60,
                8, 4
            );
            const mountainMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(0.6, 0.3, 0.4 + Math.random() * 0.2),
                roughness: 0.9,
                metalness: 0.0
            });
            const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
            
            const angle = i * Math.PI / 4;
            const distance = 300 + Math.random() * 100;
            mountain.position.set(
                Math.cos(angle) * distance,
                mountain.geometry.parameters.height / 2,
                Math.sin(angle) * distance
            );
            mountain.castShadow = true;
            mountain.receiveShadow = true;
            this.scene.add(mountain);
        }
    }
    
    createVolumetricClouds() {
        for (let i = 0; i < 15; i++) {
            const cloudGeometry = new THREE.SphereGeometry(8 + Math.random() * 12, 8, 6);
            const cloudMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.7 + Math.random() * 0.3,
                roughness: 0.0,
                metalness: 0.0
            });
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloud.position.set(
                (Math.random() - 0.5) * 800,
                40 + Math.random() * 30,
                (Math.random() - 0.5) * 800
            );
            cloud.castShadow = false;
            cloud.receiveShadow = false;
            this.scene.add(cloud);
        }
    }
    
    createAtmosphericEffects() {
        // Particle system for dust and debris
        this.particles = [];
        
        // Wind effects
        this.windDirection = new THREE.Vector3(1, 0, 0.5).normalize();
        
        // Heat shimmer effect
        this.createHeatShimmer();
    }
    
    createHeatShimmer() {
        // This would typically use shaders for realistic heat distortion
        // For now, we'll add subtle atmospheric particles
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 200;
            positions[i + 1] = Math.random() * 20;
            positions[i + 2] = (Math.random() - 0.5) * 200;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);
    }
    
    initControls() {
        // Keyboard events
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
        
        // Camera switching
        document.addEventListener('keydown', (event) => {
            if (event.code === 'KeyC') {
                this.switchCamera();
            }
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
    }
    
    startRace() {
        this.gameState = 'racing';
        document.getElementById('gameMenu').style.display = 'none';
        console.log('🏁 Premium race started!');
    }
    
    update() {
        const deltaTime = this.clock.getDelta();
        
        // Update physics
        this.world.step(deltaTime);
        
        // Handle advanced motorcycle controls
        if (this.gameState === 'racing' && this.motorcycle) {
            this.speed = this.speed || 0;
            this.rotation = this.rotation || 0;
            this.gear = this.gear || 1;
            this.rpm = this.rpm || 800;
            this.wheelSlip = this.wheelSlip || 0;
            this.lean = this.lean || 0;
            
            // Professional motorcycle physics
            const maxSpeed = 200; // Increased top speed
            const gearRatios = [0, 25, 50, 80, 120, 200]; // 5-speed transmission
            const maxRPM = 11000;
            const powerBand = this.rpm > 6000 && this.rpm < 9500;
            const acceleration = powerBand ? 60 : 35; // Power band boost
            const deceleration = 45;
            const turnSpeed = Math.min(2.5, this.speed * 0.02); // Speed-dependent steering
            
            // Advanced RPM and gear system
            const currentGearMax = gearRatios[this.gear];
            const targetRPM = (this.speed / currentGearMax) * maxRPM;
            
            // Throttle control
            if (this.keys['ArrowUp'] || this.keys['KeyW']) {
                this.rpm = Math.min(this.rpm + 5000 * deltaTime, maxRPM);
                const torque = powerBand ? acceleration * 1.3 : acceleration;
                const accelForce = (this.rpm / maxRPM) * torque * deltaTime;
                this.speed = Math.min(this.speed + accelForce, currentGearMax);
                
                // Auto-shift up
                if (this.rpm > 9500 && this.gear < 5) {
                    this.gear++;
                    this.rpm = 6000; // Drop RPM after shift
                }
            } else if (this.keys['ArrowDown'] || this.keys['KeyS']) {
                // Engine braking + wheel brakes
                const brakeForce = deceleration + (this.rpm / maxRPM) * 20;
                this.speed = Math.max(this.speed - brakeForce * deltaTime, -maxSpeed * 0.2);
                this.rpm = Math.max(this.rpm - 3000 * deltaTime, 800);
            } else {
                // Coast down
                this.rpm = Math.max(this.rpm - 2000 * deltaTime, Math.max(800, targetRPM));
                const airDrag = this.speed * this.speed * 0.002;
                this.speed = Math.max(this.speed - airDrag * deltaTime, 0);
            }
            
            // Auto-shift down
            if (this.rpm < 3000 && this.gear > 1 && this.speed > 5) {
                this.gear--;
                this.rpm = 7000;
            }
            
            // Advanced steering with realistic motorcycle physics
            const speedFactor = Math.min(Math.abs(this.speed) / maxSpeed, 1);
            const steerResponse = turnSpeed * (0.3 + speedFactor * 0.7);
            
            // Lean angle calculation
            let targetLean = 0;
            if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
                this.rotation += steerResponse * deltaTime;
                targetLean = -Math.min(0.6, speedFactor * 0.8); // More lean at higher speeds
                
                // Wheel slip calculation
                this.wheelSlip = Math.min(this.wheelSlip + deltaTime * 2, speedFactor * 0.3);
            } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
                this.rotation -= steerResponse * deltaTime;
                targetLean = Math.min(0.6, speedFactor * 0.8);
                
                this.wheelSlip = Math.min(this.wheelSlip + deltaTime * 2, speedFactor * 0.3);
            } else {
                // Return to upright and reduce wheel slip
                targetLean = 0;
                this.wheelSlip = Math.max(this.wheelSlip - deltaTime * 3, 0);
            }
            
            // Smooth lean transition
            this.lean += (targetLean - this.lean) * deltaTime * 5;
            this.motorcycle.rotation.z = this.lean;
            
            // Realistic counter-steering at high speeds
            if (Math.abs(this.speed) > 50) {
                const counterSteer = this.lean * 0.2;
                this.motorcycle.rotation.z += counterSteer;
            }
            
            // Apply movement with realistic physics
            this.motorcycle.position.x += Math.sin(this.rotation) * this.speed * deltaTime;
            this.motorcycle.position.z += Math.cos(this.rotation) * this.speed * deltaTime;
            this.motorcycle.rotation.y = this.rotation;
            
            // Correct wheel animation - rotate around Z-axis for rolling motion
            if (this.frontWheelRim && this.rearWheelRim) {
                const wheelRotation = this.speed * deltaTime * 0.4;
                // Both wheels spin around X-axis (correct rolling motion)
                this.frontWheelRim.rotation.x += wheelRotation;
                this.rearWheelRim.rotation.x += wheelRotation;
                
                // Front wheel leans into turns (realistic motorcycle physics)
                // Front wheel is at Z=-1.5, rear wheel is at Z=1.6
                if (this.frontWheel) {
                    // Lean into turns: left turn = lean left (negative Z), right turn = lean right (positive Z)
                    this.frontWheel.rotation.z = (this.keys['ArrowLeft'] || this.keys['KeyA'] ? -0.3 : 0) + 
                                                (this.keys['ArrowRight'] || this.keys['KeyD'] ? 0.3 : 0);
                }
                // Rear wheel stays upright - no leaning
                if (this.rearWheel) {
                    this.rearWheel.rotation.z = 0; // Always upright
                    this.rearWheel.rotation.y = 0; // Always straight
                }
            }
            
            // Dynamic camera system
            this.updateDynamicCamera();
        }
        
        // Update Professional Racing UI
        if (this.motorcycle && this.speed !== undefined) {
            this.updateRacingDashboard();
        }
    }
    
    updateRacingDashboard() {
        // Update speed display with realistic km/h conversion
        const speedKmh = Math.round(Math.abs(this.speed * 3.6));
        document.getElementById('speedValue').textContent = speedKmh;
        
        // Update RPM display
        const displayRPM = Math.round(this.rpm);
        document.getElementById('rpmValue').textContent = displayRPM;
        
        // Update gear display
        document.getElementById('gearValue').textContent = this.gear;
        
        // Draw speed gauge
        this.drawSpeedGauge(speedKmh);
        
        // Draw RPM gauge
        this.drawRPMGauge(this.rpm);
        
        // Color coding for different speed ranges
        const speedElement = document.getElementById('speedValue');
        if (speedKmh < 50) {
            speedElement.style.color = '#00ff41';
        } else if (speedKmh < 100) {
            speedElement.style.color = '#ffaa00';
        } else {
            speedElement.style.color = '#ff4444';
        }
        
        // RPM color coding
        const rpmElement = document.getElementById('rpmValue');
        if (this.rpm < 6000) {
            rpmElement.style.color = '#00ff41';
        } else if (this.rpm < 9000) {
            rpmElement.style.color = '#ffaa00';
        } else {
            rpmElement.style.color = '#ff4444';
        }
    }
    
    drawSpeedGauge(speed) {
        const canvas = document.getElementById('speedGauge');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 50;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Background circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 8;
        ctx.stroke();
        
        // Speed arc (0-200 km/h)
        const speedAngle = (speed / 200) * 1.5 * Math.PI - 0.75 * Math.PI;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -0.75 * Math.PI, speedAngle);
        ctx.strokeStyle = '#00ff41';
        ctx.lineWidth = 6;
        ctx.stroke();
        
        // Speed markings
        for (let i = 0; i <= 10; i++) {
            const angle = (i / 10) * 1.5 * Math.PI - 0.75 * Math.PI;
            const x1 = centerX + Math.cos(angle) * (radius - 10);
            const y1 = centerY + Math.sin(angle) * (radius - 10);
            const x2 = centerX + Math.cos(angle) * (radius - 5);
            const y2 = centerY + Math.sin(angle) * (radius - 5);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = '#00ff41';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
    
    drawRPMGauge(rpm) {
        const canvas = document.getElementById('rpmGauge');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 40;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Background circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 6;
        ctx.stroke();
        
        // RPM arc (800-11000 RPM)
        const rpmRatio = Math.max(0, (rpm - 800) / 10200);
        const rpmAngle = rpmRatio * 1.5 * Math.PI - 0.75 * Math.PI;
        
        // Different colors for different RPM ranges
        let rpmColor = '#00ff41';
        if (rpm > 9000) rpmColor = '#ff4444';
        else if (rpm > 6000) rpmColor = '#ffaa00';
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -0.75 * Math.PI, rpmAngle);
        ctx.strokeStyle = rpmColor;
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Red line zone
        if (rpm > 9500) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0.6 * Math.PI, 0.75 * Math.PI);
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 6;
            ctx.stroke();
        }
    }

    switchCamera() {
        const modes = ['chase', 'cockpit', 'cinematic', 'overhead'];
        const currentIndex = modes.indexOf(this.cameraMode);
        this.cameraMode = modes[(currentIndex + 1) % modes.length];
        this.cameraTransition = 0;
        
        // Show camera mode notification
        this.showCameraNotification();
    }
    
    showCameraNotification() {
        const modeNames = {
            'chase': 'Chase Camera',
            'cockpit': 'Cockpit View', 
            'cinematic': 'Cinematic Camera',
            'overhead': 'Overhead View'
        };
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'camera-notification';
        notification.textContent = modeNames[this.cameraMode];
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: #00ff41;
            padding: 12px 24px;
            border: 2px solid #00ff41;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            z-index: 1000;
            backdrop-filter: blur(10px);
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 2 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 2000);
    }
    
    updateDynamicCamera() {
        this.cameraTransition = Math.min(this.cameraTransition + 0.02, 1);
        
        switch (this.cameraMode) {
            case 'chase':
                this.updateChaseCamera();
                break;
            case 'cockpit':
                this.updateCockpitCamera();
                break;
            case 'cinematic':
                this.updateCinematicCamera();
                break;
            case 'overhead':
                this.updateOverheadCamera();
                break;
        }
    }
    
    updateChaseCamera() {
        const cameraDistance = 12 + Math.abs(this.speed) * 0.05;
        const cameraHeight = 5 + Math.abs(this.speed) * 0.02;
        
        const targetX = this.motorcycle.position.x - Math.sin(this.rotation) * cameraDistance;
        const targetZ = this.motorcycle.position.z - Math.cos(this.rotation) * cameraDistance;
        const targetY = cameraHeight;
        
        // Smooth camera movement
        this.camera.position.x += (targetX - this.camera.position.x) * 0.1;
        this.camera.position.z += (targetZ - this.camera.position.z) * 0.1;
        this.camera.position.y += (targetY - this.camera.position.y) * 0.1;
        
        // Look ahead of motorcycle
        const lookAheadX = this.motorcycle.position.x + Math.sin(this.rotation) * 5;
        const lookAheadZ = this.motorcycle.position.z + Math.cos(this.rotation) * 5;
        this.camera.lookAt(lookAheadX, this.motorcycle.position.y + 1, lookAheadZ);
    }
    
    updateCockpitCamera() {
        // First-person view from rider's perspective
        const riderOffset = new THREE.Vector3(0, 1.8, -0.3);
        const worldOffset = riderOffset.clone();
        worldOffset.applyQuaternion(this.motorcycle.quaternion);
        
        const targetX = this.motorcycle.position.x + worldOffset.x;
        const targetY = this.motorcycle.position.y + worldOffset.y;
        const targetZ = this.motorcycle.position.z + worldOffset.z;
        
        this.camera.position.x += (targetX - this.camera.position.x) * 0.2;
        this.camera.position.y += (targetY - this.camera.position.y) * 0.2;
        this.camera.position.z += (targetZ - this.camera.position.z) * 0.2;
        
        // Look in direction of travel
        const lookX = this.motorcycle.position.x + Math.sin(this.rotation) * 50;
        const lookZ = this.motorcycle.position.z + Math.cos(this.rotation) * 50;
        this.camera.lookAt(lookX, this.motorcycle.position.y, lookZ);
    }
    
    updateCinematicCamera() {
        const time = Date.now() * 0.001;
        const cameraDistance = 15 + Math.sin(time * 0.5) * 5;
        const cameraHeight = 8 + Math.cos(time * 0.3) * 3;
        const cameraOffset = Math.sin(this.speed * 0.1) * 2;
        
        const targetX = this.motorcycle.position.x - Math.sin(this.rotation + cameraOffset) * cameraDistance;
        const targetZ = this.motorcycle.position.z - Math.cos(this.rotation + cameraOffset) * cameraDistance;
        const targetY = cameraHeight;
        
        // Smooth camera movement with slight lag for cinematic effect
        this.camera.position.x += (targetX - this.camera.position.x) * 0.08;
        this.camera.position.z += (targetZ - this.camera.position.z) * 0.08;
        this.camera.position.y += (targetY - this.camera.position.y) * 0.08;
        
        // Dynamic cinematic look-at with slight randomness
        const lookAtX = this.motorcycle.position.x + (Math.random() - 0.5) * 2;
        const lookAtZ = this.motorcycle.position.z + (Math.random() - 0.5) * 2;
        this.camera.lookAt(lookAtX, this.motorcycle.position.y + 1, lookAtZ);
    }
    
    updateOverheadCamera() {
        const cameraHeight = 25;
        const targetX = this.motorcycle.position.x;
        const targetZ = this.motorcycle.position.z;
        const targetY = cameraHeight;
        
        // Smooth overhead movement
        this.camera.position.x += (targetX - this.camera.position.x) * 0.15;
        this.camera.position.z += (targetZ - this.camera.position.z) * 0.15;
        this.camera.position.y += (targetY - this.camera.position.y) * 0.15;
        
        // Look down at motorcycle
        this.camera.lookAt(this.motorcycle.position.x, this.motorcycle.position.y, this.motorcycle.position.z);
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

// Initialize premium game
let premiumGame;
window.addEventListener('load', () => {
    console.log('🚀 Initializing Premium Moto Racer 2...');
    premiumGame = new PremiumMotoRacer();
});