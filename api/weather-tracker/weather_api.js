require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const moment = require('moment-timezone');
const dbConfig = require('./db-config');

const app = express();
const PORT = 5033;

// MySQL connection pool
let pool;

async function initDatabase() {
    pool = mysql.createPool({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
        port: dbConfig.port,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
    
    // Create table if not exists
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS weather_data (
            id INT AUTO_INCREMENT PRIMARY KEY,
            temperature DECIMAL(5,2) NOT NULL,
            humidity DECIMAL(5,2) NOT NULL,
            timestamp INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_timestamp (timestamp)
        )
    `);
}

app.use(express.json());
app.use(express.static('public'));

async function loadData(limit = 1000) {
    try {
        const [rows] = await pool.execute(
            `SELECT id, temperature, humidity, timestamp, created_at FROM weather_data ORDER BY timestamp DESC LIMIT ${parseInt(limit)}`
        );
        // Konvertiere die Daten und stelle sicher, dass sie Zahlen sind
        return rows.reverse().map(row => ({
            id: row.id,
            temperature: parseFloat(row.temperature),
            humidity: parseFloat(row.humidity),
            timestamp: parseInt(row.timestamp),
            created_at: row.created_at
        }));
    } catch (error) {
        console.error('Error loading data:', error);
        return [];
    }
}

async function saveData(temperature, humidity, timestamp) {
    try {
        await pool.execute(
            'INSERT INTO weather_data (temperature, humidity, timestamp) VALUES (?, ?, ?)',
            [temperature, humidity, timestamp]
        );
    } catch (error) {
        console.error('Error saving data:', error);
        throw error;
    }
}

function formatTimestamp(timestamp) {
    return moment.unix(timestamp).tz('Europe/Berlin').format('DD.MM.YYYY HH:mm:ss');
}

// API endpoint for receiving sensor data
app.post('/weather-tracker', async (req, res) => {
    try {
        const {temperature, humidity, timestamp} = req.body;

        if (temperature === undefined || humidity === undefined) {
            return res.status(400).json({error: 'Missing temperature or humidity'});
        }

        const temp = parseFloat(temperature);
        const hum = parseFloat(humidity);
        const ts = timestamp || Math.floor(Date.now() / 1000);

        await saveData(temp, hum, ts);

        console.log(`Received: ${temp.toFixed(1)}°C, ${hum.toFixed(1)}% at ${formatTimestamp(ts)}`);

        res.json({status: 'success'});

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({error: error.message});
    }
});

// Dashboard route
app.get('/', async (req, res) => {
    const data = await loadData(100);
    const latest = data.length > 0 ? data[data.length - 1] : null;
    
    // Debug logging
    console.log('Dashboard loaded - Data count:', data.length);
    console.log('Latest entry:', latest);
    console.log('First 2 entries:', data.slice(0, 2));

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Weather Tracker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            :root {
                --background-dark: #2B2E3B;
                --background-darker: #252830;
                --card-background: #343845;
                --accent-blue: #688db1;
                --accent-green: #9cb68f;
                --accent-red: #e16162;
                --text-primary: #d1d5db;
                --text-secondary: #9ca3af;
                --shadow-sm: 0 2px 4px rgba(0,0,0,0.2);
                --shadow: 0 4px 8px rgba(0,0,0,0.3);
                --shadow-lg: 0 8px 16px rgba(0,0,0,0.4);
                --radius-sm: 0.5rem;
                --radius: 1rem;
                --radius-lg: 1.5rem;
                --radius-xl: 2rem;
            }
            
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
                            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
                            sans-serif;
                background: var(--background-darker);
                color: var(--text-primary);
                padding: 20px;
                min-height: 100vh;
            }
            .container { max-width: 1200px; margin: 0 auto; }
            .card {
                background: var(--card-background);
                border-radius: var(--radius);
                padding: 30px;
                margin: 20px 0;
                box-shadow: var(--shadow-lg);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .card:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 24px rgba(0,0,0,0.5);
            }
            .current { 
                text-align: center;
                background: var(--card-background);
                border: 1px solid rgba(104, 141, 177, 0.2);
            }
            .temp { 
                font-size: 4em; 
                font-weight: 300; 
                margin: 20px 0;
                background: linear-gradient(135deg, var(--accent-blue), var(--accent-green));
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            .humidity { 
                font-size: 1.8em; 
                color: var(--text-primary);
                margin-bottom: 10px;
            }
            .time { 
                color: var(--text-secondary); 
                margin-top: 20px;
                font-size: 0.875rem;
            }
            .chart-container {
                position: relative;
                height: 400px;
                margin-top: 20px;
            }
            .history { 
                max-height: 300px; 
                overflow-y: auto;
                padding-right: 10px;
            }
            .history::-webkit-scrollbar {
                width: 8px;
            }
            .history::-webkit-scrollbar-track {
                background: var(--background-darker);
                border-radius: 4px;
            }
            .history::-webkit-scrollbar-thumb {
                background: var(--accent-blue);
                border-radius: 4px;
                opacity: 0.5;
            }
            .history::-webkit-scrollbar-thumb:hover {
                opacity: 0.8;
            }
            .entry {
                display: flex;
                justify-content: space-between;
                padding: 12px 16px;
                border-radius: var(--radius-sm);
                margin-bottom: 8px;
                background: var(--background-darker);
                transition: all 0.3s ease;
                border: 1px solid transparent;
            }
            .entry:hover {
                background: var(--background-dark);
                border-color: var(--accent-blue);
                transform: translateX(4px);
            }
            h1 { 
                margin-bottom: 30px; 
                text-align: center;
                font-size: 2.5em;
                color: var(--text-primary);
            }
            h2 { 
                margin-bottom: 20px;
                font-size: 1.8em;
                color: var(--text-primary);
            }
            .stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-top: 20px;
            }
            .stat-box {
                text-align: center;
                padding: 24px;
                background: var(--background-dark);
                border-radius: var(--radius);
                border: 1px solid rgba(104, 141, 177, 0.1);
                transition: all 0.3s ease;
            }
            .stat-box:hover {
                transform: translateY(-4px);
                box-shadow: var(--shadow-lg);
                border-color: var(--accent-blue);
            }
            .stat-value {
                font-size: 2em;
                font-weight: 300;
                margin-top: 10px;
                color: var(--accent-blue);
            }
            .stat-label {
                color: var(--text-secondary);
                font-size: 0.875rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-moment@1.0.1/dist/chartjs-adapter-moment.min.js"></script>
    </head>
    <body>
        <div class="container">
            <h1>🌡️ Weather Tracker</h1>
            ${latest ? `
            <div class="card current">
                <div class="temp">${parseFloat(latest.temperature).toFixed(1)}°C</div>
                <div class="humidity">💧 ${parseFloat(latest.humidity).toFixed(1)}% Luftfeuchtigkeit</div>
                <div class="time">Zuletzt aktualisiert: ${formatTimestamp(latest.timestamp)}</div>
            </div>
            ` : '<div class="card current"><p>Keine Daten verfügbar</p></div>'}
            
            <div class="time-range-selector card" style="padding: 20px; text-align: center;">
                <button class="range-btn" data-hours="24" style="padding: 8px 16px; margin: 0 5px; background: var(--accent-blue); color: var(--text-primary); border: none; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.3s;">24 Stunden</button>
                <button class="range-btn" data-hours="168" style="padding: 8px 16px; margin: 0 5px; background: var(--card-background); color: var(--text-primary); border: 1px solid var(--accent-blue); border-radius: var(--radius-sm); cursor: pointer; transition: all 0.3s;">7 Tage</button>
                <button class="range-btn" data-hours="720" style="padding: 8px 16px; margin: 0 5px; background: var(--card-background); color: var(--text-primary); border: 1px solid var(--accent-blue); border-radius: var(--radius-sm); cursor: pointer; transition: all 0.3s;">30 Tage</button>
                <button class="range-btn" data-hours="4320" style="padding: 8px 16px; margin: 0 5px; background: var(--card-background); color: var(--text-primary); border: 1px solid var(--accent-blue); border-radius: var(--radius-sm); cursor: pointer; transition: all 0.3s;">6 Monate</button>
            </div>
            
            <div class="card">
                <h2 id="tempChartTitle">🌡️ Temperaturverlauf</h2>
                <div class="chart-container">
                    <canvas id="tempChart"></canvas>
                </div>
            </div>
            
            <div class="card">
                <h2 id="humChartTitle">💧 Luftfeuchtigkeitsverlauf</h2>
                <div class="chart-container">
                    <canvas id="humChart"></canvas>
                </div>
            </div>
            
            <div class="card">
                <h2>📈 Statistiken (letzte 24 Stunden)</h2>
                <div class="stats" id="stats">
                    <div class="stat-box">
                        <div class="stat-label">Min. Temperatur</div>
                        <div class="stat-value" id="minTemp">--</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Max. Temperatur</div>
                        <div class="stat-value" id="maxTemp">--</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Min. Luftfeuchtigkeit</div>
                        <div class="stat-value" id="minHum">--</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Max. Luftfeuchtigkeit</div>
                        <div class="stat-value" id="maxHum">--</div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h2>🕐 Letzte Messungen</h2>
                <div class="history">
                    ${data.slice(-20).reverse().map(entry => `
                        <div class="entry">
                            <span>🌡️ ${parseFloat(entry.temperature).toFixed(1)}°C | 💧 ${parseFloat(entry.humidity).toFixed(1)}%</span>
                            <span>${formatTimestamp(entry.timestamp)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        <script>
            let tempChart = null;
            let humChart = null;
            let currentTimeRange = 24;
            
            async function loadChartData(hours = 24) {
                try {
                    const response = await fetch('api/chart-data?hours=' + hours);
                    const data = await response.json();
                    console.log('Loaded data:', data);
                
                // Get computed CSS variable values
                const computedStyle = getComputedStyle(document.documentElement);
                const accentRed = computedStyle.getPropertyValue('--accent-red').trim();
                const accentBlue = computedStyle.getPropertyValue('--accent-blue').trim();
                const textPrimary = computedStyle.getPropertyValue('--text-primary').trim();
                
                // Destroy existing charts
                if (tempChart) {
                    tempChart.destroy();
                }
                if (humChart) {
                    humChart.destroy();
                }
                
                // Chart options
                const commonOptions = {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 0
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                afterLabel: function(context) {
                                    if (data.aggregation && data.aggregation !== 'raw') {
                                        const isTemp = context.dataset.label.includes('Temperatur');
                                        const ranges = isTemp ? data.tempRanges : data.humRanges;
                                        if (ranges && ranges[context.dataIndex]) {
                                            const range = ranges[context.dataIndex];
                                            return 'Bereich: ' + range.min.toFixed(1) + ' - ' + range.max.toFixed(1) + (isTemp ? '°C' : '%');
                                        }
                                    }
                                    return '';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                parser: 'DD.MM.YYYY HH:mm:ss',
                                tooltipFormat: 'DD.MM.YYYY HH:mm',
                                displayFormats: {
                                    hour: 'HH:mm',
                                    day: 'DD.MM',
                                    minute: 'HH:mm'
                                }
                            },
                            ticks: {
                                color: textPrimary
                            },
                            grid: {
                                color: 'rgba(209, 213, 219, 0.1)'
                            }
                        },
                        y: {
                            ticks: {
                                color: textPrimary
                            },
                            grid: {
                                color: 'rgba(209, 213, 219, 0.1)'
                            }
                        }
                    }
                };
                
                // Temperature Chart
                const tempCtx = document.getElementById('tempChart').getContext('2d');
                tempChart = new Chart(tempCtx, {
                    type: 'line',
                    data: {
                        labels: data.labels,
                        datasets: [{
                            label: 'Temperatur (°C)',
                            data: data.temperature,
                            borderColor: accentRed,
                            backgroundColor: 'rgba(225, 97, 98, 0.1)',
                            tension: 0.4,
                            borderWidth: 2,
                            pointRadius: 0,
                            pointHoverRadius: 6
                        }]
                    },
                    options: {
                        ...commonOptions,
                        scales: {
                            ...commonOptions.scales,
                            y: {
                                ...commonOptions.scales.y,
                                title: {
                                    display: true,
                                    text: 'Temperatur (°C)',
                                    color: textPrimary
                                }
                            }
                        }
                    }
                });
                
                // Humidity Chart
                const humCtx = document.getElementById('humChart').getContext('2d');
                humChart = new Chart(humCtx, {
                    type: 'line',
                    data: {
                        labels: data.labels,
                        datasets: [{
                            label: 'Luftfeuchtigkeit (%)',
                            data: data.humidity,
                            borderColor: accentBlue,
                            backgroundColor: 'rgba(104, 141, 177, 0.1)',
                            tension: 0.4,
                            borderWidth: 2,
                            pointRadius: 0,
                            pointHoverRadius: 6
                        }]
                    },
                    options: {
                        ...commonOptions,
                        scales: {
                            ...commonOptions.scales,
                            y: {
                                ...commonOptions.scales.y,
                                title: {
                                    display: true,
                                    text: 'Luftfeuchtigkeit (%)',
                                    color: textPrimary
                                }
                            }
                        }
                    }
                });
                
                // Update stats
                document.getElementById('minTemp').textContent = data.stats.minTemp + '°C';
                document.getElementById('maxTemp').textContent = data.stats.maxTemp + '°C';
                document.getElementById('minHum').textContent = data.stats.minHum + '%';
                document.getElementById('maxHum').textContent = data.stats.maxHum + '%';
                
                // Show data point info
                const tempChartTitle = document.getElementById('tempChartTitle');
                const humChartTitle = document.getElementById('humChartTitle');
                let aggregationText = '';
                
                if (data.aggregation === 'raw') {
                    aggregationText = ' (' + data.dataPoints + ' Datenpunkte)';
                } else if (data.aggregation === 'hourly') {
                    aggregationText = ' (Stündliche Durchschnittswerte)';
                } else if (data.aggregation === '4hourly') {
                    aggregationText = ' (4-Stunden Durchschnittswerte)';
                } else if (data.aggregation === 'daily') {
                    aggregationText = ' (Tägliche Durchschnittswerte)';
                }
                
                tempChartTitle.innerHTML = '🌡️ Temperaturverlauf' + aggregationText;
                humChartTitle.innerHTML = '💧 Luftfeuchtigkeitsverlauf' + aggregationText;
                } catch (error) {
                    console.error('Error loading chart data:', error);
                }
            }
            
            // Time range button handling
            document.querySelectorAll('.range-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const hours = parseInt(this.getAttribute('data-hours'));
                    currentTimeRange = hours;
                    
                    // Update button styles
                    document.querySelectorAll('.range-btn').forEach(b => {
                        b.style.background = 'var(--card-background)';
                        b.style.border = '1px solid var(--accent-blue)';
                    });
                    this.style.background = 'var(--accent-blue)';
                    this.style.border = 'none';
                    
                    // Reload chart with new time range
                    loadChartData(hours);
                });
            });
            
            // Wait for DOM to be ready
            setTimeout(() => {
                loadChartData(24);
            }, 100);
            
            setInterval(() => location.reload(), 60000);
        </script>
    </body>
    </html>
    `;

    res.send(html);
});

// API endpoint to get all data
app.get('/api/data', async (req, res) => {
    const data = await loadData();
    res.json(data.map(row => ({
        ...row,
        datetime: formatTimestamp(row.timestamp)
    })));
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

// Debug endpoint
app.get('/api/debug', async (req, res) => {
    try {
        const [countResult] = await pool.execute('SELECT COUNT(*) as count FROM weather_data');
        const [latestResult] = await pool.execute('SELECT * FROM weather_data ORDER BY timestamp DESC LIMIT 5');
        res.json({
            totalRecords: countResult[0].count,
            latestRecords: latestResult,
            currentTime: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API endpoint for chart data
app.get('/api/chart-data', async (req, res) => {
    let query;
    try {
        const hours = parseInt(req.query.hours) || 24;
        const since = Math.floor(Date.now() / 1000) - (hours * 3600);
        
        // Determine aggregation level based on time range
        let aggregation = 'raw';
        let groupInterval = 1;
        
        if (hours <= 24) {
            aggregation = 'raw'; // All data points
        } else if (hours <= 168) { // 7 days
            aggregation = 'hourly';
            groupInterval = 3600; // 1 hour in seconds
        } else if (hours <= 720) { // 30 days
            aggregation = '4hourly';
            groupInterval = 14400; // 4 hours in seconds
        } else { // 6 months
            aggregation = 'daily';
            groupInterval = 86400; // 24 hours in seconds
        }
        if (aggregation === 'raw') {
            query = `SELECT * FROM weather_data WHERE timestamp > ${parseInt(since)} ORDER BY timestamp`;
        } else {
            query = `
                SELECT 
                    AVG(temperature) as temperature,
                    AVG(humidity) as humidity,
                    MIN(temperature) as min_temp,
                    MAX(temperature) as max_temp,
                    MIN(humidity) as min_hum,
                    MAX(humidity) as max_hum,
                    FLOOR(timestamp / ${groupInterval}) * ${groupInterval} as grouped_timestamp,
                    COUNT(*) as data_points
                FROM weather_data 
                WHERE timestamp > ${parseInt(since)}
                GROUP BY grouped_timestamp
                ORDER BY grouped_timestamp
            `;
        }
        
        const [rows] = await pool.execute(query);
        
        const labels = [];
        const temperature = [];
        const humidity = [];
        const tempRanges = [];
        const humRanges = [];
        
        rows.forEach(row => {
            const timestamp = aggregation === 'raw' ? row.timestamp : row.grouped_timestamp;
            labels.push(formatTimestamp(timestamp));
            temperature.push(parseFloat(row.temperature));
            humidity.push(parseFloat(row.humidity));
            
            // Store ranges for aggregated data
            if (aggregation !== 'raw') {
                tempRanges.push({
                    min: parseFloat(row.min_temp),
                    max: parseFloat(row.max_temp)
                });
                humRanges.push({
                    min: parseFloat(row.min_hum),
                    max: parseFloat(row.max_hum)
                });
            }
        });
        
        // Calculate stats
        const temps = rows.map(r => parseFloat(r.temperature));
        const hums = rows.map(r => parseFloat(r.humidity));
        
        const stats = {
            minTemp: temps.length ? Math.min(...temps).toFixed(1) : '--',
            maxTemp: temps.length ? Math.max(...temps).toFixed(1) : '--',
            minHum: hums.length ? Math.min(...hums).toFixed(1) : '--',
            maxHum: hums.length ? Math.max(...hums).toFixed(1) : '--'
        };
        
        const responseData = { 
            labels, 
            temperature, 
            humidity, 
            stats,
            aggregation,
            dataPoints: rows.length
        };
        
        // Include ranges for aggregated data
        if (aggregation !== 'raw') {
            responseData.tempRanges = tempRanges;
            responseData.humRanges = humRanges;
        }
        
        res.json(responseData);
    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ 
            error: error.message,
            stack: error.stack,
            query: query || 'No query generated'
        });
    }
});

// Initialize database and start server
initDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Weather tracker running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});