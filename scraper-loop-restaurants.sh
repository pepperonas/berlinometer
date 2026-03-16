#!/bin/bash

# Robuster Scraper-Loop für Berlinometer RESTAURANTS
# Wird von PM2 verwaltet - separater Prozess für Restaurant-Scraping
# Intervall: 15-25 Minuten (länger als Bars, da Restaurants weniger volatil)

LOCK_FILE="/tmp/berlinometer-scraper-restaurants.lock"

cleanup() {
    rm -f "$LOCK_FILE"
    exit 0
}
trap cleanup SIGTERM SIGINT

while true; do
    # Lock-File prüfen (verhindert parallele Läufe)
    if [ -f "$LOCK_FILE" ]; then
        LOCK_AGE=$(( $(date +%s) - $(stat -c %Y "$LOCK_FILE" 2>/dev/null || echo 0) ))
        if [ "$LOCK_AGE" -gt 1800 ]; then
            echo "$(date): Stale lock file gefunden (${LOCK_AGE}s alt), entferne..." >> /var/log/scraper-restaurants.log
            rm -f "$LOCK_FILE"
        else
            echo "$(date): Restaurant-Scraper läuft bereits (lock age: ${LOCK_AGE}s), überspringe..." >> /var/log/scraper-restaurants.log
            sleep 60
            continue
        fi
    fi

    # Lock setzen
    touch "$LOCK_FILE"

    echo "$(date): Starte Restaurant-Scraping..." >> /var/log/scraper-restaurants.log
    /var/www/html/popular-times/run_scraper_restaurants.sh
    EXIT_CODE=$?
    echo "$(date): Restaurant-Scraping beendet (exit code: $EXIT_CODE)" >> /var/log/scraper-restaurants.log

    # Lock entfernen
    rm -f "$LOCK_FILE"

    # Zufällige Pause: 15-25 Minuten (900-1500 Sekunden)
    SLEEP_TIME=$((900 + RANDOM % 601))
    SLEEP_MIN=$((SLEEP_TIME / 60))
    echo "$(date): Nächstes Restaurant-Scraping in ~${SLEEP_MIN} Minuten (${SLEEP_TIME}s)" >> /var/log/scraper-restaurants.log
    sleep "$SLEEP_TIME"
done
