export class InputController {
    constructor(game) {
        this.game = game;
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Mouse events
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        
        // Gamepad support
        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad connected:', e.gamepad.id);
        });
        
        // Prevent right-click context menu
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    onKeyDown(event) {
        this.keys[event.code] = true;
        
        // Handle special keys
        switch(event.code) {
            case 'KeyR':
                this.resetVehicle();
                break;
            case 'KeyC':
                this.toggleCamera();
                break;
            case 'Escape':
                this.togglePause();
                break;
        }
    }
    
    onKeyUp(event) {
        this.keys[event.code] = false;
    }
    
    onMouseMove(event) {
        this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    
    onMouseDown(event) {
        this.mouseDown = true;
    }
    
    onMouseUp(event) {
        this.mouseDown = false;
    }
    
    resetVehicle() {
        const vehicle = this.game.getActiveVehicle();
        if (!vehicle) return;
        
        vehicle.reset();
    }
    
    toggleCamera() {
        const modes = ['chase', 'cockpit', 'free'];
        const currentIndex = modes.indexOf(this.game.cameraMode);
        this.game.cameraMode = modes[(currentIndex + 1) % modes.length];
        console.log('Camera mode:', this.game.cameraMode);
    }
    
    togglePause() {
        // TODO: Implement pause functionality
        console.log('Pause toggled');
    }
    
    processInput() {
        const vehicle = this.game.getActiveVehicle();
        if (!vehicle) return;
        
        // Throttle/Brake
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.applyThrottle(1.0);
        } else if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.applyBrake(1.0);
        }
        
        // Steering
        let steer = 0;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            steer = -1;
        } else if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            steer = 1;
        }
        this.applySteering(steer);
        
        // Handbrake
        if (this.keys['Space']) {
            this.applyHandbrake(1.0);
        }
    }
    
    applyThrottle(amount) {
        const vehicle = this.game.getActiveVehicle();
        if (!vehicle) return;
        
        vehicle.applyThrottle(amount);
    }
    
    applyBrake(amount) {
        const vehicle = this.game.getActiveVehicle();
        if (!vehicle) return;
        
        vehicle.applyBrake(amount);
    }
    
    applySteering(amount) {
        const vehicle = this.game.getActiveVehicle();
        if (!vehicle) return;
        
        vehicle.applySteering(amount);
    }
    
    applyHandbrake(amount) {
        const vehicle = this.game.getActiveVehicle();
        if (!vehicle) return;
        
        // Apply strong brake to all wheels
        vehicle.applyBrake(amount * 2);
    }
    
    update() {
        this.processInput();
        this.checkGamepad();
    }
    
    checkGamepad() {
        const gamepads = navigator.getGamepads();
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (!gamepad) continue;
            
            // Process gamepad input
            const throttle = gamepad.buttons[7]?.value || 0; // R2
            const brake = gamepad.buttons[6]?.value || 0; // L2
            const steer = gamepad.axes[0] || 0; // Left stick X
            
            if (throttle > 0.1) this.applyThrottle(throttle);
            if (brake > 0.1) this.applyBrake(brake);
            if (Math.abs(steer) > 0.1) this.applySteering(steer);
        }
    }
}