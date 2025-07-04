export class InputManager {
    constructor() {
        this.keys = {};
        this.bindings = {};
        this.listeners = {};
        this.gamepadIndex = null;
        this.useGamepad = false;
        
        // Default key bindings
        this.keyMap = {
            'KeyW': 'accelerate',
            'ArrowUp': 'accelerate',
            'KeyS': 'brake',
            'ArrowDown': 'brake',
            'KeyA': 'steerLeft',
            'ArrowLeft': 'steerLeft',
            'KeyD': 'steerRight',
            'ArrowRight': 'steerRight',
            'Space': 'handbrake',
            'KeyC': 'changeCamera',
            'KeyR': 'reset',
            'KeyF': 'toggleDebug',
            'Escape': 'pause'
        };
        
        // Gamepad mappings (Xbox controller layout)
        this.gamepadMap = {
            buttons: {
                0: 'accelerate',    // A button
                1: 'brake',         // B button
                2: 'handbrake',     // X button
                3: 'changeCamera',  // Y button
                8: 'pause',         // Start button
                9: 'reset'          // Select button
            },
            axes: {
                0: 'steer',         // Left stick X
                2: 'accelerate',    // Right trigger
                3: 'brake'          // Left trigger
            }
        };
    }

    init() {
        // Keyboard events
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Gamepad events
        window.addEventListener('gamepadconnected', (e) => this.onGamepadConnected(e));
        window.addEventListener('gamepaddisconnected', (e) => this.onGamepadDisconnected(e));
        
        // Start polling for gamepad input
        this.pollGamepad();
        
        // Prevent default for certain keys
        window.addEventListener('keydown', (e) => {
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });
    }

    onKeyDown(event) {
        if (this.keys[event.code]) return; // Ignore repeat events
        
        this.keys[event.code] = true;
        
        const action = this.keyMap[event.code];
        if (action) {
            this.handleAction(action, 1.0);
        }
    }

    onKeyUp(event) {
        this.keys[event.code] = false;
        
        const action = this.keyMap[event.code];
        if (action) {
            this.handleAction(action, 0.0);
        }
    }

    onGamepadConnected(event) {
        console.log('Gamepad connected:', event.gamepad.id);
        this.gamepadIndex = event.gamepad.index;
        this.useGamepad = true;
    }

    onGamepadDisconnected(event) {
        console.log('Gamepad disconnected');
        this.gamepadIndex = null;
        this.useGamepad = false;
    }

    pollGamepad() {
        if (this.useGamepad && this.gamepadIndex !== null) {
            const gamepad = navigator.getGamepads()[this.gamepadIndex];
            
            if (gamepad) {
                // Process buttons
                gamepad.buttons.forEach((button, index) => {
                    const action = this.gamepadMap.buttons[index];
                    if (action && button.pressed) {
                        this.handleAction(action, button.value);
                    }
                });
                
                // Process axes
                const steerValue = gamepad.axes[0]; // Left stick X
                if (Math.abs(steerValue) > 0.1) { // Dead zone
                    this.emit('steer', steerValue);
                } else {
                    this.emit('steer', 0);
                }
                
                // Triggers for acceleration/brake
                const accelerateValue = (gamepad.axes[2] + 1) / 2; // Convert from [-1,1] to [0,1]
                const brakeValue = (gamepad.axes[3] + 1) / 2;
                
                if (accelerateValue > 0.1) {
                    this.emit('accelerate', accelerateValue);
                }
                if (brakeValue > 0.1) {
                    this.emit('brake', brakeValue);
                }
            }
        }
        
        // Continue polling
        requestAnimationFrame(() => this.pollGamepad());
    }

    handleAction(action, value) {
        // Handle steering separately (corrected direction)
        if (action === 'steerLeft') {
            this.emit('steer', value); // Was value * -1, now just value
        } else if (action === 'steerRight') {
            this.emit('steer', value * -1); // Was value, now value * -1
        } else {
            this.emit(action, value);
        }
        
        // Debug output
        if (value > 0) {
            console.log(`Input: ${action} = ${value}`);
        }
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    off(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    isKeyPressed(keyCode) {
        return this.keys[keyCode] || false;
    }

    getSteeringInput() {
        let steering = 0;
        
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            steering -= 1;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            steering += 1;
        }
        
        return steering;
    }

    getThrottleInput() {
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            return 1;
        }
        return 0;
    }

    getBrakeInput() {
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            return 1;
        }
        return 0;
    }

    destroy() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('gamepadconnected', this.onGamepadConnected);
        window.removeEventListener('gamepaddisconnected', this.onGamepadDisconnected);
        
        this.keys = {};
        this.listeners = {};
    }
}