import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

export class Physics {
    constructor() {
        this.world = null;
        this.fixedTimeStep = 1/120; // 120Hz physics update
        this.maxSubSteps = 3;
        this.materials = {};
        this.contactMaterials = [];
    }

    init() {
        // Create physics world
        this.world = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.81, 0),
            broadphase: new CANNON.SAPBroadphase(this.world),
            allowSleep: true
        });
        
        // Performance optimizations
        this.world.defaultContactMaterial.contactEquationStiffness = 1e6;
        this.world.defaultContactMaterial.contactEquationRelaxation = 3;
        this.world.solver.iterations = 10;
        this.world.solver.tolerance = 0.001;
        
        // Create materials
        this.createMaterials();
        
        // Setup collision groups
        this.CollisionGroups = {
            GROUND: 1,
            VEHICLE_BODY: 2,
            VEHICLE_WHEEL: 4,
            STATIC_OBJECT: 8,
            DYNAMIC_OBJECT: 16,
            TRIGGER: 32
        };
    }

    createMaterials() {
        // Ground material
        this.materials.ground = new CANNON.Material('ground');
        this.materials.ground.friction = 0.8;
        this.materials.ground.restitution = 0.1;
        
        // Tire material
        this.materials.tire = new CANNON.Material('tire');
        this.materials.tire.friction = 1.2;
        this.materials.tire.restitution = 0.3;
        
        // Vehicle body material
        this.materials.vehicleBody = new CANNON.Material('vehicleBody');
        this.materials.vehicleBody.friction = 0.4;
        this.materials.vehicleBody.restitution = 0.2;
        
        // Metal material (for obstacles)
        this.materials.metal = new CANNON.Material('metal');
        this.materials.metal.friction = 0.5;
        this.materials.metal.restitution = 0.3;
        
        // Create contact materials
        this.createContactMaterials();
    }

    createContactMaterials() {
        // Tire-Ground contact
        const tireGroundContact = new CANNON.ContactMaterial(
            this.materials.tire,
            this.materials.ground,
            {
                friction: 1.0,
                restitution: 0.1,
                contactEquationStiffness: 1e7,
                contactEquationRelaxation: 3,
                frictionEquationStiffness: 1e7,
                frictionEquationRelaxation: 2
            }
        );
        this.world.addContactMaterial(tireGroundContact);
        
        // Vehicle body-Ground contact
        const bodyGroundContact = new CANNON.ContactMaterial(
            this.materials.vehicleBody,
            this.materials.ground,
            {
                friction: 0.4,
                restitution: 0.2,
                contactEquationStiffness: 1e6,
                contactEquationRelaxation: 3
            }
        );
        this.world.addContactMaterial(bodyGroundContact);
        
        // Vehicle-Metal contact
        const vehicleMetalContact = new CANNON.ContactMaterial(
            this.materials.vehicleBody,
            this.materials.metal,
            {
                friction: 0.3,
                restitution: 0.4,
                contactEquationStiffness: 1e6,
                contactEquationRelaxation: 3
            }
        );
        this.world.addContactMaterial(vehicleMetalContact);
    }

    update(deltaTime) {
        if (this.world) {
            this.world.step(this.fixedTimeStep, deltaTime, this.maxSubSteps);
        }
    }

    addBody(body) {
        this.world.addBody(body);
    }

    removeBody(body) {
        this.world.removeBody(body);
    }

    addConstraint(constraint) {
        this.world.addConstraint(constraint);
    }

    removeConstraint(constraint) {
        this.world.removeConstraint(constraint);
    }

    createRaycastVehicle(chassisBody) {
        const vehicle = new CANNON.RaycastVehicle({
            chassisBody: chassisBody,
            indexRightAxis: 0,
            indexForwardAxis: 2,
            indexUpAxis: 1
        });
        return vehicle;
    }

    createBox(halfExtents, mass = 0, material = null) {
        const shape = new CANNON.Box(new CANNON.Vec3(...halfExtents));
        const body = new CANNON.Body({
            mass: mass,
            shape: shape,
            material: material || this.materials.metal
        });
        return body;
    }

    createSphere(radius, mass = 0, material = null) {
        const shape = new CANNON.Sphere(radius);
        const body = new CANNON.Body({
            mass: mass,
            shape: shape,
            material: material || this.materials.metal
        });
        return body;
    }

    createTrimesh(vertices, indices, mass = 0, material = null) {
        const shape = new CANNON.Trimesh(vertices, indices);
        const body = new CANNON.Body({
            mass: mass,
            shape: shape,
            material: material || this.materials.ground
        });
        return body;
    }

    createHeightfield(data, options, mass = 0, material = null) {
        const shape = new CANNON.Heightfield(data, options);
        const body = new CANNON.Body({
            mass: mass,
            shape: shape,
            material: material || this.materials.ground
        });
        return body;
    }

    // Helper method for creating spring constraints (for soft-body simulation)
    // Note: CANNON.js doesn't have a built-in Spring class, so we'll use constraints instead

    // Create distance constraint (for rigid connections in soft-body)
    createDistanceConstraint(bodyA, bodyB, distance, maxForce = 1e6) {
        return new CANNON.DistanceConstraint(bodyA, bodyB, distance, maxForce);
    }

    // Ray casting helper
    raycast(from, to, options = {}) {
        const result = new CANNON.RaycastResult();
        this.world.rayTest(from, to, result);
        return result;
    }

    destroy() {
        if (this.world) {
            // Remove all bodies
            while (this.world.bodies.length > 0) {
                this.world.removeBody(this.world.bodies[0]);
            }
            
            // Remove all constraints
            while (this.world.constraints.length > 0) {
                this.world.removeConstraint(this.world.constraints[0]);
            }
            
            this.world = null;
        }
    }
}