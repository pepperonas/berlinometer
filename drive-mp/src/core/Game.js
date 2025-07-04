import * as THREE from 'three';
import { Renderer } from './Renderer.js';
import { Physics } from './Physics.js';
import { InputManager } from '../utils/InputManager.js';
import { Vehicle } from '../vehicle/Vehicle.js';
import { World } from '../world/World.js';
import { ParticleEffectsManager } from '../effects/ParticleEffectsManager.js';
import { AudioEngine } from '../audio/AudioEngine.js';

export class Game {
    constructor() {
        this.renderer = null;
        this.physics = null;
        this.inputManager = null;
        this.world = null;
        this.vehicle = null;
        this.particleEffects = null;
        this.audioEngine = null;
        
        this.clock = new THREE.Clock();
        this.stats = {
            fps: 0,
            physicsTime: 0
        };
        
        this.isRunning = false;
        this.lastTime = 0;
        this.frameCount = 0;
        this.fpsUpdateInterval = 0.5;
        this.fpsTimer = 0;
        
        this.cameraMode = 0;
        this.cameraModes = ['chase', 'orbit', 'cockpit', 'free'];
        this.lastDamage = 0;
        
        // Racing HUD data
        this.lapData = {
            currentLapTime: 0,
            bestLapTime: null,
            sector1Time: null,
            sector2Time: null,
            sector3Time: null,
            currentSector: 0,
            lapStartTime: 0
        };
        
        // G-Force canvas
        this.gForceCanvas = null;
        this.gForceCtx = null;
    }

    async init() {
        try {
            window.updateLoadingProgress(10);
            
            // Initialize renderer
            this.renderer = new Renderer();
            await this.renderer.init();
            window.updateLoadingProgress(30);
            
            // Initialize physics
            this.physics = new Physics();
            this.physics.init();
            window.updateLoadingProgress(50);
            
            // Initialize input
            this.inputManager = new InputManager();
            this.inputManager.init();
            this.setupInputBindings();
            window.updateLoadingProgress(60);
            
            // Create world
            this.world = new World(this.renderer, this.physics);
            await this.world.init();
            window.updateLoadingProgress(80);
            
            // Create vehicle
            this.vehicle = new Vehicle(this.physics.world, this.renderer.scene);
            await this.vehicle.init();
            this.vehicle.setPosition(0, 1.5, 0);
            this.vehicle.setRotation(0, 0, 0);
            window.updateLoadingProgress(80);
            
            // Initialize particle effects
            this.particleEffects = new ParticleEffectsManager(this.renderer.scene, this.physics.world);
            window.updateLoadingProgress(85);
            
            // Initialize audio engine
            this.audioEngine = new AudioEngine();
            await this.audioEngine.init();
            window.updateLoadingProgress(90);
            
            // Setup camera
            this.setupCamera();
            
            // Initialize racing HUD
            this.setupRacingHUD();
            
            // Start game loop
            this.isRunning = true;
            this.animate();
            
            window.updateLoadingProgress(100);
            setTimeout(() => window.hideLoading(), 300);
            
        } catch (error) {
            console.error('Game initialization failed:', error);
            throw error;
        }
    }

    setupInputBindings() {
        // Vehicle controls
        this.inputManager.on('accelerate', (value) => {
            console.log('Game received accelerate:', value);
            if (this.vehicle) this.vehicle.setThrottle(value);
            
            // Resume audio on first user interaction
            if (this.audioEngine && value > 0) {
                this.audioEngine.resume();
            }
        });
        
        this.inputManager.on('brake', (value) => {
            if (this.vehicle) this.vehicle.setBrake(value);
        });
        
        this.inputManager.on('steer', (value) => {
            if (this.vehicle) this.vehicle.setSteering(value);
        });
        
        this.inputManager.on('handbrake', (value) => {
            if (this.vehicle) this.vehicle.setHandbrake(value);
        });
        
        // Camera controls
        this.inputManager.on('changeCamera', () => {
            this.cameraMode = (this.cameraMode + 1) % this.cameraModes.length;
            console.log('Camera mode:', this.cameraModes[this.cameraMode]);
        });
        
        // Vehicle reset
        this.inputManager.on('reset', () => {
            if (this.vehicle) {
                this.vehicle.reset();
                this.vehicle.setPosition(0, 1.5, 0);
                this.vehicle.setRotation(0, 0, 0);
            }
        });
        
        // Debug toggle
        this.inputManager.on('toggleDebug', () => {
            const debugInfo = document.getElementById('debugInfo');
            const telemetryPanel = document.getElementById('telemetryPanel');
            
            if (debugInfo.style.display === 'none') {
                debugInfo.style.display = 'block';
                telemetryPanel.style.display = 'block';
            } else {
                debugInfo.style.display = 'none';
                telemetryPanel.style.display = 'none';
            }
            
            if (this.renderer) this.renderer.toggleDebug();
        });
    }

    setupCamera() {
        const camera = this.renderer.camera;
        camera.position.set(10, 8, 10);
        camera.lookAt(0, 0, 0);
    }

    updateCamera(deltaTime) {
        if (!this.vehicle) return;
        
        const camera = this.renderer.camera;
        const vehiclePos = this.vehicle.getPosition();
        const vehicleVel = this.vehicle.getVelocity();
        const vehicleRot = this.vehicle.getRotation();
        
        // Convert CANNON vectors to THREE vectors
        const vehiclePosThree = new THREE.Vector3(vehiclePos.x, vehiclePos.y, vehiclePos.z);
        const vehicleVelThree = new THREE.Vector3(vehicleVel.x, vehicleVel.y, vehicleVel.z);
        const vehicleRotThree = new THREE.Quaternion(vehicleRot.x, vehicleRot.y, vehicleRot.z, vehicleRot.w);
        
        switch (this.cameraModes[this.cameraMode]) {
            case 'chase': {
                const distance = 12 + Math.min(vehicleVelThree.length() * 0.1, 5);
                const height = 6 + Math.min(vehicleVelThree.length() * 0.05, 2);
                
                const offset = new THREE.Vector3(0, 0, distance);
                offset.applyQuaternion(vehicleRotThree);
                
                const targetPos = vehiclePosThree.clone().add(offset);
                targetPos.y = vehiclePosThree.y + height;
                
                camera.position.lerp(targetPos, deltaTime * 5);
                
                const lookTarget = vehiclePosThree.clone();
                lookTarget.y += 1;
                camera.lookAt(lookTarget);
                break;
            }
            
            case 'orbit': {
                const time = Date.now() * 0.0005;
                const radius = 20;
                camera.position.x = Math.cos(time) * radius;
                camera.position.y = 10;
                camera.position.z = Math.sin(time) * radius;
                camera.lookAt(vehiclePosThree);
                break;
            }
            
            case 'cockpit': {
                const offset = new THREE.Vector3(0, 1.2, 0.5);
                offset.applyQuaternion(vehicleRotThree);
                camera.position.copy(vehiclePosThree).add(offset);
                
                const forward = new THREE.Vector3(0, 0, -1);
                forward.applyQuaternion(vehicleRotThree);
                const lookTarget = camera.position.clone().add(forward.multiplyScalar(10));
                camera.lookAt(lookTarget);
                break;
            }
            
            case 'free': {
                // Free camera controlled by mouse
                break;
            }
        }
    }

    animate() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        const currentTime = this.clock.getElapsedTime();
        
        // Update FPS counter
        this.frameCount++;
        this.fpsTimer += deltaTime;
        if (this.fpsTimer >= this.fpsUpdateInterval) {
            this.stats.fps = Math.round(this.frameCount / this.fpsTimer);
            this.frameCount = 0;
            this.fpsTimer = 0;
            document.getElementById('fps').textContent = this.stats.fps;
        }
        
        // Update physics
        const physicsStart = performance.now();
        this.physics.update(deltaTime);
        this.stats.physicsTime = Math.round(performance.now() - physicsStart);
        document.getElementById('physicsTime').textContent = this.stats.physicsTime;
        
        // Update vehicle
        if (this.vehicle) {
            this.vehicle.update(deltaTime);
            this.updateVehicleHUD();
            this.updateDebugInfo();
            this.updateVehicleEffects(deltaTime);
        }
        
        // Update camera
        this.updateCamera(deltaTime);
        
        // Update renderer with vehicle position
        if (this.renderer && this.vehicle) {
            this.renderer.update(deltaTime, this.vehicle.getPosition());
        }
        
        // Update world
        if (this.world) {
            this.world.update(deltaTime);
        }
        
        // Update particle effects
        if (this.particleEffects) {
            this.particleEffects.update(deltaTime);
        }
        
        // Render
        this.renderer.render();
    }

    updateVehicleHUD() {
        const speed = Math.round(this.vehicle.getSpeed() * 3.6); // m/s to km/h
        document.getElementById('speed').textContent = Math.abs(speed);
        
        const gear = this.vehicle.getCurrentGear();
        const gearText = gear === -1 ? 'R' : gear === 0 ? 'N' : gear.toString();
        document.getElementById('gear').textContent = gearText;
    }

    updateDebugInfo() {
        if (document.getElementById('debugInfo').style.display === 'none') return;
        
        const pos = this.vehicle.getPosition();
        const vel = this.vehicle.getVelocity();
        const angVel = this.vehicle.getAngularVelocity();
        
        // Convert CANNON vectors to calculate length
        const velLength = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
        const angVelLength = Math.sqrt(angVel.x * angVel.x + angVel.y * angVel.y + angVel.z * angVel.z);
        
        document.getElementById('debugPos').textContent = 
            `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
        document.getElementById('debugVel').textContent = velLength.toFixed(1);
        document.getElementById('debugAngVel').textContent = angVelLength.toFixed(2);
        document.getElementById('debugRPM').textContent = Math.round(this.vehicle.getRPM());
        
        // Wheel slip ratios
        const wheelSlips = this.vehicle.getWheelSlipRatios();
        if (wheelSlips) {
            document.getElementById('debugWheelFL').textContent = wheelSlips[0].toFixed(2);
            document.getElementById('debugWheelFR').textContent = wheelSlips[1].toFixed(2);
            document.getElementById('debugWheelRL').textContent = wheelSlips[2].toFixed(2);
            document.getElementById('debugWheelRR').textContent = wheelSlips[3].toFixed(2);
        }
        
        // Node count and damage
        document.getElementById('debugNodes').textContent = this.vehicle.getNodeCount();
        document.getElementById('debugDamage').textContent = 
            Math.round(this.vehicle.getDamagePercentage()) + '%';
        
        // Update telemetry panel
        this.updateTelemetryPanel();
        
        // Update racing HUD
        this.updateRacingHUD();
    }

    updateVehicleEffects(deltaTime) {
        if (!this.vehicle || !this.particleEffects || !this.audioEngine) return;
        
        const vehiclePos = this.vehicle.getPosition();
        const vehicleVel = this.vehicle.getVelocity();
        const vehicleRot = this.vehicle.getRotation();
        const speed = this.vehicle.getSpeed();
        const rpm = this.vehicle.getRPM();
        const throttle = this.vehicle.currentThrottle;
        const wheelSlips = this.vehicle.getWheelSlipRatios();
        
        // Convert CANNON to THREE vectors
        const position = new THREE.Vector3(vehiclePos.x, vehiclePos.y, vehiclePos.z);
        const velocity = new THREE.Vector3(vehicleVel.x, vehicleVel.y, vehicleVel.z);
        const rotation = new THREE.Quaternion(vehicleRot.x, vehicleRot.y, vehicleRot.z, vehicleRot.w);
        
        // Update audio engine
        this.audioEngine.updateEngine(rpm, throttle, speed / 30); // Load based on speed
        this.audioEngine.updateWind(speed * 3.6, 0); // Convert to km/h
        
        // Update 3D audio listener
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(rotation);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(rotation);
        
        this.audioEngine.update3DListener(
            position,
            { forward, up },
            velocity
        );
        
        // Tire smoke effects
        if (wheelSlips && this.vehicle.wheels) {
            wheelSlips.forEach((slip, index) => {
                if (slip > 0.3) { // Significant slip
                    const wheel = this.vehicle.wheels[index];
                    if (wheel && wheel.mesh) {
                        const wheelPos = wheel.mesh.position.clone();
                        const intensity = Math.min(slip, 1.0);
                        
                        this.particleEffects.createTireSmoke(wheelPos, velocity, intensity);
                        
                        // Play tire squeal sound
                        if (slip > 0.5 && Math.random() < 0.1) {
                            this.audioEngine.playTireSqueal(intensity * 0.5, wheelPos);
                        }
                    }
                }
            });
        }
        
        // Dirt spray effect when moving on rough surfaces
        if (speed > 5) {
            const intensity = Math.min(speed / 20, 1.0);
            if (Math.random() < intensity * 0.1) {
                const rearPos = position.clone();
                rearPos.z += 2; // Behind vehicle
                rearPos.y -= 0.3; // Ground level
                this.particleEffects.createDirtSpray(rearPos, velocity, 'dirt');
            }
        }
        
        // Collision and damage effects
        const currentDamage = this.vehicle.getDamagePercentage();
        if (currentDamage > this.lastDamage + 5) { // Significant damage increase
            const impactIntensity = (currentDamage - this.lastDamage) / 20;
            
            // Create sparks and debris
            this.particleEffects.createImpactSparks(
                position, 
                new THREE.Vector3(0, 1, 0), 
                impactIntensity
            );
            this.particleEffects.createMetalDebris(
                position, 
                new THREE.Vector3(0, 1, 0), 
                impactIntensity
            );
            
            // Play collision sound
            this.audioEngine.playCollisionSound(impactIntensity, position);
            
            this.lastDamage = currentDamage;
        }
        
        // Engine backfire effect (high RPM + throttle release)
        if (rpm > 5000 && throttle < 0.1 && Math.random() < 0.05) {
            const exhaustPos = position.clone();
            const exhaustDir = new THREE.Vector3(0, 0, 1).applyQuaternion(rotation);
            exhaustPos.add(exhaustDir.multiplyScalar(2));
            
            this.particleEffects.createBackfire(exhaustPos, exhaustDir);
        }
    }

    updateTelemetryPanel() {
        if (!this.vehicle) return;
        
        const rpm = this.vehicle.getRPM();
        const speed = Math.round(this.vehicle.getSpeed() * 3.6);
        const throttle = this.vehicle.currentThrottle;
        const damage = Math.round(this.vehicle.getDamagePercentage());
        const wheelSlips = this.vehicle.getWheelSlipRatios();
        const velocity = this.vehicle.getVelocity();
        
        // Engine performance
        document.getElementById('telemetryRPM').textContent = Math.round(rpm);
        document.getElementById('telemetryThrottle').textContent = Math.round(throttle * 100);
        document.getElementById('telemetryLoad').textContent = Math.round((speed / 100) * 100);
        
        // Update progress bars
        document.getElementById('rpmBar').style.width = `${(rpm / 7000) * 100}%`;
        document.getElementById('throttleBar').style.width = `${throttle * 100}%`;
        
        // Vehicle dynamics
        document.getElementById('telemetrySpeed').textContent = speed;
        
        // Calculate G-forces (simplified)
        const gForce = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z) / 9.81;
        document.getElementById('telemetryGForce').textContent = gForce.toFixed(1);
        
        document.getElementById('telemetrySteering').textContent = 
            Math.round(this.vehicle.currentSteering * 30); // Convert to degrees
        
        // Tire status with color coding
        if (wheelSlips) {
            const slipElements = ['telemetrySlipFL', 'telemetrySlipFR', 'telemetrySlipRL', 'telemetrySlipRR'];
            wheelSlips.forEach((slip, i) => {
                const element = document.getElementById(slipElements[i]);
                if (element) {
                    element.textContent = slip.toFixed(1);
                    
                    // Color coding based on slip
                    element.className = slip < 0.3 ? 'performance-good' : 
                                       slip < 0.7 ? 'performance-warning' : 'performance-critical';
                }
            });
        }
        
        // Structural integrity
        document.getElementById('telemetryDamage').textContent = damage;
        document.getElementById('damageBar').style.width = `${damage}%`;
        
        if (this.vehicle.nodeBeamStructure) {
            const brokenBeams = this.vehicle.nodeBeamStructure.getBrokenBeamCount();
            const totalStress = this.vehicle.nodeBeamStructure.getTotalStress();
            
            document.getElementById('telemetryBrokenBeams').textContent = brokenBeams;
            
            const stressElement = document.getElementById('telemetryStress');
            const stressLevel = totalStress / 100000; // Normalize
            
            if (stressLevel < 0.3) {
                stressElement.textContent = 'LOW';
                stressElement.className = 'performance-good';
            } else if (stressLevel < 0.7) {
                stressElement.textContent = 'MEDIUM';
                stressElement.className = 'performance-warning';
            } else {
                stressElement.textContent = 'HIGH';
                stressElement.className = 'performance-critical';
            }
        }
        
        // Tire temperatures with color coding
        if (this.vehicle.getTireTemperatures) {
            const temps = this.vehicle.getTireTemperatures();
            const tempElements = ['telemetryTempFL', 'telemetryTempFR', 'telemetryTempRL', 'telemetryTempRR'];
            
            temps.forEach((temp, i) => {
                const element = document.getElementById(tempElements[i]);
                if (element) {
                    element.textContent = Math.round(temp);
                    // Color code based on temperature
                    if (temp < 40) {
                        element.className = 'performance-good';
                    } else if (temp < 100) {
                        element.className = 'performance-warning';
                    } else {
                        element.className = 'performance-critical';
                    }
                }
            });
        }
        
        // Tire wear
        if (this.vehicle.getTireWear) {
            const wear = this.vehicle.getTireWear();
            const wearElements = ['telemetryWearFL', 'telemetryWearFR', 'telemetryWearRL', 'telemetryWearRR'];
            
            wear.forEach((w, i) => {
                const element = document.getElementById(wearElements[i]);
                if (element) {
                    element.textContent = Math.round(w);
                    // Color code based on wear
                    if (w < 30) {
                        element.className = 'performance-good';
                    } else if (w < 70) {
                        element.className = 'performance-warning';
                    } else {
                        element.className = 'performance-critical';
                    }
                }
            });
        }
        
        // Aerodynamic forces
        if (this.vehicle.getAerodynamicForces) {
            const aero = this.vehicle.getAerodynamicForces();
            document.getElementById('telemetryDrag').textContent = Math.round(aero.drag);
            document.getElementById('telemetryDownforce').textContent = Math.round(aero.downforce);
            
            // Calculate aerodynamic balance
            const balance = aero.downforce > 0 ? (aero.drag / (aero.drag + aero.downforce)) * 100 : 50;
            document.getElementById('telemetryBalance').textContent = Math.round(balance);
        }
        
        // System status
        if (this.particleEffects) {
            document.getElementById('telemetryParticles').textContent = 
                this.particleEffects.getActiveParticleCount();
        }
        
        document.getElementById('telemetryAudio').textContent = '85'; // Placeholder
        document.getElementById('telemetryPhysicsMS').textContent = this.stats.physicsTime;
    }
    
    setupRacingHUD() {
        // Initialize G-Force canvas
        this.gForceCanvas = document.getElementById('gForceCanvas');
        if (this.gForceCanvas) {
            this.gForceCtx = this.gForceCanvas.getContext('2d');
        }
        
        // Initialize lap timer
        this.lapData.lapStartTime = Date.now();
    }
    
    updateRacingHUD() {
        if (!this.vehicle) return;
        
        // Update lap timer
        this.updateLapTimer();
        
        // Update tire temperatures in HUD
        this.updateHUDTireTemps();
        
        // Update G-Force meter
        this.updateGForceMeter();
    }
    
    updateLapTimer() {
        const currentTime = Date.now();
        this.lapData.currentLapTime = (currentTime - this.lapData.lapStartTime) / 1000;
        
        // Format time as MM:SS.mmm
        const minutes = Math.floor(this.lapData.currentLapTime / 60);
        const seconds = Math.floor(this.lapData.currentLapTime % 60);
        const milliseconds = Math.floor((this.lapData.currentLapTime % 1) * 1000);
        
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
        document.getElementById('currentLapTime').textContent = timeString;
        
        // Update best lap if applicable
        if (this.lapData.bestLapTime === null || this.lapData.currentLapTime < this.lapData.bestLapTime) {
            // Don't update best time until lap is complete
        }
    }
    
    updateHUDTireTemps() {
        if (!this.vehicle.getTireTemperatures) return;
        
        const temps = this.vehicle.getTireTemperatures();
        const hudElements = ['hudTempFL', 'hudTempFR', 'hudTempRL', 'hudTempRR'];
        
        temps.forEach((temp, i) => {
            const element = document.getElementById(hudElements[i]);
            if (element) {
                element.textContent = Math.round(temp) + '°';
                
                // Remove existing classes
                element.classList.remove('cold', 'optimal', 'hot', 'critical');
                
                // Add appropriate class based on temperature
                if (temp < 40) {
                    element.classList.add('cold');
                } else if (temp >= 40 && temp < 90) {
                    element.classList.add('optimal');
                } else if (temp >= 90 && temp < 120) {
                    element.classList.add('hot');
                } else {
                    element.classList.add('critical');
                }
            }
        });
    }
    
    updateGForceMeter() {
        if (!this.gForceCtx || !this.vehicle) return;
        
        const velocity = this.vehicle.getVelocity();
        const angularVel = this.vehicle.getAngularVelocity();
        
        // Calculate G-forces
        const gX = velocity.x / 9.81;
        const gZ = velocity.z / 9.81;
        const totalG = Math.sqrt(gX * gX + gZ * gZ);
        
        // Update G-force value
        document.getElementById('gForceValue').textContent = totalG.toFixed(1) + 'g';
        
        // Draw G-force meter
        const ctx = this.gForceCtx;
        const centerX = 60;
        const centerY = 60;
        const radius = 50;
        
        // Clear canvas
        ctx.clearRect(0, 0, 120, 120);
        
        // Draw background circles
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let r = 10; r <= radius; r += 10) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw center lines
        ctx.beginPath();
        ctx.moveTo(centerX - radius, centerY);
        ctx.lineTo(centerX + radius, centerY);
        ctx.moveTo(centerX, centerY - radius);
        ctx.lineTo(centerX, centerY + radius);
        ctx.stroke();
        
        // Draw G-force vector
        const vectorX = (gX / 2) * radius; // Scale to fit meter
        const vectorZ = (gZ / 2) * radius;
        
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + vectorX, centerY + vectorZ);
        ctx.stroke();
        
        // Draw G-force magnitude circle
        const magRadius = Math.min((totalG / 2) * radius, radius);
        ctx.strokeStyle = totalG > 1 ? '#ff0000' : '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX + vectorX, centerY + vectorZ, 5, 0, Math.PI * 2);
        ctx.stroke();
    }

    destroy() {
        this.isRunning = false;
        
        if (this.vehicle) this.vehicle.destroy();
        if (this.world) this.world.destroy();
        if (this.physics) this.physics.destroy();
        if (this.renderer) this.renderer.destroy();
        if (this.inputManager) this.inputManager.destroy();
    }
}