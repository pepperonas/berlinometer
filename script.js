const weatherCanvas = document.getElementById("weatherCanvas");
const weatherCtx = weatherCanvas ? weatherCanvas.getContext('2d') : null;
let currentAnimation = "code"; // Standard-Animation
let weatherAnimationId = null;

// Wetter-Animationsklassen
// Regentropfen-Klasse
class Raindrop {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * weatherCanvas.width;
        this.y = Math.random() * -100;
        this.length = Math.random() * 20 + 10;
        this.speed = Math.random() * 10 + 5;
        this.opacity = Math.random() * 0.2 + 0.1;
        this.width = Math.random() * 1.5 + 0.5;
    }

    draw() {
        weatherCtx.beginPath();
        weatherCtx.moveTo(this.x, this.y);
        weatherCtx.lineTo(this.x, this.y + this.length);
        weatherCtx.lineWidth = this.width;
        weatherCtx.strokeStyle = `rgba(142, 197, 252, ${this.opacity})`;
        weatherCtx.stroke();
    }

    update() {
        this.y += this.speed;

        // Wenn Regentropfen unten aus dem Bild fällt, neue Position generieren
        if (this.y > weatherCanvas.height) {
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
        this.x = Math.random() * weatherCanvas.width - weatherCanvas.width;
        this.y = Math.random() * (weatherCanvas.height * 0.6);
        this.width = Math.random() * 200 + 100;
        this.height = this.width * 0.6;
        this.speed = Math.random() * 0.7 + 0.2;
        this.opacity = Math.random() * 0.4 + 0.16;
    }

    draw() {
        weatherCtx.beginPath();
        weatherCtx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;

        // Wolkenform zeichnen
        const radius = this.height / 2;

        // Mittlerer Kreis
        weatherCtx.arc(this.x + this.width / 2, this.y + radius, radius, 0, Math.PI * 2);
        // Linker Kreis
        weatherCtx.arc(this.x + radius, this.y + radius, radius * 0.7, 0, Math.PI * 2);
        // Rechter Kreis
        weatherCtx.arc(this.x + this.width - radius, this.y + radius, radius * 0.7, 0, Math.PI * 2);

        weatherCtx.fill();
    }

    update() {
        this.x += this.speed;

        // Wenn Wolke rechts aus dem Bild wandert, neue Position am linken Rand
        if (this.x > weatherCanvas.width) {
            this.x = -this.width;
            this.y = Math.random() * (weatherCanvas.height * 0.6);
        }

        this.draw();
    }
}

// Sonnenstrahl-Klasse
class Sunbeam {
    constructor() {
        this.centerX = weatherCanvas.width * 0.1; // Sonne am linken oberen Rand
        this.centerY = weatherCanvas.height * 0.1;
        this.angle = Math.random() * Math.PI * 2;
        this.baseLength = Math.random() * 100 + 80;  // Mittlere Länge
        this.lengthVariation = 30;               // Maximale Abweichung
        this.length = this.baseLength + (Math.random() * 2 - 1) * this.lengthVariation;
        this.baseWidth = Math.random() * 3 + 2;    // Mittlere Breite
        this.widthVariation = 1;                // Maximale Breitenabweichung
        this.width = this.baseWidth + (Math.random() * 2 - 1) * this.widthVariation;
        this.speed = 0.01;
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
        let gradient = weatherCtx.createLinearGradient(startX, startY, endX, endY);
        gradient.addColorStop(0, `rgba(255, 235, 59, ${this.opacity})`);
        gradient.addColorStop(1, `rgba(255, 215, 0, 0)`);

        weatherCtx.beginPath();
        weatherCtx.moveTo(startX, startY);
        weatherCtx.lineTo(endX, endY);
        weatherCtx.strokeStyle = gradient;
        weatherCtx.lineWidth = this.width;
        weatherCtx.stroke();
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
        this.x = weatherCanvas.width * 0.1;
        this.y = weatherCanvas.height * 0.1;
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
        const gradient = weatherCtx.createRadialGradient(
            this.x, this.y, pulseRadius - this.glow,
            this.x, this.y, pulseRadius + this.glow
        );
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

        weatherCtx.beginPath();
        weatherCtx.fillStyle = gradient;
        weatherCtx.arc(this.x, this.y, pulseRadius + this.glow, 0, Math.PI * 2);
        weatherCtx.fill();

        // Sonne selbst
        weatherCtx.beginPath();
        weatherCtx.fillStyle = 'rgba(255, 235, 59, 1)';
        weatherCtx.arc(this.x, this.y, pulseRadius, 0, Math.PI * 2);
        weatherCtx.fill();
    }

    update() {
        this.pulseAngle += this.pulseSpeed;
        if (this.pulseAngle > Math.PI * 2) {
            this.pulseAngle = 0;
        }

        this.draw();
    }
}

// Wetter-Animation Variablen
let raindrops = [];
let clouds = [];
let sunbeams = [];
let sun = null;
let isRaining = true;

// Anzahl der Elemente
const raindropCount = 200;
const cloudCount = 10;
const sunbeamCount = 12;

// Hintergrundbeleuchtung (Blitze) - nur für Regen
function createLightning() {
    if (Math.random() < 0.003) { // Selten blitzen
        let opacity = Math.random() * 0.2 + 0.1;
        let duration = Math.random() * 100 + 50;

        // Hintergrundblitz erstellen
        weatherCanvas.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;

        // Nach kurzer Zeit zurücksetzen
        setTimeout(() => {
            weatherCanvas.style.backgroundColor = 'transparent';
        }, duration);
    }
}

// Wetter-Animationen initialisieren
function initWeatherAnimations() {
    if (!weatherCanvas) return;

    resizeWeatherCanvas();

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
}

// Wetter-Canvas auf Fenstergröße setzen
function resizeWeatherCanvas() {
    if (!weatherCanvas) return;

    weatherCanvas.width = window.innerWidth;
    weatherCanvas.height = window.innerHeight;
}

// Regen zeichnen
function drawRain() {
    // Dunklerer Hintergrund für Regenwetter
    weatherCtx.fillStyle = 'rgba(26, 29, 42, 0.6)';
    weatherCtx.fillRect(0, 0, weatherCanvas.width, weatherCanvas.height);

    // Blitze erstellen
    createLightning();

    // Regentropfen zeichnen
    raindrops.forEach(drop => {
        drop.update();
    });
}

// Sonnenschein zeichnen
function drawSunshine() {
    // Dunklerer blauer Hintergrund für Sonnenwetter
    let gradient = weatherCtx.createLinearGradient(0, 0, 0, weatherCanvas.height);
    gradient.addColorStop(0, '#1e5486'); // Dunkleres Himmelblau oben
    gradient.addColorStop(1, '#2c6ca9'); // Dunkleres Blau unten

    weatherCtx.fillStyle = gradient;
    weatherCtx.fillRect(0, 0, weatherCanvas.width, weatherCanvas.height);

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

// Wetter-Animation
function animateWeather() {
    if (!weatherCanvas) return;

    weatherCtx.clearRect(0, 0, weatherCanvas.width, weatherCanvas.height);

    if (isRaining) {
        drawRain();
    } else {
        drawSunshine();
    }

    weatherAnimationId = requestAnimationFrame(animateWeather);
}

// Wetter-Animation starten
function startWeatherAnimation() {
    if (!weatherCanvas) return;

    if (!weatherAnimationId) {
        animateWeather();
    }
}

// Wetter-Animation stoppen
function stopWeatherAnimation() {
    if (weatherAnimationId) {
        cancelAnimationFrame(weatherAnimationId);
        weatherAnimationId = null;
        // Canvas leeren
        if (weatherCanvas) {
            weatherCtx.clearRect(0, 0, weatherCanvas.width, weatherCanvas.height);
        }
    }
}

// Animation wechseln
function switchAnimation(type) {
    // Aktuelle Animation stoppen
    if (currentAnimation === "sun" || currentAnimation === "rain") {
        stopWeatherAnimation();
        if (weatherCanvas) weatherCanvas.style.display = "none";
    }

    // Code-Animation anhalten/fortsetzen
    if (type === "code") {
        if (canvas) canvas.style.display = "block";
        document.body.classList.remove("sun-mode", "rain-mode");
        currentAnimation = "code";
    } else {
        if (canvas) canvas.style.display = "none";

        // Wetteranimation starten
        if (weatherCanvas) {
            weatherCanvas.style.display = "block";
            initWeatherAnimations();

            if (type === "sun") {
                isRaining = false;
                document.body.classList.remove("rain-mode");
                document.body.classList.add("sun-mode");
            } else if (type === "rain") {
                isRaining = true;
                document.body.classList.remove("sun-mode");
                document.body.classList.add("rain-mode");
            }

            startWeatherAnimation();
            currentAnimation = type;
        }
    }
}

// Event-Listener für Animation-Dropdown
document.addEventListener('DOMContentLoaded', function () {
    const animationSelector = document.getElementById('animationSelector');
    if (animationSelector) {
        animationSelector.addEventListener('change', function () {
            switchAnimation(this.value);
        });
    }

    // Beim ersten Laden Code-Animation anzeigen
    switchAnimation("code");
});

// Fenstergrößenänderung berücksichtigen
window.addEventListener('resize', function () {
    // Bestehende Resize-Funktion bleibt erhalten
    resizeCanvas();

    // Für Wetteranimation
    resizeWeatherCanvas();

    // Bei Wetter-Animation Objekte neu initialisieren
    if (currentAnimation === "sun" || currentAnimation === "rain") {
        initWeatherAnimations();
    }
});

// Eine Liste von Code-Fragmenten für die Animation
const codeFragments = [
    "if (x > 0)", "function()", "return true;", "for(i=0;i<10;i++)", "while(true)",
    "await fetch(url)", "import React", "const data = []", "try { ... } catch(e) { }",
    "class Node {}", "<div>", "git commit", "npm install", "docker run",
    "SELECT * FROM", "console.log()", "var x = 10", "async/await", "let array = []",
    "export default", "addEventListener", "Promise.all()", "new Map()", "Object.keys()",
    "useState()", "useEffect()", "componentDidMount()", "this.setState()", "props =>",
    ".then()", ".catch()", ".filter()", ".map()", ".reduce()",
    "sudo apt-get", "ssh root@", "python -m", "pip install", "java -jar",
    "kubectl", "gcloud", "azure", "curl -X POST", "wget -O", "chmod +x", "grep -r", "sed 's/a/b/g'",
    "{...props}", "</body>", "<head>", "<!DOCTYPE html>", "app.use(express())",
    "throw Error()", "typeof x === 'string'", "null ?? 'default'", "x?.property",
    "git push", "docker-compose up", "cd /var/www", "rm -rf", "mkdir -p",
    "npm run build", "yarn start", "go build", "mvn install", "gradle build",
    "systemctl restart", "kubectl apply", "helm install", "terraform apply", "aws lambda",
    "const router = express.Router()", "<React.Fragment>", "import { useState }", "export interface", "class implements",
    "public static void main", "def __init__(self)", "sudo systemctl", "git checkout -b", "brew install", "@Override", "onCreate(Bundle", "onCreateView(LayoutInflater",
    "public class MainActivity extends", "implements View.OnClickListener",
    "button.setOnClickListener(", "new View.OnClickListener()",
    "getApplicationContext()", "getSupportFragmentManager()",
    "RecyclerView.Adapter", "ViewHolder(View", "onBindViewHolder(",
    "notifyDataSetChanged()", "getLayoutInflater()", "inflate(R.layout.",
    "Bundle bundle = new Bundle()", "getIntent().getStringExtra(",
    "putExtra(", "requestPermissions(", "checkSelfPermission(",
    "new AsyncTask<", "doInBackground(", "onPostExecute(", "#include <iostream>", "#include <vector>", "#include <string>",
    "using namespace std;", "std::cout <<", "std::cin >>", "import numpy as np", "import pandas as pd", "from datetime import",
    "if __name__ == '__main__':", "def __str__(self):", "with open(", "unittest.TestCase", "assertEqual(self,", "mock.patch(",
    "requests.get(", "response.json()", "BeautifulSoup(",
    "plt.plot(", "df.groupby(", "df.merge(", "np.array(",
    "display: flex;", "@media (max-width:", ":hover {", "$variable:",
    "CC = gcc", "CFLAGS = -Wall", "TARGET = main", "all: $(TARGET)",
    "%.o: %.c", "$(CC) -c $<", "clean:", ".PHONY: all clean",
    "LDFLAGS = -l", "SRCS = $(wildcard *.c)", "OBJS = $(SRCS:.c=.o)",
    "install:", "$(MAKE) -C", "@echo", "-include", "ifeq ($(DEBUG),1)",
    "void setup() {", "void loop() {", "pinMode(", "digitalWrite(",
    "digitalRead(", "analogRead(", "analogWrite(", "Serial.begin(9600);",
    "Serial.println(", "delay(", "millis()", "attachInterrupt(",
    "EEPROM.write(", "EEPROM.read(", "Wire.begin()", "SPI.begin()",
    "#include <Wire.h>", "#include <SPI.h>", "ISR(TIMER1_OVF_vect)",
    '<?xml version="1.0"', 'encoding="UTF-8"?>', '<root>', '</root>',
    '<element attr="value">', '<![CDATA[', ']]>', '<!-- comment -->',
    '{"key": "value"}', '"array": [', '"nested": {', '"id": 123,',
    '"enabled": true,', '"items": null,', '}, {', '] }',
    '"$schema": "', '"type": "object",', '"properties": {', '"required": [',
    "CREATE TABLE", "ALTER TABLE", "DROP TABLE", "ADD COLUMN", "MODIFY COLUMN",
    "PRIMARY KEY", "FOREIGN KEY", "REFERENCES", "UNIQUE", "NOT NULL",
    "SELECT * FROM", "WHERE", "ORDER BY", "GROUP BY", "HAVING",
];

// Grab the canvas element from the DOM
const canvas = document.getElementById("canvas");
// Get a 2D drawing context from the canvas
const ctx = canvas.getContext("2d");

// Arrays to hold various particle types
const particles = [];
const dustParticles = [];
const activeCodeFragments = [];

// A simple mouse state object to track the user's cursor
const mouse = {
    x: null,
    y: null,
    set: function ({x, y}) {
        this.x = x;
        this.y = y;
    },
    reset: function () {
        this.x = null;
        this.y = null;
    }
};

// Some global state variables for background shifting and frame counting
let backgroundHue = 0;
let frameCount = 0;
let autoDrift = true;

// Dynamically adjust the number of particles based on canvas size
function adjustParticleCount() {
    const particleConfig = {
        heightConditions: [200, 300, 400, 500, 600],
        widthConditions: [450, 600, 900, 1200, 1600],
        particlesForHeight: [40, 60, 70, 90, 110],
        particlesForWidth: [40, 50, 70, 90, 110]
    };

    let numParticles = 130;

    // Check the height and pick a suitable particle count
    for (let i = 0; i < particleConfig.heightConditions.length; i++) {
        if (canvas.height < particleConfig.heightConditions[i]) {
            numParticles = particleConfig.particlesForHeight[i];
            break;
        }
    }

    // Check the width and try to lower the particle count if needed
    for (let i = 0; i < particleConfig.widthConditions.length; i++) {
        if (canvas.width < particleConfig.widthConditions[i]) {
            numParticles = Math.min(
                numParticles,
                particleConfig.particlesForWidth[i]
            );
            break;
        }
    }

    return numParticles;
}

// Particle class
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.size = Math.random() * 3 + 1;
        this.hue = Math.random() * 360;
        this.alpha = 1;
        this.sizeDirection = Math.random() < 0.5 ? -1 : 1;
        this.trail = [];
    }

    update() {
        // Völlig zufällige Bewegung ohne Anziehungspunkte
        this.vx += (Math.random() - 0.5) * 0.1;
        this.vy += (Math.random() - 0.5) * 0.1;

        // Geschwindigkeit begrenzen, damit Partikel nicht zu schnell werden
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 2) {
            this.vx = (this.vx / speed) * 2;
            this.vy = (this.vy / speed) * 2;
        }

        // Wenn Partikel zu langsam wird, zufälligen Schubs geben
        if (speed < 0.2) {
            this.vx += (Math.random() - 0.5) * 0.5;
            this.vy += (Math.random() - 0.5) * 0.5;
        }

        // Leichte Abstoßung zwischen Partikeln, um Cluster zu vermeiden
        for (let i = 0; i < particles.length && i < 10; i++) {
            const other = particles[Math.floor(Math.random() * particles.length)];
            if (other === this) continue;

            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const distSquared = dx * dx + dy * dy;

            if (distSquared < 400) {
                const repulsion = 0.03 / (distSquared + 1);
                this.vx -= dx * repulsion;
                this.vy -= dy * repulsion;
            }
        }

        // Leichte Dämpfung der Geschwindigkeit
        this.vx *= 0.98;
        this.vy *= 0.98;

        // Position aktualisieren
        this.x += this.vx;
        this.y += this.vy;

        // Vom Rand abprallen mit zufälliger Richtungsänderung
        if (this.x <= 0 || this.x >= canvas.width) {
            this.vx = -this.vx * 0.8;
            // Zufällige Y-Komponente hinzufügen
            this.vy += (Math.random() - 0.5) * 0.5;
            this.x = Math.max(0, Math.min(this.x, canvas.width));
        }

        if (this.y <= 0 || this.y >= canvas.height) {
            this.vy = -this.vy * 0.8;
            // Zufällige X-Komponente hinzufügen
            this.vx += (Math.random() - 0.5) * 0.5;
            this.y = Math.max(0, Math.min(this.y, canvas.height));
        }

        // Größenänderung und Farbwechsel wie zuvor
        this.size += this.sizeDirection * 0.1;
        if (this.size > 4 || this.size < 1) this.sizeDirection *= -1;
        this.hue = (this.hue + 0.3) % 360;

        // Trail-Aktualisierung
        if (
            frameCount % 2 === 0 &&
            (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1)
        ) {
            this.trail.push({
                x: this.x,
                y: this.y,
                hue: this.hue,
                alpha: this.alpha
            });
            if (this.trail.length > 15) this.trail.shift();
        }
    }

    draw(ctx) {
        // Draw a gradient-based circle to represent the particle
        const gradient = ctx.createRadialGradient(
            this.x,
            this.y,
            0,
            this.x,
            this.y,
            this.size
        );
        gradient.addColorStop(
            0,
            `hsla(${this.hue}, 80%, 60%, ${this.alpha})`
        );
        gradient.addColorStop(
            1,
            `hsla(${this.hue + 30}, 80%, 30%, ${this.alpha})`
        );

        ctx.fillStyle = gradient;
        // Add a slight glow if the screen is large
        ctx.shadowBlur = canvas.width > 900 ? 10 : 0;
        ctx.shadowColor = `hsl(${this.hue}, 80%, 60%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw the particle's trail as a faint line
        if (this.trail.length > 1) {
            ctx.beginPath();
            ctx.lineWidth = 1.5;
            for (let i = 0; i < this.trail.length - 1; i++) {
                const {x: x1, y: y1, hue: h1, alpha: a1} = this.trail[i];
                const {x: x2, y: y2} = this.trail[i + 1];
                ctx.strokeStyle = `hsla(${h1}, 80%, 60%, ${a1})`;
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
            ctx.stroke();
        }
    }
}

// Dust particles are static, background-like elements to add depth and interest
class DustParticle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.5;
        this.hue = Math.random() * 360;
        this.vx = (Math.random() - 0.5) * 0.05;
        this.vy = (Math.random() - 0.5) * 0.05;
    }

    update() {
        // Wrap around the edges so dust just cycles across the screen
        this.x = (this.x + this.vx + canvas.width) % canvas.width;
        this.y = (this.y + this.vy + canvas.height) % canvas.height;
        // Slowly shift hue for a subtle shimmering effect
        this.hue = (this.hue + 0.1) % 360;
    }

    draw(ctx) {
        // Draw faint circles
        ctx.fillStyle = `hsla(${this.hue}, 30%, 70%, 0.3)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Code Fragment class
class CodeFragment {
    constructor(x, y, text, hue) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.hue = hue;
        // Zufällige Transparenz für mehr visuelle Variation
        this.alpha = 0.5 + Math.random() * 0.5;
        // Größere und zufälligere Schriftgrößen (zwischen 10 und 30 Pixeln)
        this.size = 10 + Math.random() * 20; // Basisgröße zwischen 10 und 30
        // Zufällige Lebensdauer
        this.life = 150 + Math.random() * 250;
        this.maxLife = this.life;
        // Zufällige Rotation
        this.angle = Math.random() * Math.PI * 2;
        // Völlig zufällige Bewegung
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        // Rotationsgeschwindigkeit
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
    }

    update() {
        this.life--;

        // Zufällige Änderung der Bewegungsrichtung
        this.vx += (Math.random() - 0.5) * 0.1;
        this.vy += (Math.random() - 0.5) * 0.1;

        // Geschwindigkeit begrenzen
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 1) {
            this.vx = (this.vx / speed) * 1;
            this.vy = (this.vy / speed) * 1;
        }

        // Leichte Dämpfung
        this.vx *= 0.98;
        this.vy *= 0.98;

        // Position aktualisieren
        this.x += this.vx;
        this.y += this.vy;

        // Rotation aktualisieren
        this.angle += this.rotationSpeed;

        // Vom Rand abprallen
        if (this.x < 0 || this.x > canvas.width) {
            this.vx *= -1;
            this.x = Math.max(0, Math.min(this.x, canvas.width));
            // Richtung leicht ändern
            this.vy += (Math.random() - 0.5) * 0.3;
        }

        if (this.y < 0 || this.y > canvas.height) {
            this.vy *= -1;
            this.y = Math.max(0, Math.min(this.y, canvas.height));
            // Richtung leicht ändern
            this.vx += (Math.random() - 0.5) * 0.3;
        }

        // Zufällige Farbänderungen
        if (Math.random() < 0.05) {
            this.hue = (this.hue + Math.random() * 20 - 10) % 360;
            if (this.hue < 0) this.hue += 360;
        }

        // Transparenz gegen Ende verringern
        if (this.life < 60) {
            this.alpha = this.life / 60 * 0.7;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Füge Text-Schatten für bessere Lesbarkeit und optischen Effekt hinzu
        ctx.shadowColor = `rgba(0, 0, 0, ${this.alpha * 0.7})`;
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        // Zufällig variierte Textfarbe
        ctx.fillStyle = `hsla(${this.hue}, 80%, 60%, ${this.alpha})`;
        // Verwende nur Monospace-Schriften
        ctx.font = `${this.size}px "Consolas", "Courier New", "Menlo", "Monaco", monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.text, 0, 0);

        // Setze Schatten zurück
        ctx.shadowColor = "transparent";

        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

// Create initial sets of particles whenever we resize the canvas
function createParticles() {
    particles.length = 0;
    dustParticles.length = 0;
    activeCodeFragments.length = 0;

    const numParticles = adjustParticleCount();

    // Komplett zufällige Verteilung ohne Grid
    for (let i = 0; i < numParticles; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;

        // Zufällige Anfangsgeschwindigkeit in beliebiger Richtung
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.5;

        const particle = new Particle(x, y);
        particle.vx = Math.cos(angle) * speed;
        particle.vy = Math.sin(angle) * speed;

        particles.push(particle);
    }

    // Auch die Staubpartikel völlig zufällig verteilen
    for (let i = 0; i < 250; i++) {
        dustParticles.push(new DustParticle());
    }

    // Initial ein paar Code-Fragmente erzeugen
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const fragmentText = codeFragments[Math.floor(Math.random() * codeFragments.length)];
        const hue = Math.random() * 360;
        activeCodeFragments.push(new CodeFragment(x, y, fragmentText, hue));
    }
}

// Keep canvas full size to fill the browser window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createParticles();
}

// Draw a shifting background gradient
// Draw a static background with the color #2C2E3B
function drawBackground() {
    // Setze die Hintergrundfarbe auf #2C2E3B
    ctx.fillStyle = "#1f2026";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Optional: Füge ein feines "Noise"-Muster hinzu für einen technischeren Look
    ctx.fillStyle = `rgba(0, 0, 0, 0.02)`;
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2 + 1;
        ctx.fillRect(x, y, size, size);
    }
}

// Verwalte die Code-Fragmente
function updateCodeFragments() {
    const maxFragments = 150;

    // Erstelle regelmäßig neue Fragmente
    if (frameCount % 10 === 0 && activeCodeFragments.length < maxFragments) {
        // Mehr Fragmente pro Batch erstellen
        for (let i = 0; i < 5; i++) {
            // Zufällige Position im gesamten Canvas
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;

            // Zufälliges Codefragment auswählen
            const fragmentText = codeFragments[Math.floor(Math.random() * codeFragments.length)];

            // Zufällige Farbe
            const hue = Math.random() * 360;

            // Neues Fragment erstellen
            activeCodeFragments.push(new CodeFragment(x, y, fragmentText, hue));
        }
    }

    // Bestehende Fragmente aktualisieren und zeichnen
    for (let i = activeCodeFragments.length - 1; i >= 0; i--) {
        const fragment = activeCodeFragments[i];
        fragment.update();
        fragment.draw(ctx);

        if (fragment.isDead()) {
            activeCodeFragments.splice(i, 1);
        }
    }
}

// Main animation loop
function animate() {
    drawBackground();

    // Update and draw dust particles
    for (let i = dustParticles.length - 1; i >= 0; i--) {
        dustParticles[i].update();
        dustParticles[i].draw(ctx);
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx);
    }

    // Update and draw code fragments
    updateCodeFragments();

    frameCount++;
    requestAnimationFrame(animate);
}

// Mousemove: set mouse position and add new code fragments
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.set({x: e.clientX - rect.left, y: e.clientY - rect.top});

    // Füge ein neues Code-Fragment bei Mausbewegung hinzu
    if (Math.random() < 0.1 && activeCodeFragments.length < 200) {
        const fragmentText = codeFragments[Math.floor(Math.random() * codeFragments.length)];
        const hue = Math.random() * 360;
        activeCodeFragments.push(new CodeFragment(mouse.x, mouse.y, fragmentText, hue));
    }
});

// Mouse leaves: reset mouse position
canvas.addEventListener("mouseleave", () => {
    mouse.reset();
});

// Click to create code fragment explosion
canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Erzeuge eine größere Anzahl von Code-Fragmenten bei einem Klick
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 50;
        const x = clickX + Math.cos(angle) * distance;
        const y = clickY + Math.sin(angle) * distance;

        const fragmentText = codeFragments[Math.floor(Math.random() * codeFragments.length)];
        const hue = Math.random() * 360;
        const fragment = new CodeFragment(x, y, fragmentText, hue);

        // Gib dem Fragment eine Anfangsgeschwindigkeit weg vom Klickpunkt
        fragment.vx = Math.cos(angle) * (1 + Math.random());
        fragment.vy = Math.sin(angle) * (1 + Math.random());

        activeCodeFragments.push(fragment);
    }
});

// Whenever the window is resized, adjust canvas and particles
window.addEventListener("resize", resizeCanvas);

// Initialize everything
resizeCanvas();
animate();