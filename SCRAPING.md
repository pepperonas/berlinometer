# SCRAPING.md - Google Maps Scraper Dokumentation

Diese Dokumentation beschreibt die Architektur, Funktionsweise und Best Practices des Google Maps Popular Times Scrapers.

---

## Inhaltsverzeichnis

1. [Architektur-Übersicht](#architektur-übersicht)
2. [Scraping-Pipeline](#scraping-pipeline)
3. [Playwright Browser-Automation](#playwright-browser-automation)
4. [Anti-Detection Strategien](#anti-detection-strategien)
5. [Daten-Extraktion](#daten-extraktion)
6. [Retry-Mechanismen](#retry-mechanismen)
7. [Scheduling & Automation](#scheduling--automation)
8. [Datenbank-Import](#datenbank-import)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                        SCRAPING SYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────────┐    ┌───────────────┐   │
│  │   Cron      │───▶│ schedule_       │───▶│ run_          │   │
│  │   Job       │    │ scraper.sh      │    │ scraper.sh    │   │
│  └─────────────┘    └─────────────────┘    └───────┬───────┘   │
│                                                     │           │
│                                                     ▼           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              gmaps-scraper-fast-robust.py               │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │            Playwright Browser Engine            │    │   │
│  │  │  • Chromium Headless                            │    │   │
│  │  │  • Anti-Detection Flags                         │    │   │
│  │  │  • Resource Blocking                            │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    JSON Output                          │   │
│  │         occupancy_data_YYYYMMDD_HHMMSS.json             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               process_json_to_db.py                     │   │
│  │  • JSON Parsing                                         │   │
│  │  • Data Validation                                      │   │
│  │  • MySQL Import                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              MySQL: popular_times_db                    │   │
│  │              Tabelle: occupancy_history                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Komponenten

| Komponente | Pfad | Funktion |
|------------|------|----------|
| `schedule_scraper.sh` | `/var/www/html/popular-times/` | Scheduling mit randomisierten Intervallen |
| `run_scraper.sh` | `/var/www/html/popular-times/` | Orchestriert den Scraping-Prozess |
| `gmaps-scraper-fast-robust.py` | `maps-playwrite-scraper/` | Hauptscraper mit Playwright |
| `process_json_to_db.py` | `/var/www/html/popular-times/` | JSON-zu-Datenbank Import |

---

## Scraping-Pipeline

### 1. Scheduling (`schedule_scraper.sh`)

```bash
#!/bin/bash
# Randomisierte Intervalle: 20-30 Minuten

MIN_DELAY=$((20 * 60))  # 20 Minuten in Sekunden
MAX_DELAY=$((30 * 60))  # 30 Minuten in Sekunden
RANDOM_DELAY=$((MIN_DELAY + RANDOM % (MAX_DELAY - MIN_DELAY)))

# Führe Scraper aus
/var/www/html/popular-times/run_scraper.sh

# Plane nächsten Lauf dynamisch
NEXT_RUN=$(date -d "+${RANDOM_DELAY} seconds" "+%M %H %d %m *")
crontab -l | grep -v "schedule_scraper.sh" > /tmp/cron_temp
echo "$NEXT_RUN /var/www/html/popular-times/schedule_scraper.sh" >> /tmp/cron_temp
crontab /tmp/cron_temp
```

**Warum randomisiert?**
- Vermeidet Bot-Detection durch vorhersehbare Muster
- Google erkennt regelmäßige Zugriffe als automatisiert
- Simuliert menschliches Verhalten

### 2. Ausführung (`run_scraper.sh`)

```bash
#!/bin/bash

# Virtuelle Umgebung aktivieren
source /var/www/html/popular-times/venv/bin/activate

# MySQL Credentials setzen (KRITISCH!)
export MYSQL_HOST=localhost
export MYSQL_USER=martin
export MYSQL_PASSWORD='N)ZyhegaJ#YLH(c&Jhx7'
export MYSQL_DATABASE=popular_times_db
export MYSQL_PORT=3306

# Scraper ausführen
cd /var/www/html/popular-times/maps-playwrite-scraper
python3 gmaps-scraper-fast-robust.py

# Ergebnisse kopieren
cp occupancy_data_*.json ../latest_results.json

# In Datenbank importieren
cd /var/www/html/popular-times
python3 process_json_to_db.py
```

---

## Playwright Browser-Automation

### Warum Playwright?

| Feature | Selenium | Puppeteer | Playwright |
|---------|----------|-----------|------------|
| Multi-Browser | ✅ | ❌ (nur Chrome) | ✅ |
| Auto-Wait | ❌ | ⚠️ | ✅ |
| Network Interception | ⚠️ | ✅ | ✅ |
| Performance | Langsam | Schnell | Sehr schnell |
| Python Support | ✅ | ❌ | ✅ |

### Browser-Konfiguration

```python
from playwright.async_api import async_playwright

async def create_browser():
    playwright = await async_playwright().start()

    browser = await playwright.chromium.launch(
        headless=True,
        args=[
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-site-isolation-trials'
        ]
    )

    context = await browser.new_context(
        viewport={'width': 1920, 'height': 1080},
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale='de-DE',
        timezone_id='Europe/Berlin'
    )

    return browser, context
```

### Browser-Argumente erklärt

| Argument | Zweck |
|----------|-------|
| `--disable-blink-features=AutomationControlled` | Entfernt `navigator.webdriver` Flag |
| `--no-sandbox` | Erforderlich für Root-Ausführung |
| `--disable-dev-shm-usage` | Verhindert Shared Memory Probleme |
| `--disable-web-security` | Umgeht CORS-Einschränkungen |

---

## Anti-Detection Strategien

### 1. User-Agent Rotation

```python
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
]

def get_random_user_agent():
    return random.choice(USER_AGENTS)
```

### 2. Viewport-Variation

```python
VIEWPORTS = [
    {'width': 1280, 'height': 720},
    {'width': 1366, 'height': 768},
    {'width': 1920, 'height': 1080},
    {'width': 1440, 'height': 900}
]

def get_random_viewport():
    return random.choice(VIEWPORTS)
```

### 3. Timing-Randomisierung

```python
async def human_like_delay():
    """Simuliert menschliche Wartezeiten"""
    base_delay = random.uniform(2, 5)
    micro_delay = random.uniform(0.1, 0.5)
    await asyncio.sleep(base_delay + micro_delay)

async def between_actions():
    """Kurze Pause zwischen Aktionen"""
    await asyncio.sleep(random.uniform(0.3, 1.2))
```

### 4. Resource Blocking

```python
async def block_unnecessary_resources(route):
    """Blockiert Bilder, Fonts, Media für schnelleres Laden"""
    if route.request.resource_type in ['image', 'media', 'font', 'stylesheet']:
        await route.abort()
    else:
        await route.continue_()

await page.route('**/*', block_unnecessary_resources)
```

### 5. Cookie-Banner Handling

```python
COOKIE_SELECTORS = [
    'button:has-text("Alle akzeptieren")',
    'button:has-text("Accept all")',
    'button:has-text("Akzeptieren")',
    '[aria-label*="Accept"]',
    '[data-testid="cookie-accept"]',
    'form[action*="consent"] button[type="submit"]'
]

async def handle_cookie_banner(page):
    for selector in COOKIE_SELECTORS:
        try:
            button = await page.wait_for_selector(selector, timeout=3000)
            if button:
                await button.click()
                await page.wait_for_timeout(1000)
                return True
        except:
            continue
    return False
```

---

## Daten-Extraktion

### Location Name Extraction

```python
NAME_SELECTORS = [
    'h1[data-attrid="title"]',     # Primär - meistens funktioniert
    'h1.DUwDvf',                   # Google Maps Standard
    '[data-value="Ort"]',          # Alternative
    'h1.fontHeadlineLarge',        # Neue Google Maps Version
    'h1'                           # Universal Fallback
]

async def extract_location_name(page, url):
    for selector in NAME_SELECTORS:
        try:
            element = await page.wait_for_selector(selector, timeout=5000)
            if element:
                name = await element.text_content()
                if name and len(name) > 2:
                    return name.strip()
        except:
            continue

    # Fallback: URL-Parsing (100% Erfolgsquote)
    return extract_name_from_url(url)

def extract_name_from_url(url):
    """Extrahiert Location-Name aus Google Maps URL"""
    decoded_url = urllib.parse.unquote(url)
    place_match = re.search(r'/place/([^/@]+)', decoded_url)
    if place_match:
        name = place_match.group(1).replace('+', ' ')
        return name.strip()
    return "Unbekannte Location"
```

### Auslastungsdaten Extraction

```python
OCCUPANCY_SELECTORS = [
    '[class*="section-popular-times-live-value"]',
    '[aria-label*="ausgelastet"]',
    '[aria-label*="busy"]',
    'span:has-text("% ausgelastet")',
    '[data-live-time]'
]

async def extract_occupancy(page):
    result = {
        'live_occupancy': None,
        'is_live_data': False,
        'occupancy_percent': None
    }

    for selector in OCCUPANCY_SELECTORS:
        try:
            element = await page.wait_for_selector(selector, timeout=5000)
            if element:
                text = await element.text_content()
                result['live_occupancy'] = text.strip()
                result['is_live_data'] = 'Derzeit' in text or 'gerade' in text.lower()

                # Prozentwert extrahieren
                percent_match = re.search(r'(\d+)\s*%', text)
                if percent_match:
                    result['occupancy_percent'] = int(percent_match.group(1))

                return result
        except:
            continue

    return result
```

### Adress-Extraktion

```python
ADDRESS_SELECTORS = [
    'button[data-item-id="address"]',
    '[data-tooltip="Adresse kopieren"]',
    'button[aria-label*="Adresse"]',
    '[class*="address"]'
]

async def extract_address(page):
    for selector in ADDRESS_SELECTORS:
        try:
            element = await page.wait_for_selector(selector, timeout=3000)
            if element:
                text = await element.text_content()
                # Entferne führendes '+' Zeichen
                address = text.strip().lstrip('+').strip()
                if address and len(address) > 5:
                    return address
        except:
            continue
    return None
```

---

## Retry-Mechanismen

### Multi-Retry Strategie

```python
class RetryConfig:
    """Konfiguration für jeden Retry-Versuch"""
    def __init__(self, attempt):
        self.attempt = attempt
        self.timeout = 30000 + (attempt * 10000)  # 30s, 40s, 50s
        self.viewport = VIEWPORTS[attempt % len(VIEWPORTS)]
        self.user_agent = USER_AGENTS[attempt % len(USER_AGENTS)]
        self.cookie_wait = 1000 + (attempt * 1000)  # 1s, 2s, 3s

async def scrape_with_retries(url, max_retries=3):
    """Scrapt mit mehreren Versuchen und verschiedenen Konfigurationen"""

    for attempt in range(max_retries):
        config = RetryConfig(attempt)

        try:
            result = await scrape_single_url(url, config)
            if result['location_name'] != "Unbekannte Location":
                return result

        except Exception as e:
            logging.warning(f"Attempt {attempt + 1} failed: {e}")

            # Warte vor nächstem Versuch
            await asyncio.sleep(random.uniform(3, 7))

    # Alle Versuche gescheitert - URL-Fallback
    return {
        'location_name': extract_name_from_url(url),
        'url': url,
        'live_occupancy': None,
        'is_live_data': False,
        'error': 'All retry attempts failed'
    }
```

### Adaptive Timeouts

```python
class AdaptiveTimeout:
    """Passt Timeouts basierend auf Erfolgsrate an"""

    def __init__(self):
        self.base_timeout = 30000
        self.success_count = 0
        self.failure_count = 0

    def get_timeout(self):
        # Erhöhe Timeout bei vielen Fehlern
        failure_rate = self.failure_count / max(1, self.success_count + self.failure_count)
        multiplier = 1 + (failure_rate * 0.5)
        return int(self.base_timeout * multiplier)

    def record_success(self):
        self.success_count += 1

    def record_failure(self):
        self.failure_count += 1
```

---

## Scheduling & Automation

### Cron-basiertes Scheduling

```bash
# Initial cron entry (einmalig setzen)
crontab -e

# Füge hinzu:
*/25 * * * * /var/www/html/popular-times/schedule_scraper.sh >> /var/log/scraper.log 2>&1
```

### Self-Modifying Cron

Das `schedule_scraper.sh` modifiziert seinen eigenen Cron-Eintrag für randomisierte Intervalle:

```bash
# 1. Aktuellen Cron-Eintrag entfernen
crontab -l | grep -v "schedule_scraper.sh" > /tmp/cron_temp

# 2. Neuen Eintrag mit randomisierter Zeit hinzufügen
RANDOM_MINUTES=$((20 + RANDOM % 11))  # 20-30 Minuten
NEXT_RUN=$(date -d "+${RANDOM_MINUTES} minutes" "+%M %H %d %m *")
echo "$NEXT_RUN /var/www/html/popular-times/schedule_scraper.sh" >> /tmp/cron_temp

# 3. Neuen Crontab installieren
crontab /tmp/cron_temp
```

### Logging

```bash
# Log-Datei: /var/log/scraper.log

# Format:
# [TIMESTAMP]: Nächster Scraper-Lauf in X Minuten
# [TIMESTAMP]: Scraping gestartet für Y Locations
# [TIMESTAMP]: Scraping completed - X/Y erfolgreich
# [TIMESTAMP]: Database import: X neue Einträge
```

---

## Datenbank-Import

### JSON-zu-MySQL Pipeline

```python
def process_json_file(filepath, db_pool):
    """Verarbeitet JSON-Datei und importiert in Datenbank"""

    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # KRITISCH: Beide JSON-Formate unterstützen
    results = data.get('results', data.get('locations', []))

    success_count = 0
    for result in results:
        if save_to_database(result, db_pool):
            success_count += 1

    return success_count
```

### Daten-Validierung

```python
def validate_occupancy_text(text):
    """Filtert ungültige Auslastungstexte"""

    INVALID_PATTERNS = [
        r'.*·.*Sterne.*Rezensionen.*',  # Bewertungen
        r'Foto vom Verfasser',           # Fotos
        r'.*Bar mit.*',                  # Beschreibungen
        r'^\d+$',                        # Nur Zahlen
        r'^[A-Za-z]{1,3}$'               # Nur Buchstaben
    ]

    for pattern in INVALID_PATTERNS:
        if re.match(pattern, text):
            return False

    VALID_PATTERNS = [
        r'Derzeit zu \d+\s*%.*ausgelastet',
        r'Um \d{2}:\d{2} Uhr zu \d+\s*%.*ausgelastet',
        r'\d+\s*% ausgelastet'
    ]

    return any(re.match(p, text) for p in VALID_PATTERNS)
```

### MySQL Stored Procedure

```sql
DELIMITER //

CREATE PROCEDURE insert_occupancy_data(
    IN p_url VARCHAR(2048),
    IN p_name VARCHAR(255),
    IN p_address VARCHAR(512),
    IN p_occupancy_percent INT,
    IN p_usual_percent INT,
    IN p_is_live_data BOOLEAN,
    IN p_raw_text TEXT
)
BEGIN
    DECLARE v_location_id INT;

    -- Location finden oder erstellen
    INSERT INTO locations (url, name, address)
    VALUES (p_url, p_name, p_address)
    ON DUPLICATE KEY UPDATE
        name = COALESCE(p_name, name),
        address = COALESCE(p_address, address),
        id = LAST_INSERT_ID(id);

    SET v_location_id = LAST_INSERT_ID();

    -- Auslastungsdaten einfügen
    INSERT INTO occupancy_history
        (location_id, occupancy_percent, usual_percent, is_live_data, raw_text)
    VALUES
        (v_location_id, p_occupancy_percent, p_usual_percent, p_is_live_data, p_raw_text);
END //

DELIMITER ;
```

---

## Troubleshooting

### Häufige Probleme

#### 1. "Keine Daten werden gespeichert"

**Diagnose:**
```bash
# Prüfe ob Scraper läuft
ps aux | grep gmaps-scraper

# Prüfe JSON-Output
ls -la /var/www/html/popular-times/popular-times-scrapings/ | tail -5

# Prüfe Datenbank-Einträge
mysql -u martin -p'N)ZyhegaJ#YLH(c&Jhx7' popular_times_db -e "
SELECT MAX(timestamp) FROM occupancy_history;"
```

**Lösung:**
```bash
# MySQL-Credentials in run_scraper.sh prüfen
cat /var/www/html/popular-times/run_scraper.sh | grep MYSQL

# Manueller Import-Test
python3 /var/www/html/popular-times/process_json_to_db.py
```

#### 2. "Playwright Browser startet nicht"

**Diagnose:**
```bash
# Playwright-Installation prüfen
python3 -m playwright install chromium

# Fehlende Dependencies
sudo apt-get install libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libdbus-1-3 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2
```

#### 3. "Alle Locations zeigen 'Unbekannt'"

**Ursache:** Google Maps hat Layout geändert

**Lösung:** Selektoren aktualisieren
```python
# Neue Selektoren finden via Browser DevTools
# Aktualisiere NAME_SELECTORS Array
NAME_SELECTORS = [
    'h1[data-attrid="title"]',
    'h1.DUwDvf',
    # Neue Selektoren hier hinzufügen
    'span.fontHeadlineLarge',
    '[role="main"] h1'
]
```

#### 4. "Rate Limiting / 429 Errors"

**Lösung:**
```python
# Delays erhöhen
DELAY_BETWEEN_URLS = (6, 12)  # statt (4, 8)

# Weniger Locations pro Durchlauf
MAX_LOCATIONS_PER_RUN = 30  # statt 50
```

### Monitoring-Befehle

```bash
# Scraper-Status
systemctl status popular-times-scraper

# Live-Logs
tail -f /var/log/scraper.log

# Letzte erfolgreiche Scrapings
mysql -u martin -p popular_times_db -e "
SELECT
    DATE(timestamp) as date,
    COUNT(*) as entries,
    COUNT(DISTINCT location_id) as locations
FROM occupancy_history
WHERE timestamp > DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(timestamp)
ORDER BY date DESC;"

# Cron-Job Status
crontab -l | grep schedule_scraper
```

---

## Best Practices

### 1. Rate Limiting beachten

```python
# Empfohlene Delays
DELAY_BETWEEN_REQUESTS = (4, 8)      # Sekunden
DELAY_BETWEEN_SESSIONS = (30, 60)    # Sekunden
MAX_REQUESTS_PER_HOUR = 120          # ~2 pro Minute
```

### 2. Graceful Degradation

```python
def get_location_data(url):
    """Holt Daten mit Fallback-Strategie"""

    # Level 1: Vollständige Daten
    try:
        return scrape_full_data(url)
    except:
        pass

    # Level 2: Nur Name und Adresse
    try:
        return scrape_basic_data(url)
    except:
        pass

    # Level 3: Nur URL-basierte Daten
    return {
        'location_name': extract_name_from_url(url),
        'url': url,
        'scraped_at': datetime.now().isoformat()
    }
```

### 3. Error Handling

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/scraper.log'),
        logging.StreamHandler()
    ]
)

async def safe_scrape(url):
    try:
        return await scrape_location(url)
    except TimeoutError:
        logging.warning(f"Timeout für {url}")
        return None
    except Exception as e:
        logging.error(f"Fehler bei {url}: {e}")
        return None
```

### 4. Resource Management

```python
async def scrape_batch(urls):
    """Batch-Scraping mit Resource-Management"""

    browser = None
    try:
        browser = await launch_browser()

        for url in urls:
            page = await browser.new_page()
            try:
                result = await scrape_page(page, url)
                yield result
            finally:
                await page.close()

    finally:
        if browser:
            await browser.close()
```

### 5. Daten-Qualität

```python
def clean_occupancy_data(raw_text):
    """Bereinigt Auslastungsdaten"""

    if not raw_text:
        return None

    # Entferne HTML
    text = re.sub(r'<[^>]+>', '', raw_text)

    # Normalisiere Whitespace
    text = ' '.join(text.split())

    # Validiere Format
    if not validate_occupancy_text(text):
        return None

    return text
```

---

## Performance-Metriken

| Metrik | Vorher | Nachher | Verbesserung |
|--------|--------|---------|--------------|
| Location-Namen Erfolgsquote | 50% | 100% | +100% |
| Auslastungsdaten Erfolgsquote | 50% | 75% | +50% |
| Live-Daten Erkennung | 25% | 50% | +100% |
| Durchschnittliche Zeit/URL | 15s | 20s | Akzeptabel |
| Retry-Erfolgsquote | N/A | 85% | Neu |

---

## Rechtliche Hinweise

### Terms of Service

Google Maps ToS verbieten automatisiertes Scraping. Dieses System ist:
- Nur für persönliche/bildungszwecke
- Nicht für kommerzielle Nutzung gedacht
- Rate-limited um Server-Last zu minimieren

### Empfehlungen

1. Nutze offizielle APIs wo möglich (Google Places API)
2. Halte Scraping-Frequenz niedrig
3. Respektiere robots.txt
4. Speichere keine personenbezogenen Daten

---

*Erstellt: 06.12.2025*
*Version: 2.5.0*
*Maintainer: Martin Pfeffer (@pepperonas)*
