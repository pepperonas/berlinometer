const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5033;
const DATA_FILE = 'weather_data.json';

app.use(express.json());
app.use(express.static('public'));

function loadData() {
    if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
    return [];
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// API endpoint for receiving sensor data
app.post('/weather-tracker', (req, res) => {
    try {
        const {temperature, humidity, timestamp} = req.body;

        if (temperature === undefined || humidity === undefined) {
            return res.status(400).json({error: 'Missing temperature or humidity'});
        }

        const weatherData = loadData();

        const entry = {
            temperature: parseFloat(temperature),
            humidity: parseFloat(humidity),
            timestamp: timestamp || Math.floor(Date.now() / 1000),
            datetime: new Date((timestamp || Math.floor(Date.now() / 1000)) * 1000).toISOString()
        };

        weatherData.push(entry);

        // Keep only last 1000 entries
        if (weatherData.length > 1000) {
            weatherData.splice(0, weatherData.length - 1000);
        }

        saveData(weatherData);

        console.log(`Received: ${entry.temperature.toFixed(1)}°C, ${entry.humidity.toFixed(1)}% at ${entry.datetime}`);

        res.json({status: 'success'});

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({error: error.message});
    }
});

// Dashboard route
app.get('/', (req, res) => {
    const data = loadData();
    const latest = data.length > 0 ? data[data.length - 1] : null;

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
                background: #2C2E3B;
                color: white;
                padding: 20px;
            }
            .container { max-width: 800px; margin: 0 auto; }
            .card {
                background: rgba(255,255,255,0.1);
                border-radius: 16px;
                padding: 24px;
                margin: 16px 0;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.1);
            }
            .current { text-align: center; }
            .temp { font-size: 3em; font-weight: 300; margin: 16px 0; }
            .humidity { font-size: 1.5em; opacity: 0.8; }
            .time { opacity: 0.6; margin-top: 16px; }
            .history { max-height: 400px; overflow-y: auto; }
            .entry {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            h1 { margin-bottom: 24px; text-align: center; }
            h2 { margin-bottom: 16px; }
        </style>
        <script>
            setTimeout(() => location.reload(), 30000);
        </script>
    </head>
    <body>
        <div class="container">
            <h1>Weather Tracker</h1>
            ${latest ? `
            <div class="card current">
                <div class="temp">${latest.temperature.toFixed(1)}°C</div>
                <div class="humidity">${latest.humidity.toFixed(1)}% Humidity</div>
                <div class="time">${latest.datetime}</div>
            </div>
            ` : ''}
            
            <div class="card">
                <h2>Recent Data (${data.length} entries)</h2>
                <div class="history">
                    ${data.slice(-20).reverse().map(entry => `
                        <div class="entry">
                            <span>${entry.temperature.toFixed(1)}°C | ${entry.humidity.toFixed(1)}%</span>
                            <span>${entry.datetime}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    res.send(html);
});

// API endpoint to get all data
app.get('/api/data', (req, res) => {
    res.json(loadData());
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Weather tracker running on http://localhost:${PORT}`);
});