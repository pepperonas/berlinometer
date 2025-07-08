#!/usr/bin/env python3
"""
Teufel Power HiFi IR Controller for Raspberry Pi
Author: Martin Pfeffer
License: MIT
"""

import pigpio
import time
import sys
import argparse
from typing import Dict, List

# IR Configuration
IR_GPIO_PIN = 17  # GPIO 17 for IR LED
CARRIER_FREQ = 38000  # 38 kHz carrier frequency

# Teufel Power HiFi Configuration
TEUFEL_ADDR = 0x5780

# IR Codes Mapping
TEUFEL_COMMANDS = {
    'power': 0x48,
    'bluetooth': 0x40,
    'mute': 0x28,
    'volume_up': 0xB0,
    'volume_down': 0x30,
    'left': 0x78,
    'right': 0xF8,
    'bass_up': 0x58,
    'bass_down': 0x41,
    'mid_up': 0x68,
    'mid_down': 0x42,
    'treble_up': 0xB8,
    'treble_down': 0x43,
    'aux': 0x44,
    'line': 0x45,
    'optical': 0x3F,
    'usb': 0xDF,
    'balance_left': 0xBF,
    'balance_right': 0x5F
}

class NECProtocol:
    """NEC IR Protocol Implementation"""
    
    def __init__(self, pi, gpio_pin, carrier_freq=38000):
        self.pi = pi
        self.gpio_pin = gpio_pin
        self.carrier_freq = carrier_freq
        
        # NEC Protocol Timings (in microseconds)
        self.HEADER_PULSE = 9000
        self.HEADER_SPACE = 4500
        self.BIT_PULSE = 560
        self.ONE_SPACE = 1690
        self.ZERO_SPACE = 560
        self.FINAL_PULSE = 560
        
    def _send_pulse(self, duration_us):
        """Send carrier frequency pulse"""
        self.pi.hardware_PWM(self.gpio_pin, self.carrier_freq, 333333)  # 33% duty cycle
        time.sleep(duration_us / 1000000.0)
        
    def _send_space(self, duration_us):
        """Send space (no signal)"""
        self.pi.hardware_PWM(self.gpio_pin, 0, 0)
        time.sleep(duration_us / 1000000.0)
        
    def send_nec(self, address, command):
        """Send NEC protocol IR signal"""
        # Calculate inverted values
        addr_inv = ~address & 0xFF
        cmd_inv = ~command & 0xFF
        
        # Start header
        self._send_pulse(self.HEADER_PULSE)
        self._send_space(self.HEADER_SPACE)
        
        # Send 32 bits: address, ~address, command, ~command
        data = (address << 24) | (addr_inv << 16) | (command << 8) | cmd_inv
        
        for i in range(32):
            bit = (data >> (31 - i)) & 1
            self._send_pulse(self.BIT_PULSE)
            if bit:
                self._send_space(self.ONE_SPACE)
            else:
                self._send_space(self.ZERO_SPACE)
                
        # Final pulse
        self._send_pulse(self.FINAL_PULSE)
        self.pi.hardware_PWM(self.gpio_pin, 0, 0)  # Ensure LED is off

class TeufelIRController:
    """Main controller for Teufel Power HiFi"""
    
    def __init__(self, gpio_pin=IR_GPIO_PIN):
        self.pi = pigpio.pi()
        if not self.pi.connected:
            raise Exception("Failed to connect to pigpio daemon")
            
        self.nec = NECProtocol(self.pi, gpio_pin)
        
    def send_command(self, command_name: str, repeat: int = 1):
        """Send IR command to Teufel device"""
        if command_name not in TEUFEL_COMMANDS:
            raise ValueError(f"Unknown command: {command_name}")
            
        command_code = TEUFEL_COMMANDS[command_name]
        
        print(f"Sending: {command_name} (0x{command_code:02X})")
        
        for i in range(repeat):
            self.nec.send_nec(TEUFEL_ADDR >> 8, command_code)
            if i < repeat - 1:
                time.sleep(0.05)  # 50ms between repeats
                
    def volume_adjust(self, steps: int):
        """Adjust volume by steps (positive = up, negative = down)"""
        command = 'volume_up' if steps > 0 else 'volume_down'
        for _ in range(abs(steps)):
            self.send_command(command)
            time.sleep(0.05)
            
    def close(self):
        """Clean up GPIO"""
        self.pi.hardware_PWM(IR_GPIO_PIN, 0, 0)
        self.pi.stop()

def interactive_mode(controller):
    """Interactive terminal mode"""
    print("\n=== Teufel Power HiFi IR Controller ===")
    print("Commands:")
    print("  p     - Power ON/OFF")
    print("  m     - Mute")
    print("  b     - Bluetooth")
    print("  +/-   - Volume Up/Down")
    print("  ++/-- - Volume Up/Down (5 steps)")
    print("  l/r   - Left/Right")
    print("  1-4   - Input (1=AUX, 2=Line, 3=Optical, 4=USB)")
    print("  B/b   - Bass Up/Down")
    print("  M/n   - Mid Up/Down")
    print("  T/t   - Treble Up/Down")
    print("  <//>  - Balance Left/Right")
    print("  h     - Show this help")
    print("  q     - Quit")
    print()
    
    command_map = {
        'p': 'power',
        'm': 'mute',
        'b': 'bluetooth',
        '+': 'volume_up',
        '-': 'volume_down',
        'l': 'left',
        'r': 'right',
        '1': 'aux',
        '2': 'line',
        '3': 'optical',
        '4': 'usb',
        'B': 'bass_up',
        'b': 'bass_down',
        'M': 'mid_up',
        'n': 'mid_down',
        'T': 'treble_up',
        't': 'treble_down',
        '<': 'balance_left',
        '>': 'balance_right'
    }
    
    while True:
        try:
            cmd = input("Command: ").strip()
            
            if cmd == 'q':
                break
            elif cmd == 'h':
                interactive_mode(controller)  # Show help again
                return
            elif cmd == '++':
                controller.volume_adjust(5)
            elif cmd == '--':
                controller.volume_adjust(-5)
            elif cmd in command_map:
                controller.send_command(command_map[cmd])
            else:
                print(f"Unknown command: {cmd}")
                
        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except Exception as e:
            print(f"Error: {e}")

def main():
    parser = argparse.ArgumentParser(description='Teufel Power HiFi IR Controller')
    parser.add_argument('command', nargs='?', help='IR command to send')
    parser.add_argument('-r', '--repeat', type=int, default=1, 
                        help='Number of times to repeat command')
    parser.add_argument('-l', '--list', action='store_true',
                        help='List all available commands')
    parser.add_argument('-i', '--interactive', action='store_true',
                        help='Interactive mode')
    
    args = parser.parse_args()
    
    if args.list:
        print("Available commands:")
        for cmd in sorted(TEUFEL_COMMANDS.keys()):
            print(f"  {cmd}")
        return
        
    try:
        controller = TeufelIRController()
        
        if args.interactive or not args.command:
            interactive_mode(controller)
        else:
            controller.send_command(args.command, args.repeat)
            
        controller.close()
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()