import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class NodeBeamStructure {
    constructor(physicsWorld, scene, chassisBody, chassisMesh) {
        this.physicsWorld = physicsWorld;
        this.scene = scene;
        this.chassisBody = chassisBody;
        this.chassisMesh = chassisMesh;
        
        this.nodes = [];
        this.beams = [];
        this.springs = [];
        this.constraints = [];
        
        this.nodeMeshes = [];
        this.beamLines = [];
        
        this.damage = 0;
        this.maxStress = 10000;
        this.breakThreshold = 15000;
        
        this.showDebug = false;
    }

    init() {
        this.createNodes();
        this.createBeams();
        this.createVisuals();
    }

    createNodes() {
        // Define node positions relative to chassis center
        // This creates a simplified cage structure around the vehicle
        const nodeConfig = [
            // Front nodes
            { x: -0.8, y: -0.3, z: -2.0, mass: 10 },
            { x: 0.8, y: -0.3, z: -2.0, mass: 10 },
            { x: -0.8, y: 0.5, z: -1.8, mass: 5 },
            { x: 0.8, y: 0.5, z: -1.8, mass: 5 },
            
            // Middle front nodes
            { x: -0.9, y: -0.3, z: -0.5, mass: 15 },
            { x: 0.9, y: -0.3, z: -0.5, mass: 15 },
            { x: -0.9, y: 0.7, z: -0.5, mass: 8 },
            { x: 0.9, y: 0.7, z: -0.5, mass: 8 },
            
            // Middle rear nodes
            { x: -0.9, y: -0.3, z: 0.5, mass: 15 },
            { x: 0.9, y: -0.3, z: 0.5, mass: 15 },
            { x: -0.9, y: 0.7, z: 0.5, mass: 8 },
            { x: 0.9, y: 0.7, z: 0.5, mass: 8 },
            
            // Rear nodes
            { x: -0.8, y: -0.3, z: 2.0, mass: 10 },
            { x: 0.8, y: -0.3, z: 2.0, mass: 10 },
            { x: -0.8, y: 0.5, z: 1.8, mass: 5 },
            { x: 0.8, y: 0.5, z: 1.8, mass: 5 },
            
            // Roof nodes
            { x: -0.7, y: 1.2, z: -0.3, mass: 3 },
            { x: 0.7, y: 1.2, z: -0.3, mass: 3 },
            { x: -0.7, y: 1.2, z: 0.3, mass: 3 },
            { x: 0.7, y: 1.2, z: 0.3, mass: 3 }
        ];

        // Create node bodies
        nodeConfig.forEach((config, index) => {
            const shape = new CANNON.Sphere(0.05); // Small sphere for each node
            const body = new CANNON.Body({
                mass: config.mass,
                shape: shape,
                material: this.physicsWorld.materials?.vehicleBody
            });
            
            // Position relative to chassis
            const worldPos = this.chassisBody.position.clone();
            worldPos.x += config.x;
            worldPos.y += config.y;
            worldPos.z += config.z;
            body.position.copy(worldPos);
            
            this.physicsWorld.addBody(body);
            
            this.nodes.push({
                body: body,
                localPosition: new CANNON.Vec3(config.x, config.y, config.z),
                originalPosition: config,
                connections: [],
                stress: 0,
                broken: false
            });
        });
    }

    createBeams() {
        // Define beam connections (indices of nodes to connect)
        const beamConnections = [
            // Front frame
            [0, 1], [2, 3], [0, 2], [1, 3],
            [0, 3], [1, 2], // Cross bracing
            
            // Connect front to middle
            [0, 4], [1, 5], [2, 6], [3, 7],
            
            // Middle frame
            [4, 5], [6, 7], [4, 6], [5, 7],
            [4, 7], [5, 6], // Cross bracing
            
            // Connect middle sections
            [4, 8], [5, 9], [6, 10], [7, 11],
            [8, 9], [10, 11], [8, 10], [9, 11],
            
            // Connect to rear
            [8, 12], [9, 13], [10, 14], [11, 15],
            
            // Rear frame
            [12, 13], [14, 15], [12, 14], [13, 15],
            [12, 15], [13, 14], // Cross bracing
            
            // Roof connections
            [6, 16], [7, 17], [10, 18], [11, 19],
            [16, 17], [18, 19], [16, 18], [17, 19],
            [16, 19], [17, 18], // Cross bracing
            
            // Pillars
            [2, 16], [3, 17], [14, 18], [15, 19]
        ];

        // Create beams (constraints only for now)
        beamConnections.forEach(([indexA, indexB]) => {
            const nodeA = this.nodes[indexA];
            const nodeB = this.nodes[indexB];
            
            if (!nodeA || !nodeB) return;
            
            // Calculate rest length
            const distance = nodeA.body.position.distanceTo(nodeB.body.position);
            
            // Create distance constraint for rigidity
            const constraint = new CANNON.DistanceConstraint(
                nodeA.body,
                nodeB.body,
                distance,
                1e6
            );
            this.physicsWorld.addConstraint(constraint);
            
            // Store beam data
            const beam = {
                nodeA: nodeA,
                nodeB: nodeB,
                constraint: constraint,
                restLength: distance,
                broken: false,
                stress: 0
            };
            
            this.beams.push(beam);
            
            // Add connections to nodes
            nodeA.connections.push(beam);
            nodeB.connections.push(beam);
        });

        // Connect nodes to chassis with constraints
        this.nodes.forEach(node => {
            const constraint = new CANNON.PointToPointConstraint(
                this.chassisBody,
                node.localPosition,
                node.body,
                new CANNON.Vec3()
            );
            this.physicsWorld.addConstraint(constraint);
            this.constraints.push(constraint);
        });
    }

    createVisuals() {
        // Create node visualizations (debug spheres)
        this.nodes.forEach(node => {
            const geometry = new THREE.SphereGeometry(0.05, 8, 8);
            const material = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                visible: this.showDebug
            });
            const mesh = new THREE.Mesh(geometry, material);
            this.scene.add(mesh);
            this.nodeMeshes.push(mesh);
        });

        // Create beam visualizations (debug lines)
        this.updateBeamVisuals();
    }

    updateBeamVisuals() {
        // Remove old lines
        this.beamLines.forEach(line => {
            this.scene.remove(line);
            line.geometry.dispose();
        });
        this.beamLines = [];

        if (!this.showDebug) return;

        // Create new lines
        this.beams.forEach(beam => {
            if (beam.broken) return;
            
            const points = [
                beam.nodeA.body.position,
                beam.nodeB.body.position
            ];
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: this.getStressColor(beam.stress)
            });
            const line = new THREE.Line(geometry, material);
            this.scene.add(line);
            this.beamLines.push(line);
        });
    }

    getStressColor(stress) {
        const normalizedStress = Math.min(stress / this.maxStress, 1);
        const r = Math.floor(normalizedStress * 255);
        const g = Math.floor((1 - normalizedStress) * 255);
        return (r << 16) | (g << 8) | 0;
    }

    update(deltaTime) {
        // Update node positions
        this.nodes.forEach((node, index) => {
            if (node.broken) return;
            
            // Update visual representation
            if (this.nodeMeshes[index]) {
                this.nodeMeshes[index].position.copy(node.body.position);
            }
        });

        // Calculate beam stress
        let totalStress = 0;
        this.beams.forEach(beam => {
            if (beam.broken) return;
            
            const currentLength = beam.nodeA.body.position.distanceTo(beam.nodeB.body.position);
            const strain = Math.abs(currentLength - beam.restLength) / beam.restLength;
            beam.stress = strain * this.maxStress;
            
            totalStress += beam.stress;
            
            // Check for beam failure
            if (beam.stress > this.breakThreshold) {
                this.breakBeam(beam);
            }
        });

        // Update damage value
        this.damage = Math.min(totalStress / (this.beams.length * 1000), this.maxDamage);

        // Update visual debug
        if (this.showDebug) {
            this.updateBeamVisuals();
        }

        // Apply deformation to chassis mesh
        this.applyDeformation();
    }

    breakBeam(beam) {
        beam.broken = true;
        
        // Remove constraint
        if (beam.constraint) {
            this.physicsWorld.removeConstraint(beam.constraint);
        }
        
        // Reduce node mass when disconnected
        beam.nodeA.body.mass *= 0.5;
        beam.nodeB.body.mass *= 0.5;
        
        console.log('Beam broken due to stress!');
    }

    applyDeformation() {
        // This would deform the chassis mesh based on node positions
        // For now, we'll just slightly adjust the chassis based on damage
        if (this.chassisMesh && this.damage > 10) {
            const deformScale = 1 - (this.damage / 1000);
            // Apply subtle deformation effect
            // In a full implementation, this would modify mesh vertices
        }
    }

    getDamage() {
        return this.damage;
    }

    reset() {
        // Reset all nodes to original positions
        this.nodes.forEach((node, index) => {
            const config = node.originalPosition;
            const worldPos = this.chassisBody.position.clone();
            worldPos.x += config.x;
            worldPos.y += config.y;
            worldPos.z += config.z;
            node.body.position.copy(worldPos);
            node.body.velocity.set(0, 0, 0);
            node.broken = false;
            node.stress = 0;
        });

        // Reset beams
        this.beams.forEach(beam => {
            beam.broken = false;
            beam.stress = 0;
            
            // Recreate constraints if needed
            if (!beam.constraint) {
                beam.constraint = this.physicsWorld.createDistanceConstraint(
                    beam.nodeA.body,
                    beam.nodeB.body,
                    beam.restLength,
                    1e6
                );
                this.physicsWorld.addConstraint(beam.constraint);
            }
        });

        this.damage = 0;
    }

    toggleDebug() {
        this.showDebug = !this.showDebug;
        
        // Toggle node visibility
        this.nodeMeshes.forEach(mesh => {
            mesh.visible = this.showDebug;
        });
        
        // Update beam visuals
        this.updateBeamVisuals();
    }

    destroy() {
        // Remove all physics bodies
        this.nodes.forEach(node => {
            this.physicsWorld.removeBody(node.body);
        });

        // Remove all constraints
        this.constraints.forEach(constraint => {
            this.physicsWorld.removeConstraint(constraint);
        });

        this.beams.forEach(beam => {
            if (beam.constraint) {
                this.physicsWorld.removeConstraint(beam.constraint);
            }
        });

        // Remove all visual elements
        this.nodeMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });

        this.beamLines.forEach(line => {
            this.scene.remove(line);
            line.geometry.dispose();
        });

        // Clear arrays
        this.nodes = [];
        this.beams = [];
        this.springs = [];
        this.constraints = [];
        this.nodeMeshes = [];
        this.beamLines = [];
    }
}