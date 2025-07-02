// Race Track System - Track generation and management
class RaceTrack {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.physicsManager = new PhysicsManager(world);
        
        // Track components
        this.trackGroup = new THREE.Group();
        this.trackMesh = null;
        this.barriers = [];
        this.checkpoints = [];
        this.decorations = [];
        
        // Track properties
        this.trackWidth = 12;
        this.barrierHeight = 2;
        this.trackLength = 200;
        
        // Checkpoint system
        this.currentCheckpoint = 0;
        this.lapCount = 0;
        
        this.scene.add(this.trackGroup);
    }
    
    async init() {
        this.createTrackLayout();
        this.createBarriers();
        this.createCheckpoints();
        this.createDecorations();
        this.createStartFinishLine();
    }
    
    createTrackLayout() {
        // Create a figure-8 or oval track using curves
        const trackPoints = this.generateTrackPoints();
        const trackGeometry = this.createTrackMesh(trackPoints);
        
        // Track surface
        const trackMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x444444
        });
        
        this.trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
        this.trackMesh.receiveShadow = true;
        this.trackGroup.add(this.trackMesh);
        
        // Create physics body for the track
        this.createTrackPhysics(trackPoints);
    }
    
    generateTrackPoints() {
        // Generate points for a figure-8 track
        const points = [];
        const segments = 64;
        const scale = 50;
        
        for (let i = 0; i <= segments; i++) {
            const t = (i / segments) * Math.PI * 2;
            
            // Figure-8 parametric equations
            const x = scale * Math.sin(t);
            const z = scale * Math.sin(t) * Math.cos(t);
            const y = 0;
            
            points.push(new THREE.Vector3(x, y, z));
        }
        
        return points;
    }
    
    createTrackMesh(points) {
        // Create track geometry from points
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        const normals = [];
        const uvs = [];
        
        // Generate track surface
        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];
            
            // Calculate direction and perpendicular
            const direction = new THREE.Vector3().subVectors(next, current).normalize();
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
            
            // Create track width
            const leftEdge = current.clone().add(perpendicular.clone().multiplyScalar(this.trackWidth / 2));
            const rightEdge = current.clone().add(perpendicular.clone().multiplyScalar(-this.trackWidth / 2));
            const leftEdgeNext = next.clone().add(perpendicular.clone().multiplyScalar(this.trackWidth / 2));
            const rightEdgeNext = next.clone().add(perpendicular.clone().multiplyScalar(-this.trackWidth / 2));
            
            // Add vertices
            const baseIndex = vertices.length / 3;
            
            vertices.push(leftEdge.x, leftEdge.y, leftEdge.z);
            vertices.push(rightEdge.x, rightEdge.y, rightEdge.z);
            vertices.push(leftEdgeNext.x, leftEdgeNext.y, leftEdgeNext.z);
            vertices.push(rightEdgeNext.x, rightEdgeNext.y, rightEdgeNext.z);
            
            // Add triangles
            indices.push(
                baseIndex, baseIndex + 1, baseIndex + 2,
                baseIndex + 1, baseIndex + 3, baseIndex + 2
            );
            
            // Add normals (pointing up)
            for (let j = 0; j < 4; j++) {
                normals.push(0, 1, 0);
            }
            
            // Add UVs
            const u = i / (points.length - 1);
            uvs.push(0, u, 1, u, 0, u + 1 / (points.length - 1), 1, u + 1 / (points.length - 1));
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        
        return geometry;
    }
    
    createTrackPhysics(points) {
        // Create a simple ground plane for now instead of complex trimesh
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        groundBody.material = this.physicsManager.materials.track;
        this.world.add(groundBody);
    }
    
    createBarriers() {
        const trackPoints = this.generateTrackPoints();
        
        for (let i = 0; i < trackPoints.length - 1; i++) {
            const current = trackPoints[i];
            const next = trackPoints[i + 1];
            
            const direction = new THREE.Vector3().subVectors(next, current).normalize();
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
            
            // Left barrier
            const leftBarrierPos = current.clone().add(perpendicular.clone().multiplyScalar(this.trackWidth / 2 + 1));
            this.createBarrier(leftBarrierPos, direction);
            
            // Right barrier
            const rightBarrierPos = current.clone().add(perpendicular.clone().multiplyScalar(-this.trackWidth / 2 - 1));
            this.createBarrier(rightBarrierPos, direction);
        }
    }
    
    createBarrier(position, direction) {
        // Visual barrier
        const barrierGeometry = new THREE.BoxGeometry(0.5, this.barrierHeight, 2);
        const barrierMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xff4444,
            transparent: true,
            opacity: 0.8
        });
        
        const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
        barrier.position.copy(position);
        barrier.position.y = this.barrierHeight / 2;
        barrier.castShadow = true;
        barrier.receiveShadow = true;
        
        // Align with track direction
        const angle = Math.atan2(direction.x, direction.z);
        barrier.rotation.y = angle;
        
        this.trackGroup.add(barrier);
        this.barriers.push(barrier);
        
        // Physics barrier
        const physicsBarrier = this.physicsManager.createBarrier(
            { x: position.x, y: position.y + this.barrierHeight / 2, z: position.z },
            { x: 0.5, y: this.barrierHeight, z: 2 },
            { x: 0, y: angle, z: 0 }
        );
    }
    
    createCheckpoints() {
        const trackPoints = this.generateTrackPoints();
        const checkpointInterval = Math.floor(trackPoints.length / 8); // 8 checkpoints
        
        for (let i = 0; i < trackPoints.length; i += checkpointInterval) {
            if (i >= trackPoints.length - 1) break;
            
            const point = trackPoints[i];
            const next = trackPoints[Math.min(i + 1, trackPoints.length - 1)];
            const direction = new THREE.Vector3().subVectors(next, point).normalize();
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
            
            // Create checkpoint spanning the track width
            const checkpoint = {
                id: this.checkpoints.length,
                position: point.clone(),
                direction: direction.clone(),
                perpendicular: perpendicular.clone(),
                passed: false,
                isFinishLine: i === 0 // First checkpoint is finish line
            };
            
            this.checkpoints.push(checkpoint);
            
            // Visual representation (invisible during race, visible in debug)
            this.createCheckpointVisual(checkpoint);
            
            // Physics body for detection
            const physicsCheckpoint = this.physicsManager.createCheckpoint(
                { x: point.x, y: point.y + 2, z: point.z },
                { x: this.trackWidth, y: 4, z: 2 }
            );
            physicsCheckpoint.checkpointId = checkpoint.id;
        }
    }
    
    createCheckpointVisual(checkpoint) {
        // Create visual checkpoint (normally invisible)
        const geometry = new THREE.PlaneGeometry(this.trackWidth, 4);
        const material = new THREE.MeshBasicMaterial({ 
            color: checkpoint.isFinishLine ? 0x00ff00 : 0x0088ff,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });
        
        const visual = new THREE.Mesh(geometry, material);
        visual.position.copy(checkpoint.position);
        visual.position.y += 2;
        
        const angle = Math.atan2(checkpoint.direction.x, checkpoint.direction.z);
        visual.rotation.y = angle + Math.PI / 2;
        
        visual.visible = false; // Hidden by default
        this.trackGroup.add(visual);
        
        checkpoint.visual = visual;
    }
    
    createDecorations() {
        // Add trackside decorations
        this.createTrees();
        this.createGrandstand();
        this.createLighting();
    }
    
    createTrees() {
        const trackPoints = this.generateTrackPoints();
        const treePositions = [];
        
        // Generate tree positions around the track
        for (let i = 0; i < trackPoints.length; i += 5) {
            const point = trackPoints[i];
            const direction = new THREE.Vector3().subVectors(
                trackPoints[Math.min(i + 1, trackPoints.length - 1)], 
                point
            ).normalize();
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
            
            // Trees on both sides
            const leftTreePos = point.clone().add(perpendicular.clone().multiplyScalar(20 + Math.random() * 10));
            const rightTreePos = point.clone().add(perpendicular.clone().multiplyScalar(-20 - Math.random() * 10));
            
            treePositions.push(leftTreePos, rightTreePos);
        }
        
        treePositions.forEach(pos => {
            this.createTree(pos);
        });
    }
    
    createTree(position) {
        const treeGroup = new THREE.Group();
        
        // Trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 4, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 2;
        trunk.castShadow = true;
        treeGroup.add(trunk);
        
        // Foliage
        const foliageGeometry = new THREE.SphereGeometry(2 + Math.random(), 8, 6);
        const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = 5;
        foliage.castShadow = true;
        treeGroup.add(foliage);
        
        treeGroup.position.copy(position);
        this.trackGroup.add(treeGroup);
        this.decorations.push(treeGroup);
    }
    
    createGrandstand() {
        // Create a simple grandstand structure
        const grandstandGeometry = new THREE.BoxGeometry(30, 8, 10);
        const grandstandMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const grandstand = new THREE.Mesh(grandstandGeometry, grandstandMaterial);
        
        grandstand.position.set(0, 4, -60);
        grandstand.castShadow = true;
        grandstand.receiveShadow = true;
        
        this.trackGroup.add(grandstand);
        this.decorations.push(grandstand);
    }
    
    createLighting() {
        // Add some trackside lighting
        const trackPoints = this.generateTrackPoints();
        
        for (let i = 0; i < trackPoints.length; i += 10) {
            const point = trackPoints[i];
            const direction = new THREE.Vector3().subVectors(
                trackPoints[Math.min(i + 1, trackPoints.length - 1)], 
                point
            ).normalize();
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
            
            const lightPos = point.clone().add(perpendicular.clone().multiplyScalar(15));
            this.createLightPole(lightPos);
        }
    }
    
    createLightPole(position) {
        const poleGroup = new THREE.Group();
        
        // Pole
        const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 8, 8);
        const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = 4;
        pole.castShadow = true;
        poleGroup.add(pole);
        
        // Light
        const lightGeometry = new THREE.SphereGeometry(0.5, 8, 6);
        const lightMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffffcc,
            emissive: 0x222200
        });
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.y = 8;
        poleGroup.add(light);
        
        // Actual light source
        const spotLight = new THREE.SpotLight(0xffffff, 0.5, 30, Math.PI / 6, 0.5);
        spotLight.position.set(0, 8, 0);
        spotLight.target.position.set(0, 0, 0);
        spotLight.castShadow = true;
        poleGroup.add(spotLight);
        poleGroup.add(spotLight.target);
        
        poleGroup.position.copy(position);
        this.trackGroup.add(poleGroup);
        this.decorations.push(poleGroup);
    }
    
    createStartFinishLine() {
        // Create start/finish line visual
        const lineGeometry = new THREE.PlaneGeometry(this.trackWidth, 0.5);
        const lineMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        
        const finishLine = new THREE.Mesh(lineGeometry, lineMaterial);
        const startPoint = this.checkpoints.find(cp => cp.isFinishLine);
        
        if (startPoint) {
            finishLine.position.copy(startPoint.position);
            finishLine.position.y += 0.1;
            finishLine.rotation.x = -Math.PI / 2;
            
            const angle = Math.atan2(startPoint.direction.x, startPoint.direction.z);
            finishLine.rotation.z = angle;
        }
        
        this.trackGroup.add(finishLine);
    }
    
    checkLapCompletion(motorcyclePosition) {
        // Check if motorcycle has passed through checkpoints in order
        const currentCheckpoint = this.checkpoints[this.currentCheckpoint];
        
        if (!currentCheckpoint) return false;
        
        const distance = motorcyclePosition.distanceTo(currentCheckpoint.position);
        
        if (distance < 5) { // Within checkpoint range
            currentCheckpoint.passed = true;
            this.currentCheckpoint = (this.currentCheckpoint + 1) % this.checkpoints.length;
            
            // If we've completed all checkpoints, lap is complete
            if (this.currentCheckpoint === 0) {
                this.lapCount++;
                this.resetCheckpoints();
                return true;
            }
        }
        
        return false;
    }
    
    resetCheckpoints() {
        this.checkpoints.forEach(checkpoint => {
            checkpoint.passed = false;
        });
        this.currentCheckpoint = 0;
    }
    
    getCheckpoints() {
        return this.checkpoints;
    }
    
    getTrackLength() {
        return this.trackLength;
    }
    
    getTrackWidth() {
        return this.trackWidth;
    }
    
    getStartPosition() {
        const startCheckpoint = this.checkpoints.find(cp => cp.isFinishLine);
        return startCheckpoint ? startCheckpoint.position.clone() : new THREE.Vector3(0, 1, 0);
    }
    
    getStartRotation() {
        const startCheckpoint = this.checkpoints.find(cp => cp.isFinishLine);
        if (startCheckpoint) {
            const angle = Math.atan2(startCheckpoint.direction.x, startCheckpoint.direction.z);
            return new THREE.Euler(0, angle, 0);
        }
        return new THREE.Euler(0, 0, 0);
    }
    
    enableDebugView() {
        // Show checkpoint visuals for debugging
        this.checkpoints.forEach(checkpoint => {
            if (checkpoint.visual) {
                checkpoint.visual.visible = true;
            }
        });
    }
    
    disableDebugView() {
        // Hide checkpoint visuals
        this.checkpoints.forEach(checkpoint => {
            if (checkpoint.visual) {
                checkpoint.visual.visible = false;
            }
        });
    }
    
    destroy() {
        // Clean up all track components
        this.scene.remove(this.trackGroup);
        this.physicsManager.cleanup();
    }
}