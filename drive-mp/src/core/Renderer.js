import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

export class Renderer {
    constructor() {
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.canvas = null;
        this.debugMode = false;
        this.helpers = [];
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
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 500);
        this.scene.background = new THREE.Color(0x87CEEB);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Setup lighting
        this.setupLighting();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
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

    setupPostProcessing() {
        // Basic setup for future post-processing effects
        // Could add bloom, motion blur, SSAO, etc.
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
    createVehicleMaterial(color = 0x2196F3) {
        return new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.7,
            roughness: 0.3,
            envMapIntensity: 1
        });
    }

    createWheelMaterial() {
        return new THREE.MeshStandardMaterial({
            color: 0x222222,
            metalness: 0.1,
            roughness: 0.9
        });
    }

    createGroundMaterial() {
        return new THREE.MeshStandardMaterial({
            color: 0x808080,
            metalness: 0,
            roughness: 0.8
        });
    }

    createGlassMaterial() {
        return new THREE.MeshPhysicalMaterial({
            color: 0x88ccff,
            metalness: 0,
            roughness: 0,
            transmission: 0.9,
            thickness: 0.5,
            opacity: 0.3,
            transparent: true
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
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