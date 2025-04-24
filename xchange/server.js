const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 5009;

// Speicherpfad für Dateien
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(__dirname, 'files.json');

// Verzeichnis erstellen, falls es nicht existiert
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Datenbank initialisieren, falls sie nicht existiert
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// Middleware
app.use(cors());
app.use(express.json());
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

// Routes

// Status-Endpoint
app.get(`${API_PREFIX}/status`, (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Dateien auflisten
app.get(`${API_PREFIX}/files`, (req, res) => {
    try {
        const files = getFilesDb();
        res.json({ success: true, files });
    } catch (error) {
        console.error('Fehler beim Auflisten der Dateien:', error);
        res.status(500).json({ success: false, message: 'Serverfehler beim Auflisten der Dateien' });
    }
});

// Datei hochladen
app.post(`${API_PREFIX}/upload`, (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ success: false, message: 'Keine Datei hochgeladen' });
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
                return res.status(500).json({ success: false, message: 'Fehler beim Speichern der Datei' });
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

            res.json({ success: true, fileId, message: 'Datei erfolgreich hochgeladen' });
        });
    } catch (error) {
        console.error('Fehler beim Datei-Upload:', error);
        res.status(500).json({ success: false, message: 'Serverfehler beim Hochladen der Datei' });
    }
});

// Datei herunterladen
app.get(`${API_PREFIX}/download/:id`, (req, res) => {
    try {
        const fileId = req.params.id;
        const files = getFilesDb();
        const fileInfo = files.find(file => file.id === fileId);

        if (!fileInfo) {
            return res.status(404).json({ success: false, message: 'Datei nicht gefunden' });
        }

        const filePath = path.join(UPLOAD_DIR, fileId);

        // Überprüfen, ob die Datei existiert
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'Datei existiert nicht mehr' });
        }

        // Datei zum Download anbieten
        res.download(filePath, fileInfo.name, (err) => {
            if (err) {
                console.error('Fehler beim Herunterladen der Datei:', err);
                res.status(500).json({ success: false, message: 'Fehler beim Herunterladen der Datei' });
            }
        });
    } catch (error) {
        console.error('Fehler beim Datei-Download:', error);
        res.status(500).json({ success: false, message: 'Serverfehler beim Herunterladen der Datei' });
    }
});

// Datei löschen
app.delete(`${API_PREFIX}/files/:id`, (req, res) => {
    try {
        const fileId = req.params.id;
        const files = getFilesDb();
        const fileIndex = files.findIndex(file => file.id === fileId);

        if (fileIndex === -1) {
            return res.status(404).json({ success: false, message: 'Datei nicht gefunden' });
        }

        const filePath = path.join(UPLOAD_DIR, fileId);

        // Datei aus dem Dateisystem löschen
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Datei aus der Datenbank entfernen
        files.splice(fileIndex, 1);
        saveFilesDb(files);

        res.json({ success: true, message: 'Datei erfolgreich gelöscht' });
    } catch (error) {
        console.error('Fehler beim Löschen der Datei:', error);
        res.status(500).json({ success: false, message: 'Serverfehler beim Löschen der Datei' });
    }
});

// Statische Dateien servieren (Frontend)
app.use(API_PREFIX, express.static(path.join(__dirname, 'public')));

// Startseite
app.get(API_PREFIX, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Server starten
app.listen(port, () => {
    console.log(`xchange API läuft auf http://localhost:${port}${API_PREFIX}`);
});