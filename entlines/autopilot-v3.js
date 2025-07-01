// Entlines Auto-Pilot - Fixed Version
// Kopiere diesen Code in die Browser-Konsole (F12)

(function () {
    'use strict';

    // Prüfe ob das Spiel verfügbar ist
    if (typeof bird === 'undefined' || typeof pipes === 'undefined' || typeof jump !== 'function') {
        alert('❌ Entlines Spiel nicht gefunden!');
        return;
    }

    // Entferne vorheriges Panel
    const existingPanel = document.getElementById('autopilot-panel');
    if (existingPanel) existingPanel.remove();

    let autopilotActive = false;
    let autopilotInterval = null;

    // Erstelle Control Panel
    const panel = document.createElement('div');
    panel.id = 'autopilot-panel';
    panel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: linear-gradient(135deg, #2C2E3B, #3C3F52);
        border: 2px solid #4CAF50;
        border-radius: 12px;
        padding: 15px;
        font-family: 'Segoe UI', sans-serif;
        color: white;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        min-width: 220px;
        user-select: none;
    `;

    panel.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px; color: #4CAF50;">🤖 Auto-Pilot v3</div>
        <button id="ap-toggle" style="
            background: linear-gradient(135deg, #4CAF50, #388E3C);
            color: white; border: none; padding: 10px 16px; border-radius: 6px;
            cursor: pointer; font-weight: bold; width: 100%; margin-bottom: 8px;
        ">▶️ START</button>
        <div style="font-size: 11px; color: #888;">
            Status: <span id="ap-status" style="color: #ff6b6b;">Bereit</span><br>
            Score: <span id="ap-score">0</span><br>
            <div id="ap-debug" style="margin-top: 4px; color: #aaa;"></div>
        </div>
        <button id="ap-close" style="
            position: absolute; top: 5px; right: 6px; background: none;
            border: none; color: #888; cursor: pointer; font-size: 14px;
        ">×</button>
    `;

    document.body.appendChild(panel);

    const toggleBtn = document.getElementById('ap-toggle');
    const statusSpan = document.getElementById('ap-status');
    const scoreSpan = document.getElementById('ap-score');
    const debugDiv = document.getElementById('ap-debug');
    const closeBtn = document.getElementById('ap-close');

    // NEUE STRATEGIE: Reaktive Höhenkontrolle
    function autopilotLogic() {
        if (!autopilotActive || !gameRunning) return;

        scoreSpan.textContent = score;

        const birdY = bird.y;
        const birdVelocity = bird.velocity;

        // Absolute Grenzen
        if (birdY < 5) {
            debugDiv.textContent = 'Zu hoch';
            return; // Lass fallen
        }

        if (birdY > 580) {
            debugDiv.textContent = 'NOTFALL!';
            jump();
            return;
        }

        // Finde aktuelle Röhre
        let currentPipe = null;
        let minDistance = Infinity;

        for (let pipe of pipes) {
            const distance = Math.abs(pipe.x + 30 - bird.x); // 30 = pipeWidth/2
            if (distance < minDistance && pipe.x + 60 > bird.x) {
                minDistance = distance;
                currentPipe = pipe;
            }
        }

        if (!currentPipe) {
            // Keine Röhre - halte 280px Höhe
            if (birdY > 320 && birdVelocity > 0) {
                jump();
            }
            debugDiv.textContent = 'Keine Röhre';
            return;
        }

        const gapTop = currentPipe.topHeight;
        const gapBottom = currentPipe.topHeight + 180; // pipeGap
        const gapMiddle = gapTop + 90;
        const distanceToPipe = currentPipe.x - bird.x;

        debugDiv.textContent = `D:${Math.round(distanceToPipe)} G:${Math.round(gapMiddle)}`;

        // KERNLOGIK: Je nach Entfernung verschiedene Strategien

        // GLOBALER SCHUTZ: Verhindere obere Kollisionen IMMER
        if (currentPipe && birdY < gapTop + 35) {
            debugDiv.textContent = `⚠️ OBERE RÖHRE! Stop!`;
            return; // Absolut kein Sprung
        }

        if (distanceToPipe > 100) {
            // WEIT WEG: Halte Grundhöhe um 280px
            const targetHeight = 280;

            if (birdY > targetHeight + 40 && birdVelocity > 0) {
                jump();
            }

        } else if (distanceToPipe > 20) {
            // MITTEL: Navigiere zur Lücke
            // Ziel: Leicht unter der Lückenmitte
            const targetHeight = gapMiddle + 5;

            // Springe wenn unter Ziel und fallend
            if (birdY > targetHeight && birdVelocity > 1) {
                jump();
            }

            // Früher springen bei hoher Geschwindigkeit
            if (birdVelocity > 3.5 && birdY > targetHeight - 20) {
                jump();
            }

            // Schutz vor unterer Röhre auch bei mittlerer Distanz
            if (birdY + 25 > gapBottom - 40) {
                jump();
            }

        } else {
            // NAH DRAN: Ausgewogene Kontrolle
            // Ziel: Etwas unter der Mitte aber nicht zu tief
            const targetHeight = gapMiddle + 10;

            // VERSTÄRKTER SCHUTZ vor unterer Röhre
            if (birdY + 25 > gapBottom - 50) {
                debugDiv.textContent = `🚨 UNTERE GEFAHR!`;
                jump();
                return;
            }

            // Springe wenn unter Ziel und fallend
            if (birdY > targetHeight && birdVelocity > 0.5) {
                jump();
            }

            // Extra Schutz bei hoher Fallgeschwindigkeit
            if (birdVelocity > 2.5 && birdY > gapMiddle - 5) {
                jump();
            }

            // Zweiter Notfall-Check
            if (birdVelocity > 1.5 && birdY > gapMiddle + 20) {
                jump();
            }
        }
    }

    function startAutopilot() {
        autopilotActive = true;
        toggleBtn.innerHTML = '⏸️ STOP';
        toggleBtn.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
        statusSpan.textContent = 'Aktiv 🟢';
        statusSpan.style.color = '#4CAF50';

        if (!gameStarted) jump();

        // Höhere Frequenz für bessere Reaktion
        autopilotInterval = setInterval(autopilotLogic, 25);
        console.log('🤖 Auto-Pilot v3 gestartet');
    }

    function stopAutopilot() {
        autopilotActive = false;
        if (autopilotInterval) {
            clearInterval(autopilotInterval);
            autopilotInterval = null;
        }
        toggleBtn.innerHTML = '▶️ START';
        toggleBtn.style.background = 'linear-gradient(135deg, #4CAF50, #388E3C)';
        statusSpan.textContent = 'Gestoppt 🔴';
        statusSpan.style.color = '#ff6b6b';
        debugDiv.textContent = '';
        console.log('🤖 Auto-Pilot gestoppt');
    }

    // Event Listeners
    toggleBtn.addEventListener('click', () => {
        autopilotActive ? stopAutopilot() : startAutopilot();
    });

    closeBtn.addEventListener('click', () => {
        stopAutopilot();
        panel.remove();
    });

    // Game Over Handler
    const originalGameOver = window.gameOver;
    if (originalGameOver) {
        window.gameOver = function () {
            if (autopilotActive) {
                statusSpan.textContent = 'Game Over 💀';
                statusSpan.style.color = '#ff6b6b';
            }
            return originalGameOver.apply(this, arguments);
        };
    }

    console.log('🤖 Auto-Pilot v3 geladen - Reaktive Höhenkontrolle');

})();