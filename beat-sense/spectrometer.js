// spectrometer.js - Visualisierung für den BPM-Detector

class SpectrumVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.frequencyData = null;
        this.isRunning = false;
        this.mode3D = false;
        this.sampleRate = 44100;
        this.binCount = 1024;
        this.historySize = 100; // Anzahl der zu speichernden Frames für 3D
        this.frequencyHistory = [];

        // Canvas-Setup und Event-Listener
        this.setupCanvas();
        window.addEventListener('resize', () => this.setupCanvas());

        // Visualisierungs-Modus wechseln (2D/3D)
        document.getElementById('visualizationMode').addEventListener('change', (e) => {
            this.mode3D = e.target.checked;
            this.setupCanvas();
        });
    }

    setupCanvas() {
        // Canvas an Container anpassen
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = this.mode3D ? 300 : 200;
    }

    createGradient() {
        // Gradient für Frequenz-Balken
        const gradient = this.ctx.createLinearGradient(0, this.canvas.height, 0, 0);
        gradient.addColorStop(0, '#5D5FEF');
        gradient.addColorStop(0.33, '#9C27B0');
        gradient.addColorStop(0.66, '#FF9800');
        gradient.addColorStop(1, '#F44336');
        return gradient;
    }

    start(sampleRate, binCount) {
        this.sampleRate = sampleRate || 44100;
        this.binCount = binCount || 1024;
        this.isRunning = true;
        this.frequencyHistory = [];
    }

    stop() {
        this.isRunning = false;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.frequencyHistory = [];
    }

    updateFrequencyData(frequencyData) {
        if (!this.isRunning || !frequencyData) return;

        this.frequencyData = frequencyData;

        if (this.mode3D) {
            // Für 3D-Modus Historie aufbauen
            this.frequencyHistory.unshift([...this.frequencyData]);
            if (this.frequencyHistory.length > this.historySize) {
                this.frequencyHistory.pop();
            }
            this.render3D();
        } else {
            this.render2D();
        }
    }

    render2D() {
        const { width, height } = this.canvas;
        const barCount = Math.min(this.binCount, 256);

        // Canvas leeren
        this.ctx.clearRect(0, 0, width, height);

        // Gradient erstellen
        const gradient = this.createGradient();

        // Balkenbreite berechnen
        const barWidth = width / barCount;

        for (let i = 0; i < barCount; i++) {
            // Logarithmische Skalierung für realistischere Frequenzverteilung
            const logIndex = Math.floor(Math.pow(i / barCount, 2) * this.binCount);

            // Amplitude (0-1)
            const amplitude = this.frequencyData[logIndex] / 255.0;

            // Quadratische Skalierung für bessere Visualisierung
            const barHeight = amplitude * amplitude * height;

            // Balken zeichnen
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
        }

        // Raster-Linien für bessere Lesbarkeit
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        for (let i = 0; i < 5; i++) {
            const y = height * (i / 4);
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
    }

    render3D() {
        const { width, height } = this.canvas;
        const barCount = Math.min(this.binCount, 128); // Weniger Balken für bessere Performance

        // Canvas leeren
        this.ctx.clearRect(0, 0, width, height);

        // Parameter für 3D-Darstellung
        const historyCount = this.frequencyHistory.length;
        const barWidth = width / barCount;
        const perspectiveStretch = 0.5;
        const rowDepth = 3;

        // Von hinten nach vorne zeichnen
        for (let z = historyCount - 1; z >= 0; z--) {
            const frame = this.frequencyHistory[z];
            const depthFactor = z / historyCount;
            const alpha = 1 - depthFactor * 0.7;

            for (let i = 0; i < barCount; i++) {
                // Logarithmische Skalierung
                const logIndex = Math.floor(Math.pow(i / barCount, 2) * this.binCount);

                // Amplitude (0-1)
                const amplitude = (frame[logIndex] || 0) / 255.0;

                // Höhe berechnen
                const barHeight = amplitude * amplitude * height * 0.8;

                // Perspektivische Verzerrung
                const perspectiveOffset = (0.5 - i / barCount) * width * perspectiveStretch * depthFactor;
                const x = i * barWidth + perspectiveOffset;
                const perspectiveWidth = barWidth * (1 - depthFactor * 0.3);

                // Y-Position mit Tiefe
                const y = height - barHeight + z * rowDepth;

                // Farbe nach Amplitude und Tiefe
                this.ctx.fillStyle = this.getColorForAmplitude(amplitude, alpha);
                this.ctx.fillRect(x, y, perspectiveWidth, barHeight);
            }
        }
    }

    getColorForAmplitude(amplitude, alpha = 1.0) {
        // Farbe von Blau nach Rot je nach Amplitude
        const hue = 230 + amplitude * 150;
        return `hsla(${hue}, 80%, 60%, ${alpha})`;
    }
}

// Initialisierung nach Laden der Seite
document.addEventListener('DOMContentLoaded', () => {
    // Globale Instanz erstellen
    window.spectrometerVisualizer = new SpectrumVisualizer('spectrometer-canvas');

    // Toggle-Buttons für versteckte Sektionen
    document.getElementById('toggleInfoBtn').addEventListener('click', () => {
        const infoCard = document.getElementById('info-card');
        infoCard.style.display = infoCard.style.display === 'none' ? 'block' : 'none';
        document.getElementById('toggleInfoBtn').innerHTML =
            infoCard.style.display === 'none' ?
                '<i class="material-icons left">info</i>Info anzeigen' :
                '<i class="material-icons left">info</i>Info ausblenden';
    });

    document.getElementById('toggleFeedbackBtn').addEventListener('click', () => {
        const feedbackCard = document.getElementById('feedback-card');
        feedbackCard.style.display = feedbackCard.style.display === 'none' ? 'block' : 'none';
        document.getElementById('toggleFeedbackBtn').innerHTML =
            feedbackCard.style.display === 'none' ?
                '<i class="material-icons left">feedback</i>Feedback anzeigen' :
                '<i class="material-icons left">feedback</i>Feedback ausblenden';
    });

    // Integration mit dem BPM-Detector
    // Patch für AudioBPMAnalyzer.analyze
    if (typeof AudioBPMAnalyzer !== 'undefined') {
        const originalAnalyze = AudioBPMAnalyzer.prototype.analyze;

        AudioBPMAnalyzer.prototype.analyze = function() {
            // Original-Methode aufrufen
            originalAnalyze.call(this);

            // Spektrometer aktualisieren
            if (window.spectrometerVisualizer && this.frequencyData) {
                if (!window.spectrometerVisualizer.isRunning) {
                    window.spectrometerVisualizer.start(
                        this.audioContext.sampleRate,
                        this.analyser.frequencyBinCount
                    );
                }
                window.spectrometerVisualizer.updateFrequencyData(this.frequencyData);
            }
        };

        // Patch für stopAnalysis
        const originalStopAnalysis = window.stopAnalysis;

        if (originalStopAnalysis) {
            window.stopAnalysis = function() {
                originalStopAnalysis();

                if (window.spectrometerVisualizer) {
                    window.spectrometerVisualizer.stop();
                }
            };
        }
    }
});