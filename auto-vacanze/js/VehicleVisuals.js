export class VehicleVisuals {
    constructor(scene, dimensions, nodeBeamStructure) {
        this.scene = scene;
        this.dimensions = dimensions;
        this.nodeBeamStructure = nodeBeamStructure;
        
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        this.bodyMesh = null;
        this.windowMeshes = [];
        this.detailMeshes = [];
        
        this.originalGeometry = null;
        this.deformableGeometry = null;
        
        this.createVehicleMesh();
        this.createDetails();
    }
    
    createVehicleMesh() {
        const { width, height, length } = this.dimensions;
        
        // Create main body shape (simplified car shape)
        const shape = new THREE.Shape();
        
        // Side profile of car
        shape.moveTo(-length/2, 0);
        shape.lineTo(-length/2 + length*0.15, 0);
        shape.lineTo(-length/2 + length*0.25, height*0.4);
        shape.lineTo(-length/2 + length*0.4, height*0.8);
        shape.lineTo(length/2 - length*0.3, height*0.8);
        shape.lineTo(length/2 - length*0.1, height*0.4);
        shape.lineTo(length/2, 0);
        shape.closePath();
        
        // Extrude to create 3D shape
        const extrudeSettings = {
            depth: width,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelSegments: 3
        };
        
        this.originalGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        this.originalGeometry.center();
        
        // Create deformable geometry
        this.deformableGeometry = this.originalGeometry.clone();
        
        // Materials
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x2196F3,
            metalness: 0.6,
            roughness: 0.4,
            envMapIntensity: 1
        });
        
        this.bodyMesh = new THREE.Mesh(this.deformableGeometry, bodyMaterial);
        this.bodyMesh.castShadow = true;
        this.bodyMesh.receiveShadow = true;
        this.group.add(this.bodyMesh);
        
        // Add paint effect
        this.addPaintEffect();
    }
    
    addPaintEffect() {
        // Create a simple car paint shader
        this.bodyMesh.material.onBeforeCompile = (shader) => {
            shader.uniforms.time = { value: 0 };
            
            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `
                #include <common>
                varying vec3 vWorldPosition;
                varying vec3 vWorldNormal;
                `
            );
            
            shader.vertexShader = shader.vertexShader.replace(
                '#include <worldpos_vertex>',
                `
                #include <worldpos_vertex>
                vWorldPosition = worldPosition.xyz;
                vWorldNormal = normalize(mat3(modelMatrix) * normal);
                `
            );
            
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `
                #include <common>
                varying vec3 vWorldPosition;
                varying vec3 vWorldNormal;
                uniform float time;
                `
            );
            
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <dithering_fragment>',
                `
                #include <dithering_fragment>
                
                // Add metallic flakes
                vec3 viewDir = normalize(cameraPosition - vWorldPosition);
                float sparkle = pow(max(0.0, dot(reflect(-viewDir, vWorldNormal), vec3(0.0, 1.0, 0.0))), 100.0);
                gl_FragColor.rgb += sparkle * 0.2;
                `
            );
        };
    }
    
    createDetails() {
        // Windows
        this.createWindows();
        
        // Lights
        this.createLights();
        
        // Grille and details
        this.createGrille();
    }
    
    createWindows() {
        const windowMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x303040,
            metalness: 0,
            roughness: 0,
            transmission: 0.9,
            envMapIntensity: 1,
            clearcoat: 1,
            clearcoatRoughness: 0
        });
        
        // Windshield
        const windshieldGeo = new THREE.PlaneGeometry(
            this.dimensions.width * 0.8,
            this.dimensions.height * 0.4
        );
        const windshield = new THREE.Mesh(windshieldGeo, windowMaterial);
        windshield.position.set(0, this.dimensions.height * 0.5, this.dimensions.length * 0.15);
        windshield.rotation.x = -Math.PI * 0.3;
        this.group.add(windshield);
        this.windowMeshes.push(windshield);
        
        // Side windows
        const sideWindowGeo = new THREE.PlaneGeometry(
            this.dimensions.length * 0.3,
            this.dimensions.height * 0.35
        );
        
        [-1, 1].forEach(side => {
            const sideWindow = new THREE.Mesh(sideWindowGeo, windowMaterial);
            sideWindow.position.set(
                this.dimensions.width * 0.5 * side,
                this.dimensions.height * 0.5,
                0
            );
            sideWindow.rotation.y = Math.PI * 0.5 * side;
            this.group.add(sideWindow);
            this.windowMeshes.push(sideWindow);
        });
    }
    
    createLights() {
        // Headlights
        const headlightGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.1, 8);
        const headlightMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffaa,
            emissiveIntensity: 0.5
        });
        
        [-1, 1].forEach(side => {
            const headlight = new THREE.Mesh(headlightGeo, headlightMat);
            headlight.position.set(
                this.dimensions.width * 0.3 * side,
                0,
                this.dimensions.length * 0.48
            );
            headlight.rotation.z = Math.PI * 0.5;
            this.group.add(headlight);
            this.detailMeshes.push(headlight);
            
            // Add point light
            const light = new THREE.PointLight(0xffffaa, 0.5, 10);
            light.position.copy(headlight.position);
            this.group.add(light);
        });
        
        // Taillights
        const taillightMat = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.3
        });
        
        [-1, 1].forEach(side => {
            const taillight = new THREE.Mesh(headlightGeo, taillightMat);
            taillight.position.set(
                this.dimensions.width * 0.35 * side,
                this.dimensions.height * 0.2,
                -this.dimensions.length * 0.48
            );
            taillight.rotation.z = Math.PI * 0.5;
            this.group.add(taillight);
            this.detailMeshes.push(taillight);
        });
    }
    
    createGrille() {
        const grilleGeo = new THREE.PlaneGeometry(
            this.dimensions.width * 0.6,
            this.dimensions.height * 0.3
        );
        
        const grilleMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.8,
            roughness: 0.2
        });
        
        const grille = new THREE.Mesh(grilleGeo, grilleMat);
        grille.position.set(0, this.dimensions.height * 0.2, this.dimensions.length * 0.49);
        this.group.add(grille);
        this.detailMeshes.push(grille);
    }
    
    update() {
        // Update mesh deformation based on node-beam structure
        this.updateDeformation();
        
        // Update damage visuals
        this.updateDamageVisuals();
    }
    
    updateDeformation() {
        if (!this.deformableGeometry || !this.nodeBeamStructure) return;
        
        const positions = this.deformableGeometry.attributes.position;
        const originalPositions = this.originalGeometry.attributes.position;
        
        // For each vertex, find nearest nodes and interpolate deformation
        for (let i = 0; i < positions.count; i++) {
            const vertex = new THREE.Vector3(
                originalPositions.getX(i),
                originalPositions.getY(i),
                originalPositions.getZ(i)
            );
            
            // Find nearest nodes
            const nearestNodes = this.findNearestNodes(vertex, 4);
            
            // Interpolate deformation
            const deformedPos = this.interpolateDeformation(vertex, nearestNodes);
            
            positions.setXYZ(i, deformedPos.x, deformedPos.y, deformedPos.z);
        }
        
        positions.needsUpdate = true;
        this.deformableGeometry.computeVertexNormals();
    }
    
    findNearestNodes(vertex, count) {
        const nodes = this.nodeBeamStructure.nodes;
        const distances = [];
        
        nodes.forEach((node, index) => {
            const nodePos = new THREE.Vector3(
                node.body.position.x,
                node.body.position.y,
                node.body.position.z
            );
            
            const distance = vertex.distanceTo(nodePos);
            distances.push({ index, distance, node });
        });
        
        distances.sort((a, b) => a.distance - b.distance);
        return distances.slice(0, count);
    }
    
    interpolateDeformation(vertex, nearestNodes) {
        if (nearestNodes.length === 0) return vertex;
        
        const deformedPos = new THREE.Vector3();
        let totalWeight = 0;
        
        nearestNodes.forEach(({ node, distance }) => {
            const weight = 1 / (distance + 0.01); // Avoid division by zero
            const nodePos = node.body.position;
            const restPos = this.nodeBeamStructure.restPositions[
                this.nodeBeamStructure.nodes.indexOf(node)
            ];
            
            const deformation = new THREE.Vector3(
                nodePos.x - restPos.x,
                nodePos.y - restPos.y,
                nodePos.z - restPos.z
            );
            
            deformedPos.add(
                vertex.clone().add(deformation).multiplyScalar(weight)
            );
            totalWeight += weight;
        });
        
        return deformedPos.divideScalar(totalWeight);
    }
    
    updateDamageVisuals() {
        const damage = this.nodeBeamStructure.getDeformationAmount();
        
        // Update material based on damage
        if (damage > 0.1) {
            this.bodyMesh.material.roughness = Math.min(0.8, 0.4 + damage);
            this.bodyMesh.material.metalness = Math.max(0.2, 0.6 - damage);
        }
        
        // Crack windows if damage is high
        if (damage > 0.5) {
            this.windowMeshes.forEach(window => {
                window.material.roughness = 0.8;
                window.material.transmission = 0.3;
            });
        }
    }
    
    dispose() {
        // Remove from scene
        this.scene.remove(this.group);
        
        // Dispose geometries and materials
        if (this.bodyMesh) {
            this.bodyMesh.geometry.dispose();
            this.bodyMesh.material.dispose();
        }
        
        this.windowMeshes.forEach(mesh => {
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        
        this.detailMeshes.forEach(mesh => {
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
    }
}