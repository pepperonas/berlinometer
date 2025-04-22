// BPM-Detection Code
class Hit {
    constructor(timestamp, energy, frequency) {
        this.timestamp = timestamp;
        this.energy = energy;
        this.frequency = frequency;
    }
}

class HitCache {
    constructor(maxSize = 100) {
        this.hits = [];
        this.maxSize = maxSize;
    }

    appendHit(hit) {
        this.hits.push(hit);
        if (this.hits.length > this.maxSize) {
            this.hits.shift(); // Entferne ältesten Hit, wenn Cache voll ist
        }
        return this.hits.length;
    }

    getHits(count = null) {
        if (count === null || count >= this.hits.length) {
            return [...this.hits];
        }
        return this.hits.slice(this.hits.length - count);
    }
}

class SpectrumHitDetector {
    constructor(sampleRate, threshold = 0.5, minTimeBetweenHits = 0.1) {
        this.sampleRate = sampleRate;
        this.threshold = threshold;
        this.minTimeBetweenHits = minTimeBetweenHits;
        this.lastHitTime = 0;
        this.energyHistory = [];
        this.historySize = 8; // Speichere die letzten 8 Frames für Vergleiche
    }

    // Analysiert ein Frequenzspektrum und erkennt Beats
    update(frequencyData, timestamp) {
        // Berechne die Energiewerte in verschiedenen Frequenzbändern
        const lowEnergy = this.calculateBandEnergy(frequencyData, 0, 200);
        const midEnergy = this.calculateBandEnergy(frequencyData, 200, 2000);

        // Überführe Energiewerte in Historie
        this.energyHistory.push({ low: lowEnergy, mid: midEnergy });
        if (this.energyHistory.length > this.historySize) {
            this.energyHistory.shift();
        }

        // Nicht genug Historie für Erkennung
        if (this.energyHistory.length < this.historySize) {
            return null;
        }

        // Prüfe auf Beat in den unteren Frequenzen (klassischer Kick-Drum-Bereich)
        const isHit = this.triggersHit(lowEnergy, timestamp);

        if (isHit) {
            return new Hit(timestamp, lowEnergy, 100); // Ungefährer Frequenzschwerpunkt
        }

        return null;
    }

    // Berechnet Energie in einem Frequenzband
    calculateBandEnergy(frequencyData, lowFreq, highFreq) {
        const lowIndex = Math.floor(lowFreq * frequencyData.length / (this.sampleRate / 2));
        const highIndex = Math.ceil(highFreq * frequencyData.length / (this.sampleRate / 2));

        let energy = 0;
        for (let i = lowIndex; i < highIndex && i < frequencyData.length; i++) {
            energy += frequencyData[i] * frequencyData[i]; // Quadrierter Wert für Energieberechnung
        }

        return Math.sqrt(energy / (highIndex - lowIndex)); // RMS-Energie
    }

    // Prüft, ob die Energie einen Beat auslöst
    triggersHit(energy, timestamp) {
        if (this.energyHistory.length < 2) return false;

        // Durchschnitt der letzten Energie-Werte berechnen (ohne den aktuellen)
        const recentAvg = this.energyHistory
            .slice(0, -1)
            .reduce((sum, entry) => sum + entry.low, 0) / (this.energyHistory.length - 1);

        // Prüfe, ob aktueller Wert den Durchschnitt um threshold überschreitet
        const isEnergyPeak = energy > recentAvg * (1 + this.threshold);

        // Zeitliche Begrenzung der Beat-Erkennung
        const timeSinceLastHit = timestamp - this.lastHitTime;
        const isTimeValid = timeSinceLastHit > this.minTimeBetweenHits;

        if (isEnergyPeak && isTimeValid) {
            this.lastHitTime = timestamp;
            return true;
        }

        return false;
    }
}

class TempoQueue {
    constructor(maxSize = 20) {
        this.intervals = [];
        this.maxSize = maxSize;
        this.minBPM = 60;
        this.maxBPM = 200;
    }

    // Fügt ein neues Beat-Intervall hinzu
    push(interval) {
        // Konvertiere Interval zu BPM
        const bpm = 60 / interval;

        // Prüfe, ob BPM im gültigen Bereich liegt
        if (bpm >= this.minBPM && bpm <= this.maxBPM) {
            this.intervals.push(interval);
            if (this.intervals.length > this.maxSize) {
                this.intervals.shift();
            }
        }

        return this.intervals.length;
    }

    // Aktualisiert die BPM-Grenzen
    applyNewMinBPM(minBPM) {
        this.minBPM = minBPM;
        // Filtere alte Werte basierend auf neuen Grenzen
        this.intervals = this.intervals.filter(interval => {
            const bpm = 60 / interval;
            return bpm >= this.minBPM && bpm <= this.maxBPM;
        });
    }

    // Berechnet den aktuellen BPM-Wert mit Schwellwert-Filterung
    getThresholdedBPM(confidenceThreshold = 0.3) {
        if (this.intervals.length < 2) {
            return null; // Nicht genug Daten
        }

        // Berechne BPM-Werte aus Intervallen
        const bpmValues = this.intervals.map(interval => 60 / interval);

        // Gruppiere ähnliche BPM-Werte
        const bpmClusters = this.clusterBPMValues(bpmValues);

        // Finde das größte Cluster
        let largestCluster = null;
        let maxSize = 0;

        for (const cluster of bpmClusters) {
            if (cluster.values.length > maxSize) {
                maxSize = cluster.values.length;
                largestCluster = cluster;
            }
        }

        // Berechne Konfidenz (Anteil der Werte im größten Cluster)
        const confidence = maxSize / bpmValues.length;

        // Wenn Konfidenz über Schwellwert, gib Durchschnitt des größten Clusters zurück
        if (confidence >= confidenceThreshold && largestCluster) {
            return largestCluster.average;
        }

        return null;
    }

    // Gruppiert ähnliche BPM-Werte zu Clustern
    clusterBPMValues(bpmValues, tolerance = 8) {
        const clusters = [];

        for (const bpm of bpmValues) {
            let addedToCluster = false;

            // Prüfe, ob BPM zu einem bestehenden Cluster passt
            for (const cluster of clusters) {
                if (Math.abs(cluster.average - bpm) <= tolerance) {
                    // Füge zu bestehendem Cluster hinzu
                    cluster.values.push(bpm);
                    cluster.sum += bpm;
                    cluster.average = cluster.sum / cluster.values.length;
                    addedToCluster = true;
                    break;
                }
            }

            // Wenn nicht zu bestehendem Cluster hinzugefügt, erstelle neues Cluster
            if (!addedToCluster) {
                clusters.push({
                    values: [bpm],
                    sum: bpm,
                    average: bpm
                });
            }
        }

        return clusters;
    }
}

class BPMTracker {
    constructor() {
        this.currentBPM = null;
        this.confidence = 0;
        this.lastUpdateTime = 0;
    }

    // Aktualisiert den BPM-Tracker mit einem neuen Wert
    update(timestamp, newBPM) {
        if (newBPM === null) return;

        // Bei erstem BPM-Wert
        if (this.currentBPM === null) {
            this.currentBPM = newBPM;
            this.confidence = 0.1;
            this.lastUpdateTime = timestamp;
            return;
        }

        // Berechne vergangene Zeit seit letztem Update
        const timeDelta = timestamp - this.lastUpdateTime;
        this.lastUpdateTime = timestamp;

        // Vergesse allmählich alten BPM-Wert (zeitabhängig)
        const forgetFactor = Math.min(0.1, timeDelta / 10);

        // Kombiniere alten und neuen BPM-Wert
        this._mergeBPM(forgetFactor, newBPM);
    }

    // Intern: Kombiniere bestehenden BPM mit neuem Wert
    _mergeBPM(factor, newBPM) {
        const bpmDiff = Math.abs(this.currentBPM - newBPM) / this.currentBPM;

        // Wenn neuer Wert sehr ähnlich ist, erhöhe Konfidenz
        if (bpmDiff < 0.05) {
            this.confidence = Math.min(0.99, this.confidence + 0.1);
            // Gewichtete Durchschnittsbildung
            this.currentBPM = (this.currentBPM * (1 - factor) + newBPM * factor);
        }
        // Bei größerem Unterschied reduziere Konfidenz
        else if (bpmDiff < 0.2) {
            this.confidence = Math.max(0.1, this.confidence - 0.05);
            this.currentBPM = (this.currentBPM * 0.8 + newBPM * 0.2);
        }
        // Bei sehr großem Unterschied, ignoriere neuen Wert meistens
        else {
            this.confidence = Math.max(0.05, this.confidence - 0.1);
            // Nur leichte Anpassung in Richtung des neuen Wertes
            this.currentBPM = (this.currentBPM * 0.95 + newBPM * 0.05);
        }
    }

    // Gibt aktuellen Zustand zurück
    getState() {
        return {
            bpm: this.currentBPM,
            confidence: this.confidence
        };
    }
}

class BPMAnalyzer {
    constructor(sampleRate = 44100) {
        this.sampleRate = sampleRate;
        this.hitDetector = new SpectrumHitDetector(sampleRate, 0.4, 0.08);
        this.hitCache = new HitCache();
        this.tempoQueue = new TempoQueue();
        this.bpmTracker = new BPMTracker();
        this.lastHitTime = null;
        this.minBPM = 60;
        this.maxBPM = 200;
    }

    // Setzt die BPM-Grenzen
    applyBPMBounds(bpmValue) {
        if (bpmValue < this.minBPM) return this.minBPM;
        if (bpmValue > this.maxBPM) return this.maxBPM;
        return bpmValue;
    }

    // Hauptmethode zum Updaten der Analyse
    update(frequencyData, timestamp) {
        // Suche nach Beats im Frequenzspektrum
        const hit = this.hitDetector.update(frequencyData, timestamp);

        if (hit) {
            // Speichere erkannten Hit
            this.hitCache.appendHit(hit);

            // Berechne Zeitabstand zum letzten Hit
            if (this.lastHitTime !== null) {
                const interval = timestamp - this.lastHitTime;

                // Füge Intervall zur Tempo-Queue hinzu
                this.tempoQueue.push(interval);

                // Berechne BPM-Wert
                const thresholdedBPM = this.tempoQueue.getThresholdedBPM();

                // Aktualisiere BPM-Tracker
                if (thresholdedBPM !== null) {
                    const boundedBPM = this.applyBPMBounds(thresholdedBPM);
                    this.bpmTracker.update(timestamp, boundedBPM);
                }
            }

            this.lastHitTime = timestamp;

            // Hier Beat-Indikator aktivieren
            animateBeatIndicator();
        }
    }

    // Berechnet BPM aus Zeitintervall
    calcBPMFromIndexDiff(timeInterval) {
        return 60 / timeInterval;
    }

    // Gibt aktuellen BPM-Wert zurück
    getCurBPM() {
        const state = this.bpmTracker.getState();
        return state.bpm;
    }

    // Gibt Qualität der aktuellen BPM-Erkennung zurück
    getCurBPMQuality() {
        const state = this.bpmTracker.getState();
        return state.confidence;
    }

    // Gibt die Anzahl der erkannten Hits zurück
    getHitCount() {
        return this.hitCache.hits.length;
    }

    // Gibt das letzte Intervall zwischen Hits zurück
    getLastInterval() {
        if (this.lastHitTime === null || this.tempoQueue.intervals.length === 0) {
            return null;
        }
        return this.tempoQueue.intervals[this.tempoQueue.intervals.length - 1];
    }

    // Gibt Informationen über die BPM-Cluster zurück
    getClusterInfo() {
        if (this.tempoQueue.intervals.length < 2) {
            return null;
        }

        const bpmValues = this.tempoQueue.intervals.map(interval => 60 / interval);
        const clusters = this.tempoQueue.clusterBPMValues(bpmValues);

        return clusters.map(c => `${Math.round(c.average)}bpm (${c.values.length})`).join(', ');
    }

    // Setzt alles zurück
    reset() {
        this.hitCache = new HitCache();
        this.tempoQueue = new TempoQueue();
        this.bpmTracker = new BPMTracker();
        this.lastHitTime = null;
    }
}

class AudioBPMAnalyzer {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.bpmAnalyzer = null;
        this.isRunning = false;
        this.audioSource = null;
        this.frequencyData = null;
        this.startTime = 0;
    }

    async initialize() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
            this.bpmAnalyzer = new BPMAnalyzer(this.audioContext.sampleRate);

            console.log("Audio BPM Analyzer initialized");
            return true;
        } catch (error) {
            console.error("Failed to initialize Audio BPM Analyzer:", error);
            return false;
        }
    }

    async connectToMicrophone() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioSource = this.audioContext.createMediaStreamSource(stream);
            this.audioSource.connect(this.analyser);
            this.isRunning = true;
            this.startTime = this.audioContext.currentTime;
            this.analyze();
            return true;
        } catch (error) {
            console.error("Failed to connect to microphone:", error);
            return false;
        }
    }

    async connectToAudioElement(audioElement) {
        try {
            this.audioSource = this.audioContext.createMediaElementSource(audioElement);
            this.audioSource.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            this.isRunning = true;
            this.startTime = this.audioContext.currentTime;
            this.analyze();
            return true;
        } catch (error) {
            console.error("Failed to connect to audio element:", error);
            return false;
        }
    }

    analyze() {
        if (!this.isRunning) return;

        // Hole Frequenzdaten
        this.analyser.getByteFrequencyData(this.frequencyData);

        // Berechne aktuelle Zeit
        const currentTime = this.audioContext.currentTime - this.startTime;

        // Update BPM-Analyse
        this.bpmAnalyzer.update(this.frequencyData, currentTime);

        // Aktualisiere UI bei jedem Frame
        updateBPMDisplay();

        // Rufe diese Methode regelmäßig auf
        requestAnimationFrame(() => this.analyze());
    }

    getBPM() {
        if (!this.bpmAnalyzer) return null;
        return this.bpmAnalyzer.getCurBPM();
    }

    getBPMQuality() {
        if (!this.bpmAnalyzer) return 0;
        return this.bpmAnalyzer.getCurBPMQuality();
    }

    getHitCount() {
        if (!this.bpmAnalyzer) return 0;
        return this.bpmAnalyzer.getHitCount();
    }

    getLastInterval() {
        if (!this.bpmAnalyzer) return null;
        return this.bpmAnalyzer.getLastInterval();
    }

    getClusterInfo() {
        if (!this.bpmAnalyzer) return null;
        return this.bpmAnalyzer.getClusterInfo();
    }

    stop() {
        this.isRunning = false;
        if (this.audioSource) {
            try {
                this.audioSource.disconnect();
            } catch (e) {
                console.error("Error disconnecting audio source:", e);
            }
        }
    }
}

// UI Code
let bpmAnalyzer = null;
let currentAudioStream = null;

// UI-Elemente
const microphoneBtn = document.getElementById('microphoneBtn');
const audioFileInput = document.getElementById('audioFileInput');
const stopBtn = document.getElementById('stopBtn');
const audioPlayer = document.getElementById('audioPlayer');
const audioElement = document.getElementById('audioElement');
const statusText = document.getElementById('statusText');
const bpmDisplay = document.getElementById('bpmDisplay');
const qualityFill = document.getElementById('qualityFill');
const beatIndicator = document.getElementById('beatIndicator');

// Zusätzliche UI-Elemente
const hitCountDisplay = document.getElementById('hitCount');
const lastIntervalDisplay = document.getElementById('lastInterval');
const clusterInfoDisplay = document.getElementById('clusterInfo');
const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');

// Event Listeners
microphoneBtn.addEventListener('click', startMicrophoneAnalysis);
audioFileInput.addEventListener('change', handleAudioFile);
stopBtn.addEventListener('click', stopAnalysis);
submitFeedbackBtn.addEventListener('click', copyFeedbackToClipboard);

// Animation für den Beat-Indikator
function animateBeatIndicator() {
    beatIndicator.classList.add('active');
    setTimeout(() => {
        beatIndicator.classList.remove('active');
    }, 100);
}

// Aktualisiere BPM- und Info-Anzeige
function updateBPMDisplay() {
    if (!bpmAnalyzer) return;

    const bpm = bpmAnalyzer.getBPM();
    const quality = bpmAnalyzer.getBPMQuality();

    if (bpm) {
        bpmDisplay.textContent = Math.round(bpm);
        qualityFill.style.width = `${quality * 100}%`;
    }

    // Aktualisiere Live-Informationen
    const hitCount = bpmAnalyzer.getHitCount();
    const lastInterval = bpmAnalyzer.getLastInterval();
    const clusterInfo = bpmAnalyzer.getClusterInfo();

    hitCountDisplay.textContent = hitCount;

    if (lastInterval !== null) {
        lastIntervalDisplay.textContent = lastInterval.toFixed(3);
    }

    if (clusterInfo !== null) {
        clusterInfoDisplay.textContent = clusterInfo;
    }
}

// Starte Analyse vom Mikrofon
async function startMicrophoneAnalysis() {
    // Beende vorherige Analyse
    if (bpmAnalyzer) {
        stopAnalysis();
    }

    // Neue Instanz erstellen
    bpmAnalyzer = new AudioBPMAnalyzer();
    const initSuccess = await bpmAnalyzer.initialize();

    if (!initSuccess) {
        statusText.textContent = "Fehler bei der Initialisierung des Audio-Analyzers";
        return;
    }

    statusText.textContent = "Verbinde mit Mikrofon...";

    try {
        const connected = await bpmAnalyzer.connectToMicrophone();

        if (connected) {
            statusText.textContent = "Analysiere Audio vom Mikrofon...";
            audioPlayer.style.display = 'none';

            // UI updaten
            microphoneBtn.classList.add('disabled');
            stopBtn.classList.remove('disabled');
        } else {
            statusText.textContent = "Konnte nicht mit Mikrofon verbinden";
        }
    } catch (error) {
        statusText.textContent = "Fehler beim Zugriff auf das Mikrofon: " + error.message;
    }
}

// Verarbeite Audiodatei
function handleAudioFile(event) {
    const file = event.target.files[0];

    if (!file) return;

    // Beende vorherige Analyse
    if (bpmAnalyzer) {
        stopAnalysis();
    }

    // Zeige Audioplayer
    audioPlayer.style.display = 'block';
    audioElement.src = URL.createObjectURL(file);

    // Verbinde Analyzer mit Audio-Element
    audioElement.onloadedmetadata = async () => {
        bpmAnalyzer = new AudioBPMAnalyzer();
        const initSuccess = await bpmAnalyzer.initialize();

        if (!initSuccess) {
            statusText.textContent = "Fehler bei der Initialisierung des Audio-Analyzers";
            return;
        }

        try {
            const connected = await bpmAnalyzer.connectToAudioElement(audioElement);

            if (connected) {
                statusText.textContent = `Analysiere "${file.name}"...`;
                audioElement.play();

                // UI updaten
                stopBtn.classList.remove('disabled');
            } else {
                statusText.textContent = "Konnte nicht mit Audiodatei verbinden";
            }
        } catch (error) {
            statusText.textContent = "Fehler beim Verarbeiten der Audiodatei: " + error.message;
        }
    };
}

// Stoppe die Analyse
function stopAnalysis() {
    if (bpmAnalyzer) {
        bpmAnalyzer.stop();
        bpmAnalyzer = null;

        // Stoppe Audio, falls es läuft
        if (!audioElement.paused) {
            audioElement.pause();
        }

        // UI zurücksetzen
        bpmDisplay.textContent = "--";
        qualityFill.style.width = "0%";
        hitCountDisplay.textContent = "0";
        lastIntervalDisplay.textContent = "--";
        clusterInfoDisplay.textContent = "--";
        statusText.textContent = "Wähle eine Audioquelle, um zu starten";
        microphoneBtn.classList.remove('disabled');
        stopBtn.classList.add('disabled');
    }
}

// Feedback-Daten in die Zwischenablage kopieren
function copyFeedbackToClipboard() {
    if (!bpmAnalyzer) {
        alert('Starte die Analyse, bevor du Feedback in die Zwischenablage kopierst');
        return;
    }

    const selectedFeedback = document.querySelector('input[name="feedback"]:checked').value;
    const comment = document.getElementById('feedbackComment').value;
    const currentBPM = bpmAnalyzer.getBPM();
    const currentQuality = bpmAnalyzer.getBPMQuality();

    const feedbackData = {
        type: selectedFeedback,
        comment: comment,
        currentBPM: currentBPM,
        quality: currentQuality,
        timestamp: new Date().toISOString(),
        // Algorithmus-Parameter für spätere Optimierung
        thresholdValue: bpmAnalyzer.bpmAnalyzer.hitDetector.threshold,
        minTimeBetweenHits: bpmAnalyzer.bpmAnalyzer.hitDetector.minTimeBetweenHits,
        // Zusätzliche Debug-Informationen
        hitCount: bpmAnalyzer.getHitCount(),
        lastInterval: bpmAnalyzer.getLastInterval(),
        clusterInfo: bpmAnalyzer.getClusterInfo()
    };

    // In die Zwischenablage kopieren
    const jsonString = JSON.stringify(feedbackData, null, 2);
    navigator.clipboard.writeText(jsonString)
        .then(() => {
            M.toast({html: 'Feedback in Zwischenablage kopiert!'});
        })
        .catch(err => {
            console.error('Fehler beim Kopieren in die Zwischenablage:', err);
            alert('Fehler beim Kopieren in die Zwischenablage. Siehe Konsole für Details.');
        });
}

// Initialisierung beim Laden der Seite
document.addEventListener('DOMContentLoaded', function() {
    // Überprüfe Unterstützung für Web Audio API
    if (!window.AudioContext && !window.webkitAudioContext) {
        statusText.textContent = "Dein Browser unterstützt die Web Audio API nicht";
        microphoneBtn.classList.add('disabled');
        document.getElementById('audioFileInput').disabled = true;
    }

    // Überprüfe Unterstützung für Clipboard API
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
        submitFeedbackBtn.classList.add('disabled');
        submitFeedbackBtn.title = "Dein Browser unterstützt die Clipboard API nicht";
    }

    // Materialize-Komponenten initialisieren
    M.updateTextFields();
    M.textareaAutoResize(document.getElementById('feedbackComment'));
});