import { Vehicle } from './Vehicle.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.world = null;
        this.vehicles = [];
        this.activeVehicle = null;
        this.clock = new THREE.Clock();
        this.stats = null;
        
        // Camera settings
        this.cameraMode = 'chase'; // chase, cockpit, free
        this.cameraDistance = 15;
        this.cameraHeight = 5;
        
        // Performance settings
        this.physicsSteps = 1;
        this.fixedTimeStep = 1/60;
        this.maxSubSteps = 3;
    }
    
    async init() {
        // Initialize Three.js
        this.initRenderer();
        this.initScene();
        this.initCamera();
        this.initLights();
        
        // Initialize Cannon.js physics
        this.initPhysics();
        
        // Initialize performance stats
        this.initStats();
        
        // Create test environment
        await this.createTestArena();
        
        // Create first vehicle
        await this.createVehicle();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: "high-performance"
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
    }
    
    initScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 500);
        
        // Sky gradient
        const skyGeo = new THREE.SphereGeometry(400, 32, 15);
        const skyMat = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077ff) },
                bottomColor: { value: new THREE.Color(0xffffff) },
                offset: { value: 33 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        const sky = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(sky);
    }
    
    initCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this.camera.position.set(0, 10, 20);
        this.camera.lookAt(0, 0, 0);
    }
    
    initLights() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);
        
        // Directional light (sun)
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(50, 100, 50);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 500;
        sun.shadow.camera.left = -100;
        sun.shadow.camera.right = 100;
        sun.shadow.camera.top = 100;
        sun.shadow.camera.bottom = -100;
        this.scene.add(sun);
        
        // Hemisphere light for better ambient
        const hemi = new THREE.HemisphereLight(0x87CEEB, 0x545454, 0.4);
        this.scene.add(hemi);
    }
    
    initPhysics() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 20; // Increased for stability
        this.world.solver.tolerance = 0.001; // Improved tolerance
        this.world.defaultContactMaterial.friction = 0.4;
        this.world.defaultContactMaterial.restitution = 0.2;
    }
    
    initStats() {
        if (typeof Stats !== 'undefined') {
            this.stats = new Stats();
            this.stats.showPanel(0); // FPS
            document.body.appendChild(this.stats.dom);
            this.stats.dom.style.position = 'absolute';
            this.stats.dom.style.top = '10px';
            this.stats.dom.style.right = '10px';
        }
    }
    
    async createTestArena() {
        // Ground
        const groundGeo = new THREE.PlaneGeometry(500, 500, 50, 50);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add grid texture
        const gridTexture = this.createGridTexture();
        groundMat.map = gridTexture;
        groundMat.needsUpdate = true;
        
        // Physics ground
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({
            mass: 0,
            shape: groundShape,
            material: new CANNON.Material({
                friction: 0.4,
                restitution: 0.3
            })
        });
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.add(groundBody);
        
        // Add some obstacles
        this.createObstacles();
    }
    
    createGridTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(0, 0, 512, 512);
        
        // Grid lines
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        
        const gridSize = 32;
        for (let i = 0; i <= 512; i += gridSize) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 512);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(512, i);
            ctx.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(20, 20);
        
        return texture;
    }
    
    createObstacles() {
        const obstacles = [
            { pos: [20, 1, 0], size: [2, 2, 10] },
            { pos: [-20, 1, 0], size: [2, 2, 10] },
            { pos: [0, 1, 20], size: [10, 2, 2] },
            { pos: [0, 1, -20], size: [10, 2, 2] }
        ];
        
        obstacles.forEach(obs => {
            const geo = new THREE.BoxGeometry(...obs.size);
            const mat = new THREE.MeshStandardMaterial({
                color: 0xff4444,
                roughness: 0.7,
                metalness: 0.3
            });
            
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(...obs.pos);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
            
            // Physics
            const shape = new CANNON.Box(new CANNON.Vec3(...obs.size.map(s => s/2)));
            const body = new CANNON.Body({
                mass: 0,
                shape: shape,
                position: new CANNON.Vec3(...obs.pos)
            });
            this.world.add(body);
        });
    }
    
    async createVehicle() {
        // Create vehicle with node-beam physics
        const vehicle = new Vehicle(this.scene, this.world, {
            mass: 1200,
            dimensions: { width: 1.8, height: 1.4, length: 4.2 },
            nodeCount: 250
        });
        
        this.activeVehicle = vehicle;
        this.vehicles.push(vehicle);
    }
    
    updateCamera() {
        if (!this.activeVehicle) return;
        
        const vehicle = this.activeVehicle;
        const pos = vehicle.getPosition();
        const vel = vehicle.getVelocity();
        
        if (this.cameraMode === 'chase') {
            // Chase camera
            const ideal = new THREE.Vector3(
                pos.x - vel.x * 0.5,
                pos.y + this.cameraHeight,
                pos.z - vel.z * 0.5 + this.cameraDistance
            );
            
            this.camera.position.lerp(ideal, 0.1);
            this.camera.lookAt(pos.x, pos.y, pos.z);
        }
    }
    
    update() {
        if (this.stats) this.stats.begin();
        
        const deltaTime = Math.min(this.clock.getDelta(), 0.1);
        
        // Update physics with proper substeps
        this.world.step(this.fixedTimeStep, deltaTime, this.maxSubSteps);
        
        // Update vehicles
        this.vehicles.forEach(vehicle => {
            vehicle.update(deltaTime);
        });
        
        // Update camera
        this.updateCamera();
        
        if (this.stats) this.stats.end();
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    getActiveVehicle() {
        return this.activeVehicle;
    }
}