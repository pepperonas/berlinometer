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
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                color: white;
                padding: 20px;
                min-height: 100vh;
            }
            .container { max-width: 1200px; margin: 0 auto; }
            .card {
                background: rgba(255,255,255,0.1);
                border-radius: 20px;
                padding: 30px;
                margin: 20px 0;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            }
            .current { 
                text-align: center;
                background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
            }
            .temp { 
                font-size: 4em; 
                font-weight: 300; 
                margin: 20px 0;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .humidity { 
                font-size: 1.8em; 
                opacity: 0.9;
                margin-bottom: 10px;
            }
            .time { 
                opacity: 0.7; 
                margin-top: 20px;
                font-size: 1.1em;
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
                background: rgba(255,255,255,0.1);
                border-radius: 4px;
            }
            .history::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.3);
                border-radius: 4px;
            }
            .entry {
                display: flex;
                justify-content: space-between;
                padding: 12px 10px;
                border-radius: 8px;
                margin-bottom: 5px;
                background: rgba(255,255,255,0.05);
                transition: background 0.3s;
            }
            .entry:hover {
                background: rgba(255,255,255,0.1);
            }
            h1 { 
                margin-bottom: 30px; 
                text-align: center;
                font-size: 2.5em;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            h2 { 
                margin-bottom: 20px;
                font-size: 1.8em;
            }
            .stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-top: 20px;
            }
            .stat-box {
                text-align: center;
                padding: 20px;
                background: rgba(255,255,255,0.05);
                border-radius: 15px;
            }
            .stat-value {
                font-size: 2em;
                font-weight: 300;
                margin-top: 10px;
            }
            .stat-label {
                opacity: 0.8;
                font-size: 0.9em;
            }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
            
            <div class="card">
                <h2>📊 Verlauf</h2>
                <div class="chart-container">
                    <canvas id="weatherChart"></canvas>
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
            async function loadChartData() {
                const response = await fetch('/weather-tracker/api/chart-data');
                const data = await response.json();
                
                const ctx = document.getElementById('weatherChart').getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: data.labels,
                        datasets: [{
                            label: 'Temperatur (°C)',
                            data: data.temperature,
                            borderColor: '#ff6384',
                            backgroundColor: 'rgba(255, 99, 132, 0.1)',
                            yAxisID: 'y',
                            tension: 0.4
                        }, {
                            label: 'Luftfeuchtigkeit (%)',
                            data: data.humidity,
                            borderColor: '#36a2eb',
                            backgroundColor: 'rgba(54, 162, 235, 0.1)',
                            yAxisID: 'y1',
                            tension: 0.4
                        }]
                    },
                    options: {
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
                                labels: {
                                    color: 'white'
                                }
                            }
                        },
                        scales: {
                            x: {
                                type: 'time',
                                time: {
                                    parser: 'YYYY-MM-DD HH:mm:ss',
                                    tooltipFormat: 'DD.MM.YYYY HH:mm',
                                    displayFormats: {
                                        hour: 'HH:mm',
                                        day: 'DD.MM',
                                        minute: 'HH:mm'
                                    }
                                },
                                adapters: {
                                    date: {
                                        locale: 'de-DE'
                                    }
                                },
                                ticks: {
                                    color: 'white'
                                },
                                grid: {
                                    color: 'rgba(255,255,255,0.1)'
                                }
                            },
                            y: {
                                type: 'linear',
                                display: true,
                                position: 'left',
                                title: {
                                    display: true,
                                    text: 'Temperatur (°C)',
                                    color: 'white'
                                },
                                ticks: {
                                    color: 'white'
                                },
                                grid: {
                                    color: 'rgba(255,255,255,0.1)'
                                }
                            },
                            y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                title: {
                                    display: true,
                                    text: 'Luftfeuchtigkeit (%)',
                                    color: 'white'
                                },
                                ticks: {
                                    color: 'white'
                                },
                                grid: {
                                    drawOnChartArea: false,
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
            }
            
            loadChartData();
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

// API endpoint for chart data
app.get('/api/chart-data', async (req, res) => {
    try {
        const hours = parseInt(req.query.hours) || 24;
        const since = Math.floor(Date.now() / 1000) - (hours * 3600);
        
        const [rows] = await pool.execute(
            `SELECT * FROM weather_data WHERE timestamp > ${parseInt(since)} ORDER BY timestamp`
        );
        
        const labels = [];
        const temperature = [];
        const humidity = [];
        
        rows.forEach(row => {
            labels.push(formatTimestamp(row.timestamp));
            temperature.push(row.temperature);
            humidity.push(row.humidity);
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
        
        res.json({ labels, temperature, humidity, stats });
    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ error: error.message });
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