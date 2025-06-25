let unlockSequence = ['u', 'n', 'l', 'o', 'c', 'k'];
let currentSequence = [];
let isLocked = true;

// Fullscreen aktivieren
document.addEventListener('DOMContentLoaded', () => {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    }
    
    // TEST: Klick irgendwo zum Testen der Wasserspritzer
    document.addEventListener('click', (e) => {
        if (isLocked) {
            console.log('🧪 TESTING: Clicking triggers water splash test');
            popBubble(0);
        }
    });
    
    // TEST: Automatischer Test nach 2 Sekunden
    setTimeout(() => {
        console.log('🧪 AUTO-TEST: Testing water splash visibility...');
        popBubble(0);
    }, 2000);
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

// REALISTISCHE WASSERTROPFEN-SPRITZER BEIM ZERPLATZEN
function popBubble(correctLetterIndex) {
    console.log(`💧 Bubble splash for letter ${correctLetterIndex}`);
    
    const bubbles = document.querySelectorAll('.bubble:not(.popping)');
    
    if (bubbles.length > 0) {
        const bubble = bubbles[0];
        const bubbleRect = bubble.getBoundingClientRect();
        
        const waterDrops = bubble.querySelectorAll('.water-drop');
        
        // REALISTISCHE WASSERTROPFEN AUS BLASE RAUSZIEHEN
        waterDrops.forEach((drop, index) => {
            // Klone den Tropfen
            const flyingDrop = drop.cloneNode(true);
            
            // Setze Position relativ zur Blase
            flyingDrop.style.position = 'fixed';
            flyingDrop.style.left = (bubbleRect.left + (index * 5)) + 'px';
            flyingDrop.style.top = bubbleRect.top + 'px';
            flyingDrop.style.width = '1.5px';
            flyingDrop.style.height = '1.5px';
            flyingDrop.style.background = `radial-gradient(circle, 
                rgba(104, 141, 177, 0.8) 0%,
                rgba(104, 141, 177, 0.5) 60%,
                rgba(104, 141, 177, 0.2) 100%)`;
            flyingDrop.style.borderRadius = '50%';
            flyingDrop.style.border = 'none';
            flyingDrop.style.boxShadow = '0 0 1px rgba(104, 141, 177, 0.5)';
            flyingDrop.style.zIndex = '-10';
            flyingDrop.style.opacity = '1';
            
            // Füge zum body hinzu (nicht zur Blase!)
            document.body.appendChild(flyingDrop);
            
            // WILDE 360° SPRITZER-PHYSIK - chaotisch und dynamisch
            const directions = [];
            for (let i = 0; i < 20; i++) {
                const angle = (i * 18) + Math.random() * 30 - 15; // ±15° wilde Variation
                const distance = 40 + Math.random() * 80; // Entfernung 40-120px (mehr Variation)
                const upwardBias = -30 + Math.random() * 20; // Wildere Aufwärtsbewegung
                
                const x = Math.cos(angle * Math.PI / 180) * distance;
                const y = Math.sin(angle * Math.PI / 180) * distance + upwardBias;
                const gravity = 60 + Math.random() * 80; // Mehr Gravitations-Variation
                
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
                flyingDrop.style.opacity = '0.05';
                
                // Nach Animation entfernen
                setTimeout(() => {
                    flyingDrop.remove();
                }, 2500);
            }, index * (15 + Math.random() * 20));
            
            console.log(`💧 Splash drop ${index} flying`);
        });
        
        // Blase ausblenden
        bubble.classList.add('popping');
        setTimeout(() => {
            bubble.style.display = 'none';
        }, 500);
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