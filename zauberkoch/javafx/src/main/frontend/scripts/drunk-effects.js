/**
 * JavaScript-Modul für "betrunkene" UI-Effekte mit zuverlässigem Cleanup
 */

// Speichere Globals für leichteren Zugriff und sicheres Reset
window.__drunkEffects = {
    active: false,
    intervals: [],
    mouseHandler: null,
    clickHandler: null
};

// Initialisiere betrunkene Effekte
function initDrunkEffects() {
    console.log("Initialisiere betrunkene Effekte...");

    // Verhindere doppelte Initialisierung
    if (window.__drunkEffects.active) {
        console.log("Betrunkene Effekte bereits aktiv, zuerst bereinigen");
        cleanupDrunkEffects();
    }

    // Wackel- und Schwank-Effekt der Seite
    const swayInterval = setInterval(() => {
        const intensity = Math.random() * 1.5;
        document.body.style.transform = `rotate(${Math.random() * intensity - intensity/2}deg)`;

        setTimeout(() => {
            document.body.style.transform = '';
        }, 500);
    }, 6000);

    window.__drunkEffects.intervals.push(swayInterval);

    // Füge Doppelsicht-Effekt zu Überschriften hinzu
    // document.querySelectorAll('h1, h2, h3').forEach(heading => {
    //     heading.classList.add('double-vision');
    //     heading.setAttribute('data-text', heading.textContent);
    // });

    // Füge Mausbewegungs-Handler hinzu, der Elemente verschiebt
    window.__drunkEffects.mouseHandler = (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        document.querySelectorAll('.drunk-container').forEach(container => {
            container.style.transform = `translate(${x * 15 - 7.5}px, ${y * 15 - 7.5}px) rotate(${x * 1.5 - 0.75}deg)`;
        });
    };

    // Füge verzögerte Klicks hinzu
    window.__drunkEffects.clickHandler = (e) => {
        // 30% Chance für verzögerten Klick
        if (Math.random() < 0.3) {
            const target = e.target;
            const targetTag = target.tagName.toLowerCase();

            // Vermeide Verzögerung bei Vaadin-Navigationskomponenten, um Probleme zu vermeiden
            if (targetTag.startsWith('vaadin-') &&
                (targetTag.includes('tab') || targetTag.includes('button') ||
                    targetTag.includes('item') || targetTag.includes('menu'))) {
                return; // Keine Verzögerung für Navigations-Elemente
            }

            e.preventDefault();
            e.stopPropagation();

            setTimeout(() => {
                try {
                    const simulatedEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    target.dispatchEvent(simulatedEvent);
                } catch (err) {
                    console.error('Fehler beim verzögerten Klick:', err);
                }
            }, Math.random() * 600 + 200);

            return false;
        }
    };

    // Füge global hinzu, aber nur EINMAL
    document.addEventListener('mousemove', window.__drunkEffects.mouseHandler);
    document.addEventListener('click', window.__drunkEffects.clickHandler, true);

    // Markiere als aktiv
    window.__drunkEffects.active = true;

    console.log("Betrunkene Effekte initialisiert!");
}

// Bereinige alle betrunkenen Effekte
function cleanupDrunkEffects() {
    console.log("Bereinige betrunkene Effekte...");

    // Nur bereinigen, wenn aktiv
    if (!window.__drunkEffects.active) {
        console.log("Keine betrunkenen Effekte aktiv, nichts zu bereinigen");
        return;
    }

    // 1. Alle Intervalle stoppen
    window.__drunkEffects.intervals.forEach(interval => {
        clearInterval(interval);
    });
    window.__drunkEffects.intervals = [];

    // 2. Die globalen Event-Listener entfernen
    if (window.__drunkEffects.mouseHandler) {
        document.removeEventListener('mousemove', window.__drunkEffects.mouseHandler);
        window.__drunkEffects.mouseHandler = null;
    }

    if (window.__drunkEffects.clickHandler) {
        document.removeEventListener('click', window.__drunkEffects.clickHandler, true);
        window.__drunkEffects.clickHandler = null;
    }

    // 3. CSS-Klassen und Transformationen zurücksetzen
    document.body.style.transform = '';
    document.querySelectorAll('.drunk-container, .double-vision, .blur-shift, .wobble-element, .floating-element, .drunk-body').forEach(element => {
        element.style.transform = '';
        element.style.filter = '';
        element.classList.remove('drunk-container', 'double-vision', 'blur-shift', 'wobble-element', 'floating-element', 'drunk-body');
    });

    // 4. Als inaktiv markieren
    window.__drunkEffects.active = false;

    console.log("Betrunkene Effekte erfolgreich bereinigt!");
}

// Wende betrunkene Effekte auf ein Eingabefeld an
function applyDrunkInputEffects(inputElement) {
    // Die Texteingabe ungenauer machen
    inputElement.addEventListener('input', () => {
        // 10% Chance, einen zufälligen Buchstaben einzufügen
        if (Math.random() < 0.1) {
            const chars = 'abcdefghijklmnopqrstuvwxyz';
            const randomChar = chars.charAt(Math.floor(Math.random() * chars.length));
            const currentValue = inputElement.value || '';
            inputElement.value = currentValue + randomChar;
        }
    });

    // Bei Fokus leicht verschieben
    inputElement.addEventListener('focus', () => {
        inputElement.style.transform = `translateX(${Math.random() * 6 - 3}px) translateY(${Math.random() * 6 - 3}px)`;
    });

    inputElement.addEventListener('blur', () => {
        setTimeout(() => {
            inputElement.style.transform = '';
        }, 300);
    });
}

// Füge wackelnde Effekte einem Button hinzu
function addDrunkButtonEffects(button) {
    // Bei Hover verschieben
    button.addEventListener('mouseenter', () => {
        button.style.transform = `translateX(${Math.random() * 8 - 4}px) translateY(${Math.random() * 8 - 4}px) rotate(${Math.random() * 4 - 2}deg)`;
    });

    button.addEventListener('mouseleave', () => {
        button.style.transform = '';
    });
}

// Exportiere Funktionen
window.initDrunkEffects = initDrunkEffects;
window.applyDrunkInputEffects = applyDrunkInputEffects;
window.addDrunkButtonEffects = addDrunkButtonEffects;
window.cleanupDrunkEffects = cleanupDrunkEffects;
window.isDrunkEffectsActive = () => window.__drunkEffects.active;