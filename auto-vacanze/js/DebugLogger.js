export class DebugLogger {
    constructor() {
        this.logs = [];
        this.logInterval = null;
        this.startTime = Date.now();
        
        // Clear log file on start
        this.clearLogFile();
        
        // Start periodic logging
        this.startLogging();
    }
    
    async clearLogFile() {
        const logData = `=== AUTO VACANZE DEBUG LOG ===
Game started at: ${new Date().toISOString()}
Timestamp | Event | Data
`;
        
        // In browser environment, we'll use console and local storage
        console.clear();
        console.log("=== AUTO VACANZE DEBUG LOG STARTED ===");
        localStorage.setItem('autoVacanzeDebugLog', logData);
    }
    
    log(event, data = {}) {
        const timestamp = ((Date.now() - this.startTime) / 1000).toFixed(2);
        const logEntry = {
            timestamp: parseFloat(timestamp),
            event,
            data: JSON.parse(JSON.stringify(data)) // Deep clone
        };
        
        this.logs.push(logEntry);
        
        // Console output for immediate feedback
        console.log(`[${timestamp}s] ${event}:`, data);
        
        // Update localStorage
        this.updateLogFile(logEntry);
        
        // Keep only last 1000 entries
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(-1000);
        }
    }
    
    updateLogFile(logEntry) {
        const currentLog = localStorage.getItem('autoVacanzeDebugLog') || '';
        const newLine = `${logEntry.timestamp} | ${logEntry.event} | ${JSON.stringify(logEntry.data)}\n`;
        localStorage.setItem('autoVacanzeDebugLog', currentLog + newLine);
    }
    
    startLogging() {
        // Log vehicle state every 2000ms when active (much lower frequency)
        this.logInterval = setInterval(() => {
            if (window.game && window.game.getActiveVehicle()) {
                const vehicle = window.game.getActiveVehicle();
                this.logVehicleState(vehicle);
            }
        }, 2000);
    }
    
    logVehicleState(vehicle) {
        const pos = vehicle.getPosition();
        const vel = vehicle.getVelocity();
        const angVel = vehicle.chassisBody.angularVelocity;
        
        this.log('VEHICLE_STATE', {
            position: { x: pos.x.toFixed(2), y: pos.y.toFixed(2), z: pos.z.toFixed(2) },
            velocity: { x: vel.x.toFixed(2), y: vel.y.toFixed(2), z: vel.z.toFixed(2) },
            speed: vel.length().toFixed(2),
            angularVelocity: { x: angVel.x.toFixed(2), y: angVel.y.toFixed(2), z: angVel.z.toFixed(2) },
            throttle: vehicle.throttleInput ? vehicle.throttleInput.toFixed(2) : '0.00',
            brake: vehicle.brakeInput ? vehicle.brakeInput.toFixed(2) : '0.00',
            steering: vehicle.steerAngle ? vehicle.steerAngle.toFixed(2) : '0.00'
        });
    }
    
    logInput(inputType, value) {
        this.log('INPUT', { type: inputType, value });
    }
    
    logEvent(eventType, data) {
        this.log(eventType, data);
    }
    
    exportLog() {
        const logData = localStorage.getItem('autoVacanzeDebugLog') || '';
        const blob = new Blob([logData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `auto-vacanze-debug-${Date.now()}.log`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    dispose() {
        if (this.logInterval) {
            clearInterval(this.logInterval);
        }
    }
}