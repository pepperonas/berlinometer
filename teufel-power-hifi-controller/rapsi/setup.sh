#!/bin/bash
# Teufel IR Controller Setup for Raspberry Pi
# Author: Martin Pfeffer
# License: MIT

set -e

echo "=== Teufel IR Controller Setup ==="
echo

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/cpuinfo; then
    echo "Warning: This script is designed for Raspberry Pi"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install required packages
echo "Installing required packages..."
sudo apt-get update
sudo apt-get install -y python3-pip pigpio python3-pigpio

# Enable pigpio daemon
echo "Enabling pigpio daemon..."
sudo systemctl enable pigpiod
sudo systemctl start pigpiod

# Install Python requirements
echo "Installing Python packages..."
pip3 install --user pigpio

# Create directory structure
echo "Creating directory structure..."
mkdir -p ~/teufel-ir-controller
cd ~/teufel-ir-controller

# Download the controller script
echo "Creating controller script..."
cat > teufel_ir_controller.py << 'EOF'
# [Python script content would be inserted here]
EOF

# Make executable
chmod +x teufel_ir_controller.py

# Create systemd service (optional)
echo "Creating systemd service..."
sudo tee /etc/systemd/system/teufel-ir-api.service > /dev/null << EOF
[Unit]
Description=Teufel IR Controller API
After=network.target pigpiod.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$HOME/teufel-ir-controller
ExecStart=/usr/bin/python3 $HOME/teufel-ir-controller/teufel_ir_api.py
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Create simple test script
echo "Creating test script..."
cat > test_ir.py << 'EOF'
#!/usr/bin/env python3
import pigpio
import time

# Test if pigpio is working
pi = pigpio.pi()
if pi.connected:
    print("✓ pigpio connected successfully")
    
    # Test GPIO 17
    pi.set_mode(17, pigpio.OUTPUT)
    print("✓ GPIO 17 configured as output")
    
    # Quick LED test (if visible LED connected)
    print("Testing GPIO 17 (3 quick pulses)...")
    for _ in range(3):
        pi.write(17, 1)
        time.sleep(0.1)
        pi.write(17, 0)
        time.sleep(0.1)
    
    pi.stop()
    print("✓ Test completed successfully")
else:
    print("✗ Failed to connect to pigpio daemon")
    print("  Try: sudo systemctl start pigpiod")
EOF

chmod +x test_ir.py

# Create README
cat > README.md << 'EOF'
# Teufel IR Controller - Raspberry Pi

## Hardware Setup

Connect IR LED to GPIO 17:
```
RPi GPIO 17 (Pin 11) ──[100Ω]──┬── IR-LED Anode (+)
                                │
RPi GND (Pin 9/14/20/25) ───────┴── IR-LED Kathode (-)
```

For more range, use transistor circuit:
```
                    3.3V (Pin 1)
                         │
                        [1kΩ]
                         │
GPIO 17 ──[100Ω]────────┤ 2N2222
                        E│
                    GND ─┘
                        
                      C │
                        ├── IR-LED (-)
                   3.3V ─── IR-LED (+)
```

## Usage

1. Test connection:
   ```bash
   ./test_ir.py
   ```

2. Interactive mode:
   ```bash
   ./teufel_ir_controller.py
   ```

3. Send single command:
   ```bash
   ./teufel_ir_controller.py power
   ./teufel_ir_controller.py volume_up --repeat 5
   ```

4. List all commands:
   ```bash
   ./teufel_ir_controller.py --list
   ```

## API Server (Port 5002)

Start manually:
```bash
python3 teufel_ir_api.py
```

Or enable service:
```bash
sudo systemctl enable teufel-ir-api
sudo systemctl start teufel-ir-api
```

API Endpoints:
- POST /ir/send/{command}
- GET /ir/commands
- POST /ir/volume/{steps}
EOF

# Create simple API server for later
cat > teufel_ir_api.py << 'EOF'
#!/usr/bin/env python3
"""
Simple REST API for Teufel IR Controller
Port: 5002 (next free port after your other services)
"""

from flask import Flask, jsonify, request
from teufel_ir_controller import TeufelIRController, TEUFEL_COMMANDS
import threading

app = Flask(__name__)
controller = None
lock = threading.Lock()

@app.route('/ir/commands', methods=['GET'])
def get_commands():
    """Get list of available commands"""
    return jsonify(list(TEUFEL_COMMANDS.keys()))

@app.route('/ir/send/<command>', methods=['POST'])
def send_command(command):
    """Send IR command"""
    try:
        repeat = request.args.get('repeat', 1, type=int)
        with lock:
            controller.send_command(command, repeat)
        return jsonify({'status': 'success', 'command': command})
    except ValueError as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/ir/volume/<int:steps>', methods=['POST'])
def adjust_volume(steps):
    """Adjust volume by steps"""
    try:
        with lock:
            controller.volume_adjust(steps)
        return jsonify({'status': 'success', 'steps': steps})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'teufel-ir-controller'})

if __name__ == '__main__':
    controller = TeufelIRController()
    app.run(host='0.0.0.0', port=5002, debug=False)
EOF

chmod +x teufel_ir_api.py

# Install Flask for API
pip3 install --user flask

echo
echo "=== Setup Complete ==="
echo
echo "Hardware connection:"
echo "  IR LED (+) → 100Ω → GPIO 17 (Pin 11)"
echo "  IR LED (-) → GND (Pin 9/14/20/25)"
echo
echo "Test with:"
echo "  cd ~/teufel-ir-controller"
echo "  ./test_ir.py"
echo "  ./teufel_ir_controller.py --interactive"
echo
echo "API Server will run on port 5002"
echo