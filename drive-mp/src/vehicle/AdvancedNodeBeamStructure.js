import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

export class AdvancedNodeBeamStructure {
    constructor(physicsWorld, scene, chassisBody, chassisMesh) {
        this.physicsWorld = physicsWorld;
        this.scene = scene;
        this.chassisBody = chassisBody;
        this.chassisMesh = chassisMesh;
        
        // Advanced node system
        this.nodes = [];
        this.beams = [];
        this.constraints = [];
        this.brokenBeams = [];
        
        // Material properties for different vehicle parts
        this.materials = {
            frame: { stiffness: 100000, damping: 200, breakThreshold: 50000, mass: 15 },
            body: { stiffness: 80000, damping: 150, breakThreshold: 40000, mass: 10 },
            bumper: { stiffness: 30000, damping: 100, breakThreshold: 15000, mass: 5 },
            roof: { stiffness: 60000, damping: 120, breakThreshold: 25000, mass: 8 },
            door: { stiffness: 40000, damping: 110, breakThreshold: 20000, mass: 6 }
        };
        
        // Deformation tracking
        this.deformationData = new Map();
        this.originalPositions = new Map();
        this.partHealth = new Map();
        
        // Visual effects
        this.sparkParticles = [];
        this.damageTextures = [];
        
        this.showDebug = false;
        this.damageAccumulator = 0;
    }

    init() {
        this.createAdvancedNodeStructure();
        this.createAdvancedBeamNetwork();
        this.setupDeformationTracking();
        this.createParticleSystem();
    }

    createAdvancedNodeStructure() {
        // Create a much denser node grid for realistic deformation
        const nodeConfigs = [
            // Front Structure (Crumple Zone)
            ...this.generateGridNodes('front_bumper', -0.9, 0.9, -0.4, 0.4, -2.1, -1.8, 'bumper'),
            ...this.generateGridNodes('front_frame', -0.8, 0.8, -0.2, 0.6, -1.8, -1.2, 'frame'),
            
            // Passenger Cell (Strong)
            ...this.generateGridNodes('cabin_frame', -0.9, 0.9, -0.3, 1.0, -1.2, 1.2, 'frame'),
            ...this.generateGridNodes('roof', -0.7, 0.7, 0.8, 1.2, -0.8, 0.8, 'roof'),
            ...this.generateGridNodes('doors_left', -0.9, -0.7, -0.2, 0.8, -0.8, 0.8, 'door'),
            ...this.generateGridNodes('doors_right', 0.7, 0.9, -0.2, 0.8, -0.8, 0.8, 'door'),
            
            // Rear Structure (Crumple Zone)
            ...this.generateGridNodes('rear_frame', -0.8, 0.8, -0.2, 0.6, 1.2, 1.8, 'frame'),
            ...this.generateGridNodes('rear_bumper', -0.9, 0.9, -0.4, 0.4, 1.8, 2.1, 'bumper'),
            
            // Engine Bay
            ...this.generateGridNodes('engine_bay', -0.6, 0.6, 0.0, 0.5, -1.5, -0.5, 'frame'),
            
            // Floor Pan
            ...this.generateGridNodes('floor', -0.8, 0.8, -0.5, -0.2, -1.0, 1.0, 'frame')
        ];

        // Create physics nodes
        nodeConfigs.forEach((config, index) => {
            const material = this.materials[config.type];
            const shape = new CANNON.Sphere(0.02);
            const body = new CANNON.Body({
                mass: material.mass * 0.1, // Reduced mass for performance
                shape: shape,
                material: this.physicsWorld.materials?.vehicleBody
            });
            
            body.position.set(config.x, config.y, config.z);
            this.physicsWorld.addBody(body);
            
            const node = {
                id: `${config.part}_${index}`,
                body: body,
                originalPos: new THREE.Vector3(config.x, config.y, config.z),
                part: config.part,
                type: config.type,
                connections: [],
                stress: 0,
                broken: false,
                health: 1.0
            };
            
            this.nodes.push(node);
            this.originalPositions.set(node.id, node.originalPos.clone());
            this.partHealth.set(config.part, 1.0);
        });

        console.log(`Created ${this.nodes.length} advanced nodes`);
    }

    generateGridNodes(part, xMin, xMax, yMin, yMax, zMin, zMax, type) {
        const nodes = [];
        const density = type === 'bumper' ? 0.3 : type === 'frame' ? 0.4 : 0.5;
        
        for (let x = xMin; x <= xMax; x += density) {
            for (let y = yMin; y <= yMax; y += density) {
                for (let z = zMin; z <= zMax; z += density) {
                    nodes.push({ x, y, z, part, type });
                }
            }
        }
        return nodes;
    }

    createAdvancedBeamNetwork() {
        // Create intelligent beam connections based on automotive engineering
        this.createStructuralBeams();
        this.createCrumpleZoneBeams();
        this.createSafetyBeams();
        this.createFlexibleConnections();
    }

    createStructuralBeams() {
        // Main frame beams (strongest)
        this.connectNodesByPart('cabin_frame', 'frame', 1.5);
        this.connectNodesByPart('engine_bay', 'frame', 1.2);
        this.connectNodesByPart('floor', 'frame', 1.0);
        
        // Cross-bracing for torsional rigidity
        this.createCrossBracing('cabin_frame', 2.0);
    }

    createCrumpleZoneBeams() {
        // Front crumple zone (designed to deform)
        this.connectNodesByPart('front_bumper', 'bumper', 0.4);
        this.connectNodesByPart('front_frame', 'frame', 0.8);
        
        // Rear crumple zone
        this.connectNodesByPart('rear_bumper', 'bumper', 0.4);
        this.connectNodesByPart('rear_frame', 'frame', 0.8);
        
        // Energy absorption connections
        this.connectParts('front_bumper', 'front_frame', 0.6);
        this.connectParts('rear_bumper', 'rear_frame', 0.6);
    }

    createSafetyBeams() {
        // Door frame reinforcement
        this.connectNodesByPart('doors_left', 'door', 1.0);
        this.connectNodesByPart('doors_right', 'door', 1.0);
        
        // Roof strength for rollover protection
        this.connectNodesByPart('roof', 'roof', 1.2);
        this.connectParts('roof', 'cabin_frame', 1.5);
        
        // A, B, C pillars simulation
        this.createPillars();
    }

    createFlexibleConnections() {
        // Body panels (flexible mounting)
        this.connectPartsFlexible('doors_left', 'cabin_frame', 0.3);
        this.connectPartsFlexible('doors_right', 'cabin_frame', 0.3);
        this.connectPartsFlexible('roof', 'doors_left', 0.4);
        this.connectPartsFlexible('roof', 'doors_right', 0.4);
    }

    connectNodesByPart(partName, materialType, strengthMultiplier = 1.0) {
        const partNodes = this.nodes.filter(n => n.part === partName);
        const material = this.materials[materialType];
        
        partNodes.forEach((nodeA, i) => {
            partNodes.forEach((nodeB, j) => {
                if (i >= j) return;
                
                const distance = nodeA.originalPos.distanceTo(nodeB.originalPos);
                if (distance < 0.8) { // Connect nearby nodes
                    this.createBeam(nodeA, nodeB, material, strengthMultiplier);
                }
            });
        });
    }

    connectParts(partA, partB, strengthMultiplier = 1.0) {
        const nodesA = this.nodes.filter(n => n.part === partA);
        const nodesB = this.nodes.filter(n => n.part === partB);
        
        if (nodesA.length === 0 || nodesB.length === 0) {
            console.warn(`Cannot connect parts ${partA} and ${partB}: one or both parts have no nodes`);
            return;
        }
        
        nodesA.forEach(nodeA => {
            const closest = nodesB.reduce((prev, curr) => {
                const distPrev = nodeA.originalPos.distanceTo(prev.originalPos);
                const distCurr = nodeA.originalPos.distanceTo(curr.originalPos);
                return distCurr < distPrev ? curr : prev;
            });
            
            if (nodeA.originalPos.distanceTo(closest.originalPos) < 1.0) {
                this.createBeam(nodeA, closest, this.materials.frame, strengthMultiplier);
            }
        });
    }

    createBeam(nodeA, nodeB, material, strengthMultiplier = 1.0) {
        const distance = nodeA.body.position.distanceTo(nodeB.body.position);
        const stiffness = material.stiffness * strengthMultiplier;
        const damping = material.damping * strengthMultiplier;
        const breakThreshold = material.breakThreshold * strengthMultiplier;
        
        const constraint = new CANNON.DistanceConstraint(
            nodeA.body,
            nodeB.body,
            distance,
            stiffness
        );
        this.physicsWorld.addConstraint(constraint);
        
        const beam = {
            nodeA: nodeA,
            nodeB: nodeB,
            constraint: constraint,
            restLength: distance,
            stiffness: stiffness,
            damping: damping,
            breakThreshold: breakThreshold,
            stress: 0,
            broken: false,
            health: 1.0,
            type: material
        };
        
        this.beams.push(beam);
        nodeA.connections.push(beam);
        nodeB.connections.push(beam);
        
        return beam;
    }

    createCrossBracing(partName, strengthMultiplier) {
        const partNodes = this.nodes.filter(n => n.part === partName);
        
        // Create diagonal cross-bracing for structural integrity
        for (let i = 0; i < partNodes.length - 2; i += 2) {
            for (let j = i + 2; j < Math.min(i + 6, partNodes.length); j += 2) {
                const nodeA = partNodes[i];
                const nodeB = partNodes[j];
                const distance = nodeA.originalPos.distanceTo(nodeB.originalPos);
                
                if (distance > 0.5 && distance < 1.5) {
                    this.createBeam(nodeA, nodeB, this.materials.frame, strengthMultiplier * 0.7);
                }
            }
        }
    }

    createPillars() {
        // Simulate A, B, C pillars for realistic rollover behavior
        const roofNodes = this.nodes.filter(n => n.part === 'roof');
        const frameNodes = this.nodes.filter(n => n.part === 'cabin_frame');
        
        if (roofNodes.length === 0 || frameNodes.length === 0) {
            console.warn('Cannot create pillars: missing roof or frame nodes');
            return;
        }
        
        // A-Pillars (front)
        roofNodes.filter(n => n.originalPos.z < -0.5).forEach(roofNode => {
            if (frameNodes.length > 0) {
                const closestFrame = frameNodes.reduce((prev, curr) => {
                    const distPrev = roofNode.originalPos.distanceTo(prev.originalPos);
                    const distCurr = roofNode.originalPos.distanceTo(curr.originalPos);
                    return distCurr < distPrev ? curr : prev;
                });
                this.createBeam(roofNode, closestFrame, this.materials.frame, 2.0);
            }
        });
        
        // B-Pillars (center)
        roofNodes.filter(n => Math.abs(n.originalPos.z) < 0.5).forEach(roofNode => {
            if (frameNodes.length > 0) {
                const closestFrame = frameNodes.reduce((prev, curr) => {
                    const distPrev = roofNode.originalPos.distanceTo(prev.originalPos);
                    const distCurr = roofNode.originalPos.distanceTo(curr.originalPos);
                    return distCurr < distPrev ? curr : prev;
                });
                this.createBeam(roofNode, closestFrame, this.materials.frame, 2.5);
            }
        });
        
        // C-Pillars (rear)
        roofNodes.filter(n => n.originalPos.z > 0.5).forEach(roofNode => {
            if (frameNodes.length > 0) {
                const closestFrame = frameNodes.reduce((prev, curr) => {
                    const distPrev = roofNode.originalPos.distanceTo(prev.originalPos);
                    const distCurr = roofNode.originalPos.distanceTo(curr.originalPos);
                    return distCurr < distPrev ? curr : prev;
                });
                this.createBeam(roofNode, closestFrame, this.materials.frame, 2.0);
            }
        });
    }

    connectPartsFlexible(partA, partB, strength) {
        // Create flexible connections for body panels
        this.connectParts(partA, partB, strength);
    }

    setupDeformationTracking() {
        // Track deformation for visual effects
        this.nodes.forEach(node => {
            this.deformationData.set(node.id, {
                originalPos: node.originalPos.clone(),
                currentDeformation: 0,
                maxDeformation: 0,
                deformationHistory: []
            });
        });
    }

    createParticleSystem() {
        // Particle system for sparks and debris
        this.sparkGeometry = new THREE.BufferGeometry();
        this.sparkMaterial = new THREE.PointsMaterial({
            color: 0xffaa00,
            size: 0.1,
            transparent: true,
            opacity: 0.8
        });
        
        this.sparkSystem = new THREE.Points(this.sparkGeometry, this.sparkMaterial);
        this.scene.add(this.sparkSystem);
    }

    update(deltaTime) {
        this.updateStressAnalysis();
        this.updateProgressiveDamage(deltaTime);
        this.updateDeformation();
        this.updateParticleEffects(deltaTime);
        this.updatePartHealth();
    }

    updateStressAnalysis() {
        let totalStress = 0;
        
        this.beams.forEach(beam => {
            if (beam.broken) return;
            
            const currentLength = beam.nodeA.body.position.distanceTo(beam.nodeB.body.position);
            const strain = Math.abs(currentLength - beam.restLength) / beam.restLength;
            beam.stress = strain * beam.stiffness;
            
            totalStress += beam.stress;
            
            // Progressive weakening before break
            if (beam.stress > beam.breakThreshold * 0.7) {
                beam.health -= 0.001; // Gradual weakening
                if (beam.health <= 0) {
                    this.breakBeam(beam);
                }
            }
        });
        
        this.damageAccumulator = Math.min(totalStress / (this.beams.length * 10000), 100); // Reduced sensitivity
    }

    updateProgressiveDamage(deltaTime) {
        // Implement fatigue and progressive failure
        this.beams.forEach(beam => {
            if (beam.broken) return;
            
            // Fatigue damage from repeated stress
            if (beam.stress > beam.breakThreshold * 0.5) {
                beam.health -= beam.stress * 0.000001 * deltaTime;
            }
            
            // Stress redistribution when beams break
            if (beam.health < 0.5) {
                beam.constraint.distance *= 1.01; // Loosening
            }
        });
    }

    breakBeam(beam) {
        if (beam.broken) return;
        
        beam.broken = true;
        this.brokenBeams.push(beam);
        
        // Remove physics constraint
        if (beam.constraint) {
            this.physicsWorld.removeConstraint(beam.constraint);
        }
        
        // Create spark effect
        this.createSparkEffect(beam);
        
        // Redistribute stress to neighboring beams
        this.redistributeStress(beam);
        
        console.log(`Beam broken: ${beam.nodeA.part} <-> ${beam.nodeB.part}`);
    }

    createSparkEffect(beam) {
        const position = new THREE.Vector3().lerpVectors(
            new THREE.Vector3().copy(beam.nodeA.body.position),
            new THREE.Vector3().copy(beam.nodeB.body.position),
            0.5
        );
        
        // Create spark particles
        for (let i = 0; i < 10; i++) {
            const spark = {
                position: position.clone(),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 5,
                    Math.random() * 3,
                    (Math.random() - 0.5) * 5
                ),
                life: 0.5 + Math.random() * 0.5,
                maxLife: 1.0
            };
            this.sparkParticles.push(spark);
        }
    }

    redistributeStress(brokenBeam) {
        // Find connected beams and increase their stress
        const affectedNodes = [brokenBeam.nodeA, brokenBeam.nodeB];
        
        affectedNodes.forEach(node => {
            node.connections.forEach(beam => {
                if (!beam.broken && beam !== brokenBeam) {
                    beam.health -= 0.1; // Stress concentration
                }
            });
        });
    }

    updateDeformation() {
        // Track visual deformation for mesh morphing
        this.nodes.forEach(node => {
            const deformData = this.deformationData.get(node.id);
            if (!deformData) return;
            
            const currentPos = new THREE.Vector3().copy(node.body.position);
            const deformation = currentPos.distanceTo(deformData.originalPos);
            
            deformData.currentDeformation = deformation;
            deformData.maxDeformation = Math.max(deformData.maxDeformation, deformation);
            deformData.deformationHistory.push(deformation);
            
            // Keep only recent history
            if (deformData.deformationHistory.length > 60) {
                deformData.deformationHistory.shift();
            }
        });
    }

    updateParticleEffects(deltaTime) {
        // Update spark particles
        this.sparkParticles = this.sparkParticles.filter(spark => {
            spark.life -= deltaTime;
            spark.position.add(spark.velocity.clone().multiplyScalar(deltaTime));
            spark.velocity.y -= 9.81 * deltaTime; // Gravity
            
            return spark.life > 0;
        });
        
        // Update particle system geometry
        if (this.sparkParticles.length > 0) {
            const positions = new Float32Array(this.sparkParticles.length * 3);
            this.sparkParticles.forEach((spark, i) => {
                positions[i * 3] = spark.position.x;
                positions[i * 3 + 1] = spark.position.y;
                positions[i * 3 + 2] = spark.position.z;
            });
            
            this.sparkGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        }
    }

    updatePartHealth() {
        // Calculate health per vehicle part
        const partGroups = {};
        
        this.nodes.forEach(node => {
            if (!partGroups[node.part]) {
                partGroups[node.part] = { total: 0, healthy: 0 };
            }
            partGroups[node.part].total++;
            if (node.health > 0.5) {
                partGroups[node.part].healthy++;
            }
        });
        
        Object.keys(partGroups).forEach(part => {
            const health = partGroups[part].healthy / partGroups[part].total;
            this.partHealth.set(part, health);
        });
    }

    getDamage() {
        return this.damageAccumulator;
    }

    getPartHealth(part) {
        return this.partHealth.get(part) || 1.0;
    }

    getDeformationData() {
        return this.deformationData;
    }

    getBrokenBeamCount() {
        return this.brokenBeams.length;
    }

    getTotalStress() {
        return this.beams.reduce((total, beam) => total + beam.stress, 0);
    }

    reset() {
        // Reset all beams and nodes
        this.brokenBeams.forEach(beam => {
            if (beam.constraint) {
                this.physicsWorld.addConstraint(beam.constraint);
            }
            beam.broken = false;
            beam.health = 1.0;
        });
        
        this.brokenBeams = [];
        this.damageAccumulator = 0;
        this.sparkParticles = [];
        
        // Reset node positions and health
        this.nodes.forEach(node => {
            const originalPos = this.originalPositions.get(node.id);
            if (originalPos) {
                node.body.position.copy(originalPos);
                node.body.velocity.set(0, 0, 0);
                node.health = 1.0;
            }
        });
        
        // Reset part health
        this.partHealth.forEach((value, key) => {
            this.partHealth.set(key, 1.0);
        });
    }

    destroy() {
        // Clean up physics bodies and constraints
        this.nodes.forEach(node => {
            this.physicsWorld.removeBody(node.body);
        });
        
        this.beams.forEach(beam => {
            if (beam.constraint) {
                this.physicsWorld.removeConstraint(beam.constraint);
            }
        });
        
        // Clean up visual elements
        if (this.sparkSystem) {
            this.scene.remove(this.sparkSystem);
        }
        
        this.nodes = [];
        this.beams = [];
        this.brokenBeams = [];
        this.sparkParticles = [];
    }
}