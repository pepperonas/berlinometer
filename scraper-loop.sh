#!/bin/bash

# Robuster Scraper-Loop für Berlinometer
# Wird von PM2 verwaltet - überlebt Reboots, auto-restart bei Crashes
# Intervall: 7-12 Minuten (randomisiert)

LOCK_FILE="/tmp/berlinometer-scraper.lock"

cleanup() {
    rm -f "$LOCK_FILE"
    exit 0
}
trap cleanup SIGTERM SIGINT

while true; do
    # Lock-File prüfen (verhindert parallele Läufe)
    if [ -f "$LOCK_FILE" ]; then
        LOCK_AGE=$(( $(date +%s) - $(stat -c %Y "$LOCK_FILE" 2>/dev/null || echo 0) ))
        if [ "$LOCK_AGE" -gt 900 ]; then
            echo "$(date): Stale lock file gefunden (${LOCK_AGE}s alt), entferne..." >> /var/log/scraper.log
            rm -f "$LOCK_FILE"
        else
            echo "$(date): Scraper läuft bereits (lock age: ${LOCK_AGE}s), überspringe..." >> /var/log/scraper.log
            sleep 60
            continue
        fi
    fi

    # Lock setzen
    touch "$LOCK_FILE"

    echo "$(date): Starte Scraping..." >> /var/log/scraper.log
    /var/www/html/popular-times/run_scraper.sh
    EXIT_CODE=$?
    echo "$(date): Scraping beendet (exit code: $EXIT_CODE)" >> /var/log/scraper.log

    # Lock entfernen
    rm -f "$LOCK_FILE"

    # Zufällige Pause: 7-12 Minuten (420-720 Sekunden)
    SLEEP_TIME=$((420 + RANDOM % 301))
    SLEEP_MIN=$((SLEEP_TIME / 60))
    echo "$(date): Nächstes Scraping in ~${SLEEP_MIN} Minuten (${SLEEP_TIME}s)" >> /var/log/scraper.log
    sleep "$SLEEP_TIME"
done
