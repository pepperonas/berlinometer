const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const {v4: uuidv4} = require('uuid');
const { createCanvas } = require('canvas');

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
const SHARE_FILE = path.join(__dirname, 'shares.json');

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

// Shares-Datei initialisieren, falls sie nicht existiert
if (!fs.existsSync(SHARE_FILE)) {
    fs.writeFileSync(SHARE_FILE, JSON.stringify({}));
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

// Hilfsfunktionen für Share-Links
function getSharesDb() {
    try {
        return JSON.parse(fs.readFileSync(SHARE_FILE, 'utf8'));
    } catch (error) {
        console.error('Fehler beim Lesen der Shares-Datei:', error);
        return {};
    }
}

function saveSharesDb(shares) {
    try {
        fs.writeFileSync(SHARE_FILE, JSON.stringify(shares, null, 2));
        return true;
    } catch (error) {
        console.error('Fehler beim Speichern der Shares-Datei:', error);
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

    // Prüfe auf Share-Endpoint - dieser ist ohne Auth erlaubt
    if (req.path.startsWith(`${API_PREFIX}/share/`) && req.method === 'GET') {
        return next();
    }

    // Prüfe auf Thumbnail-Endpoint - dieser ist ohne Auth erlaubt
    if (req.path.startsWith(`${API_PREFIX}/thumbnail/`) && req.method === 'GET') {
        return next();
    }

    const sessionId = req.query.session || req.cookies?.sessionId;

    if (validateSession(sessionId)) {
        return next();
    }

    // Bei API-Anfragen mit ungültiger Session 401 zurückgeben
    if (req.path.startsWith(`${API_PREFIX}/files`) ||
        req.path.startsWith(`${API_PREFIX}/upload`) ||
        req.path.startsWith(`${API_PREFIX}/download`) ||
        req.path.startsWith(`${API_PREFIX}/create-share`)) {
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
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⬇️</text></svg>">
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
                const passwordInput = document.getElementById('password');
                
                // Automatisch Fokus auf das Passwort-Eingabefeld setzen
                passwordInput.focus();
                
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
                    
                    const password = passwordInput.value;
                    
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
                            
                            // Nach einem Fehlversuch wieder Fokus auf das Passwort-Feld setzen
                            passwordInput.value = '';
                            passwordInput.focus();
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
        const shares = getSharesDb();

        // Füge Sharing-Status zu den Dateien hinzu
        const filesWithShareInfo = files.map(file => {
            const isShared = Object.values(shares).some(share => share.fileId === file.id);
            return {
                ...file,
                isShared
            };
        });

        res.json({success: true, files: filesWithShareInfo});
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

        // Content-Type und Content-Disposition Header setzen
        res.setHeader('Content-Type', fileInfo.type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.name}"`);
        
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

        // Alle Shares für diese Datei löschen
        const shares = getSharesDb();
        Object.keys(shares).forEach(shareId => {
            if (shares[shareId].fileId === fileId) {
                delete shares[shareId];
            }
        });
        saveSharesDb(shares);

        // Datei aus der Datenbank entfernen
        files.splice(fileIndex, 1);
        saveFilesDb(files);

        res.json({success: true, message: 'Datei erfolgreich gelöscht'});
    } catch (error) {
        console.error('Fehler beim Löschen der Datei:', error);
        res.status(500).json({success: false, message: 'Serverfehler beim Löschen der Datei'});
    }
});

// Share-Link erstellen
app.post(`${API_PREFIX}/create-share`, (req, res) => {
    try {
        const { fileId, expiryDays } = req.body;

        if (!fileId) {
            return res.status(400).json({success: false, message: 'Keine Datei-ID angegeben'});
        }

        // Überprüfen, ob die Datei existiert
        const files = getFilesDb();
        const fileInfo = files.find(file => file.id === fileId);

        if (!fileInfo) {
            return res.status(404).json({success: false, message: 'Datei nicht gefunden'});
        }

        // Share-ID generieren
        const shareId = uuidv4();

        // Ablaufdatum berechnen (Standard: 7 Tage, -1 für unbegrenzt)
        const days = parseInt(expiryDays) || 7;
        let expiryDate = null;
        let expires = null;

        if (days !== -1) {
            expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + days);
            expires = expiryDate.toISOString();
        }

        // Share in Datenbank speichern
        const shares = getSharesDb();
        shares[shareId] = {
            fileId,
            fileName: fileInfo.name,
            fileSize: fileInfo.size,
            fileType: fileInfo.type,
            created: new Date().toISOString(),
            expires: expires
        };

        saveSharesDb(shares);

        // Basis-URL für den Share-Link
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const baseUrl = `${protocol}://${host}${API_PREFIX}/share/${shareId}`;

        res.json({
            success: true,
            shareId,
            shareUrl: baseUrl,
            expiryDate: expires,
            fileName: fileInfo.name
        });
    } catch (error) {
        console.error('Fehler beim Erstellen des Share-Links:', error);
        res.status(500).json({success: false, message: 'Serverfehler beim Erstellen des Share-Links'});
    }
});

// Share-Link abrufen (Download der geteilten Datei)
app.get(`${API_PREFIX}/share/:shareId`, (req, res) => {
    try {
        const shareId = req.params.shareId;
        const shares = getSharesDb();

        // Überprüfen, ob der Share existiert
        if (!shares[shareId]) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html lang="de">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>xchange | Link ungültig</title>
                    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⬇️</text></svg>">
                    <style>
                        :root {
                            --background-dark: #2B2E3B;
                            --background-darker: #252830;
                            --card-background: #343845;
                            --accent-blue: #688db1;
                            --accent-red: #e16162;
                            --text-primary: #d1d5db;
                            --shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
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
                        
                        .error-container {
                            background-color: var(--card-background);
                            border-radius: var(--radius-lg);
                            width: 100%;
                            max-width: 500px;
                            box-shadow: var(--shadow);
                            text-align: center;
                            padding: 40px 20px;
                        }
                        
                        .error-icon {
                            font-size: 60px;
                            color: var(--accent-red);
                            margin-bottom: 20px;
                        }
                        
                        h1 {
                            margin-bottom: 15px;
                        }
                        
                        p {
                            margin-bottom: 25px;
                            opacity: 0.8;
                        }
                    </style>
                    <link href="https://cdnjs.cloudflare.com/ajax/libs/material-design-icons/3.0.1/iconfont/material-icons.min.css"
                          rel="stylesheet">
                </head>
                <body>
                    <div class="error-container">
                        <div class="error-icon">
                            <i class="material-icons">error_outline</i>
                        </div>
                        <h1>Link ungültig oder abgelaufen</h1>
                        <p>Der angeforderte Download-Link existiert nicht oder ist bereits abgelaufen.</p>
                    </div>
                </body>
                </html>
            `);
        }

        const shareInfo = shares[shareId];

        // Überprüfen, ob der Share abgelaufen ist (nur wenn ein Ablaufdatum gesetzt ist)
        if (shareInfo.expires && new Date(shareInfo.expires) < new Date()) {
            // Abgelaufenen Share löschen
            delete shares[shareId];
            saveSharesDb(shares);

            return res.status(410).send(`
                <!DOCTYPE html>
                <html lang="de">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>xchange | Link abgelaufen</title>
                    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⬇️</text></svg>">
                    <style>
                        :root {
                            --background-dark: #2B2E3B;
                            --background-darker: #252830;
                            --card-background: #343845;
                            --accent-blue: #688db1;
                            --accent-red: #e16162;
                            --text-primary: #d1d5db;
                            --shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
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
                        
                        .error-container {
                            background-color: var(--card-background);
                            border-radius: var(--radius-lg);
                            width: 100%;
                            max-width: 500px;
                            box-shadow: var(--shadow);
                            text-align: center;
                            padding: 40px 20px;
                        }
                        
                        .error-icon {
                            font-size: 60px;
                            color: var(--accent-red);
                            margin-bottom: 20px;
                        }
                        
                        h1 {
                            margin-bottom: 15px;
                        }
                        
                        p {
                            margin-bottom: 25px;
                            opacity: 0.8;
                        }
                    </style>
                    <link href="https://cdnjs.cloudflare.com/ajax/libs/material-design-icons/3.0.1/iconfont/material-icons.min.css"
                          rel="stylesheet">
                </head>
                <body>
                    <div class="error-container">
                        <div class="error-icon">
                            <i class="material-icons">access_time</i>
                        </div>
                        <h1>Link abgelaufen</h1>
                        <p>Der angeforderte Download-Link ist leider abgelaufen.</p>
                    </div>
                </body>
                </html>
            `);
        }

        // Datei-Pfad ermitteln
        const fileId = shareInfo.fileId;
        const filePath = path.join(UPLOAD_DIR, fileId);

        // Überprüfen, ob die Datei noch existiert
        if (!fs.existsSync(filePath)) {
            delete shares[shareId];
            saveSharesDb(shares);

            return res.status(404).send(`
                <!DOCTYPE html>
                <html lang="de">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>xchange | Datei nicht gefunden</title>
                    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⬇️</text></svg>">
                    <style>
                        :root {
                            --background-dark: #2B2E3B;
                            --background-darker: #252830;
                            --card-background: #343845;
                            --accent-blue: #688db1;
                            --accent-red: #e16162;
                            --text-primary: #d1d5db;
                            --shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
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
                        
                        .error-container {
                            background-color: var(--card-background);
                            border-radius: var(--radius-lg);
                            width: 100%;
                            max-width: 500px;
                            box-shadow: var(--shadow);
                            text-align: center;
                            padding: 40px 20px;
                        }
                        
                        .error-icon {
                            font-size: 60px;
                            color: var(--accent-red);
                            margin-bottom: 20px;
                        }
                        
                        h1 {
                            margin-bottom: 15px;
                        }
                        
                        p {
                            margin-bottom: 25px;
                            opacity: 0.8;
                        }
                    </style>
                    <link href="https://cdnjs.cloudflare.com/ajax/libs/material-design-icons/3.0.1/iconfont/material-icons.min.css"
                          rel="stylesheet">
                </head>
                <body>
                    <div class="error-container">
                        <div class="error-icon">
                            <i class="material-icons">folder_off</i>
                        </div>
                        <h1>Datei nicht mehr verfügbar</h1>
                        <p>Die angeforderte Datei existiert nicht mehr.</p>
                    </div>
                </body>
                </html>
            `);
        }

        // Wenn Accept-Header HTML enthält und kein direkter Download angefordert wurde,
        // zeigen wir eine Download-Seite an
        const acceptHeader = req.headers.accept || '';
        const directDownload = req.query.dl === '1';

        if (!directDownload && acceptHeader.includes('text/html')) {
            // Dateigröße formatieren
            const formatFileSize = (bytes) => {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            };

            const fileSize = formatFileSize(shareInfo.fileSize);
            let expiryInfo = '';

            if (shareInfo.expires) {
                const expiryDate = new Date(shareInfo.expires);
                // Deutsches Datumsformat: TT.MM.YYYY SS:MM
                const day = expiryDate.getDate().toString().padStart(2, '0');
                const month = (expiryDate.getMonth() + 1).toString().padStart(2, '0');
                const year = expiryDate.getFullYear();
                const hours = expiryDate.getHours().toString().padStart(2, '0');
                const minutes = expiryDate.getMinutes().toString().padStart(2, '0');
                const formattedExpiryDate = `${day}.${month}.${year} ${hours}:${minutes}`;
                expiryInfo = `Dieser Link ist gültig bis ${formattedExpiryDate}`;
            } else {
                expiryInfo = `Dieser Link ist unbegrenzt gültig`;
            }

            return res.send(`
                <!DOCTYPE html>
                <html lang="de">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>📥 ${shareInfo.fileName} - xchange</title>
                    
                    <!-- Open Graph Meta Tags für Link-Vorschauen (WhatsApp optimiert) -->
                    <meta property="og:title" content="📥 ${shareInfo.fileName}">
                    <meta property="og:description" content="Datei herunterladen (${fileSize}) - Verfügbar über xchange">
                    <meta property="og:type" content="website">
                    <meta property="og:url" content="${protocol}://${host}${API_PREFIX}/share/${shareId}">
                    <meta property="og:image" content="${protocol}://${host}${API_PREFIX}/thumbnail/${shareId}">
                    <meta property="og:image:secure_url" content="${protocol}://${host}${API_PREFIX}/thumbnail/${shareId}">
                    <meta property="og:image:type" content="image/png">
                    <meta property="og:image:width" content="1200">
                    <meta property="og:image:height" content="630">
                    <meta property="og:image:alt" content="Download ${shareInfo.fileName} über xchange">
                    <meta property="og:site_name" content="xchange">
                    <meta property="og:locale" content="de_DE">
                    
                    <!-- WhatsApp spezifische Meta Tags -->
                    <meta name="theme-color" content="#688db1">
                    <meta name="apple-mobile-web-app-capable" content="yes">
                    <meta name="apple-mobile-web-app-status-bar-style" content="default">
                    <meta name="application-name" content="xchange">
                    <meta name="mobile-web-app-capable" content="yes">
                    
                    <!-- Twitter Card Meta Tags -->
                    <meta name="twitter:card" content="summary_large_image">
                    <meta name="twitter:title" content="📥 ${shareInfo.fileName}">
                    <meta name="twitter:description" content="Datei herunterladen (${fileSize}) - Verfügbar über xchange">
                    <meta name="twitter:image" content="${protocol}://${host}${API_PREFIX}/thumbnail/${shareId}">
                    <meta name="twitter:image:alt" content="xchange Download - ${shareInfo.fileName}">
                    
                    <!-- Zusätzliche Meta Tags für bessere Kompatibilität -->
                    <meta name="description" content="Download ${shareInfo.fileName} (${fileSize}) über xchange - Sicher und einfach">
                    <meta name="author" content="xchange - File Sharing">
                    <meta name="robots" content="noindex, nofollow">
                    
                    <!-- Preload für bessere Performance -->
                    <link rel="preload" href="${protocol}://${host}${API_PREFIX}/thumbnail/${shareId}" as="image" type="image/png">
                    
                    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⬇️</text></svg>">
                    <style>
                        :root {
                            --background-dark: #2B2E3B;
                            --background-darker: #252830;
                            --card-background: #343845;
                            --accent-blue: #688db1;
                            --accent-green: #9cb68f;
                            --text-primary: #d1d5db;
                            --text-secondary: #9ca3af;
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
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            padding: 20px;
                            position: relative;
                        }
                        
                        .download-container {
                            background-color: var(--card-background);
                            border-radius: var(--radius-lg);
                            width: 100%;
                            max-width: 500px;
                            box-shadow: var(--shadow);
                            overflow: hidden;
                            margin-bottom: 60px;
                        }
                        
                        .download-header {
                            background-color: var(--background-darker);
                            padding: 20px;
                            text-align: center;
                        }
                        
                        .download-content {
                            padding: 30px;
                            text-align: center;
                        }
                        
                        .file-icon {
                            font-size: 64px;
                            color: var(--accent-blue);
                            margin-bottom: 15px;
                        }
                        
                        .file-name {
                            font-size: 20px;
                            margin-bottom: 5px;
                            word-break: break-word;
                        }
                        
                        .file-info {
                            color: var(--text-secondary);
                            margin-bottom: 20px;
                        }
                        
                        .download-btn {
                            display: inline-block;
                            background-color: var(--accent-blue);
                            color: var(--text-primary);
                            text-decoration: none;
                            padding: 12px 24px;
                            border-radius: var(--radius);
                            font-size: 16px;
                            margin-top: 10px;
                            transition: background-color 0.3s;
                        }
                        
                        .download-btn:hover {
                            background-color: #5a7a9a;
                        }
                        
                        .expiry-info {
                            margin-top: 20px;
                            font-size: 14px;
                            color: var(--text-secondary);
                        }
                        
                        .powered-by {
                            text-align: center;
                            font-size: 12px;
                            color: var(--text-secondary);
                            opacity: 0.7;
                            position: absolute;
                            bottom: 20px;
                            left: 0;
                            width: 100%;
                        }
                    </style>
                    <link href="https://cdnjs.cloudflare.com/ajax/libs/material-design-icons/3.0.1/iconfont/material-icons.min.css"
                          rel="stylesheet">
                </head>
                <body>
                    <div class="download-container">
                        <div class="download-header">
                            <h1>xchange | Datei-Download</h1>
                        </div>
                        <div class="download-content">
                            <div class="file-icon">
                                <i class="material-icons">insert_drive_file</i>
                            </div>
                            <h2 class="file-name">${shareInfo.fileName}</h2>
                            <div class="file-info">${fileSize}</div>
                            
                            <a href="${API_PREFIX}/share/${shareId}?dl=1" class="download-btn">
                                <i class="material-icons" style="vertical-align: middle; margin-right: 5px;">file_download</i>
                                Download starten
                            </a>
                            
                            <div class="expiry-info">
                                ${expiryInfo}
                            </div>
                        </div>
                    </div>
                    <div class="powered-by">
                        Made with ❤️ by Martin Pfeffer
                    </div>
                </body>
                </html>
            `);
        }

        // Content-Type und Content-Disposition Header setzen für bessere Link-Vorschauen
        res.setHeader('Content-Type', shareInfo.fileType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${shareInfo.fileName}"`);
        
        // Datei zum Download anbieten
        res.download(filePath, shareInfo.fileName, (err) => {
            if (err) {
                console.error('Fehler beim Herunterladen der geteilten Datei:', err);
                res.status(500).send('Fehler beim Herunterladen der Datei');
            }
        });
    } catch (error) {
        console.error('Fehler beim Verarbeiten des Share-Links:', error);
        res.status(500).send('Ein Serverfehler ist aufgetreten');
    }
});

// Thumbnail-Endpoint für WhatsApp-kompatible Link-Vorschauen
app.get(`${API_PREFIX}/thumbnail/:shareId`, (req, res) => {
    try {
        const shareId = req.params.shareId;
        const shares = getSharesDb();

        // Überprüfen, ob der Share existiert
        if (!shares[shareId]) {
            return res.status(404).send('Share nicht gefunden');
        }

        const shareInfo = shares[shareId];

        // Überprüfen, ob der Share abgelaufen ist (nur wenn ein Ablaufdatum gesetzt ist)
        if (shareInfo.expires && new Date(shareInfo.expires) < new Date()) {
            // Abgelaufenen Share löschen
            delete shares[shareId];
            saveSharesDb(shares);
            return res.status(410).send('Share abgelaufen');
        }

        // PNG-Thumbnail mit Canvas generieren (WhatsApp optimiert: 1200x630)
        const canvas = createCanvas(1200, 630);
        const ctx = canvas.getContext('2d');

        // Hintergrund mit Gradient
        const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
        gradient.addColorStop(0, '#2B2E3B');
        gradient.addColorStop(1, '#343845');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 630);

        // Zentriertes Layout - Download-Emoji oben
        ctx.fillStyle = '#688db1';
        ctx.font = 'bold 200px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⬇️', 600, 220);

        // Dateiname zentriert unten (mehrzeilig wenn nötig)
        let fileName = shareInfo.fileName;
        ctx.fillStyle = '#d1d5db';
        ctx.font = 'bold 42px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Text wrapping für langen Dateinamen
        const maxWidth = 1000;
        const lineHeight = 50;
        let startY = 400;
        
        if (ctx.measureText(fileName).width > maxWidth) {
            // Text umbrechen
            const words = fileName.split(' ');
            let lines = [];
            let currentLine = '';
            
            for (let i = 0; i < words.length; i++) {
                const testLine = currentLine + words[i] + ' ';
                if (ctx.measureText(testLine).width > maxWidth && i > 0) {
                    lines.push(currentLine.trim());
                    currentLine = words[i] + ' ';
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine.trim()) {
                lines.push(currentLine.trim());
            }
            
            // Maximal 3 Zeilen anzeigen
            const maxLines = 3;
            if (lines.length > maxLines) {
                lines = lines.slice(0, maxLines - 1);
                lines.push(lines[lines.length - 1] + '...');
            }
            
            // Zentriert ausgeben
            const totalHeight = lines.length * lineHeight;
            let y = startY - (totalHeight / 2) + (lineHeight / 2);
            
            lines.forEach(line => {
                ctx.fillText(line, 600, y);
                y += lineHeight;
            });
        } else {
            ctx.fillText(fileName, 600, startY);
        }

        // Kleiner "xchange" Text unten
        ctx.fillStyle = '#9ca3af';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('xchange', 600, 600);

        // PNG als Buffer generieren
        const buffer = canvas.toBuffer('image/png');

        // Response Headers setzen
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 Stunde Cache
        res.send(buffer);

    } catch (error) {
        console.error('Fehler beim Generieren des Thumbnails:', error);
        
        // Fallback: WhatsApp optimierter SVG wenn Canvas fehlschlägt
        let fileName = shareInfo.fileName;
        if (fileName.length > 35) {
            fileName = fileName.substring(0, 32) + '...';
        }
        
        const svgFallback = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
            <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#2B2E3B;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#343845;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="1200" height="630" fill="url(#bg)"/>
            <text x="600" y="220" font-family="Arial" font-size="200" text-anchor="middle" fill="#688db1" font-weight="bold">⬇️</text>
            <text x="600" y="400" font-family="Arial" font-size="42" text-anchor="middle" fill="#d1d5db" font-weight="bold">${fileName}</text>
            <text x="600" y="600" font-family="Arial" font-size="24" text-anchor="middle" fill="#9ca3af">xchange</text>
        </svg>`;
        
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(svgFallback);
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