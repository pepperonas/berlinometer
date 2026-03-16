#!/bin/bash

# Script zum automatischen Ausführen des Google Maps Scrapers für RESTAURANTS

# Aktiviere das virtuelle Python-Environment
source /var/www/html/popular-times/venv/bin/activate

# Wechsle in das Scraper-Verzeichnis
cd /var/www/html/popular-times/maps-playwrite-scraper

# Führe das Scraping-Script mit Restaurant-Kategorie aus
python3 gmaps-scraper-fast-robust.py --category restaurant

# Process JSON files and insert into database
cd /var/www/html/popular-times
python3 process_json_to_db.py >> /var/log/scraper-restaurants.log 2>&1

# Optional: Log-Eintrag
echo "Restaurant scraping completed at $(date)" >> /var/log/scraper-restaurants.log
