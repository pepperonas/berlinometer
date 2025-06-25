let unlockSequence = ['u', 'n', 'l', 'o', 'c', 'k'];
let currentSequence = [];
let isLocked = true;

// Fullscreen aktivieren
document.addEventListener('DOMContentLoaded', () => {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    }
    
    // Alle Test-Funktionen entfernt - Blasen platzen nur bei richtigen Buchstaben
});

// Alle Events blockieren
function blockEvent(e) {
    if (isLocked) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}

// Event-Listener für alle Input-Events
const events = ['keydown', 'keyup', 'keypress', 'mousedown', 'mouseup', 'mousemove', 'wheel', 'contextmenu', 'touchstart', 'touchend', 'touchmove'];

events.forEach(event => {
    document.addEventListener(event, blockEvent, { capture: true, passive: false });
});

// Unlock-Sequenz abfangen
document.addEventListener('keydown', (e) => {
    if (!isLocked) return;
    
    const key = e.key.toLowerCase();
    
    if (key === unlockSequence[currentSequence.length]) {
        currentSequence.push(key);
        updateProgress();
        popBubble(currentSequence.length - 1);
        
        if (currentSequence.length === unlockSequence.length) {
            popAllBubbles();
            setTimeout(unlock, 600);
        }
    } else {
        currentSequence = [];
        updateProgress();
        resetBubbles();
    }
}, true);

function updateProgress() {
    const progress = (currentSequence.length / unlockSequence.length) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
}

// SOUND-THROTTLING für Blasen-Platzen
let lastSoundTime = 0;

// SOUND-ERZEUGUNG für Blasen-Platzen mit drop.mp3
function createBubblePopSound() {
    const now = Date.now();
    
    // Prüfe ob 100ms seit dem letzten Sound vergangen sind
    if (now - lastSoundTime < 100) {
        return; // Sound überspringen
    }
    
    lastSoundTime = now;
    
    try {
        const audio = new Audio('drop.mp3');
        audio.volume = 0.6;
        audio.currentTime = 0; // Stelle sicher, dass der Sound von vorne startet
        audio.play().catch(e => {
            console.log('Audio konnte nicht abgespielt werden:', e);
        });
    } catch (e) {
        console.log('Audio-Datei konnte nicht geladen werden:', e);
    }
}

// REALISTISCHE WASSERTROPFEN-SPRITZER BEIM ZERPLATZEN
function popBubble(correctLetterIndex) {
    console.log(`💧 Bubble splash for letter ${correctLetterIndex}`);
    
    // Blubb-Sound abspielen
    try {
        createBubblePopSound();
    } catch (e) {
        console.log('Audio nicht unterstützt:', e);
    }
    
    const bubbles = document.querySelectorAll('.bubble:not(.popping)');
    
    // Filtere nur sichtbare Blasen (nicht außerhalb des Bildschirms)
    const visibleBubbles = Array.from(bubbles).filter(bubble => {
        const rect = bubble.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < window.innerHeight; // Blase ist im sichtbaren Bereich
    });
    
    // Sortiere sichtbare Blasen nach Y-Position (höchste zuerst)
    const sortedBubbles = visibleBubbles.sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        return rectA.top - rectB.top; // Kleinste Y-Position (oben) zuerst
    });
    
    // Lass 2 Blasen gleichzeitig platzen für mehr Effekt (die obersten)
    const bubblesToPop = Math.min(2, sortedBubbles.length);
    
    for (let b = 0; b < bubblesToPop; b++) {
        if (sortedBubbles[b]) {
            const bubble = sortedBubbles[b];
            const bubbleRect = bubble.getBoundingClientRect();
            
            // Sound wird bereits einmal pro popBubble-Aufruf abgespielt
            // Kein zusätzlicher Sound nötig
            
            const waterDrops = bubble.querySelectorAll('.water-drop');
            
            // REALISTISCHE WASSERTROPFEN AUS BLASE RAUSZIEHEN
            waterDrops.forEach((drop, index) => {
                // Klone den Tropfen
                const flyingDrop = drop.cloneNode(true);
                
                // Setze Position relativ zur Blase mit zufälliger Streuung
                flyingDrop.style.position = 'fixed';
                flyingDrop.style.left = (bubbleRect.left + bubbleRect.width/2 + (Math.random() * 40 - 20)) + 'px';
                flyingDrop.style.top = (bubbleRect.top + bubbleRect.height/2 + (Math.random() * 40 - 20)) + 'px';
                flyingDrop.style.width = '2px';
                flyingDrop.style.height = '2px';
                flyingDrop.style.background = `radial-gradient(circle, 
                    rgba(104, 141, 177, 1) 0%,
                    rgba(104, 141, 177, 0.8) 50%,
                    rgba(104, 141, 177, 0.4) 100%)`;
                flyingDrop.style.borderRadius = '50%';
                flyingDrop.style.border = 'none';
                flyingDrop.style.boxShadow = '0 0 2px rgba(104, 141, 177, 0.8)';
                flyingDrop.style.zIndex = '-10';
                flyingDrop.style.opacity = '1';
                
                // Füge zum body hinzu (nicht zur Blase!)
                document.body.appendChild(flyingDrop);
                
                // KOMPLETT CHAOTISCHE SPRITZER-PHYSIK - keine Muster
                const directions = [];
                for (let i = 0; i < 20; i++) {
                    // Völlig zufällige Winkel ohne gleichmäßige Verteilung
                    const angle = Math.random() * 360;
                    const distance = 30 + Math.random() * 120; // 30-150px völlig zufällig
                    
                    // Zufällige X/Y Komponenten mit mehr Chaos
                    const baseX = Math.cos(angle * Math.PI / 180) * distance;
                    const baseY = Math.sin(angle * Math.PI / 180) * distance;
                    
                    // Zusätzliche chaotische Abweichungen
                    const x = baseX + (Math.random() * 60 - 30);
                    const y = baseY + (Math.random() * 60 - 30) - 20; // Leichte Aufwärtsbewegung
                    const gravity = 40 + Math.random() * 100; // 40-140 wilde Gravitation
                    
                    directions.push({ x, y, gravity });
                }
                
                const motion = directions[index] || directions[0];
                
                setTimeout(() => {
                    flyingDrop.style.transition = 'all 2.5s cubic-bezier(0.15, 0.85, 0.35, 1)';
                    flyingDrop.style.transform = `
                        translate(${motion.x}px, ${motion.y + motion.gravity}px) 
                        scale(${0.6 + Math.random() * 1.0})
                        rotate(${Math.random() * 720 - 360}deg)
                    `;
                    flyingDrop.style.opacity = '0.15';
                    
                    // Nach Animation entfernen
                    setTimeout(() => {
                        flyingDrop.remove();
                    }, 2500);
                }, Math.random() * 150 + b * 80); // Völlig chaotisches Timing
                
                console.log(`💧 Splash drop ${index} from bubble ${b} flying`);
            });
            
            // Blase ausblenden
            bubble.classList.add('popping');
            setTimeout(() => {
                bubble.style.display = 'none';
            }, 500);
        }
    }
}

// Alle verbleibenden Blasen spektakulär zerplatzen lassen
function popAllBubbles() {
    const bubbles = document.querySelectorAll('.bubble:not(.popping)');
    console.log(`🎇 FINAL POP: ${bubbles.length} bubbles remaining`);
    
    bubbles.forEach((bubble, index) => {
        setTimeout(() => {
            bubble.classList.remove('popping');
            bubble.classList.add('final-pop');
            
            // Nach Animation komplett ausblenden
            setTimeout(() => {
                bubble.style.opacity = '0';
                bubble.style.visibility = 'hidden';
            }, 1500);
        }, index * 100); // Versetztes Zerplatzen für dramatischen Effekt
    });
}

// Blasen zurücksetzen - Blasen fliegen normal nach oben weiter
function resetBubbles() {
    const bubbles = document.querySelectorAll('.bubble');
    bubbles.forEach(bubble => {
        // Entferne Zerplatz-Klassen
        bubble.classList.remove('popping', 'final-pop');
        
        // Setze Sichtbarkeit und Opacity zurück
        bubble.style.opacity = '';
        bubble.style.visibility = '';
        
        // Lasse normale Aufwärtsbewegung fortsetzen
        bubble.style.animation = '';
    });
}

function unlock() {
    isLocked = false;
    
    // Blubberblasen ausblenden
    document.querySelector('.bubbles').style.display = 'none';
    
    document.querySelector('.container').innerHTML = `
        <div class="icon" style="color: var(--accent-green);">🔓</div>
        <h1>Entsperrt!</h1>
        <div class="status">Du kannst jetzt normal weiterarbeiten</div>
        <div style="margin-top: var(--spacing-5);">
            <button onclick="location.reload()" class="btn-primary">
                Erneut sperren
            </button>
        </div>
    `;
    
    // Cursor wieder anzeigen
    document.body.style.cursor = 'default';
    
    // Fullscreen verlassen nach 3 Sekunden
    setTimeout(() => {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }, 3000);
}

// Fullscreen-Exit abfangen
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && isLocked) {
        // Warnung anzeigen wenn Fullscreen verlassen wird
        alert('Vollbild-Modus verlassen! Sperrung möglicherweise nicht mehr aktiv.');
    }
});