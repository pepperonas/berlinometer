export class AudioEngine {
    constructor() {
        this.context = null;
        this.listener = null;
        this.masterGain = null;
        this.sounds = new Map();
        this.soundSources = new Map();
        
        // Audio categories with separate volume controls
        this.categories = {
            engine: { gain: null, volume: 0.7 },
            collision: { gain: null, volume: 0.8 },
            environment: { gain: null, volume: 0.5 },
            tire: { gain: null, volume: 0.6 },
            wind: { gain: null, volume: 0.4 }
        };
        
        // Engine sound synthesis
        this.engineOscillators = [];
        this.engineFilters = [];
        this.isInitialized = false;
        
        // Mute system
        this.isMuted = true; // Start muted by default
        this.savedMasterVolume = 1.0;
    }

    async init() {
        try {
            // Create audio context (requires user interaction)
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create master gain
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            
            // Set initial volume based on mute state
            this.masterGain.gain.value = this.isMuted ? 0 : this.savedMasterVolume;
            
            // Create category gains
            Object.keys(this.categories).forEach(category => {
                const gain = this.context.createGain();
                gain.connect(this.masterGain);
                gain.gain.value = this.categories[category].volume;
                this.categories[category].gain = gain;
            });
            
            // Setup 3D audio listener
            this.listener = this.context.listener;
            
            // Generate procedural engine sounds
            await this.generateEngineSounds();
            
            // Generate other procedural sounds
            await this.generateEnvironmentalSounds();
            
            this.isInitialized = true;
            console.log('Audio Engine initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize audio:', error);
        }
    }

    async generateEngineSounds() {
        // Create realistic engine sound using multiple oscillators
        const engineConfig = {
            cylinders: 4,
            baseFreq: 60, // Base engine rumble
            harmonic1: 120, // First harmonic
            harmonic2: 180, // Second harmonic
            harmonic3: 240, // Third harmonic
            exhaustDelay: 0.02 // Exhaust system delay
        };
        
        // Main engine rumble (low frequency)
        const rumbleOsc = this.context.createOscillator();
        rumbleOsc.type = 'sawtooth';
        rumbleOsc.frequency.value = engineConfig.baseFreq;
        
        const rumbleGain = this.context.createGain();
        rumbleGain.gain.value = 0.3;
        
        const rumbleFilter = this.context.createBiquadFilter();
        rumbleFilter.type = 'lowpass';
        rumbleFilter.frequency.value = 300;
        rumbleFilter.Q.value = 2;
        
        rumbleOsc.connect(rumbleFilter);
        rumbleFilter.connect(rumbleGain);
        rumbleGain.connect(this.categories.engine.gain);
        
        this.engineOscillators.push({ 
            osc: rumbleOsc, 
            gain: rumbleGain, 
            filter: rumbleFilter,
            type: 'rumble',
            baseFreq: engineConfig.baseFreq 
        });
        
        // Harmonic oscillators for complexity
        [engineConfig.harmonic1, engineConfig.harmonic2, engineConfig.harmonic3].forEach((freq, i) => {
            const harmOsc = this.context.createOscillator();
            harmOsc.type = i % 2 === 0 ? 'triangle' : 'square';
            harmOsc.frequency.value = freq;
            
            const harmGain = this.context.createGain();
            harmGain.gain.value = 0.1 / (i + 1); // Decreasing harmonics
            
            const harmFilter = this.context.createBiquadFilter();
            harmFilter.type = 'bandpass';
            harmFilter.frequency.value = freq * 2;
            harmFilter.Q.value = 3;
            
            harmOsc.connect(harmFilter);
            harmFilter.connect(harmGain);
            harmGain.connect(this.categories.engine.gain);
            
            this.engineOscillators.push({ 
                osc: harmOsc, 
                gain: harmGain, 
                filter: harmFilter,
                type: 'harmonic',
                baseFreq: freq,
                harmonicIndex: i 
            });
        });
        
        // Exhaust pop/crackle generator
        const exhaustBuffer = this.generateExhaustCrackle();
        this.sounds.set('exhaustPop', exhaustBuffer);
        
        // Start all oscillators
        this.engineOscillators.forEach(eng => {
            eng.osc.start();
        });
    }

    generateExhaustCrackle() {
        // Generate procedural exhaust pops and crackles
        const length = 0.1; // 100ms
        const sampleRate = this.context.sampleRate;
        const buffer = this.context.createBuffer(1, length * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            // Generate pink noise with sharp attack
            const attack = Math.exp(-i / (sampleRate * 0.01)); // 10ms attack
            const noise = (Math.random() * 2 - 1) * attack;
            
            // Add some harmonic content
            const harmonic = Math.sin(2 * Math.PI * 200 * i / sampleRate) * attack * 0.3;
            
            data[i] = (noise + harmonic) * 0.5;
        }
        
        return buffer;
    }

    async generateEnvironmentalSounds() {
        // Wind noise
        const windBuffer = this.generateWindNoise();
        this.sounds.set('wind', windBuffer);
        
        // Tire squeal
        const squealBuffer = this.generateTireSqueal();
        this.sounds.set('tireSqueal', squealBuffer);
        
        // Collision impacts
        const impactBuffer = this.generateImpactSound();
        this.sounds.set('impact', impactBuffer);
        
        // Skid sounds
        const skidBuffer = this.generateSkidSound();
        this.sounds.set('skid', skidBuffer);
    }

    generateWindNoise() {
        const length = 2; // 2 seconds loop
        const sampleRate = this.context.sampleRate;
        const buffer = this.context.createBuffer(1, length * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            // Generate filtered white noise
            const noise = (Math.random() * 2 - 1) * 0.3;
            
            // Add wind frequency characteristics
            const windFreq = 80 + Math.sin(i / 1000) * 20;
            const wind = Math.sin(2 * Math.PI * windFreq * i / sampleRate) * 0.1;
            
            data[i] = noise + wind;
        }
        
        return buffer;
    }

    generateTireSqueal() {
        const length = 0.5; // 500ms
        const sampleRate = this.context.sampleRate;
        const buffer = this.context.createBuffer(1, length * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            // High-pitched squeal with frequency modulation
            const baseFreq = 800;
            const modulation = Math.sin(2 * Math.PI * 5 * i / sampleRate) * 200;
            const squeal = Math.sin(2 * Math.PI * (baseFreq + modulation) * i / sampleRate);
            
            // Add some noise
            const noise = (Math.random() * 2 - 1) * 0.3;
            
            // Envelope
            const envelope = Math.sin(Math.PI * i / data.length);
            
            data[i] = (squeal * 0.7 + noise * 0.3) * envelope * 0.4;
        }
        
        return buffer;
    }

    generateImpactSound() {
        const length = 0.3; // 300ms
        const sampleRate = this.context.sampleRate;
        const buffer = this.context.createBuffer(1, length * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            // Sharp attack with exponential decay
            const attack = i < sampleRate * 0.01 ? i / (sampleRate * 0.01) : 1;
            const decay = Math.exp(-i / (sampleRate * 0.1));
            const envelope = attack * decay;
            
            // Mix of low rumble and high crack
            const lowFreq = Math.sin(2 * Math.PI * 60 * i / sampleRate) * 0.6;
            const highFreq = Math.sin(2 * Math.PI * 2000 * i / sampleRate) * 0.4;
            const noise = (Math.random() * 2 - 1) * 0.5;
            
            data[i] = (lowFreq + highFreq + noise) * envelope * 0.3;
        }
        
        return buffer;
    }

    generateSkidSound() {
        const length = 1; // 1 second loop
        const sampleRate = this.context.sampleRate;
        const buffer = this.context.createBuffer(1, length * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            // Rough texture sound
            const roughness = Math.sin(2 * Math.PI * 150 * i / sampleRate) * 
                            Math.sin(2 * Math.PI * 37 * i / sampleRate);
            
            // Add filtered noise
            const noise = (Math.random() * 2 - 1) * 0.4;
            
            data[i] = (roughness * 0.6 + noise * 0.4) * 0.3;
        }
        
        return buffer;
    }

    updateEngine(rpm, throttle, load = 0) {
        if (!this.isInitialized) return;
        
        // Calculate engine frequencies based on RPM
        const rpmRatio = rpm / 7000; // Normalize to max RPM
        
        this.engineOscillators.forEach(eng => {
            // Update frequency based on RPM
            const targetFreq = eng.baseFreq * (0.5 + rpmRatio * 1.5);
            eng.osc.frequency.exponentialRampToValueAtTime(
                targetFreq, 
                this.context.currentTime + 0.1
            );
            
            // Update volume based on throttle and type
            let targetVolume = 0;
            switch (eng.type) {
                case 'rumble':
                    targetVolume = 0.2 + throttle * 0.3 + load * 0.2;
                    break;
                case 'harmonic':
                    targetVolume = (0.05 + throttle * 0.15) / (eng.harmonicIndex + 1);
                    break;
            }
            
            eng.gain.gain.exponentialRampToValueAtTime(
                Math.max(0.001, targetVolume), 
                this.context.currentTime + 0.1
            );
            
            // Update filter based on RPM
            if (eng.filter.type === 'lowpass') {
                eng.filter.frequency.exponentialRampToValueAtTime(
                    200 + rpmRatio * 800, 
                    this.context.currentTime + 0.1
                );
            } else if (eng.filter.type === 'bandpass') {
                eng.filter.frequency.exponentialRampToValueAtTime(
                    eng.baseFreq * (1 + rpmRatio), 
                    this.context.currentTime + 0.1
                );
            }
        });
        
        // Trigger exhaust pops on throttle release
        if (throttle < 0.1 && rpm > 3000 && Math.random() < 0.1) {
            this.playExhaustPop();
        }
    }

    playExhaustPop() {
        const source = this.context.createBufferSource();
        source.buffer = this.sounds.get('exhaustPop');
        
        const gain = this.context.createGain();
        gain.gain.value = 0.3 + Math.random() * 0.4;
        
        // Add some pitch variation
        source.playbackRate.value = 0.8 + Math.random() * 0.4;
        
        source.connect(gain);
        gain.connect(this.categories.engine.gain);
        source.start();
    }

    playCollisionSound(intensity, position) {
        if (!this.isInitialized) return;
        
        const source = this.context.createBufferSource();
        source.buffer = this.sounds.get('impact');
        
        const gain = this.context.createGain();
        gain.gain.value = Math.min(intensity * 0.5, 1.0);
        
        // 3D positioning
        const panner = this.context.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 50;
        panner.rolloffFactor = 1;
        
        if (position) {
            panner.positionX.value = position.x;
            panner.positionY.value = position.y;
            panner.positionZ.value = position.z;
        }
        
        // Pitch variation based on intensity
        source.playbackRate.value = 0.7 + intensity * 0.6;
        
        source.connect(gain);
        gain.connect(panner);
        panner.connect(this.categories.collision.gain);
        source.start();
    }

    playTireSqueal(intensity, position) {
        if (!this.isInitialized) return;
        
        const sourceId = 'tireSqueal_' + Date.now();
        
        const source = this.context.createBufferSource();
        source.buffer = this.sounds.get('tireSqueal');
        source.loop = true;
        
        const gain = this.context.createGain();
        gain.gain.value = intensity * 0.4;
        
        // 3D positioning
        const panner = this.context.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 30;
        
        if (position) {
            panner.positionX.value = position.x;
            panner.positionY.value = position.y;
            panner.positionZ.value = position.z;
        }
        
        source.connect(gain);
        gain.connect(panner);
        panner.connect(this.categories.tire.gain);
        source.start();
        
        // Store reference for later control
        this.soundSources.set(sourceId, { source, gain, panner });
        
        // Auto-cleanup after duration
        setTimeout(() => {
            this.stopSound(sourceId);
        }, 500);
        
        return sourceId;
    }

    updateWind(speed, direction) {
        if (!this.isInitialized) return;
        
        // Update wind volume based on speed
        const windVolume = Math.min(speed / 50, 1.0) * 0.3;
        this.categories.wind.gain.gain.exponentialRampToValueAtTime(
            Math.max(0.001, windVolume), 
            this.context.currentTime + 0.5
        );
    }

    update3DListener(position, orientation, velocity) {
        if (!this.isInitialized || !this.listener) return;
        
        // Update listener position
        if (this.listener.positionX) {
            this.listener.positionX.value = position.x;
            this.listener.positionY.value = position.y;
            this.listener.positionZ.value = position.z;
        }
        
        // Update listener orientation
        if (this.listener.forwardX && orientation) {
            this.listener.forwardX.value = orientation.forward.x;
            this.listener.forwardY.value = orientation.forward.y;
            this.listener.forwardZ.value = orientation.forward.z;
            
            this.listener.upX.value = orientation.up.x;
            this.listener.upY.value = orientation.up.y;
            this.listener.upZ.value = orientation.up.z;
        }
        
        // Doppler effect simulation (basic)
        if (velocity) {
            const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
            const dopplerFactor = 1 + speed * 0.001; // Subtle effect
            
            this.engineOscillators.forEach(eng => {
                eng.osc.detune.value = (dopplerFactor - 1) * 1200; // Cents
            });
        }
    }

    stopSound(soundId) {
        const soundRef = this.soundSources.get(soundId);
        if (soundRef) {
            soundRef.source.stop();
            this.soundSources.delete(soundId);
        }
    }

    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.exponentialRampToValueAtTime(
                Math.max(0.001, volume), 
                this.context.currentTime + 0.1
            );
        }
    }

    setCategoryVolume(category, volume) {
        if (this.categories[category] && this.categories[category].gain) {
            this.categories[category].volume = volume;
            this.categories[category].gain.gain.exponentialRampToValueAtTime(
                Math.max(0.001, volume), 
                this.context.currentTime + 0.1
            );
        }
    }

    // Resume audio context (required after user interaction)
    resume() {
        if (this.context && this.context.state === 'suspended') {
            return this.context.resume();
        }
        return Promise.resolve();
    }
    
    // Mute/Unmute system
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.masterGain) {
            if (this.isMuted) {
                // Save current volume before muting
                this.savedMasterVolume = this.masterGain.gain.value;
                this.masterGain.gain.exponentialRampToValueAtTime(
                    0.001, 
                    this.context.currentTime + 0.1
                );
            } else {
                // Restore saved volume
                this.masterGain.gain.exponentialRampToValueAtTime(
                    Math.max(0.001, this.savedMasterVolume), 
                    this.context.currentTime + 0.1
                );
            }
        }
        
        console.log(`Audio ${this.isMuted ? 'muted' : 'unmuted'}`);
        return this.isMuted;
    }
    
    getMuteState() {
        return this.isMuted;
    }
    
    setMuted(muted) {
        if (this.isMuted !== muted) {
            this.toggleMute();
        }
    }

    destroy() {
        // Stop all oscillators
        this.engineOscillators.forEach(eng => {
            eng.osc.stop();
        });
        
        // Stop all sound sources
        this.soundSources.forEach(soundRef => {
            soundRef.source.stop();
        });
        
        // Close audio context
        if (this.context) {
            this.context.close();
        }
        
        this.engineOscillators = [];
        this.soundSources.clear();
        this.sounds.clear();
    }
}