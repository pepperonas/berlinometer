document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('weatherCanvas');
    const ctx = canvas.getContext('2d');
    const toggleButton = document.getElementById('toggleAnimation');
    const weatherToggle = document.getElementById('toggleWeather');

    let animationActive = true;
    let animationId = null;
    let isRaining = true; // Standard: regnerisch

    // Canvas auf Fenstergröße setzen
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // Regentropfen-Klasse
    class Raindrop {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * -100;
            this.length = Math.random() * 20 + 10;
            this.speed = Math.random() * 10 + 5;
            this.opacity = Math.random() * 0.2 + 0.1;
            this.width = Math.random() * 1.5 + 0.5;
        }

        draw() {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, this.y + this.length);
            ctx.lineWidth = this.width;
            ctx.strokeStyle = `rgba(142, 197, 252, ${this.opacity})`;
            ctx.stroke();
        }

        update() {
            this.y += this.speed;

            // Wenn Regentropfen unten aus dem Bild fällt, neue Position generieren
            if (this.y > canvas.height) {
                this.reset();
            }

            this.draw();
        }
    }

    // Wolken-Klasse (für schönes Wetter)
    class Cloud {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width - canvas.width;
            this.y = Math.random() * (canvas.height * 0.6);
            this.width = Math.random() * 200 + 100;
            this.height = this.width * 0.6;
            this.speed = Math.random() * 0.5 + 0.1;
            this.opacity = Math.random() * 0.4 + 0.1;
        }

        draw() {
            ctx.beginPath();
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;

            // Wolkenform zeichnen
            const radius = this.height / 2;

            // Mittlerer Kreis
            ctx.arc(this.x + this.width / 2, this.y + radius, radius, 0, Math.PI * 2);
            // Linker Kreis
            ctx.arc(this.x + radius, this.y + radius, radius * 0.7, 0, Math.PI * 2);
            // Rechter Kreis
            ctx.arc(this.x + this.width - radius, this.y + radius, radius * 0.7, 0, Math.PI * 2);

            ctx.fill();
        }

        update() {
            this.x += this.speed;

            // Wenn Wolke rechts aus dem Bild wandert, neue Position am linken Rand
            if (this.x > canvas.width) {
                this.x = -this.width;
                this.y = Math.random() * (canvas.height * 0.6);
            }

            this.draw();
        }
    }

    // Sonnenstrahl-Klasse
    class Sunbeam {
        constructor() {
            this.centerX = canvas.width * 0.1; // Sonne am linken oberen Rand
            this.centerY = canvas.height * 0.1;
            this.angle = Math.random() * Math.PI * 2;
            this.baseLength = Math.random() * 100 + 80;  // Mittlere Länge
            this.lengthVariation = 30;               // Maximale Abweichung
            this.length = this.baseLength + (Math.random() * 2 - 1) * this.lengthVariation;
            this.baseWidth = Math.random() * 3 + 2;    // Mittlere Breite
            this.widthVariation = 1;                // Maximale Breitenabweichung
            this.width = this.baseWidth + (Math.random() * 2 - 1) * this.widthVariation;
            this.speed = 0.0001;
            this.opacity = Math.random() * 0.3 + 0.4;
            this.opacityVariation = 0.1;
            this.fanning = Math.random() * 0.1 - 0.05; // Leichte Fächerung
            this.xOffset = Math.random() * 10 - 5;
            this.yOffset = Math.random() * 10 - 5;
        }

        draw() {
            const startX = this.centerX + this.xOffset;
            const startY = this.centerY + this.yOffset;
            const endX = startX + Math.cos(this.angle) * this.length;
            const endY = startY + Math.sin(this.angle) * this.length;

            // Farbverlauf für weichere Kanten
            let gradient = ctx.createLinearGradient(startX, startY, endX, endY);
            gradient.addColorStop(0, `rgba(255, 235, 59, ${this.opacity})`);
            gradient.addColorStop(1, `rgba(255, 215, 0, 0)`);

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = this.width;
            ctx.stroke();
        }

        update() {
            this.angle += this.speed + this.fanning;
            this.opacity += (Math.random() * 0.02 - 0.01) * this.opacityVariation;
            this.opacity = Math.max(0, Math.min(this.opacity, 0.5)); // Opazität begrenzen

            // Zufällige Variation von Länge und Breite
            this.length = this.baseLength + (Math.random() * 2 - 1) * this.lengthVariation;
            this.width = this.baseWidth + (Math.random() * 2 - 1) * this.widthVariation;

            this.draw();
        }
    }

    // Sonnenschein-Klasse (zentraler Kreis)
    class Sun {
        constructor() {
            this.x = canvas.width * 0.1;
            this.y = canvas.height * 0.1;
            this.radius = 40;
            this.glow = 20;
            this.pulseSpeed = 0.02;
            this.pulseAmount = 5;
            this.pulseAngle = 0;
        }

        draw() {
            // Pulsierende Größe
            const pulseRadius = this.radius + Math.sin(this.pulseAngle) * this.pulseAmount;

            // Äußeres Glühen
            const gradient = ctx.createRadialGradient(
                this.x, this.y, pulseRadius - this.glow,
                this.x, this.y, pulseRadius + this.glow
            );
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

            ctx.beginPath();
            ctx.fillStyle = gradient;
            ctx.arc(this.x, this.y, pulseRadius + this.glow, 0, Math.PI * 2);
            ctx.fill();

            // Sonne selbst
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255, 235, 59, 1)';
            ctx.arc(this.x, this.y, pulseRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        update() {
            this.pulseAngle += this.pulseSpeed;
            if (this.pulseAngle > Math.PI * 2) {
                this.pulseAngle = 0;
            }

            this.draw();
        }
    }

    // Hintergrundbeleuchtung (Blitze) - nur für Regen
    function createLightning() {
        if (Math.random() < 0.003) { // Selten blitzen
            let opacity = Math.random() * 0.2 + 0.1;
            let duration = Math.random() * 100 + 50;

            // Hintergrundblitz erstellen
            canvas.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;

            // Nach kurzer Zeit zurücksetzen
            setTimeout(() => {
                canvas.style.backgroundColor = 'transparent';
            }, duration);
        }
    }

    // Animation-Elemente
    let raindrops = [];
    let clouds = [];
    let sunbeams = [];
    let sun = null;

    // Anzahl der Elemente
    const raindropCount = 200;
    const cloudCount = 10;
    const sunbeamCount = 12;

    function init() {
        resizeCanvas();

        // Regentropfen erzeugen
        raindrops = [];
        for (let i = 0; i < raindropCount; i++) {
            raindrops.push(new Raindrop());
        }

        // Wolken erzeugen
        clouds = [];
        for (let i = 0; i < cloudCount; i++) {
            clouds.push(new Cloud());
        }

        // Sonnenstrahlen erzeugen
        sunbeams = [];
        for (let i = 0; i < sunbeamCount; i++) {
            sunbeams.push(new Sunbeam());
        }

        // Sonne erzeugen
        sun = new Sun();

        startAnimation();
    }

    function drawRain() {
        // Dunkelblauer Hintergrund für Regenwetter
        ctx.fillStyle = 'rgba(42, 45, 62, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Blitze erstellen
        createLightning();

        // Regentropfen zeichnen
        raindrops.forEach(drop => {
            drop.update();
        });
    }

    function drawSunshine() {
        // Hellblauer Hintergrund für schönes Wetter
        let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB'); // Helles Himmelblau oben
        gradient.addColorStop(1, '#B0E2FF'); // Leicht helleres Blau unten

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Sonne zeichnen
        sun.update();

        // Sonnenstrahlen zeichnen
        sunbeams.forEach(beam => {
            beam.update();
        });

        // Wolken zeichnen
        clouds.forEach(cloud => {
            cloud.update();
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (isRaining) {
            drawRain();
        } else {
            drawSunshine();
        }

        animationId = requestAnimationFrame(animate);
    }

    // Animation starten
    function startAnimation() {
        if (!animationActive) return;

        if (!animationId) {
            animate();
        }
    }

    // Animation stoppen
    function stopAnimation() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
            // Canvas leeren
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    // Wetter wechseln
    function toggleWeatherType() {
        isRaining = !isRaining;

        if (isRaining) {
            weatherToggle.textContent = "☀️";
            document.body.classList.remove('sunny');
            document.body.classList.add('rainy');
        } else {
            weatherToggle.textContent = "🌧️";
            document.body.classList.remove('rainy');
            document.body.classList.add('sunny');
        }
    }

    // Toggle-Button für Animation
    toggleButton.addEventListener('click', function () {
        animationActive = !animationActive;

        if (animationActive) {
            startAnimation();
            toggleButton.textContent = "Animation ausschalten";
            toggleButton.classList.remove('off');
        } else {
            stopAnimation();
            toggleButton.textContent = "Animation einschalten";
            toggleButton.classList.add('off');
        }
    });

    // Toggle-Button für Wettertyp
    weatherToggle.addEventListener('click', function () {
        toggleWeatherType();
    });

    // Ereignislistener für Fenstergrößenänderung
    window.addEventListener('resize', function () {
        resizeCanvas();
        if (!animationActive) {
            // Canvas leeren
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    });

    // Animation starten
    init();
});