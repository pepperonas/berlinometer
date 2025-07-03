export class UIManager {
    constructor() {
        this.speedDisplay = document.getElementById('speed');
        this.gearDisplay = document.getElementById('gear');
        this.damageBar = document.getElementById('damage-fill');
        this.game = null;
        
        this.setupUI();
    }
    
    setupUI() {
        // Hide controls help after 10 seconds
        setTimeout(() => {
            const help = document.getElementById('controls-help');
            if (help) {
                help.style.opacity = '0';
                help.style.transition = 'opacity 1s';
                setTimeout(() => help.style.display = 'none', 1000);
            }
        }, 10000);
    }
    
    connectToGame(game) {
        this.game = game;
        
        // Start UI update loop
        this.updateLoop();
    }
    
    updateLoop() {
        this.updateSpeed();
        this.updateGear();
        this.updateDamage();
        
        requestAnimationFrame(() => this.updateLoop());
    }
    
    updateSpeed() {
        if (!this.game || !this.game.getActiveVehicle()) return;
        
        const vehicle = this.game.getActiveVehicle();
        const velocity = vehicle.getVelocity();
        
        if (!velocity) {
            this.speedDisplay.textContent = '0';
            return;
        }
        
        const speed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);
        
        // Convert to km/h
        const kmh = Math.round(speed * 3.6);
        this.speedDisplay.textContent = Math.abs(kmh);
        
        // Store speed for other uses
        vehicle.speed = kmh;
    }
    
    updateGear() {
        if (!this.game || !this.game.getActiveVehicle()) return;
        
        const vehicle = this.game.getActiveVehicle();
        const speed = Math.abs(vehicle.speed || 0);
        
        // Simple automatic transmission
        let gear = 'N';
        if (speed > 0 && speed < 20) gear = '1';
        else if (speed < 40) gear = '2';
        else if (speed < 60) gear = '3';
        else if (speed < 90) gear = '4';
        else if (speed >= 90) gear = '5';
        
        this.gearDisplay.textContent = gear;
        vehicle.gear = gear;
    }
    
    updateDamage() {
        if (!this.game || !this.game.getActiveVehicle()) return;
        
        const vehicle = this.game.getActiveVehicle();
        const damage = vehicle.damage || 0;
        
        // Update damage bar
        this.damageBar.style.width = `${damage}%`;
        
        // Change color based on damage level
        if (damage < 30) {
            this.damageBar.style.background = '#4CAF50';
        } else if (damage < 70) {
            this.damageBar.style.background = '#FFC107';
        } else {
            this.damageBar.style.background = '#F44336';
        }
    }
    
    showMessage(text, duration = 3000) {
        const message = document.createElement('div');
        message.className = 'ui-message';
        message.textContent = text;
        message.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
        `;
        
        document.getElementById('ui-overlay').appendChild(message);
        
        setTimeout(() => {
            message.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => message.remove(), 300);
        }, duration);
    }
}