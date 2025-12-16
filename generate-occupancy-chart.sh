#!/bin/bash

# Farben für Terminal-Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# VPS Verbindung
VPS_HOST="root@69.62.121.168"
MYSQL_USER="martin"
MYSQL_PASS='N)ZyhegaJ#YLH(c&Jhx7'
MYSQL_DB="popular_times_db"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       🍹 Berlinometer - Auslastungs-Chart Generator        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Schritt 1: Alle Locations abrufen
echo -e "${YELLOW}📍 Lade verfügbare Locations...${NC}"
echo ""

LOCATIONS=$(ssh $VPS_HOST "mysql -u $MYSQL_USER -p'$MYSQL_PASS' $MYSQL_DB -N -e \"
SELECT DISTINCT l.name
FROM locations l
JOIN occupancy_history oh ON l.id = oh.location_id
WHERE oh.occupancy_percent IS NOT NULL
ORDER BY l.name;
\"" 2>/dev/null)

if [ -z "$LOCATIONS" ]; then
    echo -e "${RED}❌ Fehler: Konnte keine Locations laden${NC}"
    exit 1
fi

# Locations nummerieren und anzeigen
echo -e "${GREEN}Verfügbare Locations:${NC}"
echo "────────────────────────────────────────"
i=1
declare -a LOCATION_ARRAY
while IFS= read -r loc; do
    LOCATION_ARRAY[$i]="$loc"
    printf "${BLUE}%3d${NC} │ %s\n" $i "$loc"
    ((i++))
done <<< "$LOCATIONS"
echo "────────────────────────────────────────"
echo ""

# Location auswählen
read -p "$(echo -e ${YELLOW}Wähle Location \(1-$((i-1))\): ${NC})" LOC_NUM

if ! [[ "$LOC_NUM" =~ ^[0-9]+$ ]] || [ "$LOC_NUM" -lt 1 ] || [ "$LOC_NUM" -ge "$i" ]; then
    echo -e "${RED}❌ Ungültige Auswahl${NC}"
    exit 1
fi

SELECTED_LOCATION="${LOCATION_ARRAY[$LOC_NUM]}"
echo -e "${GREEN}✓ Ausgewählt: ${SELECTED_LOCATION}${NC}"
echo ""

# Funktion: Datum parsen (unterstützt yyyyMMdd, yyyy-MM-dd, dd.MM.yyyy)
parse_date() {
    local input="$1"
    local parsed=""

    # Format: yyyyMMdd
    if [[ "$input" =~ ^[0-9]{8}$ ]]; then
        parsed="${input:0:4}-${input:4:2}-${input:6:2}"
    # Format: yyyy-MM-dd
    elif [[ "$input" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
        parsed="$input"
    # Format: dd.MM.yyyy
    elif [[ "$input" =~ ^[0-9]{2}\.[0-9]{2}\.[0-9]{4}$ ]]; then
        day="${input:0:2}"
        month="${input:3:2}"
        year="${input:6:4}"
        parsed="$year-$month-$day"
    else
        echo ""
        return 1
    fi

    echo "$parsed"
}

# Start-Datum
echo -e "${CYAN}📅 Startdatum eingeben${NC}"
echo -e "   ${BLUE}(Formate: yyyyMMdd, yyyy-MM-dd, dd.MM.yyyy)${NC}"
read -p "$(echo -e ${YELLOW}Start-Datum: ${NC})" START_DATE_INPUT

START_DATE=$(parse_date "$START_DATE_INPUT")
if [ -z "$START_DATE" ]; then
    echo -e "${RED}❌ Ungültiges Datumsformat${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Parsed: $START_DATE${NC}"

# Start-Uhrzeit
read -p "$(echo -e ${YELLOW}Start-Uhrzeit \(0-23\): ${NC})" START_HOUR
if ! [[ "$START_HOUR" =~ ^[0-9]{1,2}$ ]] || [ "$START_HOUR" -lt 0 ] || [ "$START_HOUR" -gt 23 ]; then
    echo -e "${RED}❌ Ungültige Uhrzeit${NC}"
    exit 1
fi
START_HOUR=$(printf "%02d" $START_HOUR)
echo ""

# End-Datum
echo -e "${CYAN}📅 Enddatum eingeben${NC}"
read -p "$(echo -e ${YELLOW}End-Datum: ${NC})" END_DATE_INPUT

END_DATE=$(parse_date "$END_DATE_INPUT")
if [ -z "$END_DATE" ]; then
    echo -e "${RED}❌ Ungültiges Datumsformat${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Parsed: $END_DATE${NC}"

# End-Uhrzeit
read -p "$(echo -e ${YELLOW}End-Uhrzeit \(0-23\): ${NC})" END_HOUR
if ! [[ "$END_HOUR" =~ ^[0-9]{1,2}$ ]] || [ "$END_HOUR" -lt 0 ] || [ "$END_HOUR" -gt 23 ]; then
    echo -e "${RED}❌ Ungültige Uhrzeit${NC}"
    exit 1
fi
END_HOUR=$(printf "%02d" $END_HOUR)
echo ""

# Zeitraum zusammenbauen
START_DATETIME="${START_DATE} ${START_HOUR}:00:00"
END_DATETIME="${END_DATE} ${END_HOUR}:00:00"

echo -e "${CYAN}🔍 Lade Daten...${NC}"
echo -e "   Location: ${GREEN}$SELECTED_LOCATION${NC}"
echo -e "   Von:      ${GREEN}$START_DATETIME${NC}"
echo -e "   Bis:      ${GREEN}$END_DATETIME${NC}"
echo ""

# Daten aus Datenbank holen
DATA=$(ssh $VPS_HOST "mysql -u $MYSQL_USER -p'$MYSQL_PASS' $MYSQL_DB -N -e \"
SELECT
    DATE_FORMAT(oh.timestamp, '%H:%i') as time_str,
    oh.occupancy_percent
FROM occupancy_history oh
JOIN locations l ON oh.location_id = l.id
WHERE oh.timestamp >= '$START_DATETIME'
  AND oh.timestamp <= '$END_DATETIME'
  AND l.name = '$SELECTED_LOCATION'
  AND oh.occupancy_percent IS NOT NULL
ORDER BY oh.timestamp ASC;
\"" 2>/dev/null)

if [ -z "$DATA" ]; then
    echo -e "${RED}❌ Keine Daten gefunden für diesen Zeitraum${NC}"
    exit 1
fi

# Statistiken berechnen
MAX_VALUE=0
MAX_TIME=""
SUM=0
COUNT=0
FIFTY_TIME=""

while IFS=$'\t' read -r time value; do
    if [ "$value" -gt "$MAX_VALUE" ]; then
        MAX_VALUE=$value
        MAX_TIME=$time
    fi
    SUM=$((SUM + value))
    COUNT=$((COUNT + 1))
    if [ -z "$FIFTY_TIME" ] && [ "$value" -ge 50 ]; then
        FIFTY_TIME=$time
    fi
done <<< "$DATA"

if [ "$COUNT" -gt 0 ]; then
    AVG=$((SUM / COUNT))
else
    AVG=0
fi

if [ -z "$FIFTY_TIME" ]; then
    FIFTY_TIME="--"
fi

echo -e "${GREEN}✓ ${COUNT} Datenpunkte gefunden${NC}"
echo ""

# JavaScript-Daten generieren
JS_DATA=""
while IFS=$'\t' read -r time value; do
    if [ -n "$JS_DATA" ]; then
        JS_DATA="$JS_DATA,"$'\n'
    fi
    JS_DATA="$JS_DATA            { time: '$time', value: $value }"
done <<< "$DATA"

# Dateiname generieren
SAFE_NAME=$(echo "$SELECTED_LOCATION" | tr ' ' '-' | tr -cd '[:alnum:]-')
START_DATE_SHORT=$(echo "$START_DATE" | tr -d '-')
END_DATE_SHORT=$(echo "$END_DATE" | tr -d '-')
OUTPUT_FILE="${SAFE_NAME}_${START_DATE_SHORT}-${END_DATE_SHORT}.html"

# Datum für Anzeige formatieren
START_DISPLAY=$(date -j -f "%Y-%m-%d" "$START_DATE" "+%d.%m.%Y" 2>/dev/null || echo "$START_DATE")
END_DISPLAY=$(date -j -f "%Y-%m-%d" "$END_DATE" "+%d.%m.%Y" 2>/dev/null || echo "$END_DATE")

# HTML-Datei erstellen
cat > "$OUTPUT_FILE" << EOF
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${SELECTED_LOCATION} - Auslastung ${START_DISPLAY} - ${END_DISPLAY}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            padding: 20px;
            color: #fff;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            margin-bottom: 10px;
            font-size: 2rem;
            background: linear-gradient(90deg, #ff6b6b, #feca57);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle {
            text-align: center;
            color: #888;
            margin-bottom: 30px;
            font-size: 1.1rem;
        }
        .chart-container {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 30px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .stat-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: #feca57;
        }
        .stat-label {
            color: #888;
            margin-top: 5px;
            font-size: 0.9rem;
        }
        .peak-time {
            color: #ff6b6b;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #555;
            font-size: 0.8rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${SELECTED_LOCATION}</h1>
        <p class="subtitle">Auslastung ${START_DISPLAY} ${START_HOUR}:00 - ${END_DISPLAY} ${END_HOUR}:00</p>

        <div class="chart-container">
            <canvas id="occupancyChart"></canvas>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">${MAX_VALUE}%</div>
                <div class="stat-label">Maximum</div>
            </div>
            <div class="stat-card">
                <div class="stat-value peak-time">${MAX_TIME}</div>
                <div class="stat-label">Peak Zeit</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${AVG}%</div>
                <div class="stat-label">Durchschnitt</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${FIFTY_TIME}</div>
                <div class="stat-label">50% erreicht</div>
            </div>
        </div>

        <p class="footer">Generiert am $(date "+%d.%m.%Y %H:%M") | Berlinometer</p>
    </div>

    <script>
        const data = [
$JS_DATA
        ];

        const ctx = document.getElementById('occupancyChart').getContext('2d');

        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(255, 107, 107, 0.8)');
        gradient.addColorStop(1, 'rgba(254, 202, 87, 0.2)');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.time),
                datasets: [{
                    label: 'Auslastung %',
                    data: data.map(d => d.value),
                    borderColor: '#ff6b6b',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#ff6b6b',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { size: 14 },
                        bodyFont: { size: 16 },
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                return 'Auslastung: ' + context.raw + '%';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#888',
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#888',
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>
EOF

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    ✅ Chart erstellt!                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "📄 Datei: ${CYAN}$OUTPUT_FILE${NC}"
echo -e "📊 Datenpunkte: ${CYAN}$COUNT${NC}"
echo -e "📈 Maximum: ${CYAN}${MAX_VALUE}%${NC} um ${CYAN}${MAX_TIME}${NC}"
echo -e "📉 Durchschnitt: ${CYAN}${AVG}%${NC}"
echo ""

# Datei öffnen?
read -p "$(echo -e ${YELLOW}Im Browser öffnen? \(j/n\): ${NC})" OPEN_BROWSER
if [[ "$OPEN_BROWSER" =~ ^[jJyY]$ ]]; then
    open "$OUTPUT_FILE"
fi
