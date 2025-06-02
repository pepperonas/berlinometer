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
    constructor(sampleRate, threshold = 0.32, minTimeBetweenHits = 0.08) {
        this.sampleRate = sampleRate;
        this.threshold = threshold;
        this.minTimeBetweenHits = minTimeBetweenHits;
        this.lastHitTime = 0;
        this.energyHistory = [];
        this.historySize = 12; // Erhöht für bessere Onset-Erkennung
        this.averageEnergy = 0; // Durchschnittliche Energie für adaptive Schwellwerte
        this.adaptiveThreshold = threshold;
        
        // Onset-Detection Parameter
        this.spectralFlux = [];
        this.spectralFluxHistory = [];
        this.spectralFluxHistorySize = 20;
        this.previousSpectrum = null;

        // Dynamische Genre-Erkennung für bessere Frequenzgewichtung
        this.genreProfile = {
            lowRatio: 0.5,    // Standard-Gewichtung für niedrige Frequenzen
            midLowRatio: 0.35, // Standard-Gewichtung für mittlere-niedrige Frequenzen
            midRatio: 0.15,    // Standard-Gewichtung für mittlere Frequenzen
            highRatio: 0.0    // Standard-Gewichtung für hohe Frequenzen
        };

        // Diagnosedaten
        this.diagnosticData = {
            lastHitEnergies: null,
            averageEnergy: 0,
            peakRatio: 0,
            adaptiveThresholdValue: threshold,
            genreProfile: {...this.genreProfile}
        };
    }

    // Analysiert ein Frequenzspektrum und erkennt Beats
    update(frequencyData, timestamp) {
        // Berechne Spectral Flux für bessere Onset-Erkennung
        const flux = this.calculateSpectralFlux(frequencyData);
        this.spectralFluxHistory.push(flux);
        if (this.spectralFluxHistory.length > this.spectralFluxHistorySize) {
            this.spectralFluxHistory.shift();
        }
        
        // Berechne die Energiewerte in optimierten Frequenzbändern für Musik
        const subBassEnergy = this.calculateBandEnergy(frequencyData, 20, 60);    // Sub-Bass
        const bassEnergy = this.calculateBandEnergy(frequencyData, 60, 250);      // Bass
        const lowMidEnergy = this.calculateBandEnergy(frequencyData, 250, 500);   // Low-Mid
        const midEnergy = this.calculateBandEnergy(frequencyData, 500, 2000);     // Mid
        const highMidEnergy = this.calculateBandEnergy(frequencyData, 2000, 4000); // High-Mid
        
        // Kombiniere Sub-Bass und Bass für lowEnergy
        const lowEnergy = (subBassEnergy * 0.3 + bassEnergy * 0.7);
        // Kombiniere Low-Mid und Mid für midLowEnergy 
        const midLowEnergy = (lowMidEnergy * 0.6 + midEnergy * 0.4);
        // High-Mid als highEnergy
        const highEnergy = highMidEnergy;

        // Überprüfe auf Genre-Eigenschaften und passe Gewichtungen an
        this.updateGenreProfile(lowEnergy, midLowEnergy, midEnergy, highEnergy);

        // Kombinierte Energie mit dynamischer Gewichtung basierend auf Genre
        const combinedEnergy =
            (lowEnergy * this.genreProfile.lowRatio) +
            (midLowEnergy * this.genreProfile.midLowRatio) +
            (midEnergy * this.genreProfile.midRatio) +
            (highEnergy * this.genreProfile.highRatio);

        // Adaptive Schwellwertanpassung - sensibler und mit mehr Dynamik
        this.updateAdaptiveThreshold(combinedEnergy, timestamp);

        // Überführe Energiewerte in Historie
        this.energyHistory.push({
            low: lowEnergy,
            midLow: midLowEnergy,
            mid: midEnergy,
            high: highEnergy,
            combined: combinedEnergy,
            timestamp: timestamp
        });

        if (this.energyHistory.length > this.historySize) {
            this.energyHistory.shift();
        }

        // Nicht genug Historie für Erkennung
        if (this.energyHistory.length < this.historySize) {
            return null;
        }

        // Prüfe auf Beat mit kombinierter Energie und Spectral Flux
        const isHit = this.triggersHit(combinedEnergy, flux, timestamp);

        // Diagnose-Daten aktualisieren
        const recentAvg = this.energyHistory.length > 1 ?
            this.energyHistory.slice(0, -1).reduce((sum, entry) => sum + entry.combined, 0) /
            (this.energyHistory.length - 1) : 0;

        this.diagnosticData.peakRatio = combinedEnergy / (recentAvg || 1);
        this.diagnosticData.adaptiveThresholdValue = this.adaptiveThreshold;
        this.diagnosticData.averageEnergy = this.averageEnergy;
        this.diagnosticData.genreProfile = {...this.genreProfile};

        if (isHit) {
            // Speichere Energiewerte dieses Hits für Diagnose
            this.diagnosticData.lastHitEnergies = {
                low: lowEnergy,
                midLow: midLowEnergy,
                mid: midEnergy,
                high: highEnergy,
                combined: combinedEnergy,
                timestamp: timestamp
            };

            return new Hit(timestamp, combinedEnergy, this.estimateFrequency(lowEnergy, midLowEnergy, midEnergy, highEnergy));
        }

        return null;
    }

    // Schätzt den Frequenzschwerpunkt des Beats
    estimateFrequency(lowEnergy, midLowEnergy, midEnergy, highEnergy) {
        const totalEnergy = lowEnergy + midLowEnergy + midEnergy + highEnergy;
        if (totalEnergy === 0) return 100; // Fallback

        // Gewichteter Durchschnitt der Frequenzbänder
        return (100 * lowEnergy + 500 * midLowEnergy + 1400 * midEnergy + 4000 * highEnergy) / totalEnergy;
    }

    // Erkennt Muster in der Musik und passt Genre-Profil an
    updateGenreProfile(lowEnergy, midLowEnergy, midEnergy, highEnergy) {
        const totalEnergy = lowEnergy + midLowEnergy + midEnergy + highEnergy;
        if (totalEnergy === 0) return;

        // Berechne relative Energien
        const lowRatio = lowEnergy / totalEnergy;
        const midLowRatio = midLowEnergy / totalEnergy;
        const midRatio = midEnergy / totalEnergy;
        const highRatio = highEnergy / totalEnergy;

        // Identifiziere Muster basierend auf Energieverteilung - optimiert
        const targetProfile = {};
        
        if (lowRatio > 0.55 && midLowRatio < 0.25) {
            // Bass-lastige Musik (EDM, Hip-Hop, Dubstep)
            targetProfile.lowRatio = 0.65;
            targetProfile.midLowRatio = 0.25;
            targetProfile.midRatio = 0.1;
            targetProfile.highRatio = 0.0;
        } else if (lowRatio > 0.4 && midLowRatio > 0.3) {
            // Drum & Bass, Techno
            targetProfile.lowRatio = 0.55;
            targetProfile.midLowRatio = 0.35;
            targetProfile.midRatio = 0.1;
            targetProfile.highRatio = 0.0;
        } else if (midLowRatio > 0.4 && lowRatio < 0.35) {
            // Rock, Pop, Indie
            targetProfile.lowRatio = 0.35;
            targetProfile.midLowRatio = 0.45;
            targetProfile.midRatio = 0.15;
            targetProfile.highRatio = 0.05;
        } else if (midRatio > 0.25 || highRatio > 0.15) {
            // Jazz, Klassik, Acoustic
            targetProfile.lowRatio = 0.3;
            targetProfile.midLowRatio = 0.4;
            targetProfile.midRatio = 0.25;
            targetProfile.highRatio = 0.05;
        } else {
            // Standard/Ausgeglichen
            targetProfile.lowRatio = 0.45;
            targetProfile.midLowRatio = 0.35;
            targetProfile.midRatio = 0.15;
            targetProfile.highRatio = 0.05;
        }
        
        // Sanfte Anpassung an Ziel-Profil (lernt Genre-Charakteristiken)
        const adaptionRate = 0.08; // Schnellere Anpassung
        this.genreProfile.lowRatio += (targetProfile.lowRatio - this.genreProfile.lowRatio) * adaptionRate;
        this.genreProfile.midLowRatio += (targetProfile.midLowRatio - this.genreProfile.midLowRatio) * adaptionRate;
        this.genreProfile.midRatio += (targetProfile.midRatio - this.genreProfile.midRatio) * adaptionRate;
        this.genreProfile.highRatio += (targetProfile.highRatio - this.genreProfile.highRatio) * adaptionRate;

    }

    // Passt den Schwellwert basierend auf durchschnittlicher Energie an
    updateAdaptiveThreshold(currentEnergy, timestamp) {
        // Schnellere Anpassung des Durchschnitts (0.90 und 0.10 statt 0.95 und 0.05)
        this.averageEnergy = (this.averageEnergy * 0.90) + (currentEnergy * 0.10);

        // Dynamischere Schwellwertanpassung
        const timeSinceLastHit = timestamp - this.lastHitTime;

        // Schnellere Schwellwertsenkung wenn kein Hit
        let thresholdModifier = 1.0;
        if (timeSinceLastHit > 0.8) { // Von 1.0 auf 0.8 reduziert
            thresholdModifier = Math.max(0.6, 1.0 - (timeSinceLastHit - 0.8) * 0.15); // Stärkere Reduktion
        }

        // Energiebasierte Anpassung
        const energyFactor = Math.max(0.2, Math.min(1.0, this.averageEnergy / 80));
        this.adaptiveThreshold = this.threshold * thresholdModifier * (0.6 + energyFactor * 0.4);
    }

    // Berechnet Energie in einem Frequenzband mit A-Gewichtung
    calculateBandEnergy(frequencyData, lowFreq, highFreq) {
        const lowIndex = Math.floor(lowFreq * frequencyData.length / (this.sampleRate / 2));
        const highIndex = Math.ceil(highFreq * frequencyData.length / (this.sampleRate / 2));

        let energy = 0;
        let weightSum = 0;
        
        for (let i = lowIndex; i < highIndex && i < frequencyData.length; i++) {
            const freq = (i * this.sampleRate / 2) / frequencyData.length;
            // A-Gewichtung für menschliche Hörwahrnehmung
            const weight = this.getAWeighting(freq);
            energy += frequencyData[i] * frequencyData[i] * weight;
            weightSum += weight;
        }

        return weightSum > 0 ? Math.sqrt(energy / weightSum) : 0; // Gewichtete RMS-Energie
    }
    
    // A-Gewichtung für Frequenzen (vereinfacht)
    getAWeighting(frequency) {
        if (frequency < 20) return 0.1;
        if (frequency < 100) return 0.5;
        if (frequency < 1000) return 1.0;
        if (frequency < 6000) return 0.8;
        return 0.5;
    }
    
    // Berechnet Spectral Flux für Onset-Erkennung
    calculateSpectralFlux(frequencyData) {
        if (!this.previousSpectrum) {
            this.previousSpectrum = new Float32Array(frequencyData.length);
            return 0;
        }
        
        let flux = 0;
        // Fokus auf niedrige bis mittlere Frequenzen (0-2000 Hz)
        const maxBin = Math.min(frequencyData.length, Math.floor(2000 * frequencyData.length / (this.sampleRate / 2)));
        
        for (let i = 0; i < maxBin; i++) {
            const diff = frequencyData[i] - this.previousSpectrum[i];
            // Nur positive Differenzen zählen (Onset)
            if (diff > 0) {
                flux += diff;
            }
        }
        
        // Speichere aktuelles Spektrum für nächsten Frame
        this.previousSpectrum.set(frequencyData);
        
        return flux;
    }

    // Prüft, ob die Energie einen Beat auslöst
    triggersHit(energy, spectralFlux, timestamp) {
        if (this.energyHistory.length < 3 || this.spectralFluxHistory.length < 3) return false;

        // Durchschnitt der letzten Energie-Werte berechnen (ohne den aktuellen)
        const recentAvg = this.energyHistory
            .slice(0, -1)
            .reduce((sum, entry) => sum + entry.combined, 0) / (this.energyHistory.length - 1);

        // Prüfe, ob aktueller Wert den Durchschnitt um adaptiveThreshold überschreitet
        const isEnergyPeak = energy > recentAvg * (1 + this.adaptiveThreshold);

        // Spectral Flux Peak Detection
        const avgFlux = this.spectralFluxHistory.slice(0, -1).reduce((a, b) => a + b, 0) / (this.spectralFluxHistory.length - 1);
        const fluxThreshold = avgFlux * 1.5; // 50% über Durchschnitt
        const isFluxPeak = spectralFlux > fluxThreshold && spectralFlux > this.spectralFluxHistory[this.spectralFluxHistory.length - 2];
        
        // Prüfe auch, ob es ein lokales Maximum ist
        const prevEnergy = this.energyHistory[this.energyHistory.length - 2].combined;
        const isLocalPeak = energy > prevEnergy;

        // Zeitliche Begrenzung der Beat-Erkennung
        const timeSinceLastHit = timestamp - this.lastHitTime;
        const isTimeValid = timeSinceLastHit > this.minTimeBetweenHits;

        // Kombiniere beide Methoden für robustere Erkennung
        if ((isEnergyPeak || isFluxPeak) && isLocalPeak && isTimeValid) {
            this.lastHitTime = timestamp;
            return true;
        }

        return false;
    }

    // Getter für Diagnose-Daten
    getDiagnosticData() {
        return {...this.diagnosticData};
    }
}

class TempoQueue {
    constructor(maxSize = 20) { // Erhöht für bessere Stabilität
        this.intervals = [];
        this.maxSize = maxSize;
        this.minBPM = 60;
        this.maxBPM = 200;
        // Gewichtung für häufige BPM-Bereiche - Bevorzugung von höheren BPMs in typischen Bereichen
        this.bpmWeights = {
            60: 0.6,  // Langsamer
            80: 0.8,  // Langsam
            105: 1.0, // Moderat
            115: 1.4, // Bevorzugter Bereich Anfang - Höhere Gewichtung
            140: 1.4, // Bevorzugter Bereich Ende
            170: 0.8, // Schneller
            200: 0.5  // Sehr schnell
        };
        
        // Tempo-Stabilisierung
        this.recentBPMs = [];
        this.stableBPM = null;
        this.stabilityCounter = 0;
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
    getThresholdedBPM(confidenceThreshold = 0.08) { // Von 0.12 auf 0.08 reduziert
        if (this.intervals.length < 1) {
            return this.stableBPM; // Rückgabe des stabilen BPM wenn vorhanden
        }

        // Berechne BPM-Werte aus Intervallen
        const bpmValues = this.intervals.map(interval => 60 / interval);

        // Spezialfall: Bei nur einem oder zwei Intervallen, direkt BPM zurückgeben
        if (bpmValues.length <= 2) {
            const sum = bpmValues.reduce((a, b) => a + b, 0);
            // Verdoppele BPM wenn zu niedrig (unter 90)
            const avgBPM = sum / bpmValues.length;
            return avgBPM < 90 ? avgBPM * 2 : avgBPM; // Vermutlich halbes Tempo erkannt
        }

        // Gruppiere ähnliche BPM-Werte und berücksichtige harmonische Beziehungen
        const bpmClusters = this.clusterBPMValuesWithHarmonics(bpmValues);

        // Wenn keine Cluster gefunden wurden, nutze Durchschnitt
        if (bpmClusters.length === 0) {
            const avgBPM = bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length;
            return avgBPM < 90 ? avgBPM * 2 : avgBPM; // Verdoppele wenn zu niedrig
        }

        // Finde das gewichtete beste Cluster mit besonderer Berücksichtigung der Verdoppelung
        let bestCluster = null;
        let bestScore = 0;

        for (const cluster of bpmClusters) {
            // Spezialfall: Bei niedrigem BPM (< 90), verdoppele für Bewertung
            const evaluationBPM = cluster.average < 90 ? cluster.average * 2 : cluster.average;

            // Gewichtung basierend auf BPM-Bereich und Clustergröße
            const bpmWeight = this.getBpmWeight(evaluationBPM); // Verwende verdoppeltes BPM
            const sizeWeight = Math.pow(cluster.values.length / bpmValues.length, 1.5); // Stärkere Gewichtung größerer Cluster
            const recencyWeight = 1.3; // Neuere Werte werden stärker gewichtet

            // Berechne Gesamtscore mit Präferenz für typische Musik-Tempos
            const score = bpmWeight * sizeWeight * recencyWeight;

            if (score > bestScore) {
                bestScore = score;
                bestCluster = cluster;
            }
        }

        // Berechne Konfidenz (gewichteter Anteil der Werte im größten Cluster)
        const confidence = bestCluster ? (bestCluster.values.length / bpmValues.length) : 0;

        // Wenn Konfidenz über Schwellwert, gib Durchschnitt des besten Clusters zurück
        if (confidence >= confidenceThreshold && bestCluster) {
            // BPM verdoppeln, wenn im niedrigen Bereich und wahrscheinlich halbes Tempo erkannt
            const finalBPM = bestCluster.average < 90 ? bestCluster.average * 2 : bestCluster.average;
            
            // Tempo-Stabilisierung
            this.updateStableBPM(finalBPM, confidence);
            
            return finalBPM;
        }

        return this.stableBPM; // Rückgabe des stabilen BPM als Fallback
    }
    
    // Aktualisiert den stabilen BPM-Wert
    updateStableBPM(newBPM, confidence) {
        this.recentBPMs.push({ bpm: newBPM, confidence: confidence });
        if (this.recentBPMs.length > 10) {
            this.recentBPMs.shift();
        }
        
        // Prüfe ob die letzten BPM-Werte stabil sind
        if (this.recentBPMs.length >= 5) {
            const last5 = this.recentBPMs.slice(-5);
            const avgBPM = last5.reduce((sum, item) => sum + item.bpm, 0) / last5.length;
            const avgConfidence = last5.reduce((sum, item) => sum + item.confidence, 0) / last5.length;
            
            // Prüfe Stabilität (alle Werte innerhalb von 5% des Durchschnitts)
            const isStable = last5.every(item => Math.abs(item.bpm - avgBPM) / avgBPM < 0.05);
            
            if (isStable && avgConfidence > 0.7) {
                this.stabilityCounter++;
                if (this.stabilityCounter > 3) {
                    this.stableBPM = Math.round(avgBPM);
                }
            } else {
                this.stabilityCounter = Math.max(0, this.stabilityCounter - 1);
                if (this.stabilityCounter === 0) {
                    this.stableBPM = null;
                }
            }
        }
    }

    // Gibt Gewichtung für BPM-Bereich zurück
    getBpmWeight(bpm) {
        // Linear interpolieren zwischen den definierten Gewichtungspunkten
        const weightPoints = Object.entries(this.bpmWeights).sort((a, b) => a[0] - b[0]);

        // Wenn unter Minimum oder über Maximum
        if (bpm <= Number(weightPoints[0][0])) return weightPoints[0][1];
        if (bpm >= Number(weightPoints[weightPoints.length - 1][0]))
            return weightPoints[weightPoints.length - 1][1];

        // Finde die zwei umgebenden Punkte für Interpolation
        for (let i = 0; i < weightPoints.length - 1; i++) {
            const lowerBpm = Number(weightPoints[i][0]);
            const upperBpm = Number(weightPoints[i + 1][0]);

            if (bpm >= lowerBpm && bpm <= upperBpm) {
                const lowerWeight = weightPoints[i][1];
                const upperWeight = weightPoints[i + 1][1];

                // Lineare Interpolation
                const factor = (bpm - lowerBpm) / (upperBpm - lowerBpm);
                return lowerWeight + factor * (upperWeight - lowerWeight);
            }
        }

        return 1.0; // Fallback
    }

    // Gruppiert ähnliche BPM-Werte zu Clustern und berücksichtigt harmonische Beziehungen
    clusterBPMValuesWithHarmonics(bpmValues, tolerance = 6) {
        const clusters = [];
        const harmonicRelations = [0.5, 1, 2]; // Halbierte, normale und doppelte Geschwindigkeit

        for (const bpm of bpmValues) {
            let addedToCluster = false;

            // Teste alle Cluster mit allen harmonischen Beziehungen
            for (const cluster of clusters) {
                for (const harmonic of harmonicRelations) {
                    const normalizedBpm = bpm * harmonic;

                    if (Math.abs(cluster.average - normalizedBpm) <= tolerance) {
                        // Füge zu bestehendem Cluster hinzu - aber normalisiert
                        // Bei niedrigen BPMs (unter 90) normalisiere auf die doppelte Geschwindigkeit
                        let normalizedValue = bpm;
                        if (bpm < 90 && harmonic === 1) {
                            normalizedValue = bpm * 2; // Verdoppele niedrige BPMs
                        } else {
                            normalizedValue = bpm * harmonic / Math.pow(2, Math.round(Math.log2(harmonic)));
                        }

                        cluster.values.push(normalizedValue);
                        cluster.sum += normalizedValue;
                        cluster.average = cluster.sum / cluster.values.length;
                        addedToCluster = true;
                        break;
                    }
                }
                if (addedToCluster) break;
            }

            // Wenn nicht zu bestehendem Cluster hinzugefügt, erstelle neues Cluster
            if (!addedToCluster) {
                // Bei niedrigen BPMs (unter 90) normalisiere auf die doppelte Geschwindigkeit
                const normalizedBpm = bpm < 90 ? bpm * 2 : bpm;

                clusters.push({
                    values: [normalizedBpm],
                    sum: normalizedBpm,
                    average: normalizedBpm
                });
            }
        }

        // Entferne zu kleine Cluster
        return clusters.filter(cluster => cluster.values.length >= 1); // Auch einzelne Werte zulassen
    }

    // Gruppiert ähnliche BPM-Werte zu Clustern (ohne harmonische Beziehungen)
    clusterBPMValues(bpmValues, tolerance = 6) {
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
        this.bpmHistory = [];
        this.maxHistorySize = 3; // Von 5 auf 3 reduziert - schnellere Anpassung
    }

    // Aktualisiert den BPM-Tracker mit einem neuen Wert
    update(timestamp, newBPM) {
        if (newBPM === null) return;

        // Bei erstem BPM-Wert
        if (this.currentBPM === null) {
            this.currentBPM = newBPM;
            this.confidence = 0.3; // Start mit mittlerer Konfidenz
            this.lastUpdateTime = timestamp;
            this.bpmHistory.push(newBPM);
            return;
        }

        // Berechne vergangene Zeit seit letztem Update
        const timeDelta = timestamp - this.lastUpdateTime;
        this.lastUpdateTime = timestamp;

        // Füge neuen BPM zur Historie hinzu
        this.bpmHistory.push(newBPM);
        if (this.bpmHistory.length > this.maxHistorySize) {
            this.bpmHistory.shift();
        }

        // Vergesse allmählich alten BPM-Wert (zeitabhängig)
        const forgetFactor = Math.min(0.15, timeDelta / 8); // Schnellere Anpassung

        // Berechne Median der letzten BPM-Werte für höhere Stabilität
        const medianBPM = this.getMedianBPM();

        // Kombiniere alten und neuen BPM-Wert mit Median als Referenz
        this._mergeBPM(forgetFactor, newBPM, medianBPM);
    }

    // Berechnet den Median der BPM-Historie
    getMedianBPM() {
        if (this.bpmHistory.length === 0) return this.currentBPM;

        const sortedBPM = [...this.bpmHistory].sort((a, b) => a - b);
        const mid = Math.floor(sortedBPM.length / 2);

        return sortedBPM.length % 2 === 0
            ? (sortedBPM[mid - 1] + sortedBPM[mid]) / 2
            : sortedBPM[mid];
    }

    // Intern: Kombiniere bestehenden BPM mit neuem Wert
    _mergeBPM(factor, newBPM, medianBPM) {
        // Erkennen von drastischen Änderungen (Liedwechsel)
        const bpmDiff = Math.abs(medianBPM - newBPM) / medianBPM;

        // Bevorzuge BPMs in typischen Musik-Bereichen (115-135)
        const preferenceBonus = (newBPM >= 115 && newBPM <= 135) ? 0.05 : 0;

        // Bei großen Änderungen: schnellerer Reset
        if (bpmDiff > 0.25 && this.bpmHistory.length >= 3) {
            // Prüfe ob die letzten BPM-Werte konsistent sind (deutet auf Liedwechsel hin)
            const recentBpms = this.bpmHistory.slice(-3);
            const recentAvg = recentBpms.reduce((sum, bpm) => sum + bpm, 0) / recentBpms.length;
            const recentConsistency = recentBpms.every(bpm => Math.abs(bpm - recentAvg) / recentAvg < 0.1);

            if (recentConsistency) {
                // Schnellere Anpassung bei konsistenten neuen Werten
                this.confidence = 0.4; // Höhere Startkonfidenzzuweisung
                this.currentBPM = newBPM * 0.6 + this.currentBPM * 0.4; // Stärkere Gewichtung des neuen Werts
                return;
            }
        }

        // Normale Anpassungen mit verbesserten Werten
        if (bpmDiff < 0.05) {
            // Kleine Abweichung: normal anpassen
            this.confidence = Math.min(0.99, this.confidence + (0.2 + preferenceBonus));
            this.currentBPM = (this.currentBPM * (1 - factor * 2.0) + newBPM * factor * 2.0);
        } else if (bpmDiff < 0.15) {
            // Mittlere Abweichung: schneller anpassen
            this.confidence = Math.max(0.15, this.confidence - (0.02 - preferenceBonus));
            this.currentBPM = (this.currentBPM * 0.75 + newBPM * 0.25); // Mehr Gewicht auf neuem Wert
        } else {
            // Große Abweichung: vorsichtiger, aber immer noch schneller als original
            this.confidence = Math.max(0.1, this.confidence - (0.05 - preferenceBonus / 2));
            this.currentBPM = (this.currentBPM * 0.85 + newBPM * 0.15); // 15% statt 5% Anpassung
        }
    }

    // Gibt aktuellen Zustand zurück
    getState() {
        return {
            bpm: this.currentBPM,
            confidence: this.confidence
        };
    }

    // Gibt BPM-Historie zurück für Diagnose
    getBPMHistory() {
        return [...this.bpmHistory];
    }
}

class BPMAnalyzer {
    constructor(sampleRate = 44100) {
        this.sampleRate = sampleRate;
        this.hitDetector = new SpectrumHitDetector(sampleRate, 0.32, 0.08);
        this.hitCache = new HitCache();
        this.tempoQueue = new TempoQueue();
        this.bpmTracker = new BPMTracker();
        this.lastHitTime = null;
        this.minBPM = 60;
        this.maxBPM = 200;
        this.energyHistory = []; // Für Track-Wechsel-Erkennung
        
        // Neue Komponenten für verbesserte BPM-Erkennung
        this.onsetStrengthCurve = [];
        this.onsetCurveSize = 512;
        this.autoCorrelation = new AutoCorrelation(sampleRate);
        this.tempogram = new FourierTempogram(sampleRate);
        this.beatTracker = new DynamicProgrammingBeatTracker(sampleRate);
        this.octaveCorrector = new OctaveErrorCorrector();
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
        
        // Update Onset-Stärke-Kurve für Autokorrelation und Tempogramm
        const onsetStrength = this.calculateOnsetStrength(frequencyData);
        this.onsetStrengthCurve.push(onsetStrength);
        if (this.onsetStrengthCurve.length > this.onsetCurveSize) {
            this.onsetStrengthCurve.shift();
        }

        // Erkenne mögliche Track-Wechsel durch drastische Änderungen in der Energieverteilung
        const currentEnergy = this.hitDetector.diagnosticData.averageEnergy;

        // Speichere historische Energiewerte für Vergleich
        if (!this.energyHistory) this.energyHistory = [];
        this.energyHistory.push(currentEnergy);
        if (this.energyHistory.length > 20) this.energyHistory.shift();

        // Erkennung von drastischen Energieänderungen (potenzieller Track-Wechsel)
        if (this.energyHistory.length > 10) {
            const recentAvg = this.energyHistory.slice(-5).reduce((sum, e) => sum + e, 0) / 5;
            const olderAvg = this.energyHistory.slice(-10, -5).reduce((sum, e) => sum + e, 0) / 5;

            // Wenn sich die Energie drastisch ändert, setze Tempo-Queue zurück
            if (Math.abs(recentAvg - olderAvg) / Math.max(recentAvg, olderAvg, 0.1) > 0.4) {
                console.log("Track-Wechsel erkannt: Energie-Änderung", Math.abs(recentAvg - olderAvg) / Math.max(recentAvg, olderAvg, 0.1));
                this.tempoQueue = new TempoQueue();
                this.bpmTracker = new BPMTracker();
                this.lastHitTime = timestamp - 0.5; // Nicht komplett zurücksetzen
                this.onsetStrengthCurve = []; // Reset Onset-Kurve

                // Nach Reset: Schnellere Neuerkennung durch temporär empfindlichere Parameter
                this.hitDetector.threshold *= 0.8; // Temporär empfindlicher für Beats
                this.hitDetector.minTimeBetweenHits = Math.max(0.05, this.hitDetector.minTimeBetweenHits * 0.8); // Empfindlicher

                // Timer zur Wiederherstellung normaler Empfindlichkeit nach 2 Sekunden
                setTimeout(() => {
                    this.hitDetector.threshold /= 0.8; // Original-Empfindlichkeit wiederherstellen
                    this.hitDetector.minTimeBetweenHits /= 0.8; // Original-Zeit wiederherstellen
                }, 2000);
            }
        }

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
            } else if (this.hitCache.hits.length === 1) {
                // Bei erstem Hit, schon einen Default-BPM anzeigen
                // Dies verbessert die UX, indem wir sofort Feedback geben
                this.bpmTracker.update(timestamp, 120); // Starten mit 120 BPM als Standardwert
            }

            this.lastHitTime = timestamp;

            // Hier Beat-Indikator aktivieren
            animateBeatIndicator();
        } else {
            // Verwende zusätzliche Methoden wenn keine Hits erkannt wurden
            this.performAdvancedAnalysis(timestamp);
        }
    }
    
    // Erweiterte Analyse mit mehreren Methoden
    performAdvancedAnalysis(timestamp) {
        // 1. Autokorrelationsbasierte Tempo-Schätzung
        if (this.onsetStrengthCurve.length > 100) {
            const acfResult = this.autoCorrelation.computeTempo(this.onsetStrengthCurve);
            if (acfResult && acfResult.confidence > 0.3) {
                this.updateWithAlternativeMethod(timestamp, acfResult.bpm, acfResult.confidence, 'ACF');
            }
        }
        
        // 2. Fourier-Tempogramm für lokale Analyse
        if (this.onsetStrengthCurve.length > 50) {
            const tempogramResult = this.tempogram.computeLocalTempo(
                this.onsetStrengthCurve, 
                this.onsetStrengthCurve.length - 1
            );
            if (tempogramResult) {
                this.updateWithAlternativeMethod(timestamp, tempogramResult.bpm, 0.5, 'Tempogram');
            }
        }
        
        // 3. Notfall-Mechanismus (wie vorher, aber erweitert)
        if (this.lastHitTime !== null &&
            timestamp - this.lastHitTime > 1.5 &&
            this.hitCache.hits.length > 0 &&
            this.bpmTracker.getState().bpm === null) {

            // Sammle alle Tempo-Kandidaten
            const candidates = [];
            
            if (this.tempoQueue.intervals.length > 0) {
                const avgInterval = this.tempoQueue.intervals.reduce((a, b) => a + b, 0) /
                    this.tempoQueue.intervals.length;
                let estimatedBPM = 60 / avgInterval;
                candidates.push({ bpm: estimatedBPM, strength: 0.7 });
            }
            
            if (this.hitCache.hits.length > 1) {
                const hits = this.hitCache.getHits();
                const totalTime = hits[hits.length - 1].timestamp - hits[0].timestamp;
                const avgInterval = totalTime / (hits.length - 1);
                let estimatedBPM = 60 / avgInterval;
                candidates.push({ bpm: estimatedBPM, strength: 0.5 });
            }
            
            // Oktavfehler-Korrektur
            if (candidates.length > 0) {
                const correctedBPM = this.octaveCorrector.correctOctaveErrors(candidates, 0.5);
                if (correctedBPM) {
                    this.bpmTracker.update(timestamp, this.applyBPMBounds(correctedBPM));
                    console.log("Korrigiertes Notfall-BPM:", Math.round(correctedBPM));
                }
            }
        }
    }
    
    // Update mit alternativen Methoden
    updateWithAlternativeMethod(timestamp, bpm, confidence, method) {
        if (!bpm || bpm < this.minBPM || bpm > this.maxBPM) return;
        
        // Prüfe auf Oktavfehler
        const candidates = [{ bpm: bpm, strength: confidence }];
        const correctedBPM = this.octaveCorrector.correctOctaveErrors(candidates, confidence);
        
        if (correctedBPM) {
            // Füge virtuellen Hit zur Queue hinzu für konsistente Verarbeitung
            const virtualInterval = 60 / correctedBPM;
            this.tempoQueue.push(virtualInterval);
            
            // Update BPM-Tracker mit gewichteter Konfidenz
            const adjustedConfidence = confidence * 0.8; // Alternative Methoden etwas niedriger gewichten
            this.bpmTracker.update(timestamp, correctedBPM);
            
            console.log(`BPM über ${method} erkannt:`, Math.round(correctedBPM), 'Konfidenz:', adjustedConfidence);
        }
    }
    
    // Berechne Onset-Stärke aus Frequenzdaten
    calculateOnsetStrength(frequencyData) {
        let totalEnergy = 0;
        let weightedEnergy = 0;
        
        // Fokus auf niedrige bis mittlere Frequenzen
        const maxBin = Math.min(frequencyData.length, Math.floor(frequencyData.length * 0.3));
        
        for (let i = 0; i < maxBin; i++) {
            const energy = frequencyData[i] * frequencyData[i];
            const weight = 1 - (i / maxBin) * 0.5; // Mehr Gewicht auf niedrige Frequenzen
            
            totalEnergy += energy;
            weightedEnergy += energy * weight;
        }
        
        return Math.sqrt(weightedEnergy / maxBin);
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
        if (this.tempoQueue.intervals.length < 1) {
            return null;
        }

        const bpmValues = this.tempoQueue.intervals.map(interval => 60 / interval);
        const clusters = this.tempoQueue.clusterBPMValues(bpmValues);

        return clusters.map(c => `${Math.round(c.average)}bpm (${c.values.length})`).join(', ');
    }

    // Gibt detaillierte Cluster-Informationen zurück
    getDetailedClusterInfo() {
        if (this.tempoQueue.intervals.length < 1) {
            return null;
        }

        const bpmValues = this.tempoQueue.intervals.map(interval => 60 / interval);
        const clusters = this.tempoQueue.clusterBPMValuesWithHarmonics(bpmValues);

        return clusters.map(c => ({
            average: c.average,
            count: c.values.length,
            values: c.values.slice(-5) // Die letzten 5 Werte pro Cluster
        }));
    }

    // Gibt Diagnose-Daten zurück
    getDiagnosticData() {
        return {
            hitDetector: this.hitDetector.getDiagnosticData(),
            beatIntervals: this.tempoQueue.intervals.slice(-5), // Die letzten 5 Intervalle
            hitCount: this.hitCache.hits.length,
            lastClusters: this.getDetailedClusterInfo(),
            bpmHistory: this.bpmTracker.getBPMHistory()
        };
    }

    // Setzt alles zurück
    reset() {
        this.hitCache = new HitCache();
        this.tempoQueue = new TempoQueue();
        this.bpmTracker = new BPMTracker();
        this.lastHitTime = null;
        this.onsetStrengthCurve = [];
        this.energyHistory = [];
    }
}

// Autokorrelation für robuste Tempo-Erkennung
class AutoCorrelation {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.windowSize = 8; // Sekunden
        this.hopLength = 512;
    }
    
    // Berechnet Autokorrelation der Onset-Stärke-Kurve
    computeTempo(onsetCurve) {
        if (onsetCurve.length < 2) return null;
        
        const maxLag = Math.floor(this.sampleRate * 60 / this.hopLength / 40); // Min 40 BPM
        const minLag = Math.floor(this.sampleRate * 60 / this.hopLength / 250); // Max 250 BPM
        
        // Normalisiere Onset-Kurve
        const mean = onsetCurve.reduce((a, b) => a + b, 0) / onsetCurve.length;
        const normalized = onsetCurve.map(v => v - mean);
        
        // Berechne Autokorrelation
        const acf = [];
        for (let lag = minLag; lag <= maxLag; lag++) {
            let sum = 0;
            for (let i = 0; i < normalized.length - lag; i++) {
                sum += normalized[i] * normalized[i + lag];
            }
            acf.push({ lag: lag, value: sum / (normalized.length - lag) });
        }
        
        // Finde Peaks in ACF
        const peaks = this.findPeaks(acf);
        if (peaks.length === 0) return null;
        
        // Konvertiere besten Peak zu BPM
        const bestPeak = peaks[0];
        const beatPeriod = bestPeak.lag * this.hopLength / this.sampleRate;
        const bpm = 60 / beatPeriod;
        
        return {
            bpm: bpm,
            confidence: this.calculateConfidence(acf, bestPeak)
        };
    }
    
    findPeaks(acf) {
        const peaks = [];
        for (let i = 1; i < acf.length - 1; i++) {
            if (acf[i].value > acf[i-1].value && acf[i].value > acf[i+1].value) {
                peaks.push(acf[i]);
            }
        }
        return peaks.sort((a, b) => b.value - a.value);
    }
    
    calculateConfidence(acf, peak) {
        const maxValue = Math.max(...acf.map(a => a.value));
        return peak.value / maxValue;
    }
}

// Fourier-Tempogramm für lokale Tempo-Analyse
class FourierTempogram {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.windowSize = 384; // ~8 Sekunden bei 44.1kHz und hop=512
        this.hopLength = 512;
    }
    
    // Berechnet lokales Tempo über Fourier-Analyse
    computeLocalTempo(onsetCurve, position) {
        const startIdx = Math.max(0, position - Math.floor(this.windowSize / 2));
        const endIdx = Math.min(onsetCurve.length, startIdx + this.windowSize);
        
        if (endIdx - startIdx < 32) return null;
        
        const window = onsetCurve.slice(startIdx, endIdx);
        
        // Anwende Hanning-Fenster
        const windowed = this.applyHanningWindow(window);
        
        // FFT (vereinfacht - in Produktion würde man eine richtige FFT verwenden)
        const spectrum = this.computeFFT(windowed);
        
        // Finde dominante Frequenz im Tempo-Bereich
        const tempoSpectrum = this.convertToTempoSpectrum(spectrum);
        const dominantTempo = this.findDominantTempo(tempoSpectrum);
        
        return dominantTempo;
    }
    
    applyHanningWindow(signal) {
        const windowed = new Float32Array(signal.length);
        for (let i = 0; i < signal.length; i++) {
            const window = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (signal.length - 1));
            windowed[i] = signal[i] * window;
        }
        return windowed;
    }
    
    computeFFT(signal) {
        // Vereinfachte DFT für Demonstration
        const N = signal.length;
        const spectrum = [];
        
        for (let k = 0; k < N/2; k++) {
            let real = 0, imag = 0;
            for (let n = 0; n < N; n++) {
                const angle = -2 * Math.PI * k * n / N;
                real += signal[n] * Math.cos(angle);
                imag += signal[n] * Math.sin(angle);
            }
            spectrum.push(Math.sqrt(real * real + imag * imag));
        }
        
        return spectrum;
    }
    
    convertToTempoSpectrum(spectrum) {
        const tempoSpectrum = [];
        const N = spectrum.length * 2;
        
        for (let i = 1; i < spectrum.length; i++) {
            const freq = i * this.sampleRate / this.hopLength / N;
            const bpm = freq * 60;
            
            if (bpm >= 40 && bpm <= 250) {
                tempoSpectrum.push({ bpm: bpm, magnitude: spectrum[i] });
            }
        }
        
        return tempoSpectrum;
    }
    
    findDominantTempo(tempoSpectrum) {
        if (tempoSpectrum.length === 0) return null;
        
        // Finde Maximum
        let maxIdx = 0;
        for (let i = 1; i < tempoSpectrum.length; i++) {
            if (tempoSpectrum[i].magnitude > tempoSpectrum[maxIdx].magnitude) {
                maxIdx = i;
            }
        }
        
        return {
            bpm: tempoSpectrum[maxIdx].bpm,
            magnitude: tempoSpectrum[maxIdx].magnitude
        };
    }
}

// Dynamische Programmierung für Beat-Tracking
class DynamicProgrammingBeatTracker {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.lambda = 100; // Gewichtung zwischen Onset-Stärke und Tempo-Regularität
    }
    
    trackBeats(onsetCurve, estimatedTempo) {
        if (!estimatedTempo || onsetCurve.length < 10) return [];
        
        const idealInterval = 60 / estimatedTempo * this.sampleRate / 512; // in Frames
        const tolerance = 0.2; // 20% Toleranz
        
        // Dynamische Programmierung
        const N = onsetCurve.length;
        const score = new Float32Array(N);
        const predecessor = new Int32Array(N);
        
        // Initialisierung
        for (let i = 0; i < N; i++) {
            score[i] = onsetCurve[i];
            predecessor[i] = -1;
        }
        
        // DP-Schritt
        for (let i = 1; i < N; i++) {
            for (let j = Math.max(0, i - Math.floor(idealInterval * (1 + tolerance))); 
                 j < i - Math.floor(idealInterval * (1 - tolerance)); j++) {
                
                const interval = i - j;
                const penalty = this.calculatePenalty(interval, idealInterval);
                const candidateScore = score[j] + onsetCurve[i] - this.lambda * penalty;
                
                if (candidateScore > score[i]) {
                    score[i] = candidateScore;
                    predecessor[i] = j;
                }
            }
        }
        
        // Backtracking
        const beats = [];
        let current = this.findBestEndpoint(score, N - Math.floor(idealInterval), N);
        
        while (current >= 0) {
            beats.unshift(current);
            current = predecessor[current];
        }
        
        return beats;
    }
    
    calculatePenalty(interval, ideal) {
        const ratio = Math.log(interval / ideal);
        return ratio * ratio;
    }
    
    findBestEndpoint(score, start, end) {
        let bestIdx = start;
        for (let i = start + 1; i < end; i++) {
            if (score[i] > score[bestIdx]) {
                bestIdx = i;
            }
        }
        return bestIdx;
    }
}

// Oktavfehler-Korrektor
class OctaveErrorCorrector {
    constructor() {
        this.musicBPMRanges = {
            // Typische BPM-Bereiche für verschiedene Genres
            slowBallad: { min: 60, max: 80 },
            popRock: { min: 100, max: 140 },
            dance: { min: 120, max: 135 },
            hipHop: { min: 80, max: 100 },
            dnb: { min: 160, max: 180 }
        };
    }
    
    correctOctaveErrors(candidates, confidence) {
        if (!candidates || candidates.length === 0) return null;
        
        // Gruppiere Kandidaten nach Oktav-Beziehungen
        const octaveGroups = this.groupByOctaves(candidates);
        
        // Bewerte jede Gruppe
        const scoredGroups = octaveGroups.map(group => ({
            group: group,
            score: this.scoreGroup(group, confidence)
        }));
        
        // Wähle beste Gruppe
        scoredGroups.sort((a, b) => b.score - a.score);
        const bestGroup = scoredGroups[0].group;
        
        // Wähle mittleren BPM aus der Gruppe
        return this.selectFromGroup(bestGroup);
    }
    
    groupByOctaves(candidates) {
        const groups = [];
        const used = new Set();
        
        for (const candidate of candidates) {
            if (used.has(candidate.bpm)) continue;
            
            const group = [candidate];
            used.add(candidate.bpm);
            
            // Finde verwandte Tempi
            for (const other of candidates) {
                if (used.has(other.bpm)) continue;
                
                const ratio = candidate.bpm / other.bpm;
                if (Math.abs(ratio - 0.5) < 0.05 || 
                    Math.abs(ratio - 1.0) < 0.05 || 
                    Math.abs(ratio - 2.0) < 0.05 ||
                    Math.abs(ratio - 0.33) < 0.05 ||
                    Math.abs(ratio - 3.0) < 0.05) {
                    group.push(other);
                    used.add(other.bpm);
                }
            }
            
            groups.push(group);
        }
        
        return groups;
    }
    
    scoreGroup(group, baseConfidence) {
        let score = 0;
        
        // Größe der Gruppe
        score += group.length * 10;
        
        // Musikalische Plausibilität
        for (const item of group) {
            score += this.getMusicalPlausibility(item.bpm) * (item.strength || 1);
        }
        
        // Konfidenz
        score *= baseConfidence || 1;
        
        return score;
    }
    
    getMusicalPlausibility(bpm) {
        // Bevorzuge typische Musik-Tempi
        if (bpm >= 100 && bpm <= 140) return 2.0;
        if (bpm >= 80 && bpm <= 100) return 1.5;
        if (bpm >= 140 && bpm <= 180) return 1.3;
        if (bpm >= 60 && bpm <= 80) return 1.0;
        return 0.5;
    }
    
    selectFromGroup(group) {
        // Sortiere nach BPM
        group.sort((a, b) => a.bpm - b.bpm);
        
        // Wähle mittleren Wert
        const midIdx = Math.floor(group.length / 2);
        return group[midIdx].bpm;
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
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
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

    getDiagnosticData() {
        if (!this.bpmAnalyzer) return null;
        return this.bpmAnalyzer.getDiagnosticData();
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
const infoAccordion = document.getElementById('infoAccordion');
const feedbackAccordion = document.getElementById('feedbackAccordion');

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

    // BPM anzeigen, auch wenn Qualität niedrig ist
    if (bpm) {
        bpmDisplay.textContent = Math.round(bpm);
        qualityFill.style.width = `${quality * 100}%`;
    } else if (bpmAnalyzer.getHitCount() > 0) {
        // Fallback: Wenn Hits aber kein BPM, zeige "Berechne..." an
        bpmDisplay.textContent = "--";
        qualityFill.style.width = "10%"; // Zeigt an, dass wir arbeiten
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

    // Erweiterte Diagnostik-Daten
    const diagnosticData = bpmAnalyzer.getDiagnosticData();

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
        clusterInfo: bpmAnalyzer.getClusterInfo(),
        // Detaillierte Diagnose-Daten
        diagnostic: diagnosticData
    };

    // In die Zwischenablage kopieren
    const jsonString = JSON.stringify(feedbackData, null, 2);
    navigator.clipboard.writeText(jsonString)
        .then(() => {
            M.toast({html: 'Feedback mit Diagnose-Daten in Zwischenablage kopiert!'});

            // Schließe das Feedback-Akkordeon nach dem Kopieren
            const feedbackInstance = M.Collapsible.getInstance(feedbackAccordion);
            if (feedbackInstance) {
                feedbackInstance.close(0);
            }
        })
        .catch(err => {
            console.error('Fehler beim Kopieren in die Zwischenablage:', err);
            alert('Fehler beim Kopieren in die Zwischenablage. Siehe Konsole für Details.');
        });
}

// Initialisierung beim Laden der Seite
document.addEventListener('DOMContentLoaded', function () {
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

    // Akkordeons initialisieren
    const elems = document.querySelectorAll('.collapsible');
    M.Collapsible.init(elems, {
        accordion: true,
        onOpenStart: function (el) {
            // Hier könnten spezifische Aktionen beim Öffnen eines Akkordeons stattfinden
        }
    });
});