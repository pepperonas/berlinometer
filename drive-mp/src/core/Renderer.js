import * as THREE from 'three';
// Temporarily disable post-processing imports until we resolve module issues
// import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
// import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
// import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
// import { SAOPass } from 'three/addons/postprocessing/SAOPass.js';
// import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
// import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
// import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export class Renderer {
    constructor() {
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.canvas = null;
        this.debugMode = false;
        this.helpers = [];
        
        // Post-processing
        this.composer = null;
        this.bloomPass = null;
        this.saoPass = null;
        this.smaaPass = null;
        
        // Environment
        this.envMap = null;
        this.pmremGenerator = null;
        
        // Advanced rendering settings
        this.renderSettings = {
            shadows: true,
            bloom: true,
            sao: true,
            antialiasing: true,
            toneMappingExposure: 1.2,
            bloomStrength: 0.3,
            bloomRadius: 0.8,
            bloomThreshold: 0.8
        };
        
        // Performance monitoring
        this.performanceMonitor = {
            frameTime: 0,
            targetFPS: 60,
            adaptiveQuality: true,
            qualityLevel: 1.0
        };
        
        // LOD settings
        this.lodSettings = {
            enabled: true,
            distances: [50, 150, 300],
            shadowDistance: 100,
            particleDistance: 75
        };
    }

    async init() {
        // Get canvas element
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }

        // Create WebGL renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Set clear color to avoid black screen
        this.renderer.setClearColor(0x87CEEB, 1.0); // Sky blue
        
        // Advanced renderer settings
        this.renderer.shadowMap.enabled = this.renderSettings.shadows;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = this.renderSettings.toneMappingExposure;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.physicallyCorrectLights = true;
        
        // Enable HDR support
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // Initialize PMREM generator for environment maps
        this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.pmremGenerator.compileEquirectangularShader();
        
        // Create scene
        this.scene = new THREE.Scene();
        
        // Setup advanced environment
        await this.setupEnvironment();
        
        // Setup dynamic fog
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 500);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Set initial camera position to ensure something is visible
        this.camera.position.set(10, 8, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Setup lighting
        this.setupLighting();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Add a test cube to ensure scene is visible
        const testGeometry = new THREE.BoxGeometry(2, 2, 2);
        const testMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const testCube = new THREE.Mesh(testGeometry, testMaterial);
        testCube.position.set(0, 1, 0);
        testCube.castShadow = true;
        testCube.receiveShadow = true;
        this.scene.add(testCube);
        console.log('Added test cube to scene');
        
        // Setup post-processing (optional, for better visuals)
        this.setupPostProcessing();
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        
        // Shadow settings
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        directionalLight.shadow.bias = -0.0005;
        
        this.scene.add(directionalLight);
        
        // Hemisphere light for better ambient
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x545454, 0.4);
        this.scene.add(hemisphereLight);
        
        // Store lights for potential updates
        this.lights = {
            ambient: ambientLight,
            directional: directionalLight,
            hemisphere: hemisphereLight
        };
    }

    async setupEnvironment() {
        // Create dynamic sky gradient
        this.createDynamicSky();
        
        // Load HDR environment map
        try {
            const envMap = await this.loadHDREnvironment();
            this.scene.environment = envMap;
            this.envMap = envMap;
        } catch (error) {
            console.warn('Could not load HDR environment, using fallback:', error);
            this.createFallbackEnvironment();
        }
    }
    
    createDynamicSky() {
        // Create a dynamic sky using gradient
        const skyGeometry = new THREE.SphereGeometry(400, 32, 32);
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077ff) },
                bottomColor: { value: new THREE.Color(0xffffff) },
                offset: { value: 33 },
                exponent: { value: 0.6 },
                sunPosition: { value: new THREE.Vector3(50, 100, 50).normalize() }
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
                uniform vec3 sunPosition;
                varying vec3 vWorldPosition;
                
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    vec3 skyColor = mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0));
                    
                    // Add sun disk
                    vec3 viewDirection = normalize(vWorldPosition);
                    float sunDot = dot(viewDirection, sunPosition);
                    float sunDisk = smoothstep(0.99, 0.995, sunDot);
                    skyColor += vec3(1.0, 0.9, 0.7) * sunDisk * 3.0;
                    
                    gl_FragColor = vec4(skyColor, 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
        this.skyMaterial = skyMaterial;
    }
    
    async loadHDREnvironment() {
        // Create a procedural HDR environment using built-in features
        return new Promise((resolve) => {
            // Create a simple gradient environment
            const renderTarget = new THREE.WebGLCubeRenderTarget(256);
            const cubeCamera = new THREE.CubeCamera(0.1, 1000, renderTarget);
            
            // Create a temporary scene with gradient sky
            const tempScene = new THREE.Scene();
            const skyGeo = new THREE.SphereGeometry(500, 32, 32);
            const skyMat = new THREE.ShaderMaterial({
                uniforms: {
                    topColor: { value: new THREE.Color(0x0077ff) },
                    bottomColor: { value: new THREE.Color(0xffffff) }
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
                    varying vec3 vWorldPosition;
                    void main() {
                        float h = normalize(vWorldPosition).y;
                        gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
                    }
                `,
                side: THREE.BackSide
            });
            const sky = new THREE.Mesh(skyGeo, skyMat);
            tempScene.add(sky);
            
            // Render to cube camera
            cubeCamera.position.set(0, 0, 0);
            cubeCamera.update(this.renderer, tempScene);
            
            // Use the rendered environment
            resolve(this.pmremGenerator.fromCubemap(renderTarget.texture).texture);
        });
    }
    
    createFallbackEnvironment() {
        // Create a simple environment map from the scene
        const renderTarget = new THREE.WebGLCubeRenderTarget(256);
        const cubeCamera = new THREE.CubeCamera(0.1, 1000, renderTarget);
        cubeCamera.position.set(0, 10, 0);
        cubeCamera.update(this.renderer, this.scene);
        this.scene.environment = renderTarget.texture;
    }
    
    setupPostProcessing() {
        // Temporarily disabled until module imports are resolved
        // Will use built-in renderer features instead
        console.log('Post-processing temporarily disabled - using built-in renderer features');
        
        // Enable built-in antialiasing
        this.renderer.antialias = true;
        
        // Use built-in tone mapping
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = this.renderSettings.toneMappingExposure;
    }

    toggleDebug() {
        this.debugMode = !this.debugMode;
        
        if (this.debugMode) {
            // Add grid helper
            const gridHelper = new THREE.GridHelper(200, 50, 0x444444, 0x222222);
            this.scene.add(gridHelper);
            this.helpers.push(gridHelper);
            
            // Add axes helper
            const axesHelper = new THREE.AxesHelper(5);
            this.scene.add(axesHelper);
            this.helpers.push(axesHelper);
            
            // Add directional light helper
            const lightHelper = new THREE.DirectionalLightHelper(this.lights.directional, 5);
            this.scene.add(lightHelper);
            this.helpers.push(lightHelper);
        } else {
            // Remove all helpers
            this.helpers.forEach(helper => {
                this.scene.remove(helper);
            });
            this.helpers = [];
        }
    }

    createDebugSphere(position, radius = 0.1, color = 0xff0000) {
        const geometry = new THREE.SphereGeometry(radius, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(position);
        this.scene.add(sphere);
        return sphere;
    }

    createDebugLine(start, end, color = 0x00ff00) {
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const material = new THREE.LineBasicMaterial({ color });
        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
        return line;
    }

    createDebugBox(position, size, color = 0x0000ff) {
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const material = new THREE.MeshBasicMaterial({ 
            color, 
            wireframe: true 
        });
        const box = new THREE.Mesh(geometry, material);
        box.position.copy(position);
        this.scene.add(box);
        return box;
    }

    // Material creation helpers
    createVehicleMaterial(color = 0x2196F3, materialType = 'metallic') {
        switch (materialType) {
            case 'metallic':
                return this.createMetallicPaint(color);
            case 'matte':
                return this.createMattePaint(color);
            case 'chrome':
                return this.createChromeMaterial();
            case 'carbon':
                return this.createCarbonFiberMaterial();
            default:
                return this.createMetallicPaint(color);
        }
    }
    
    createMetallicPaint(color = 0x2196F3) {
        // Advanced car paint shader with clear coat effect
        return new THREE.MeshPhysicalMaterial({
            color: color,
            metalness: 0.9,
            roughness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.03,
            envMapIntensity: 2.0,
            reflectivity: 0.9,
            transmission: 0.0,
            thickness: 0.0,
            ior: 1.4
        });
    }
    
    createMattePaint(color = 0x2196F3) {
        return new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.0,
            roughness: 0.9,
            envMapIntensity: 0.3
        });
    }
    
    createChromeMaterial() {
        return new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 1.0,
            roughness: 0.0,
            envMapIntensity: 3.0
        });
    }
    
    createCarbonFiberMaterial() {
        // Create procedural carbon fiber pattern
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Create carbon fiber weave pattern
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 512, 512);
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        
        // Draw weave pattern
        for (let i = 0; i < 512; i += 32) {
            for (let j = 0; j < 512; j += 32) {
                ctx.beginPath();
                ctx.arc(i + 16, j + 16, 8, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        
        return new THREE.MeshStandardMaterial({
            map: texture,
            normalMap: texture,
            normalScale: new THREE.Vector2(0.5, 0.5),
            metalness: 0.8,
            roughness: 0.2,
            envMapIntensity: 1.5
        });
    }

    createWheelMaterial(type = 'tire') {
        switch (type) {
            case 'tire':
                return this.createTireMaterial();
            case 'rim':
                return this.createRimMaterial();
            case 'brake':
                return this.createBrakeMaterial();
            default:
                return this.createTireMaterial();
        }
    }
    
    createTireMaterial() {
        // Create tire tread pattern
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 256, 256);
        
        // Add tread pattern
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        for (let i = 0; i < 256; i += 16) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(256, i + 8);
            ctx.stroke();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        return new THREE.MeshStandardMaterial({
            map: texture,
            normalMap: texture,
            normalScale: new THREE.Vector2(0.3, 0.3),
            color: 0x1a1a1a,
            metalness: 0.0,
            roughness: 0.95
        });
    }
    
    createRimMaterial() {
        return new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.9,
            roughness: 0.1,
            envMapIntensity: 1.5
        });
    }
    
    createBrakeMaterial() {
        return new THREE.MeshStandardMaterial({
            color: 0x660000,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x220000,
            emissiveIntensity: 0.1
        });
    }

    createGroundMaterial(type = 'asphalt') {
        switch (type) {
            case 'asphalt':
                return this.createAsphaltMaterial();
            case 'concrete':
                return this.createConcreteMaterial();
            case 'grass':
                return this.createGrassMaterial();
            case 'gravel':
                return this.createGravelMaterial();
            default:
                return this.createAsphaltMaterial();
        }
    }
    
    createAsphaltMaterial() {
        // Create asphalt texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Base asphalt color
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, 512, 512);
        
        // Add noise and aggregate pattern
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const size = Math.random() * 3 + 1;
            const brightness = Math.random() * 0.3 + 0.1;
            
            ctx.fillStyle = `rgba(${brightness * 255}, ${brightness * 255}, ${brightness * 255}, 0.3)`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(8, 8);
        
        return new THREE.MeshStandardMaterial({
            map: texture,
            normalMap: texture,
            normalScale: new THREE.Vector2(0.2, 0.2),
            color: 0x2a2a2a,
            metalness: 0.0,
            roughness: 0.9
        });
    }
    
    createConcreteMaterial() {
        return new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.0,
            roughness: 0.7
        });
    }
    
    createGrassMaterial() {
        return new THREE.MeshStandardMaterial({
            color: 0x3a5f3a,
            metalness: 0.0,
            roughness: 0.9
        });
    }
    
    createGravelMaterial() {
        return new THREE.MeshStandardMaterial({
            color: 0x665544,
            metalness: 0.0,
            roughness: 0.95
        });
    }

    createGlassMaterial(type = 'windshield') {
        switch (type) {
            case 'windshield':
                return new THREE.MeshPhysicalMaterial({
                    color: 0x88ccff,
                    metalness: 0,
                    roughness: 0,
                    transmission: 0.95,
                    thickness: 0.1,
                    ior: 1.52,
                    opacity: 0.1,
                    transparent: true,
                    envMapIntensity: 1.0
                });
            case 'headlight':
                return new THREE.MeshPhysicalMaterial({
                    color: 0xffffff,
                    metalness: 0,
                    roughness: 0.1,
                    transmission: 0.8,
                    thickness: 0.2,
                    ior: 1.5,
                    emissive: 0x444444,
                    emissiveIntensity: 0.2
                });
            case 'taillight':
                return new THREE.MeshPhysicalMaterial({
                    color: 0xff2222,
                    metalness: 0,
                    roughness: 0.2,
                    transmission: 0.7,
                    emissive: 0x220000,
                    emissiveIntensity: 0.3
                });
            default:
                return this.createGlassMaterial('windshield');
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Update pixel ratio based on current quality
        this.adaptRenderQuality();
    }

    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        } else {
            console.warn('Renderer not ready:', {
                renderer: !!this.renderer,
                scene: !!this.scene,
                camera: !!this.camera
            });
        }
    }
    
    // Update dynamic elements
    update(deltaTime, vehiclePosition) {
        // Performance monitoring
        this.updatePerformanceMonitoring(deltaTime);
        
        // Update sky based on time of day or other factors
        if (this.skyMaterial) {
            const time = Date.now() * 0.0001;
            this.skyMaterial.uniforms.sunPosition.value.set(
                Math.cos(time) * 50,
                Math.sin(time * 0.5) * 50 + 30,
                Math.sin(time) * 50
            ).normalize();
        }
        
        // Update shadow camera to follow vehicle
        if (vehiclePosition) {
            this.updateShadowCamera(vehiclePosition);
        }
        
        // Update fog based on distance
        if (this.scene.fog && vehiclePosition) {
            const speed = vehiclePosition.length() || 0;
            this.scene.fog.near = 30 + speed * 2;
            this.scene.fog.far = 300 + speed * 10;
        }
        
        // Apply LOD optimizations
        if (this.lodSettings.enabled && vehiclePosition) {
            this.updateLOD(vehiclePosition);
        }
    }
    
    updatePerformanceMonitoring(deltaTime) {
        this.performanceMonitor.frameTime = deltaTime * 1000;
        const currentFPS = 1 / deltaTime;
        
        if (this.performanceMonitor.adaptiveQuality) {
            const targetFrameTime = 1000 / this.performanceMonitor.targetFPS;
            
            if (this.performanceMonitor.frameTime > targetFrameTime * 1.2) {
                this.performanceMonitor.qualityLevel = Math.max(0.5, this.performanceMonitor.qualityLevel - 0.1);
                this.adaptRenderQuality();
            } else if (this.performanceMonitor.frameTime < targetFrameTime * 0.8) {
                this.performanceMonitor.qualityLevel = Math.min(1.0, this.performanceMonitor.qualityLevel + 0.05);
                this.adaptRenderQuality();
            }
        }
    }
    
    adaptRenderQuality() {
        const quality = this.performanceMonitor.qualityLevel;
        
        // Adjust tone mapping exposure based on quality
        this.renderer.toneMappingExposure = this.renderSettings.toneMappingExposure * (0.8 + quality * 0.2);
        
        if (this.lights.directional) {
            const shadowMapSize = quality > 0.8 ? 2048 : quality > 0.6 ? 1024 : 512;
            this.lights.directional.shadow.mapSize.setScalar(shadowMapSize);
        }
        
        const pixelRatio = Math.min(window.devicePixelRatio, 1 + quality);
        this.renderer.setPixelRatio(pixelRatio);
    }
    
    updateLOD(vehiclePosition) {
        this.scene.traverse((object) => {
            if (object.isMesh && object.userData.isLODObject) {
                const distance = object.position.distanceTo(vehiclePosition);
                
                if (distance > this.lodSettings.distances[2]) {
                    object.visible = false;
                } else {
                    object.visible = true;
                    
                    if (object.material) {
                        if (distance > this.lodSettings.distances[1]) {
                            object.material.wireframe = false;
                            if (object.material.map) {
                                object.material.map.minFilter = THREE.LinearFilter;
                            }
                        } else if (distance > this.lodSettings.distances[0]) {
                            if (object.material.map) {
                                object.material.map.minFilter = THREE.LinearMipmapLinearFilter;
                            }
                        }
                    }
                }
                
                const shadowDistance = this.lodSettings.shadowDistance;
                object.castShadow = distance < shadowDistance && this.renderSettings.shadows;
                object.receiveShadow = distance < shadowDistance * 1.5 && this.renderSettings.shadows;
            }
        });
    }
    
    getPerformanceStats() {
        return {
            frameTime: this.performanceMonitor.frameTime,
            qualityLevel: this.performanceMonitor.qualityLevel,
            fps: Math.round(1000 / this.performanceMonitor.frameTime)
        };
    }
    
    markForLOD(object, enableLOD = true) {
        if (object.isMesh) {
            object.userData.isLODObject = enableLOD;
        }
        object.children.forEach(child => {
            this.markForLOD(child, enableLOD);
        });
    }

    // Helper method to update shadow camera based on vehicle position
    updateShadowCamera(position) {
        const light = this.lights.directional;
        light.position.x = position.x + 50;
        light.position.z = position.z + 50;
        light.target.position.copy(position);
        light.target.updateMatrixWorld();
    }

    destroy() {
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }
        
        // Clean up scene
        if (this.scene) {
            this.scene.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            this.scene = null;
        }
        
        window.removeEventListener('resize', this.onWindowResize);
    }
}