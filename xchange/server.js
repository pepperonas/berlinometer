const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const {v4: uuidv4} = require('uuid');

const app = express();
const port = process.env.PORT || 5009;

// Konfiguration für den Passwortschutz
const AUTH_CONFIG = {
    password: '1337',
    maxAttempts: 5,                              // Maximale Anzahl fehlgeschlagener Anmeldeversuche
    blockTime: 15 * 60 * 1000,                   // Blockzeit in Millisekunden (15 Minuten)
    sessionDuration: 24 * 60 * 60 * 1000         // Session-Gültigkeit (24 Stunden)
};

// Speicherpfad für Dateien
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(__dirname, 'files.json');
const SESSION_FILE = path.join(__dirname, 'sessions.json');

// Verzeichnis erstellen, falls es nicht existiert
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, {recursive: true});
}

// Datenbank initialisieren, falls sie nicht existiert
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// Sessions-Datei initialisieren, falls sie nicht existiert
if (!fs.existsSync(SESSION_FILE)) {
    fs.writeFileSync(SESSION_FILE, JSON.stringify({}));
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(fileUpload({
    createParentPath: true,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max Dateigröße
    },
    abortOnLimit: true
}));

// API-Prefix
const API_PREFIX = '/xchange';

// Hilfsfunktionen für die Datenbank
function getFilesDb() {
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (error) {
        console.error('Fehler beim Lesen der Datenbankdatei:', error);
        return [];
    }
}

function saveFilesDb(files) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(files, null, 2));
        return true;
    } catch (error) {
        console.error('Fehler beim Speichern der Datenbankdatei:', error);
        return false;
    }
}

// Session-Verwaltungsfunktionen
function getSessions() {
    try {
        return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    } catch (error) {
        console.error('Fehler beim Lesen der Sessions:', error);
        return {};
    }
}

function saveSessions(sessions) {
    try {
        fs.writeFileSync(SESSION_FILE, JSON.stringify(sessions, null, 2));
        return true;
    } catch (error) {
        console.error('Fehler beim Speichern der Sessions:', error);
        return false;
    }
}

function createSession(ip) {
    const sessionId = uuidv4();
    const sessions = getSessions();

    sessions[sessionId] = {
        ip,
        created: Date.now(),
        expires: Date.now() + AUTH_CONFIG.sessionDuration
    };

    saveSessions(sessions);
    return sessionId;
}

function validateSession(sessionId) {
    if (!sessionId) return false;

    const sessions = getSessions();
    const session = sessions[sessionId];

    if (!session) return false;

    // Prüfen, ob die Session abgelaufen ist
    if (session.expires < Date.now()) {
        // Abgelaufene Session löschen
        delete sessions[sessionId];
        saveSessions(sessions);
        return false;
    }

    return true;
}

// Bruteforce-Schutz
const failedAttempts = {};

function recordFailedAttempt(ip) {
    if (!failedAttempts[ip]) {
        failedAttempts[ip] = {
            count: 0,
            blockedUntil: null
        };
    }

    failedAttempts[ip].count += 1;

    // Wenn maximale Versuche überschritten, IP blockieren
    if (failedAttempts[ip].count >= AUTH_CONFIG.maxAttempts) {
        failedAttempts[ip].blockedUntil = Date.now() + AUTH_CONFIG.blockTime;
        console.log(`IP ${ip} wurde aufgrund zu vieler Anmeldeversuche für ${AUTH_CONFIG.blockTime / 60000} Minuten blockiert.`);
    }
}

function isBlocked(ip) {
    if (!failedAttempts[ip] || !failedAttempts[ip].blockedUntil) {
        return false;
    }

    // Wenn Blockierzeit abgelaufen ist, zurücksetzen
    if (failedAttempts[ip].blockedUntil < Date.now()) {
        failedAttempts[ip] = {
            count: 0,
            blockedUntil: null
        };
        return false;
    }

    return true;
}

function resetFailedAttempts(ip) {
    if (failedAttempts[ip]) {
        failedAttempts[ip].count = 0;
        failedAttempts[ip].blockedUntil = null;
    }
}

// Authentifizierungs-Middleware
function authMiddleware(req, res, next) {
    // Prüfe auf Login-Seite und Login-Anfrage - diese sind ohne Auth erlaubt
    if (req.path === `${API_PREFIX}/login` || req.path === `${API_PREFIX}/authenticate`) {
        return next();
    }

    // Prüfe auf Status-Endpoint - dieser ist ohne Auth erlaubt
    if (req.path === `${API_PREFIX}/status`) {
        return next();
    }

    const sessionId = req.query.session || req.cookies?.sessionId;

    if (validateSession(sessionId)) {
        return next();
    }

    // Bei API-Anfragen mit ungültiger Session 401 zurückgeben
    if (req.path.startsWith(`${API_PREFIX}/files`) ||
        req.path.startsWith(`${API_PREFIX}/upload`) ||
        req.path.startsWith(`${API_PREFIX}/download`)) {
        return res.status(401).json({success: false, message: 'Nicht authentifiziert'});
    }

    // Bei HTML-Anfragen zur Login-Seite weiterleiten
    res.redirect(`${API_PREFIX}/login`);
}

// Login-Seite
app.get(`${API_PREFIX}/login`, (req, res) => {
    // Hier senden wir die Login-Seite
    res.send(`
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>xchange | Login</title>
        <style>
            :root {
                --background-dark: #2B2E3B;
                --background-darker: #252830;
                --card-background: #343845;
                --accent-blue: #688db1;
                --text-primary: #d1d5db;
                --text-secondary: #9ca3af;
                --error-color: #e16162;
                --shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
                --radius: 0.5rem;
                --radius-lg: 1rem;
            }
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
                'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            }
            
            body {
                background-color: var(--background-dark);
                color: var(--text-primary);
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 20px;
            }
            
            .login-container {
                background-color: var(--card-background);
                border-radius: var(--radius-lg);
                width: 100%;
                max-width: 400px;
                box-shadow: var(--shadow);
                overflow: hidden;
            }
            
            .login-header {
                background-color: var(--background-darker);
                padding: 20px;
                text-align: center;
            }
            
            .login-form {
                padding: 30px;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 8px;
                color: var(--text-secondary);
            }
            
            .form-group input {
                width: 100%;
                padding: 12px;
                background-color: var(--background-darker);
                border: 1px solid var(--background-darker);
                border-radius: var(--radius);
                color: var(--text-primary);
                font-size: 16px;
                transition: border-color 0.3s;
            }
            
            .form-group input:focus {
                outline: none;
                border-color: var(--accent-blue);
            }
            
            .login-btn {
                width: 100%;
                padding: 12px;
                background-color: var(--accent-blue);
                color: var(--text-primary);
                border: none;
                border-radius: var(--radius);
                font-size: 16px;
                cursor: pointer;
                transition: background-color 0.3s;
            }
            
            .login-btn:hover {
                background-color: #5a7a9a;
            }
            
            .error-message {
                color: var(--error-color);
                margin-bottom: 20px;
                text-align: center;
                display: none;
            }
        </style>
    </head>
    <body>
        <div class="login-container">
            <div class="login-header">
                <h1>xchange | Login</h1>
            </div>
            <div class="login-form">
                <div class="error-message" id="errorMessage"></div>
                <form id="loginForm">
                    <div class="form-group">
                        <label for="password">Passwort</label>
                        <input type="password" id="password" name="password" required autocomplete="current-password">
                    </div>
                    <button type="submit" class="login-btn">Anmelden</button>
                </form>
            </div>
        </div>
        
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                const loginForm = document.getElementById('loginForm');
                const errorMessage = document.getElementById('errorMessage');
                
                // URL Parameter auslesen
                const urlParams = new URLSearchParams(window.location.search);
                const error = urlParams.get('error');
                
                // Fehlermeldung anzeigen, wenn vorhanden
                if (error) {
                    errorMessage.textContent = decodeURIComponent(error);
                    errorMessage.style.display = 'block';
                }
                
                loginForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const password = document.getElementById('password').value;
                    
                    fetch('${API_PREFIX}/authenticate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ password })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // Erfolgreich angemeldet - zur Hauptseite weiterleiten
                            window.location.href = '${API_PREFIX}?session=' + data.sessionId;
                        } else {
                            // Fehlermeldung anzeigen
                            errorMessage.textContent = data.message || 'Ungültiges Passwort';
                            errorMessage.style.display = 'block';
                        }
                    })
                    .catch(error => {
                        errorMessage.textContent = 'Verbindungsfehler. Bitte versuche es später erneut.';
                        errorMessage.style.display = 'block';
                    });
                });
            });
        </script>
    </body>
    </html>
    `);
});

// Authentifizierungs-Endpunkt
app.post(`${API_PREFIX}/authenticate`, (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    const {password} = req.body;

    // Prüfen, ob die IP blockiert ist
    if (isBlocked(ip)) {
        const blockedUntil = failedAttempts[ip].blockedUntil;
        const remainingMinutes = Math.ceil((blockedUntil - Date.now()) / 60000);

        return res.status(429).json({
            success: false,
            message: `Zu viele Anmeldeversuche. Bitte versuche es in ${remainingMinutes} Minuten erneut.`
        });
    }

    // Passwort prüfen
    if (password === AUTH_CONFIG.password) {
        // Anmeldung erfolgreich - Fehlversuche zurücksetzen
        resetFailedAttempts(ip);

        // Neue Session erstellen
        const sessionId = createSession(ip);

        return res.json({
            success: true,
            message: 'Anmeldung erfolgreich',
            sessionId
        });
    } else {
        // Fehlgeschlagenen Anmeldeversuch registrieren
        recordFailedAttempt(ip);

        return res.status(401).json({
            success: false,
            message: 'Ungültiges Passwort'
        });
    }
});

// Authentifizierungs-Middleware einbinden
app.use(authMiddleware);

// Ab hier folgen die vorhandenen Routen, die jetzt durch die Middleware geschützt sind

// Status-Endpoint
app.get(`${API_PREFIX}/status`, (req, res) => {
    res.json({status: 'ok', timestamp: new Date().toISOString()});
});

// Dateien auflisten
app.get(`${API_PREFIX}/files`, (req, res) => {
    try {
        const files = getFilesDb();
        res.json({success: true, files});
    } catch (error) {
        console.error('Fehler beim Auflisten der Dateien:', error);
        res.status(500).json({success: false, message: 'Serverfehler beim Auflisten der Dateien'});
    }
});

// Datei hochladen
app.post(`${API_PREFIX}/upload`, (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({success: false, message: 'Keine Datei hochgeladen'});
        }

        // Datei aus dem Request holen
        const uploadedFile = req.files.file;
        const fileId = uuidv4();
        const fileName = uploadedFile.name;
        const filePath = path.join(UPLOAD_DIR, fileId);

        // Datei in das Upload-Verzeichnis verschieben
        uploadedFile.mv(filePath, (err) => {
            if (err) {
                console.error('Fehler beim Speichern der Datei:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Fehler beim Speichern der Datei'
                });
            }

            // Datei-Informationen speichern
            const fileInfo = {
                id: fileId,
                name: fileName,
                size: uploadedFile.size,
                type: uploadedFile.mimetype,
                uploadDate: new Date().toISOString()
            };

            // Zu Datenbank hinzufügen
            const files = getFilesDb();
            files.push(fileInfo);
            saveFilesDb(files);

            res.json({success: true, fileId, message: 'Datei erfolgreich hochgeladen'});
        });
    } catch (error) {
        console.error('Fehler beim Datei-Upload:', error);
        res.status(500).json({success: false, message: 'Serverfehler beim Hochladen der Datei'});
    }
});

// Datei herunterladen
app.get(`${API_PREFIX}/download/:id`, (req, res) => {
    try {
        const fileId = req.params.id;
        const files = getFilesDb();
        const fileInfo = files.find(file => file.id === fileId);

        if (!fileInfo) {
            return res.status(404).json({success: false, message: 'Datei nicht gefunden'});
        }

        const filePath = path.join(UPLOAD_DIR, fileId);

        // Überprüfen, ob die Datei existiert
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({success: false, message: 'Datei existiert nicht mehr'});
        }

        // Datei zum Download anbieten
        res.download(filePath, fileInfo.name, (err) => {
            if (err) {
                console.error('Fehler beim Herunterladen der Datei:', err);
                res.status(500).json({
                    success: false,
                    message: 'Fehler beim Herunterladen der Datei'
                });
            }
        });
    } catch (error) {
        console.error('Fehler beim Datei-Download:', error);
        res.status(500).json({
            success: false,
            message: 'Serverfehler beim Herunterladen der Datei'
        });
    }
});

// Datei löschen
app.delete(`${API_PREFIX}/files/:id`, (req, res) => {
    try {
        const fileId = req.params.id;
        const files = getFilesDb();
        const fileIndex = files.findIndex(file => file.id === fileId);

        if (fileIndex === -1) {
            return res.status(404).json({success: false, message: 'Datei nicht gefunden'});
        }

        const filePath = path.join(UPLOAD_DIR, fileId);

        // Datei aus dem Dateisystem löschen
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Datei aus der Datenbank entfernen
        files.splice(fileIndex, 1);
        saveFilesDb(files);

        res.json({success: true, message: 'Datei erfolgreich gelöscht'});
    } catch (error) {
        console.error('Fehler beim Löschen der Datei:', error);
        res.status(500).json({success: false, message: 'Serverfehler beim Löschen der Datei'});
    }
});

// Statische Dateien servieren (Frontend)
app.use(API_PREFIX, express.static(path.join(__dirname, 'public')));

// Startseite
app.get(API_PREFIX, (req, res) => {
    // Session-Parameter an die URL anhängen, wenn vorhanden
    const sessionId = req.query.session;

    if (sessionId) {
        // Set cookie für zukünftige Anfragen
        res.cookie('sessionId', sessionId, {
            maxAge: AUTH_CONFIG.sessionDuration,
            httpOnly: true,
            sameSite: 'strict'
        });
    }

    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Server starten
app.listen(port, () => {
    console.log(`xchange API läuft auf http://localhost:${port}${API_PREFIX}`);
});