# HandwerkOS ERP - Production Deployment Guide

Eine vollständige Anleitung für das Deployment des HandwerkOS ERP-Systems auf Ihrem VPS.

## 🚀 Schnelles Deployment

```bash
# 1. Klonen Sie das Repository auf Ihren lokalen Computer
git clone <your-repo> handwerkos-erp
cd handwerkos-erp

# 2. Konfigurieren Sie die Production Environment
cp .env.prod.example .env.prod
# Bearbeiten Sie .env.prod und füllen Sie alle sicheren Passwörter aus

# 3. Starten Sie das vollständige Deployment
./deploy.sh full
```

## 📋 Voraussetzungen

### Lokaler Computer
- Docker und Docker Compose
- SSH-Zugang zu Ihrem VPS
- Git

### VPS Server (mrx3k1.de)
- Ubuntu 20.04+ oder Debian 11+
- Mindestens 2GB RAM, 2 CPU Cores
- 20GB freier Speicherplatz
- Root-Zugang
- Domain `erp.mrx3k1.de` zeigt auf Server-IP

## 🔧 Detaillierte Konfiguration

### 1. Environment-Variablen (.env.prod)

**WICHTIG**: Ändern Sie alle Standard-Passwörter!

```bash
# Sichere Passwörter generieren
openssl rand -base64 32  # Für JWT_SECRET
openssl rand -base64 32  # Für JWT_REFRESH_SECRET
openssl rand -base64 32  # Für SESSION_SECRET
openssl rand -base64 32  # Für POSTGRES_PASSWORD
openssl rand -base64 32  # Für REDIS_PASSWORD
openssl rand -base64 32  # Für MINIO_ROOT_PASSWORD
```

### 2. SMTP-Konfiguration

Für E-Mail-Funktionalität:

```env
SMTP_HOST=mail.mrx3k1.de
SMTP_PORT=587
SMTP_USER=noreply@mrx3k1.de
SMTP_PASSWORD=IHR_EMAIL_PASSWORT
SMTP_FROM_EMAIL=noreply@erp.mrx3k1.de
SMTP_FROM_NAME=HandwerkOS
```

### 3. DNS-Konfiguration

Stellen Sie sicher, dass `erp.mrx3k1.de` auf die IP-Adresse Ihres VPS zeigt:

```bash
# Testen Sie die DNS-Auflösung
nslookup erp.mrx3k1.de
dig erp.mrx3k1.de
```

## 📂 Deployment-Schritte im Detail

### Schritt 1: Vorbereitung
```bash
# Lokale Dateien vorbereiten
./deploy.sh prepare
```

### Schritt 2: Dateien auf Server übertragen
```bash
# Dateien synchronisieren
./deploy.sh deploy
```

### Schritt 3: Server-Umgebung einrichten
```bash
# Server konfigurieren
./deploy.sh setup
```

### Schritt 4: SSL-Zertifikat einrichten
```bash
# Let's Encrypt SSL
./deploy.sh ssl
```

### Schritt 5: Services starten
```bash
# Alle Services starten
./deploy.sh start
```

### Schritt 6: Deployment verifizieren
```bash
# Testen der Installation
./deploy.sh verify
```

## 🐳 Docker Services

Das System verwendet folgende Docker-Container:

| Service | Port | Beschreibung |
|---------|------|--------------|
| postgres | 5432 | PostgreSQL Datenbank |
| redis | 6379 | Cache & Queue System |
| minio | 9000/9001 | S3-kompatible Datei-Speicherung |
| api | 3001 | Backend API (Fastify) |
| web | 3000 | Frontend (Next.js) |

## 🔄 PM2 Process Management

```bash
# SSH zum Server
ssh root@mrx3k1.de

# PM2 Status prüfen
pm2 status

# Logs ansehen
pm2 logs handwerkos-api
pm2 logs handwerkos-web
pm2 logs handwerkos-worker

# Services neustarten
pm2 restart handwerkos-api
pm2 restart handwerkos-web
pm2 restart all

# PM2 Monitoring (optional)
pm2 monit
```

## 🌐 Nginx Konfiguration

Die Nginx-Konfiguration bietet:

- **HTTPS-Weiterleitung** von HTTP
- **Rate Limiting** für API-Endpunkte
- **Security Headers** (HSTS, CSP, etc.)
- **Gzip-Komprimierung** für bessere Performance
- **Proxy Caching** für statische Assets
- **File Upload** Support (max. 10MB)

### Nginx-Befehle
```bash
# Konfiguration testen
nginx -t

# Nginx neuladen
systemctl reload nginx

# Status prüfen
systemctl status nginx

# Logs ansehen
tail -f /var/log/nginx/erp.mrx3k1.de.access.log
tail -f /var/log/nginx/erp.mrx3k1.de.error.log
```

## 🔒 SSL/HTTPS mit Let's Encrypt

### Automatische Erneuerung
Das System erneuert SSL-Zertifikate automatisch:
```bash
# Erneuerung testen
certbot renew --dry-run

# Manuelle Erneuerung
certbot renew --force-renewal

# Zertifikat-Info anzeigen
./scripts/ssl-setup.sh info
```

### SSL-Problembehebung
```bash
# SSL-Setup erneut ausführen
./scripts/ssl-setup.sh setup

# SSL-Konfiguration testen
./scripts/ssl-setup.sh verify

# Zertifikate sichern
./scripts/ssl-setup.sh backup
```

## 💾 Backup-System

### Automatische Backups
Backups werden täglich um 2:00 Uhr erstellt:

```bash
# Manueller Backup
./scripts/backup.sh

# Backup-Status prüfen
ls -la /var/www/handwerkos/backups/

# Backup-Test
./scripts/backup.sh test
```

### Backup-Inhalte
- **Datenbank**: PostgreSQL Dump (komprimiert)
- **Dateien**: Uploads, Logs, Konfigurationen
- **Storage**: MinIO/S3 Daten
- **SSL**: Let's Encrypt Zertifikate
- **Config**: Nginx, PM2, Crontab

### Restore aus Backup
```bash
# Datenbank wiederherstellen
gunzip -c /var/www/handwerkos/backups/handwerkos_db_TIMESTAMP.sql.gz | \
docker exec -i handwerkos_postgres_prod psql -U $POSTGRES_USER -d $POSTGRES_DB

# Dateien wiederherstellen
tar -xzf /var/www/handwerkos/backups/handwerkos_files_TIMESTAMP.tar.gz -C /var/www/handwerkos/
```

## 📊 Monitoring & Logs

### System Logs
```bash
# Application Logs
tail -f /var/www/handwerkos/logs/api/handwerkos-api.log
tail -f /var/www/handwerkos/logs/web/handwerkos-web.log

# Docker Logs
docker logs handwerkos_api_prod -f
docker logs handwerkos_web_prod -f
docker logs handwerkos_postgres_prod -f

# System Logs
journalctl -u nginx -f
journalctl -u docker -f
```

### Health Checks
```bash
# API Health
curl https://erp.mrx3k1.de/api/health

# Database Health
docker exec handwerkos_postgres_prod pg_isready -U handwerkos_prod

# Redis Health
docker exec handwerkos_redis_prod redis-cli ping

# MinIO Health
curl http://localhost:9000/minio/health/live
```

### Performance Monitoring
```bash
# System Resources
htop
df -h
free -h

# Docker Resources
docker stats

# Nginx Status
systemctl status nginx
```

## 🔧 Wartung & Updates

### Anwendungs-Update
```bash
# 1. Neuen Code pullen
git pull origin main

# 2. Re-deployment
./deploy.sh full

# Oder schrittweise:
./deploy.sh prepare
./deploy.sh deploy
./deploy.sh start
```

### System-Updates
```bash
# SSH zum Server
ssh root@mrx3k1.de

# System Updates
apt update && apt upgrade -y

# Docker Updates
apt update && apt install docker.io docker-compose

# Node.js Updates
npm update -g pm2

# Neustart falls erforderlich
reboot
```

### Datenbank-Wartung
```bash
# Datenbank-Statistiken aktualisieren
docker exec handwerkos_postgres_prod psql -U handwerkos_prod -d handwerkos_production -c "ANALYZE;"

# Vacuum (Speicher aufräumen)
docker exec handwerkos_postgres_prod psql -U handwerkos_prod -d handwerkos_production -c "VACUUM ANALYZE;"
```

## 🚨 Troubleshooting

### Häufige Probleme

#### 1. SSL-Zertifikat-Fehler
```bash
# SSL neu einrichten
./scripts/ssl-setup.sh setup

# Nginx-Konfiguration prüfen
nginx -t

# Let's Encrypt Logs prüfen
tail -f /var/log/letsencrypt/letsencrypt.log
```

#### 2. Database Connection Error
```bash
# Container-Status prüfen
docker ps | grep postgres

# Database-Logs prüfen
docker logs handwerkos_postgres_prod

# Connection testen
docker exec handwerkos_postgres_prod pg_isready -U handwerkos_prod
```

#### 3. API nicht erreichbar
```bash
# PM2 Status prüfen
pm2 status

# API-Logs prüfen
pm2 logs handwerkos-api

# Port prüfen
netstat -tulpn | grep 3001

# API direkt testen
curl http://localhost:3001/health
```

#### 4. Frontend lädt nicht
```bash
# Web-Service prüfen
pm2 logs handwerkos-web

# Build-Probleme
cd /var/www/handwerkos && npm run build

# Nginx-Proxy prüfen
curl -H "Host: erp.mrx3k1.de" http://localhost:3000
```

#### 5. Hohe Speicher-/CPU-Nutzung
```bash
# Resource-Verbrauch prüfen
htop
docker stats

# PM2 Memory Limits prüfen
pm2 show handwerkos-api

# Services neustarten
pm2 restart all
```

### Log-Analyse
```bash
# Fehler in Logs finden
grep -i error /var/www/handwerkos/logs/api/handwerkos-api.log
grep -i error /var/log/nginx/erp.mrx3k1.de.error.log

# Rate Limiting prüfen
grep "limiting requests" /var/log/nginx/erp.mrx3k1.de.error.log

# Performance-Probleme
grep "timeout" /var/log/nginx/erp.mrx3k1.de.error.log
```

## 📞 Support & Hilfe

### Wichtige Dateien
- **Logs**: `/var/www/handwerkos/logs/`
- **Backups**: `/var/www/handwerkos/backups/`
- **Nginx Config**: `/etc/nginx/sites-available/erp.mrx3k1.de.conf`
- **SSL Certs**: `/etc/letsencrypt/live/erp.mrx3k1.de/`
- **Environment**: `/var/www/handwerkos/.env.prod`

### Notfall-Kontakte
- **System Admin**: admin@mrx3k1.de
- **Support**: support@handwerkos.de

### System-Status URLs
- **Application**: https://erp.mrx3k1.de
- **API Health**: https://erp.mrx3k1.de/api/health
- **MinIO Console**: https://erp.mrx3k1.de/minio/ (Admin only)

---

## 🎉 Nach erfolgreichem Deployment

Ihr HandwerkOS ERP-System ist jetzt verfügbar unter:
**https://erp.mrx3k1.de**

### Erste Schritte:
1. **Registrieren** Sie das erste Unternehmen
2. **Testen** Sie die Rechnungs-Funktionen
3. **Konfigurieren** Sie SMTP für E-Mails
4. **Überwachen** Sie die Logs auf Fehler
5. **Planen** Sie regelmäßige Backups

**Viel Erfolg mit Ihrem neuen ERP-System! 🚀**