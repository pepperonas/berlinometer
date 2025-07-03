export class NodeBeamStructure {
    constructor(world, dimensions, nodeCount) {
        this.world = world;
        this.dimensions = dimensions;
        this.nodeCount = nodeCount;
        
        this.nodes = [];
        this.beams = [];
        this.bodies = [];
        this.constraints = [];
        
        this.restPositions = [];
        this.maxDeformation = 0;
        
        this.createStructure();
    }
    
    createStructure() {
        // Create a 3D grid of nodes for the vehicle
        const { width, height, length } = this.dimensions;
        
        // Calculate grid dimensions
        const nodesPerDimension = Math.cbrt(this.nodeCount);
        const nx = Math.ceil(nodesPerDimension * (width / length));
        const ny = Math.ceil(nodesPerDimension * (height / length));
        const nz = Math.ceil(nodesPerDimension);
        
        // Create nodes
        for (let x = 0; x < nx; x++) {
            for (let y = 0; y < ny; y++) {
                for (let z = 0; z < nz; z++) {
                    const posX = (x / (nx - 1) - 0.5) * width;
                    const posY = (y / (ny - 1) - 0.5) * height;
                    const posZ = (z / (nz - 1) - 0.5) * length;
                    
                    const node = this.createNode(posX, posY, posZ);
                    this.nodes.push(node);
                    
                    // Store rest position
                    this.restPositions.push(new CANNON.Vec3(posX, posY, posZ));
                }
            }
        }
        
        // Create beams (connections between nodes)
        this.createBeams(nx, ny, nz);
        
        // Create additional structural beams for stability
        this.createDiagonalBeams(nx, ny, nz);
    }
    
    createNode(x, y, z) {
        const mass = this.dimensions.width * this.dimensions.height * this.dimensions.length * 
                     200 / this.nodeCount; // Much higher mass per node for stability
        
        const shape = new CANNON.Sphere(0.1); // Bigger sphere for better physics
        const body = new CANNON.Body({
            mass: mass,
            shape: shape,
            position: new CANNON.Vec3(x, y, z),
            material: new CANNON.Material({
                friction: 0.4,
                restitution: 0.1
            })
        });
        
        // Add linear and angular damping to prevent oscillations
        body.linearDamping = 0.1;
        body.angularDamping = 0.1;
        
        this.world.add(body);
        this.bodies.push(body);
        
        return {
            body: body,
            connections: [],
            restLength: {}
        };
    }
    
    createBeams(nx, ny, nz) {
        // Connect adjacent nodes
        for (let x = 0; x < nx; x++) {
            for (let y = 0; y < ny; y++) {
                for (let z = 0; z < nz; z++) {
                    const currentIdx = this.getNodeIndex(x, y, z, nx, ny, nz);
                    const currentNode = this.nodes[currentIdx];
                    
                    // Connect to neighbors
                    const neighbors = [
                        { dx: 1, dy: 0, dz: 0 },  // Right
                        { dx: 0, dy: 1, dz: 0 },  // Up
                        { dx: 0, dy: 0, dz: 1 },  // Forward
                    ];
                    
                    neighbors.forEach(({ dx, dy, dz }) => {
                        const nx2 = x + dx;
                        const ny2 = y + dy;
                        const nz2 = z + dz;
                        
                        if (nx2 < nx && ny2 < ny && nz2 < nz) {
                            const neighborIdx = this.getNodeIndex(nx2, ny2, nz2, nx, ny, nz);
                            const neighborNode = this.nodes[neighborIdx];
                            
                            this.createBeam(currentNode, neighborNode, currentIdx, neighborIdx);
                        }
                    });
                }
            }
        }
    }
    
    createDiagonalBeams(nx, ny, nz) {
        // Add diagonal beams for structural integrity
        for (let x = 0; x < nx - 1; x++) {
            for (let y = 0; y < ny - 1; y++) {
                for (let z = 0; z < nz - 1; z++) {
                    const idx000 = this.getNodeIndex(x, y, z, nx, ny, nz);
                    const idx111 = this.getNodeIndex(x + 1, y + 1, z + 1, nx, ny, nz);
                    
                    if (idx000 !== -1 && idx111 !== -1) {
                        this.createBeam(this.nodes[idx000], this.nodes[idx111], idx000, idx111);
                    }
                }
            }
        }
    }
    
    createBeam(node1, node2, idx1, idx2) {
        const restLength = node1.body.position.distanceTo(node2.body.position);
        
        // Spring constraint with very high stiffness for rigid behavior
        const constraint = new CANNON.DistanceConstraint(
            node1.body,
            node2.body,
            restLength,
            1e7 // Very high stiffness to prevent separation
        );
        
        this.world.addConstraint(constraint);
        this.constraints.push(constraint);
        
        // Store beam information
        const beam = {
            node1: idx1,
            node2: idx2,
            restLength: restLength,
            constraint: constraint,
            stiffness: 1e7,
            damping: 500,
            breakingForce: 100000 // Very high force - essentially unbreakable
        };
        
        this.beams.push(beam);
        
        // Update node connections
        node1.connections.push(idx2);
        node2.connections.push(idx1);
        node1.restLength[idx2] = restLength;
        node2.restLength[idx1] = restLength;
    }
    
    getNodeIndex(x, y, z, nx, ny, nz) {
        if (x < 0 || x >= nx || y < 0 || y >= ny || z < 0 || z >= nz) {
            return -1;
        }
        return x * ny * nz + y * nz + z;
    }
    
    update(deltaTime, isInvulnerable = false) {
        // Update beam forces and check for breaking
        this.beams.forEach((beam, index) => {
            const node1 = this.nodes[beam.node1];
            const node2 = this.nodes[beam.node2];
            
            const currentLength = node1.body.position.distanceTo(node2.body.position);
            const strain = Math.abs(currentLength - beam.restLength) / beam.restLength;
            
            // Disable beam breaking for now - just maintain structural integrity
            // Apply spring-damper forces
            const force = this.calculateBeamForce(node1.body, node2.body, beam);
            
            node1.body.applyForce(force.scale(-1), node1.body.position);
            node2.body.applyForce(force, node2.body.position);
        });
        
        // Update deformation metric (only if not invulnerable)
        if (!isInvulnerable) {
            this.updateDeformation();
        }
    }
    
    calculateBeamForce(body1, body2, beam) {
        const pos1 = body1.position;
        const pos2 = body2.position;
        const vel1 = body1.velocity;
        const vel2 = body2.velocity;
        
        // Spring force
        const distance = pos1.distanceTo(pos2);
        const direction = pos2.vsub(pos1);
        direction.normalize();
        
        const springForce = (distance - beam.restLength) * beam.stiffness;
        
        // Damping force
        const relativeVelocity = vel2.vsub(vel1);
        const dampingForce = direction.dot(relativeVelocity) * beam.damping;
        
        // Total force
        return direction.scale(springForce + dampingForce);
    }
    
    breakBeam(beamIndex) {
        const beam = this.beams[beamIndex];
        
        // Remove constraint
        this.world.removeConstraint(beam.constraint);
        
        // Remove from beams array
        this.beams.splice(beamIndex, 1);
        
        // Update node connections
        const node1 = this.nodes[beam.node1];
        const node2 = this.nodes[beam.node2];
        
        node1.connections = node1.connections.filter(idx => idx !== beam.node2);
        node2.connections = node2.connections.filter(idx => idx !== beam.node1);
        
        delete node1.restLength[beam.node2];
        delete node2.restLength[beam.node1];
    }
    
    updateDeformation() {
        let totalDeformation = 0;
        let count = 0;
        
        this.nodes.forEach((node, index) => {
            const currentPos = node.body.position;
            const restPos = this.restPositions[index];
            
            const deformation = currentPos.distanceTo(restPos);
            totalDeformation += deformation;
            count++;
        });
        
        this.maxDeformation = Math.max(this.maxDeformation, totalDeformation / count);
    }
    
    getDeformationAmount() {
        return this.maxDeformation;
    }
    
    getChassisBodies() {
        // Return central bodies that represent the main chassis
        const centerBodies = [];
        const centerThreshold = 0.3; // 30% from center
        
        this.nodes.forEach(node => {
            const pos = node.body.position;
            const relX = Math.abs(pos.x) / (this.dimensions.width / 2);
            const relY = Math.abs(pos.y) / (this.dimensions.height / 2);
            const relZ = Math.abs(pos.z) / (this.dimensions.length / 2);
            
            if (relX < centerThreshold && relY < centerThreshold && relZ < centerThreshold) {
                centerBodies.push(node.body);
            }
        });
        
        return centerBodies;
    }
    
    getCenterOfMass() {
        const com = new CANNON.Vec3();
        let totalMass = 0;
        
        this.bodies.forEach(body => {
            const mass = body.mass;
            com.vadd(body.position.scale(mass), com);
            totalMass += mass;
        });
        
        return com.scale(1 / totalMass);
    }
    
    setPosition(x, y, z) {
        const offset = new CANNON.Vec3(x, y, z);
        
        this.nodes.forEach((node, index) => {
            const restPos = this.restPositions[index];
            node.body.position.copy(restPos.vadd(offset));
            node.body.velocity.set(0, 0, 0);
            node.body.angularVelocity.set(0, 0, 0);
        });
    }
    
    reset() {
        // Restore all beams and positions
        this.beams = [];
        this.constraints.forEach(constraint => {
            this.world.removeConstraint(constraint);
        });
        this.constraints = [];
        
        // Reset positions
        this.nodes.forEach((node, index) => {
            node.body.position.copy(this.restPositions[index]);
            node.body.velocity.set(0, 0, 0);
            node.connections = [];
            node.restLength = {};
        });
        
        // Recreate structure
        const nx = Math.ceil(Math.cbrt(this.nodeCount));
        const ny = nx;
        const nz = nx;
        
        this.createBeams(nx, ny, nz);
        this.createDiagonalBeams(nx, ny, nz);
        
        this.maxDeformation = 0;
    }
    
    dispose() {
        // Remove all bodies from world
        this.bodies.forEach(body => {
            this.world.remove(body);
        });
        
        // Remove all constraints
        this.constraints.forEach(constraint => {
            this.world.removeConstraint(constraint);
        });
        
        this.nodes = [];
        this.beams = [];
        this.bodies = [];
        this.constraints = [];
    }
}