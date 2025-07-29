#!/bin/bash

# Script zur Planung des nächsten Scraper-Laufs mit randomisierter Zeit (20-30 Min)
# Dieses Script entfernt sich selbst aus dem Cron und plant den nächsten Lauf

# Generiere zufällige Verzögerung zwischen 20-30 Minuten (in Sekunden)
MIN_DELAY=$((20 * 60))  # 20 Minuten in Sekunden
MAX_DELAY=$((30 * 60))  # 30 Minuten in Sekunden
RANDOM_DELAY=$((MIN_DELAY + RANDOM % (MAX_DELAY - MIN_DELAY)))

echo "$(date): Nächster Scraper-Lauf in $((RANDOM_DELAY / 60)) Minuten" >> /var/log/scraper.log

# Führe Scraper aus
/var/www/html/popular-times/run_scraper.sh

# Plane nächsten Lauf
NEXT_RUN=$(date -d "+${RANDOM_DELAY} seconds" "+%M %H %d %m *")

# Entferne aktuellen Cron-Eintrag und füge neuen hinzu
crontab -l | grep -v "schedule_scraper.sh" > /tmp/cron_temp 2>/dev/null || true
echo "$NEXT_RUN /var/www/html/popular-times/schedule_scraper.sh" >> /tmp/cron_temp
crontab /tmp/cron_temp
rm /tmp/cron_temp

echo "$(date): Nächster Lauf geplant für: $(date -d "+${RANDOM_DELAY} seconds")" >> /var/log/scraper.log