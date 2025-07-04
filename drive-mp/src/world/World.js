import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

export class World {
    constructor(renderer, physics) {
        this.renderer = renderer;
        this.physics = physics;
        this.objects = [];
        this.dynamicObjects = [];
    }

    async init() {
        // Create ground
        this.createGround();
        
        // Create test environment
        this.createTestArena();
        
        // Create some obstacles
        this.createObstacles();
        
        // Create ramps
        this.createRamps();
    }

    createGround() {
        // Visual ground
        const groundSize = 500;
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 50, 50);
        const groundMaterial = this.renderer.createGroundMaterial();
        
        // Add some texture or pattern
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Create checkerboard pattern
        const tileSize = 32;
        for (let i = 0; i < canvas.width; i += tileSize) {
            for (let j = 0; j < canvas.height; j += tileSize) {
                ctx.fillStyle = ((i + j) / tileSize) % 2 === 0 ? '#808080' : '#606060';
                ctx.fillRect(i, j, tileSize, tileSize);
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(groundSize / 10, groundSize / 10);
        groundMaterial.map = texture;
        
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.receiveShadow = true;
        this.renderer.scene.add(groundMesh);
        
        // Physics ground
        const groundShape = new CANNON.Box(new CANNON.Vec3(groundSize / 2, 0.1, groundSize / 2));
        const groundBody = new CANNON.Body({
            mass: 0,
            shape: groundShape,
            material: this.physics.materials.ground
        });
        groundBody.position.set(0, -0.1, 0);
        this.physics.addBody(groundBody);
    }

    createTestArena() {
        // Create walls around test area
        const wallHeight = 10;
        const wallThickness = 1;
        const arenaSize = 100;
        
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.5,
            roughness: 0.5
        });
        
        // Wall configurations [x, y, z, rotationY]
        const walls = [
            [0, wallHeight/2, arenaSize/2, 0],      // Front
            [0, wallHeight/2, -arenaSize/2, 0],     // Back
            [arenaSize/2, wallHeight/2, 0, Math.PI/2],   // Right
            [-arenaSize/2, wallHeight/2, 0, Math.PI/2]   // Left
        ];
        
        walls.forEach(([x, y, z, rotation]) => {
            // Visual wall
            const wallGeometry = new THREE.BoxGeometry(
                rotation === 0 ? arenaSize : wallThickness,
                wallHeight,
                rotation === 0 ? wallThickness : arenaSize
            );
            const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
            wallMesh.position.set(x, y, z);
            wallMesh.castShadow = true;
            wallMesh.receiveShadow = true;
            this.renderer.scene.add(wallMesh);
            
            // Physics wall
            const wallShape = new CANNON.Box(new CANNON.Vec3(
                rotation === 0 ? arenaSize/2 : wallThickness/2,
                wallHeight/2,
                rotation === 0 ? wallThickness/2 : arenaSize/2
            ));
            const wallBody = new CANNON.Body({
                mass: 0,
                shape: wallShape,
                material: this.physics.materials.metal
            });
            wallBody.position.set(x, y, z);
            this.physics.addBody(wallBody);
        });
    }

    createObstacles() {
        // Create various obstacles for testing vehicle physics
        const obstacleMaterial = new THREE.MeshStandardMaterial({
            color: 0xff4444,
            metalness: 0.6,
            roughness: 0.4
        });
        
        // Create boxes
        for (let i = 0; i < 5; i++) {
            const size = 2 + Math.random() * 3;
            const boxGeometry = new THREE.BoxGeometry(size, size, size);
            const boxMesh = new THREE.Mesh(boxGeometry, obstacleMaterial);
            
            const x = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 80;
            boxMesh.position.set(x, size/2, z);
            boxMesh.castShadow = true;
            boxMesh.receiveShadow = true;
            this.renderer.scene.add(boxMesh);
            
            // Physics
            const boxShape = new CANNON.Box(new CANNON.Vec3(size/2, size/2, size/2));
            const boxBody = new CANNON.Body({
                mass: 100,
                shape: boxShape,
                material: this.physics.materials.metal
            });
            boxBody.position.copy(boxMesh.position);
            this.physics.addBody(boxBody);
            
            this.dynamicObjects.push({ mesh: boxMesh, body: boxBody });
        }
        
        // Create cylinders (barrels)
        const barrelMaterial = new THREE.MeshStandardMaterial({
            color: 0x4444ff,
            metalness: 0.7,
            roughness: 0.3
        });
        
        for (let i = 0; i < 8; i++) {
            const radius = 1;
            const height = 2;
            const cylinderGeometry = new THREE.CylinderGeometry(radius, radius, height, 16);
            const cylinderMesh = new THREE.Mesh(cylinderGeometry, barrelMaterial);
            
            const x = (Math.random() - 0.5) * 60;
            const z = (Math.random() - 0.5) * 60;
            cylinderMesh.position.set(x, height/2, z);
            cylinderMesh.castShadow = true;
            cylinderMesh.receiveShadow = true;
            this.renderer.scene.add(cylinderMesh);
            
            // Physics (using compound shape)
            const cylinderShape = new CANNON.Box(new CANNON.Vec3(radius, height/2, radius));
            const cylinderBody = new CANNON.Body({
                mass: 50,
                shape: cylinderShape,
                material: this.physics.materials.metal
            });
            cylinderBody.position.copy(cylinderMesh.position);
            this.physics.addBody(cylinderBody);
            
            this.dynamicObjects.push({ mesh: cylinderMesh, body: cylinderBody });
        }
    }

    createRamps() {
        // Create ramps for jumping
        const rampMaterial = new THREE.MeshStandardMaterial({
            color: 0x44ff44,
            metalness: 0.3,
            roughness: 0.7
        });
        
        // Simple ramp
        const createRamp = (x, z, rotation = 0) => {
            const width = 10;
            const length = 20;
            const height = 5;
            
            // Create ramp geometry
            const shape = new THREE.Shape();
            shape.moveTo(0, 0);
            shape.lineTo(length, 0);
            shape.lineTo(length, height);
            shape.closePath();
            
            const extrudeSettings = {
                steps: 1,
                depth: width,
                bevelEnabled: false
            };
            
            const rampGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            rampGeometry.rotateX(-Math.PI / 2);
            
            const rampMesh = new THREE.Mesh(rampGeometry, rampMaterial);
            rampMesh.position.set(x, 0, z);
            rampMesh.rotation.y = rotation;
            rampMesh.castShadow = true;
            rampMesh.receiveShadow = true;
            this.renderer.scene.add(rampMesh);
            
            // Physics (using trimesh)
            const vertices = [];
            const indices = [];
            
            // Bottom face
            vertices.push(0, 0, 0);
            vertices.push(length, 0, 0);
            vertices.push(length, 0, width);
            vertices.push(0, 0, width);
            
            // Top face
            vertices.push(0, height, 0);
            vertices.push(length, height, 0);
            vertices.push(length, height, width);
            vertices.push(0, height, width);
            
            // Create triangles
            // Bottom
            indices.push(0, 1, 2);
            indices.push(0, 2, 3);
            
            // Top slope
            indices.push(1, 5, 6);
            indices.push(1, 6, 2);
            
            // Sides
            indices.push(0, 4, 7);
            indices.push(0, 7, 3);
            
            indices.push(4, 5, 6);
            indices.push(4, 6, 7);
            
            // Back
            indices.push(0, 1, 5);
            indices.push(0, 5, 4);
            
            // Front
            indices.push(2, 3, 7);
            indices.push(2, 7, 6);
            
            const rampShape = new CANNON.Trimesh(vertices, indices);
            const rampBody = new CANNON.Body({
                mass: 0,
                shape: rampShape,
                material: this.physics.materials.ground
            });
            rampBody.position.set(x, 0, z);
            rampBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), rotation);
            this.physics.addBody(rampBody);
        };
        
        // Place ramps
        createRamp(30, 0, 0);
        createRamp(-30, 0, Math.PI);
        createRamp(0, 30, Math.PI / 2);
        createRamp(0, -30, -Math.PI / 2);
    }

    update(deltaTime) {
        // Update dynamic objects (sync physics to visuals)
        this.dynamicObjects.forEach(obj => {
            obj.mesh.position.copy(obj.body.position);
            obj.mesh.quaternion.copy(obj.body.quaternion);
        });
        
        // Update any animated elements
        // Could add moving platforms, rotating obstacles, etc.
    }

    destroy() {
        // Clean up all objects
        this.objects.forEach(obj => {
            if (obj.mesh) {
                this.renderer.scene.remove(obj.mesh);
                if (obj.mesh.geometry) obj.mesh.geometry.dispose();
                if (obj.mesh.material) obj.mesh.material.dispose();
            }
            if (obj.body) {
                this.physics.removeBody(obj.body);
            }
        });
        
        this.dynamicObjects.forEach(obj => {
            if (obj.mesh) {
                this.renderer.scene.remove(obj.mesh);
                if (obj.mesh.geometry) obj.mesh.geometry.dispose();
                if (obj.mesh.material) obj.mesh.material.dispose();
            }
            if (obj.body) {
                this.physics.removeBody(obj.body);
            }
        });
        
        this.objects = [];
        this.dynamicObjects = [];
    }
}