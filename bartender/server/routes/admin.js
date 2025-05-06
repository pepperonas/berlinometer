const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');

// Liste der erlaubten Skripte
const allowedScripts = [
  'seed-bar-data.js',
  'delete-bar-data.js',
  'reset-admin.js'
];

// Temporäre Datei für automatisierte Eingaben erstellen
const createTempInputScript = async (script, email) => {
  try {
    const tempDir = path.join(process.cwd(), 'temp');
    
    // Temporäres Verzeichnis erstellen, falls es nicht existiert
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    const timestamp = Date.now();
    const originalScript = path.join(process.cwd(), script);
    const tempScriptPath = path.join(tempDir, `${path.basename(script, '.js')}_${timestamp}.js`);
    
    // Inhalt des Originalskripts lesen
    let scriptContent = fs.readFileSync(originalScript, 'utf8');
    
    if (script === 'seed-bar-data.js' || script === 'delete-bar-data.js') {
      // Modifizierte Version erstellen, die keine Benutzereingabe benötigt
      scriptContent = scriptContent.replace(
        'const email = await askForEmail();',
        `const email = '${email}'; // Automatisch eingefügt`
      );
      
      // Auch die Bestätigungsabfrage überspringen
      scriptContent = scriptContent.replace(
        'const confirm = await confirmDataCreation();',
        'const confirm = true; // Automatisch bestätigt'
      );
      
      scriptContent = scriptContent.replace(
        'const confirm = await confirmDataDeletion();',
        'const confirm = true; // Automatisch bestätigt'
      );
    }
    
    // Temporäre Datei schreiben
    fs.writeFileSync(tempScriptPath, scriptContent);
    
    return tempScriptPath;
  } catch (error) {
    console.error('Fehler beim Erstellen des temporären Skripts:', error);
    throw error;
  }
};

// Temporäre Dateien aufräumen
const cleanupTempFiles = () => {
  const tempDir = path.join(process.cwd(), 'temp');
  if (fs.existsSync(tempDir)) {
    fs.readdirSync(tempDir).forEach(file => {
      // Lösche nur Dateien, die älter als 1 Stunde sind
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      const fileAge = (Date.now() - stats.mtimeMs) / 1000 / 60 / 60; // Alter in Stunden
      
      if (fileAge > 1) {
        fs.unlinkSync(filePath);
      }
    });
  }
};

// @route   GET /api/admin/users
// @desc    Gibt eine Liste aller Benutzer zurück
// @access  Private/Admin
router.get('/users', protect, async (req, res) => {
  try {
    // Debug-Informationen
    console.log('Admin/users route accessed by:', req.user ? {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    } : 'No user in request');
    
    // Erweiterte Fehlerprüfung
    if (!req.user) {
      console.log('No user object in request');
      return res.status(401).json({
        success: false,
        error: 'Nicht autorisiert, Benutzerinformationen fehlen im Request'
      });
    }
    
    // Wir umgehen hier die Rollenprüfung und nutzen nur die E-Mail
    // Dies ist für den speziellen Fall, dass der Benutzer nicht die Admin-Rolle hat
    if (req.user.email !== 'martin.pfeffer@celox.io') {
      console.log(`User ${req.user.email} hat keine Berechtigung - role: ${req.user.role}`);
      return res.status(403).json({
        success: false,
        error: `Keine Berechtigung zum Abrufen der Benutzerliste (${req.user.email})`
      });
    }
    
    // Direkt aus mongoose-Modell abrufen, falls möglich
    const User = require('../models/User');
    const users = await User.find().select('-password');
    
    console.log(`Benutzerabfrage erfolgreich - ${users.length} Benutzer gefunden`);
    
    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (err) {
    console.error('Fehler beim Abrufen der Benutzer:', err);
    res.status(500).json({
      success: false,
      error: 'Serverfehler beim Abrufen der Benutzer: ' + err.message
    });
  }
});

// @route   POST /api/admin/run-script
// @desc    Führt ein System-Skript aus
// @access  Private/Admin
router.post('/run-script', protect, authorize('admin'), async (req, res) => {
  try {
    const { script, email } = req.body;
    
    console.log('Run-Script-Anfrage:', { script, email, user: req.user.email });
    
    // Vergewissern, dass nur erlaubte Skripte ausgeführt werden können
    if (!allowedScripts.includes(script)) {
      return res.status(400).json({
        success: false,
        error: `Unerlaubtes Skript: ${script}`
      });
    }
    
    // Nur für Benutzer mit bestimmter E-Mail erlauben (Zusätzliche Sicherheitsmaßnahme)
    if (req.user.email !== 'martin.pfeffer@celox.io') {
      return res.status(403).json({
        success: false,
        error: `Keine Berechtigung zum Ausführen von Skripten (${req.user.email})`
      });
    }
    
    // Für Skripte, die eine E-Mail-Adresse benötigen, diese überprüfen
    if ((script === 'seed-bar-data.js' || script === 'delete-bar-data.js') && !email) {
      return res.status(400).json({
        success: false,
        error: 'Für dieses Skript wird eine E-Mail-Adresse benötigt'
      });
    }
    
    // Definiere das Basisverzeichnis für Skripte
    // Auf dem VPS ist möglicherweise ein anderes Verzeichnis erforderlich
    const isProduction = process.env.NODE_ENV === 'production';
    let baseDir = process.cwd();
    
    // Für Produktionsumgebung, prüfe mögliche alternative Verzeichnisse
    if (isProduction) {
      // Liste von möglichen Verzeichnissen, in denen die Skripte liegen könnten
      const possiblePaths = [
        process.cwd(),
        '/var/www/bartender',
        '/var/www/html/bartender',
        '/opt/bartender',
        '/home/mrx3k1/bartender'
      ];
      
      // Finde das erste existierende Verzeichnis, das die Skripte enthält
      for (const dir of possiblePaths) {
        const scriptPathTest = path.join(dir, script);
        if (fs.existsSync(scriptPathTest)) {
          baseDir = dir;
          console.log(`Skript gefunden in Verzeichnis: ${baseDir}`);
          break;
        }
      }
    }

    console.log(`Verwende Basisverzeichnis: ${baseDir}`);
    
    // Skript ausführen mit modifiziertem Skript, falls nötig
    let scriptPath;
    
    try {
      // Temporäres Verzeichnis für dieses Basisverzeichnis erstellen, falls nötig
      const tempDir = path.join(baseDir, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
        console.log(`Temporäres Verzeichnis erstellt: ${tempDir}`);
      }
      
      // Alte temporäre Dateien bereinigen
      cleanupTempFiles();
      
      // Originaler Skriptpfad
      const originalScriptPath = path.join(baseDir, script);
      
      // Prüfen, ob das Skript existiert
      if (!fs.existsSync(originalScriptPath)) {
        console.error(`Skript nicht gefunden: ${originalScriptPath}`);
        return res.status(404).json({
          success: false,
          error: `Skript nicht gefunden: ${script}. Verfügbare Pfade wurden überprüft.`,
          checkedPaths: possiblePaths
        });
      }
      
      if (script === 'seed-bar-data.js' || script === 'delete-bar-data.js') {
        // Modifizierte Version des Skripts erstellen
        const timestamp = Date.now();
        const tempScriptPath = path.join(tempDir, `${path.basename(script, '.js')}_${timestamp}.js`);
        
        // Inhalt des Originalskripts lesen
        let scriptContent = fs.readFileSync(originalScriptPath, 'utf8');
        
        // Modifizierte Version erstellen, die keine Benutzereingabe benötigt
        scriptContent = scriptContent.replace(
          'const email = await askForEmail();',
          `const email = '${email}'; // Automatisch eingefügt`
        );
        
        // Auch die Bestätigungsabfrage überspringen
        scriptContent = scriptContent.replace(
          'const confirm = await confirmDataCreation();',
          'const confirm = true; // Automatisch bestätigt'
        );
        
        scriptContent = scriptContent.replace(
          'const confirm = await confirmDataDeletion();',
          'const confirm = true; // Automatisch bestätigt'
        );
        
        // Temporäre Datei schreiben
        fs.writeFileSync(tempScriptPath, scriptContent);
        console.log(`Temporäres Skript erstellt: ${tempScriptPath}`);
        
        scriptPath = tempScriptPath;
      } else {
        // Originales Skript verwenden
        scriptPath = originalScriptPath;
      }
      
      console.log(`Führe Skript aus: ${scriptPath}`);
      
      // Prüfen, ob die Berechtigungen für die Ausführung des Skripts ausreichen
      try {
        fs.accessSync(scriptPath, fs.constants.R_OK);
      } catch (accessErr) {
        console.error(`Keine Leseberechtigung für das Skript: ${scriptPath}`, accessErr);
        return res.status(403).json({
          success: false,
          error: `Keine Leseberechtigung für das Skript: ${scriptPath}`
        });
      }
      
      // Rückgabe-Array für die Ausgabe
      let scriptOutput = [];
      let scriptError = [];
      
      // Skript als separaten Prozess starten
      const childProcess = spawn('node', [scriptPath], { 
        timeout: 120000,
        // Umgebungsvariablen übergeben
        env: process.env
      });
      
      // Ausgaben sammeln
      childProcess.stdout.on('data', (data) => {
        console.log(`Skript-Ausgabe: ${data}`);
        scriptOutput.push(data.toString());
      });
      
      childProcess.stderr.on('data', (data) => {
        console.error(`Skript-Fehler: ${data}`);
        scriptError.push(data.toString());
      });
      
      // Auf Abschluss warten
      childProcess.on('close', (code) => {
        console.log(`Skript beendet mit Code ${code}`);
        
        if (code !== 0) {
          return res.status(500).json({
            success: false,
            error: `Skript beendet mit Fehlercode: ${code}`,
            details: scriptError.join('')
          });
        }
        
        res.status(200).json({
          success: true,
          output: scriptOutput.join('')
        });
      });
      
      // Fehlerbehandlung
      childProcess.on('error', (err) => {
        console.error(`Fehler beim Ausführen des Skripts: ${err}`);
        res.status(500).json({
          success: false,
          error: `Fehler beim Ausführen des Skripts: ${err.message}`
        });
      });
    } catch (scriptErr) {
      console.error('Fehler beim Vorbereiten oder Ausführen des Skripts:', scriptErr);
      res.status(500).json({
        success: false,
        error: `Fehler beim Vorbereiten des Skripts: ${scriptErr.message}`
      });
    }
  } catch (err) {
    console.error('Fehler bei der Skriptausführung:', err);
    res.status(500).json({
      success: false,
      error: 'Serverfehler bei der Skriptausführung'
    });
  }
});

module.exports = router;