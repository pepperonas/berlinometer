# Raspberry Pi Setup - Yamaha Receiver Control

Dieses Dokument beschreibt die Installation der Yamaha Receiver Control App auf einem Raspberry Pi.

## 📋 Voraussetzungen

### Raspberry Pi Vorbereitung
```bash
# 1. System aktualisieren
sudo apt update && sudo apt upgrade -y

# 2. Node.js installieren (Version 18.x LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. PM2 global installieren
sudo npm install -g pm2

# 4. SSH aktivieren (falls nicht aktiv)
sudo systemctl enable ssh
sudo systemctl start ssh
```

## 🚀 Automatische Installation

### Option 1: Von Ihrem Computer aus deployen

1. **IP-Adresse Ihres Raspberry Pi finden:**
   ```bash
   # Auf dem Raspberry Pi:
   hostname -I
   ```

2. **Dateien kopieren und deployen:**
   ```bash
   # Im yahama-amp Verzeichnis auf Ihrem Computer:
   ./copy-to-raspi.sh [RASPI_IP] [USERNAME]
   
   # Beispiel:
   ./copy-to-raspi.sh 192.168.1.100 pi
   ```

3. **SSH zum Raspberry Pi und Installation ausführen:**
   ```bash
   ssh pi@192.168.1.100
   cd ~/yamaha-amp
   ./deploy-raspi.sh
   ```

### Option 2: Direkt auf dem Raspberry Pi

1. **Dateien manuell kopieren oder Repository klonen**
2. **Deployment-Skript ausführen:**
   ```bash
   cd ~/yamaha-amp
   ./deploy-raspi.sh
   ```

## 🔧 Konfiguration

### Port-Einstellung
- **Standard-Port:** 5001 (da 5000 belegt ist)
- **Änderung:** In `server.js` oder `ecosystem.config.js`

### PM2 Konfiguration
```bash
# Status prüfen
pm2 status yamaha-amp

# Logs anzeigen
pm2 logs yamaha-amp

# App neustarten
pm2 restart yamaha-amp

# App stoppen
pm2 stop yamaha-amp

# App entfernen
pm2 delete yamaha-amp
```

### Systemd Service
```bash
# Service Status
sudo systemctl status yamaha-amp

# Service starten/stoppen
sudo systemctl start yamaha-amp
sudo systemctl stop yamaha-amp

# Service bei Boot aktivieren
sudo systemctl enable yamaha-amp
```

## 🌐 Zugriff

Nach erfolgreicher Installation ist die App erreichbar unter:

- **Lokal:** `http://localhost:5001`
- **Netzwerk:** `http://[RASPI_IP]:5001`
- **Advanced Version:** `http://[RASPI_IP]:5001/advanced`
- **Basic Version:** `http://[RASPI_IP]:5001/basic`

### API Endpoints
- **Health Check:** `http://[RASPI_IP]:5001/api/health`
- **System Info:** `http://[RASPI_IP]:5001/api/system`

## 📱 Verwendung

1. **Browser öffnen** und zur Raspberry Pi IP navigieren
2. **Yamaha Receiver IP eingeben** in der Verbindungsmaske
3. **"Verbinden" klicken** - die App fungiert als CORS Proxy
4. **Receiver steuern** über die Web-Oberfläche

## 🔧 Wartung

### Update der App
```bash
cd ~/yamaha-amp
./update.sh
```

### Backup erstellen
```bash
cd ~/yamaha-amp
./backup.sh
```

### Logs überwachen
```bash
# PM2 Logs (Live)
pm2 logs yamaha-amp --lines 50

# Systemd Logs
sudo journalctl -u yamaha-amp -f
```

## 🔒 Sicherheit

### Firewall (optional)
```bash
# UFW installieren und konfigurieren
sudo apt install ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 5001
sudo ufw enable
```

### Nginx Reverse Proxy (optional)
```bash
# Nginx installieren
sudo apt install nginx

# Site konfigurieren
sudo nano /etc/nginx/sites-available/yamaha-app
```

```nginx
server {
    listen 80;
    server_name your-raspi-hostname;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Site aktivieren
sudo ln -s /etc/nginx/sites-available/yamaha-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🐛 Troubleshooting

### Häufige Probleme

1. **Port 5001 belegt:**
   ```bash
   # Port prüfen
   sudo netstat -tlnp | grep :5001
   
   # Anderen Port in ecosystem.config.js verwenden
   ```

2. **PM2 startet nicht automatisch:**
   ```bash
   # PM2 Startup neu konfigurieren
   pm2 unstartup
   pm2 startup
   pm2 save
   ```

3. **CORS Fehler:**
   - Server läuft nicht → `pm2 status`
   - Firewall blockiert → Port 5001 freigeben
   - Falsche IP → Health Check testen

4. **Yamaha Receiver nicht erreichbar:**
   - Receiver und Raspberry Pi im gleichen Netzwerk?
   - Receiver IP korrekt?
   - Receiver eingeschaltet?

### Log-Dateien
```bash
# PM2 Logs
tail -f ~/yamaha-amp/logs/combined.log

# System Logs
sudo journalctl -u yamaha-amp -f

# Nginx Logs (falls verwendet)
sudo tail -f /var/log/nginx/error.log
```

## 📊 Performance

### Raspberry Pi Optimierung
```bash
# GPU Memory reduzieren (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Swap konfigurieren
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile  # CONF_SWAPSIZE=1024
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Node.js Optimierung
```javascript
// In ecosystem.config.js
max_memory_restart: '512M',  // Für Pi Zero
max_memory_restart: '1G',    // Für Pi 3/4
```

## 🎯 Features auf Raspberry Pi

- ✅ Vollständige Yamaha Receiver Kontrolle
- ✅ Web-Interface mit Dark Theme
- ✅ CORS Proxy für Browser-Zugriff
- ✅ PM2 Process Management
- ✅ Systemd Service Integration
- ✅ Auto-Start bei Boot
- ✅ Logging und Monitoring
- ✅ Update und Backup Skripte

## 💡 Tipps

1. **Statische IP:** Konfigurieren Sie eine statische IP für den Raspberry Pi
2. **mDNS:** `sudo apt install avahi-daemon` für `http://raspberrypi.local:5001`
3. **Bookmarks:** Speichern Sie die URL als Bookmark auf Ihren Geräten
4. **Mobile:** Die App ist responsive und funktioniert auf Smartphones/Tablets

---

🎵 **Viel Spaß mit Ihrer Yamaha Receiver Control App auf dem Raspberry Pi!**