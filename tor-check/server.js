const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3010;

// Middleware für JSON und statische Dateien
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// GeoIP-Lookup über externe API
async function getLocationData(ip) {
    try {
        // Entferne lokale/private IPs
        if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
            return {
                ip,
                country: 'Local',
                city: 'Localhost',
                region: 'Local Network',
                org: 'Local',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                lat: null,
                lon: null,
                isTor: false
            };
        }

        const fetch = require('node-fetch');
        
        // Nutze ip-api.com für kostenlose GeoIP-Daten
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`, {
            timeout: 5000
        });
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.status === 'success') {
                // Einfache Tor-Erkennung basierend auf ISP/Org
                const isTorLikely = data.org && (
                    data.org.toLowerCase().includes('tor') ||
                    data.org.toLowerCase().includes('onion') ||
                    data.org.toLowerCase().includes('relay') ||
                    data.isp.toLowerCase().includes('tor')
                );

                return {
                    ip: data.query,
                    country: data.country,
                    countryCode: data.countryCode,
                    city: data.city,
                    region: data.regionName,
                    org: data.org || data.isp,
                    timezone: data.timezone,
                    lat: data.lat,
                    lon: data.lon,
                    isTor: isTorLikely
                };
            }
        }
        
        // Fallback bei Fehler
        return {
            ip,
            country: 'Unknown',
            city: 'Unknown', 
            region: 'Unknown',
            org: 'Unknown',
            timezone: 'Unknown',
            lat: null,
            lon: null,
            isTor: false
        };
        
    } catch (error) {
        console.error('GeoIP Lookup Fehler:', error);
        return {
            ip,
            country: 'Error',
            city: 'Error',
            region: 'Error', 
            org: 'Error',
            timezone: 'Unknown',
            lat: null,
            lon: null,
            isTor: false
        };
    }
}

// Enhanced Logging-Funktion mit Location-Tracking
async function logRequest(req, additionalInfo = {}) {
    const timestamp = new Date().toISOString();
    // Korrekte IP-Erkennung durch Nginx Reverse Proxy
    const clientIP = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
    
    // Hole Location-Daten für die IP (async, aber blockiert nicht die Response)
    let locationData = null;
    try {
        locationData = await getLocationData(clientIP);
    } catch (error) {
        console.error('Location lookup failed:', error);
    }

    const logEntry = {
        timestamp,
        ip: clientIP,
        location: locationData,
        forwardedFor: req.headers['x-forwarded-for'],
        realIP: req.headers['x-real-ip'],
        userAgent: req.headers['user-agent'],
        method: req.method,
        url: req.url,
        referer: req.headers['referer'],
        acceptLanguage: req.headers['accept-language'],
        headers: req.headers,
        query: req.query,
        body: req.body,
        connection: {
            encrypted: req.connection.encrypted,
            localAddress: req.connection.localAddress,
            localPort: req.connection.localPort,
            remoteAddress: req.connection.remoteAddress,
            remotePort: req.connection.remotePort
        },
        server: {
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch(),
            uptime: os.uptime()
        },
        sessionId: req.headers['x-session-id'] || `${clientIP}-${Date.now()}`,
        ...additionalInfo
    };

    // Log in Datei schreiben
    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }
    
    const logFile = path.join(logDir, `requests-${new Date().toISOString().split('T')[0]}.json`);
    
    try {
        let existingLogs = [];
        if (fs.existsSync(logFile)) {
            const content = fs.readFileSync(logFile, 'utf8');
            if (content.trim()) {
                existingLogs = JSON.parse(content);
            }
        }
        
        existingLogs.push(logEntry);
        fs.writeFileSync(logFile, JSON.stringify(existingLogs, null, 2));
        
        // Enhanced Console-Output mit Location
        const locationStr = locationData ? 
            `${locationData.city}, ${locationData.country}` : 
            'Unknown Location';
        console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${clientIP} (${locationStr}) - UA: ${req.headers['user-agent']?.substring(0, 50)}...`);
        
    } catch (error) {
        console.error('Fehler beim Schreiben des Logs:', error);
    }

    return logEntry;
}

// Synchrone Version für Middleware (ohne Location-Lookup)
function logRequestSync(req, additionalInfo = {}) {
    const timestamp = new Date().toISOString();
    const clientIP = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
    
    const logEntry = {
        timestamp,
        ip: clientIP,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ...additionalInfo
    };

    console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${clientIP}`);
    return logEntry;
}

// Middleware für Request-Logging (synchron, um Response-Zeit nicht zu beeinträchtigen)
app.use((req, res, next) => {
    req.logEntry = logRequestSync(req, {
        type: 'request',
        message: 'Eingehender Request'
    });
    
    // Async Location-Logging im Background
    logRequest(req, {
        type: 'request',
        message: 'Eingehender Request'
    }).catch(err => console.error('Background logging failed:', err));
    
    next();
});

// API-Endpunkt für detaillierte Client-Informationen
app.get('/api/client-info', (req, res) => {
    const clientInfo = {
        timestamp: new Date().toISOString(),
        ip: req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress,
        ips: {
            direct: req.connection.remoteAddress,
            forwarded: req.headers['x-forwarded-for'],
            realIP: req.headers['x-real-ip'],
            cfConnectingIP: req.headers['cf-connecting-ip']
        },
        headers: req.headers,
        connection: {
            encrypted: req.connection.encrypted,
            localAddress: req.connection.localAddress,
            localPort: req.connection.localPort,
            remoteAddress: req.connection.remoteAddress,
            remotePort: req.connection.remotePort
        },
        tor: {
            // Tor-Indikatoren basierend auf Headers und IP-Eigenschaften
            torBrowser: req.headers['user-agent']?.includes('Tor Browser'),
            suspiciousHeaders: checkSuspiciousHeaders(req.headers),
            possibleExitNode: checkPossibleExitNode(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress)
        },
        fingerprint: {
            userAgent: req.headers['user-agent'],
            acceptLanguage: req.headers['accept-language'],
            acceptEncoding: req.headers['accept-encoding'],
            acceptCharset: req.headers['accept-charset'],
            dnt: req.headers['dnt'],
            connection: req.headers['connection']
        }
    };

    // Log diese spezielle API-Anfrage
    logRequest(req, {
        type: 'client-info-api',
        clientInfo,
        message: 'Client-Info API Aufruf'
    });

    res.json(clientInfo);
});

// Proxy-Endpunkt für externe IP-Services (CORS-Lösung)
app.get('/api/ip-proxy/:service', async (req, res) => {
    const { service } = req.params;
    
    const services = {
        'ipify': 'https://api.ipify.org?format=json',
        'ipinfo': 'https://ipinfo.io/json',
        'ip-api': 'https://ip-api.com/json/',
        'jsonip': 'https://jsonip.com/',
        'httpbin': 'https://httpbin.org/ip',
        'tor-project': 'https://check.torproject.org/api/ip'
    };

    if (!services[service]) {
        return res.status(400).json({ error: 'Unknown service' });
    }

    try {
        const fetch = require('node-fetch');
        const response = await fetch(services[service], {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; TorCheck/1.0)',
                'Accept': 'application/json'
            },
            timeout: 10000
        });
        
        const data = await response.json();
        
        logRequest(req, {
            type: 'ip-proxy',
            service,
            data,
            message: `IP Proxy für ${service}`
        });

        res.json(data);
        
    } catch (error) {
        console.error(`IP Proxy Fehler für ${service}:`, error);
        res.status(500).json({ 
            error: `Service ${service} nicht erreichbar`,
            details: error.message 
        });
    }
});

// API-Endpunkt für GeoIP-Informationen (simuliert)
app.get('/api/geoip', async (req, res) => {
    try {
        const ip = req.ip || req.connection.remoteAddress;
        
        // Hier könntest du echte GeoIP-Services integrieren
        // Für Demo-Zwecke: Mock-Daten
        const geoInfo = {
            ip: ip,
            country: 'Unknown',
            city: 'Unknown',
            region: 'Unknown',
            org: 'Unknown',
            timezone: 'Unknown',
            isTor: false // Würde durch echte Tor-Exit-Node-Liste bestimmt
        };

        logRequest(req, {
            type: 'geoip-api',
            geoInfo,
            message: 'GeoIP API Aufruf'
        });

        res.json(geoInfo);
        
    } catch (error) {
        console.error('GeoIP Fehler:', error);
        res.status(500).json({ error: 'GeoIP Service Fehler' });
    }
});

// API-Endpunkt für Request-Logs (für Debug-Zwecke)
app.get('/api/logs', (req, res) => {
    try {
        const logDir = path.join(__dirname, 'logs');
        const today = new Date().toISOString().split('T')[0];
        const logFile = path.join(logDir, `requests-${today}.json`);
        
        if (fs.existsSync(logFile)) {
            const logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
            
            // Nur die letzten 50 Einträge zurückgeben
            const recentLogs = logs.slice(-50);
            
            res.json({
                count: logs.length,
                recent: recentLogs,
                file: `requests-${today}.json`
            });
        } else {
            res.json({
                count: 0,
                recent: [],
                message: 'Keine Logs für heute gefunden'
            });
        }
        
    } catch (error) {
        console.error('Fehler beim Laden der Logs:', error);
        res.status(500).json({ error: 'Logs konnten nicht geladen werden' });
    }
});

// API-Endpunkt für Location-Statistiken
app.get('/api/locations', (req, res) => {
    try {
        const logDir = path.join(__dirname, 'logs');
        const today = new Date().toISOString().split('T')[0];
        const logFile = path.join(logDir, `requests-${today}.json`);
        
        if (!fs.existsSync(logFile)) {
            return res.json({
                totalRequests: 0,
                uniqueVisitors: 0,
                locations: [],
                countries: {},
                cities: {},
                torRequests: 0
            });
        }

        const logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        const locationStats = {
            totalRequests: logs.length,
            uniqueVisitors: new Set(),
            locations: [],
            countries: {},
            cities: {},
            torRequests: 0,
            recentVisitors: []
        };

        // Analysiere alle Logs mit Location-Daten
        logs.forEach(log => {
            if (log.location) {
                const loc = log.location;
                
                // Unique Visitors (basierend auf IP)
                locationStats.uniqueVisitors.add(log.ip);
                
                // Tor-Requests zählen
                if (loc.isTor) {
                    locationStats.torRequests++;
                }
                
                // Länder-Statistiken
                if (loc.country && loc.country !== 'Unknown') {
                    locationStats.countries[loc.country] = (locationStats.countries[loc.country] || 0) + 1;
                }
                
                // Städte-Statistiken
                if (loc.city && loc.city !== 'Unknown') {
                    const cityKey = `${loc.city}, ${loc.country}`;
                    locationStats.cities[cityKey] = (locationStats.cities[cityKey] || 0) + 1;
                }
                
                // Detaillierte Location-Liste (nur unique IPs, letzte 100)
                if (!locationStats.locations.find(l => l.ip === log.ip)) {
                    locationStats.locations.push({
                        ip: log.ip,
                        country: loc.country,
                        city: loc.city,
                        region: loc.region,
                        org: loc.org,
                        isTor: loc.isTor,
                        lat: loc.lat,
                        lon: loc.lon,
                        firstSeen: log.timestamp,
                        lastSeen: log.timestamp,
                        requestCount: 1
                    });
                } else {
                    // Update lastSeen und requestCount für bekannte IPs
                    const existing = locationStats.locations.find(l => l.ip === log.ip);
                    existing.lastSeen = log.timestamp;
                    existing.requestCount++;
                }
            }
        });

        // Recent visitors (letzte 20, nach Zeit sortiert)
        locationStats.recentVisitors = locationStats.locations
            .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))
            .slice(0, 20);

        locationStats.uniqueVisitors = locationStats.uniqueVisitors.size;
        
        // Locations begrenzen (Performance)
        locationStats.locations = locationStats.locations.slice(-100);

        res.json(locationStats);
        
    } catch (error) {
        console.error('Fehler beim Laden der Location-Statistiken:', error);
        res.status(500).json({ error: 'Location-Statistiken konnten nicht geladen werden' });
    }
});

// API-Endpunkt für Live-Visitor-Map-Daten
app.get('/api/visitor-map', (req, res) => {
    try {
        const logDir = path.join(__dirname, 'logs');
        const today = new Date().toISOString().split('T')[0];
        const logFile = path.join(logDir, `requests-${today}.json`);
        
        if (!fs.existsSync(logFile)) {
            return res.json({ visitors: [] });
        }

        const logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        const visitorMap = {};
        
        // Nur Logs der letzten 2 Stunden für "Live"-Ansicht
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        
        logs.forEach(log => {
            if (log.location && new Date(log.timestamp) > twoHoursAgo) {
                const loc = log.location;
                if (loc.lat && loc.lon && loc.country !== 'Local') {
                    const key = `${log.ip}`;
                    
                    if (!visitorMap[key]) {
                        visitorMap[key] = {
                            ip: log.ip,
                            lat: loc.lat,
                            lon: loc.lon,
                            country: loc.country,
                            city: loc.city,
                            org: loc.org,
                            isTor: loc.isTor,
                            requestCount: 0,
                            lastSeen: log.timestamp
                        };
                    }
                    
                    visitorMap[key].requestCount++;
                    visitorMap[key].lastSeen = log.timestamp;
                }
            }
        });

        res.json({
            visitors: Object.values(visitorMap),
            generatedAt: new Date().toISOString(),
            timeWindow: '2 hours'
        });
        
    } catch (error) {
        console.error('Fehler beim Laden der Visitor-Map:', error);
        res.status(500).json({ error: 'Visitor-Map konnte nicht geladen werden' });
    }
});

// API-Endpunkt für Server-Status
app.get('/api/status', (req, res) => {
    const status = {
        timestamp: new Date().toISOString(),
        server: {
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch(),
            uptime: os.uptime(),
            loadavg: os.loadavg(),
            freemem: os.freemem(),
            totalmem: os.totalmem(),
            cpus: os.cpus().length
        },
        nodejs: {
            version: process.version,
            pid: process.pid,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
        },
        network: {
            interfaces: os.networkInterfaces()
        }
    };

    res.json(status);
});

// Hilfsfunktionen für Tor-Erkennung
function checkSuspiciousHeaders(headers) {
    const suspicious = [];
    
    // Tor Browser hat typische Header-Eigenschaften
    if (headers['user-agent']?.includes('Tor Browser')) {
        suspicious.push('Tor Browser User-Agent');
    }
    
    // Fehlende typische Browser-Headers
    if (!headers['accept-language']) {
        suspicious.push('Fehlender Accept-Language Header');
    }
    
    // Ungewöhnliche Kombinationen
    if (headers['dnt'] === '1' && !headers['accept-charset']) {
        suspicious.push('DNT ohne Accept-Charset (Tor-Browser typisch)');
    }
    
    return suspicious;
}

function checkPossibleExitNode(ip) {
    // Vereinfachte Exit-Node-Erkennung
    // In Produktion würdest du die echte Tor Exit-Node-Liste verwenden
    const torExitNodeRanges = [
        // Beispiel-Ranges (nicht vollständig!)
        '185.220.',
        '109.70.',
        '199.87.'
    ];
    
    return torExitNodeRanges.some(range => ip?.startsWith(range));
}

// Root-Route für die HTML-Seite
app.get('/', (req, res) => {
    logRequest(req, {
        type: 'homepage',
        message: 'Homepage-Aufruf'
    });
    
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 404-Handler
app.use('*', (req, res) => {
    logRequest(req, {
        type: '404',
        message: '404 - Seite nicht gefunden'
    });
    
    res.status(404).json({
        error: 'Seite nicht gefunden',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

// Error-Handler
app.use((err, req, res, next) => {
    console.error('Server-Fehler:', err);
    
    logRequest(req, {
        type: 'error',
        error: err.message,
        stack: err.stack,
        message: 'Server-Fehler aufgetreten'
    });
    
    res.status(500).json({
        error: 'Interner Server-Fehler',
        timestamp: new Date().toISOString()
    });
});

// Server starten
app.listen(PORT, () => {
    console.log(`🔒 Tor-Check Server läuft auf Port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    console.log(`🔍 API-Endpunkte verfügbar:`);
    console.log(`   - GET /api/client-info - Detaillierte Client-Informationen`);
    console.log(`   - GET /api/geoip - GeoIP-Informationen`);
    console.log(`   - GET /api/logs - Request-Logs einsehen`);
    console.log(`   - GET /api/status - Server-Status`);
    console.log(`📁 Logs werden gespeichert in: ./logs/`);
});

module.exports = app;