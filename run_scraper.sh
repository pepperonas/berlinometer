#!/bin/bash

# Script zum automatischen Ausführen des Google Maps Scrapers
# Verwendet für Cronjob-Ausführung

# Aktiviere das virtuelle Python-Environment
source /var/www/html/popular-times/venv/bin/activate

# Wechsle in das Scraper-Verzeichnis
cd /var/www/html/popular-times/maps-playwrite-scraper

# Führe das Scraping-Script aus
python3 gmaps-scraper-fast-robust.py

# Kopiere die neueste JSON-Datei nach latest_results.json für die Webapp
cp occupancy_data_*.json ../latest_results.json 2>/dev/null || true

# Process JSON files and insert into database
cd /var/www/html/popular-times
python3 process_json_to_db.py >> /var/log/scraper.log 2>&1

# Optional: Log-Eintrag
echo "Scraping completed at $(date)" >> /var/log/scraper.log