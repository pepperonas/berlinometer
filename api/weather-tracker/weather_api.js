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
            pressure DECIMAL(7,2) DEFAULT NULL,
            temperature_indoor DECIMAL(5,2) DEFAULT NULL,
            humidity_indoor DECIMAL(5,2) DEFAULT NULL,
            pressure_indoor DECIMAL(7,2) DEFAULT NULL,
            temperature_outdoor DECIMAL(5,2) DEFAULT NULL,
            humidity_outdoor DECIMAL(5,2) DEFAULT NULL,
            sensor_indoor VARCHAR(20) DEFAULT NULL,
            sensor_outdoor VARCHAR(20) DEFAULT NULL,
            timestamp INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_timestamp (timestamp)
        )
    `);
}

app.use(express.json());
app.use(express.static(__dirname));
app.use('/public', express.static(__dirname + '/public'));

// Store last valid reading for comparison
let lastValidReading = null;

// Store readings per minute to enforce rate limiting
const recentReadings = new Map(); // Key: minute timestamp, Value: { data, insertedAt }

// Validation constants
const MAX_TEMP_CHANGE_PER_MINUTE = 2.0; // Max 2°C change per minute
const MAX_HUM_CHANGE_PER_MINUTE = 5.0; // Max 5% humidity change per minute
const MIN_TEMPERATURE = -50; // Minimum reasonable temperature
const MAX_TEMPERATURE = 60; // Maximum reasonable temperature
const MIN_HUMIDITY = 0; // Minimum humidity
const MAX_HUMIDITY = 100; // Maximum humidity

// Cleanup old entries from recentReadings every 5 minutes
setInterval(() => {
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;
    for (const [minute, data] of recentReadings.entries()) {
        if (data.insertedAt < fiveMinutesAgo) {
            recentReadings.delete(minute);
        }
    }
}, 300000);

async function loadData(limit = 1000) {
    try {
        const [rows] = await pool.execute(
            `SELECT id, temperature_indoor, humidity_indoor, pressure_indoor, temperature_outdoor, humidity_outdoor, sensor_indoor, sensor_outdoor, timestamp, created_at FROM weather_data ORDER BY timestamp DESC LIMIT ${parseInt(limit)}`
        );
        // Konvertiere die Daten und stelle sicher, dass sie Zahlen sind
        return rows.reverse().map(row => ({
            id: row.id,
            // Use indoor values as primary for backward compatibility
            temperature: row.temperature_indoor ? parseFloat(row.temperature_indoor) : null,
            humidity: row.humidity_indoor ? parseFloat(row.humidity_indoor) : null,
            pressure: row.pressure_indoor ? parseFloat(row.pressure_indoor) : null,
            temperature_indoor: row.temperature_indoor ? parseFloat(row.temperature_indoor) : null,
            humidity_indoor: row.humidity_indoor ? parseFloat(row.humidity_indoor) : null,
            pressure_indoor: row.pressure_indoor ? parseFloat(row.pressure_indoor) : null,
            temperature_outdoor: row.temperature_outdoor ? parseFloat(row.temperature_outdoor) : null,
            humidity_outdoor: row.humidity_outdoor ? parseFloat(row.humidity_outdoor) : null,
            sensor_indoor: row.sensor_indoor,
            sensor_outdoor: row.sensor_outdoor,
            timestamp: parseInt(row.timestamp),
            created_at: row.created_at
        }));
    } catch (error) {
        console.error('Error loading data:', error);
        return [];
    }
}

async function getLastValidReading() {
    try {
        const [rows] = await pool.execute(
            'SELECT temperature_indoor, humidity_indoor, pressure_indoor, temperature_outdoor, humidity_outdoor, sensor_indoor, sensor_outdoor, timestamp FROM weather_data ORDER BY timestamp DESC LIMIT 1'
        );
        if (rows.length > 0) {
            return {
                // Use indoor as primary for backward compatibility
                temperature: rows[0].temperature_indoor ? parseFloat(rows[0].temperature_indoor) : null,
                humidity: rows[0].humidity_indoor ? parseFloat(rows[0].humidity_indoor) : null,
                pressure: rows[0].pressure_indoor ? parseFloat(rows[0].pressure_indoor) : null,
                temperature_indoor: rows[0].temperature_indoor ? parseFloat(rows[0].temperature_indoor) : null,
                humidity_indoor: rows[0].humidity_indoor ? parseFloat(rows[0].humidity_indoor) : null,
                pressure_indoor: rows[0].pressure_indoor ? parseFloat(rows[0].pressure_indoor) : null,
                temperature_outdoor: rows[0].temperature_outdoor ? parseFloat(rows[0].temperature_outdoor) : null,
                humidity_outdoor: rows[0].humidity_outdoor ? parseFloat(rows[0].humidity_outdoor) : null,
                sensor_indoor: rows[0].sensor_indoor,
                sensor_outdoor: rows[0].sensor_outdoor,
                timestamp: parseInt(rows[0].timestamp)
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting last reading:', error);
        return null;
    }
}

async function checkIfMinuteHasData(timestamp) {
    try {
        // Round down to the minute
        const minuteTimestamp = Math.floor(timestamp / 60) * 60;
        const minuteEnd = minuteTimestamp + 60;
        
        const [rows] = await pool.execute(
            'SELECT COUNT(*) as count FROM weather_data WHERE timestamp >= ? AND timestamp < ?',
            [minuteTimestamp, minuteEnd]
        );
        
        return rows[0].count > 0;
    } catch (error) {
        console.error('Error checking minute data:', error);
        return false;
    }
}

function validateSensorData(temperature, humidity, timestamp, lastReading) {
    const errors = [];
    
    // Check absolute bounds
    if (temperature < MIN_TEMPERATURE || temperature > MAX_TEMPERATURE) {
        errors.push(`Temperature ${temperature}°C is outside reasonable range (${MIN_TEMPERATURE}°C to ${MAX_TEMPERATURE}°C)`);
    }
    
    if (humidity < MIN_HUMIDITY || humidity > MAX_HUMIDITY) {
        errors.push(`Humidity ${humidity}% is outside valid range (${MIN_HUMIDITY}% to ${MAX_HUMIDITY}%)`);
    }
    
    // Check rate of change if we have a previous reading
    if (lastReading) {
        const timeDiff = timestamp - lastReading.timestamp;
        
        // Check rate of change for all time differences > 0
        if (timeDiff > 0) {
            const tempChange = Math.abs(temperature - lastReading.temperature);
            const humChange = Math.abs(humidity - lastReading.humidity);
            
            // Calculate max allowed change based on time difference (scaled to 1 minute)
            const timeFactorMinutes = Math.max(timeDiff / 60, 1); // At least 1 minute for scaling
            const maxAllowedTempChange = MAX_TEMP_CHANGE_PER_MINUTE * timeFactorMinutes;
            const maxAllowedHumChange = MAX_HUM_CHANGE_PER_MINUTE * timeFactorMinutes;
            
            // Reject normal limit violations, but allow after sensor gaps (10+ minutes)
            const isAfterLongGap = timeDiff >= 600; // 10+ minutes gap
            
            if (tempChange > maxAllowedTempChange) {
                if (isAfterLongGap) {
                    console.warn(`Temperature change after sensor gap: ${tempChange.toFixed(2)}°C over ${(timeDiff/60).toFixed(1)} minutes - allowing due to gap`);
                } else {
                    errors.push(`Temperature change too high: ${tempChange.toFixed(2)}°C over ${(timeDiff/60).toFixed(1)} minutes (max: ${maxAllowedTempChange.toFixed(1)}°C)`);
                }
            }
            
            if (humChange > maxAllowedHumChange) {
                if (isAfterLongGap) {
                    console.warn(`Humidity change after sensor gap: ${humChange.toFixed(2)}% over ${(timeDiff/60).toFixed(1)} minutes - allowing due to gap`);
                } else {
                    errors.push(`Humidity change too high: ${humChange.toFixed(2)}% over ${(timeDiff/60).toFixed(1)} minutes (max: ${maxAllowedHumChange.toFixed(1)}%)`);
                }
            }
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

async function saveData(data) {
    try {
        const {
            temperature, humidity, pressure, timestamp,
            temperature_indoor, humidity_indoor, pressure_indoor,
            temperature_outdoor, humidity_outdoor,
            sensor_indoor, sensor_outdoor
        } = data;
        
        await pool.execute(
            `INSERT INTO weather_data (
                timestamp,
                temperature_indoor, humidity_indoor, pressure_indoor,
                temperature_outdoor, humidity_outdoor,
                sensor_indoor, sensor_outdoor
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                timestamp,
                temperature_indoor, humidity_indoor, pressure_indoor,
                temperature_outdoor, humidity_outdoor,
                sensor_indoor, sensor_outdoor
            ]
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
        const {
            temperature, humidity, pressure, timestamp,
            temperature_indoor, humidity_indoor, pressure_indoor,
            temperature_outdoor, humidity_outdoor,
            sensor_indoor, sensor_outdoor
        } = req.body;

        // Backward compatibility: use primary temp/humidity if indoor/outdoor not provided
        const temp = parseFloat(temperature);
        const hum = parseFloat(humidity);
        const press = pressure ? parseFloat(pressure) : null;
        const ts = timestamp || Math.floor(Date.now() / 1000);
        
        // Parse indoor/outdoor values - only use fallback if both indoor/outdoor are undefined
        let tempIndoor = temperature_indoor !== undefined ? parseFloat(temperature_indoor) : null;
        let humIndoor = humidity_indoor !== undefined ? parseFloat(humidity_indoor) : null;
        let pressIndoor = pressure_indoor !== undefined ? parseFloat(pressure_indoor) : null;
        const tempOutdoor = temperature_outdoor !== undefined ? parseFloat(temperature_outdoor) : null;
        const humOutdoor = humidity_outdoor !== undefined ? parseFloat(humidity_outdoor) : null;
        
        // Legacy fallback: if no indoor/outdoor data provided, use primary values as indoor
        if (tempIndoor === null && tempOutdoor === null) {
            tempIndoor = temp;
            humIndoor = hum;
            pressIndoor = press;
        }
        
        if (temperature === undefined || humidity === undefined) {
            return res.status(400).json({error: 'Missing temperature or humidity'});
        }

        // Check rate limiting - only one entry per minute
        const minuteTimestamp = Math.floor(ts / 60) * 60;
        const minuteKey = minuteTimestamp.toString();
        
        // Check if we already have data for this minute in memory
        if (recentReadings.has(minuteKey)) {
            console.log(`Rate limited: Already have data for minute ${formatTimestamp(minuteTimestamp)}`);
            return res.status(429).json({
                error: 'Rate limited',
                message: 'Only one reading per minute allowed',
                nextAllowedTime: minuteTimestamp + 60
            });
        }
        
        // Check database for existing data in this minute
        const hasMinuteData = await checkIfMinuteHasData(ts);
        if (hasMinuteData) {
            console.log(`Rate limited: Database already has data for minute ${formatTimestamp(minuteTimestamp)}`);
            return res.status(429).json({
                error: 'Rate limited',
                message: 'Only one reading per minute allowed',
                nextAllowedTime: minuteTimestamp + 60
            });
        }

        // Initialize lastValidReading if needed
        if (!lastValidReading) {
            lastValidReading = await getLastValidReading();
        }

        // Validate the sensor data
        const validation = validateSensorData(temp, hum, ts, lastValidReading);
        
        if (!validation.isValid) {
            console.error(`Rejected sensor data: ${temp.toFixed(1)}°C, ${hum.toFixed(1)}% - Reasons:`, validation.errors);
            return res.status(400).json({
                error: 'Invalid sensor data',
                reasons: validation.errors,
                data: { temperature: temp, humidity: hum, timestamp: ts }
            });
        }

        await saveData({
            temperature: temp,
            humidity: hum,
            pressure: press,
            timestamp: ts,
            temperature_indoor: tempIndoor,
            humidity_indoor: humIndoor,
            pressure_indoor: pressIndoor,
            temperature_outdoor: tempOutdoor,
            humidity_outdoor: humOutdoor,
            sensor_indoor: sensor_indoor || null,
            sensor_outdoor: sensor_outdoor || null
        });

        // Store in recent readings map
        recentReadings.set(minuteKey, {
            data: { temperature: temp, humidity: hum, timestamp: ts },
            insertedAt: Math.floor(Date.now() / 1000)
        });

        // Update last valid reading
        lastValidReading = {
            temperature: temp,
            humidity: hum,
            pressure: press,
            timestamp: ts,
            temperature_indoor: tempIndoor,
            humidity_indoor: humIndoor,
            pressure_indoor: pressIndoor,
            temperature_outdoor: tempOutdoor,
            humidity_outdoor: humOutdoor,
            sensor_indoor: sensor_indoor || null,
            sensor_outdoor: sensor_outdoor || null
        };

        const pressureText = press ? `, ${press.toFixed(1)}hPa` : '';
        const indoorText = tempIndoor !== null ? ` Indoor: ${tempIndoor.toFixed(1)}°C, ${humIndoor.toFixed(1)}%` : '';
        const outdoorText = tempOutdoor !== null ? ` Outdoor: ${tempOutdoor.toFixed(1)}°C, ${humOutdoor.toFixed(1)}%` : '';
        console.log(`Accepted: ${temp.toFixed(1)}°C, ${hum.toFixed(1)}%${pressureText}${indoorText}${outdoorText} at ${formatTimestamp(ts)}`);

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
        <link rel="icon" type="image/x-icon" href="public/favicon.ico">
        <link rel="icon" type="image/png" sizes="16x16" href="public/favicon-16x16.png">
        <link rel="icon" type="image/png" sizes="32x32" href="public/favicon-32x32.png">
        <link rel="apple-touch-icon" sizes="180x180" href="public/apple-touch-icon.png">
        <link rel="icon" type="image/png" sizes="192x192" href="public/android-chrome-192x192.png">
        <link rel="icon" type="image/png" sizes="512x512" href="public/android-chrome-512x512.png">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
            tailwind.config = {
                darkMode: 'class',
                theme: {
                    extend: {
                        colors: {
                            primary: '#2C2E3B',
                            'primary-light': '#383B4F',
                        },
                        animation: {
                            'fadeIn': 'fadeIn 0.3s ease-in-out',
                            'slideIn': 'slideIn 0.4s ease-out',
                            'chartLoad': 'chartLoad 0.5s ease-out',
                        },
                        keyframes: {
                            fadeIn: {
                                'from': { opacity: '0' },
                                'to': { opacity: '1' }
                            },
                            slideIn: {
                                'from': { transform: 'translateY(10px)', opacity: '0' },
                                'to': { transform: 'translateY(0)', opacity: '1' }
                            },
                            chartLoad: {
                                '0%': { opacity: '0', transform: 'translateY(20px)' },
                                '100%': { opacity: '1', transform: 'translateY(0)' }
                            }
                        }
                    },
                },
            }
        </script>
        <style>
            body {
                margin: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
                'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
                sans-serif;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                -webkit-tap-highlight-color: transparent;
                overscroll-behavior-y: contain;
                min-height: 100vh;
            }
            
            .dark {
                color-scheme: dark;
            }
            
            /* Touch-Optimierungen */
            button, a {
                -webkit-tap-highlight-color: transparent;
            }
            
            * {
                touch-action: manipulation;
            }
            
            @media (max-width: 640px) {
                input, button {
                    font-size: 16px;
                }
            }
            
            .dark input::placeholder {
                opacity: 0.7;
            }
            
            /* PWA-Styling */
            @media all and (display-mode: standalone) {
                body {
                    padding-top: env(safe-area-inset-top);
                    padding-bottom: env(safe-area-inset-bottom);
                    padding-left: env(safe-area-inset-left);
                    padding-right: env(safe-area-inset-right);
                }
            }
            
            /* Chart container styling */
            .chart-container {
                position: relative;
                height: 400px;
                margin-top: 20px;
            }
            
            /* Custom scrollbar */
            .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.1);
                border-radius: 3px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 3px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(0, 0, 0, 0.5);
            }
            
            /* Name Overlay Styles */
            .chart-container {
                position: relative;
            }
            
            .name-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 10;
                pointer-events: none;
            }
            
            .name-overlay.active {
                opacity: 1;
                visibility: visible;
            }
            
            .name-text {
                font-size: clamp(48px, 8vw, 96px);
                font-weight: 900;
                font-family: 'Arial Black', Arial, sans-serif;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                text-align: center;
                transform: scale(0.8);
                transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .name-overlay.active .name-text {
                transform: scale(1);
            }
            
            .name-text.uli {
                background: linear-gradient(135deg, #ff6b6b, #ee5a52, #dc4343);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                filter: drop-shadow(0 4px 12px rgba(238, 90, 82, 0.4))
                        drop-shadow(0 0 20px rgba(238, 90, 82, 0.3));
            }
            
            .name-text.martin {
                background: linear-gradient(135deg, #4facfe, #00f2fe, #0093e6);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                filter: drop-shadow(0 4px 12px rgba(79, 172, 254, 0.4))
                        drop-shadow(0 0 20px rgba(79, 172, 254, 0.3));
            }
            
            .chart-container.dimmed canvas {
                opacity: 0.15;
                filter: blur(1px);
                transition: all 0.8s ease;
            }
            
            /* Pulse Animation */
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            .name-overlay.active .name-text {
                animation: pulse 3s ease-in-out infinite;
            }
            
            /* Mobile Optimizations */
            @media (max-width: 640px) {
                .name-text {
                    font-size: clamp(32px, 12vw, 64px);
                    letter-spacing: 0.15em;
                }
            }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-moment@1.0.1/dist/chartjs-adapter-moment.min.js"></script>
        <!-- Cache buster for development -->
        <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
        <meta http-equiv="Pragma" content="no-cache">
        <meta http-equiv="Expires" content="0">
    </head>
    <body class="min-h-screen transition-colors duration-300 bg-primary text-white">
        <div class="container mx-auto px-4 py-6 sm:py-8 max-w-5xl">
            <!-- Header -->
            <div class="flex justify-between items-center mb-4 sm:mb-8">
                <h1 class="text-2xl sm:text-4xl font-bold tracking-tight text-blue-300">Weather Tracker</h1>
            </div>
            
            ${latest ? `
            <!-- Current Weather Card -->
            <div class="bg-primary rounded-lg shadow-lg p-6 sm:p-8 mb-6 animate-slideIn">
                ${latest.temperature_indoor !== null || latest.temperature_outdoor !== null ? `
                <!-- Indoor/Outdoor Display -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    ${latest.temperature_indoor !== null ? `
                    <div class="text-center">
                        <h3 class="text-lg font-semibold text-blue-300 mb-4">🏠 Indoor (${latest.sensor_indoor || 'Unknown'})</h3>
                        <div class="grid grid-cols-${latest.pressure_indoor ? '3' : '2'} gap-3">
                            <div class="bg-primary-light rounded-lg p-3 sm:p-4 transition-transform duration-200 hover:scale-105">
                                <div class="text-blue-400 text-xs font-medium mb-1">Temperatur</div>
                                <div class="text-2xl sm:text-3xl font-bold text-white">${parseFloat(latest.temperature_indoor).toFixed(1)}°</div>
                            </div>
                            <div class="bg-primary-light rounded-lg p-3 sm:p-4 transition-transform duration-200 hover:scale-105">
                                <div class="text-blue-400 text-xs font-medium mb-1">Feuchtigkeit</div>
                                <div class="text-2xl sm:text-3xl font-bold text-white">${parseFloat(latest.humidity_indoor).toFixed(0)}%</div>
                            </div>
                            ${latest.pressure_indoor ? `
                            <div class="bg-primary-light rounded-lg p-3 sm:p-4 transition-transform duration-200 hover:scale-105">
                                <div class="text-green-400 text-xs font-medium mb-1">Druck</div>
                                <div class="text-2xl sm:text-3xl font-bold text-white">${parseFloat(latest.pressure_indoor).toFixed(1)}</div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    ` : ''}
                    ${latest.temperature_outdoor !== null ? `
                    <div class="text-center">
                        <h3 class="text-lg font-semibold text-orange-300 mb-4">🌤️ Outdoor (${latest.sensor_outdoor || 'Unknown'})</h3>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-primary-light rounded-lg p-3 sm:p-4 transition-transform duration-200 hover:scale-105">
                                <div class="text-orange-400 text-xs font-medium mb-1">Temperatur</div>
                                <div class="text-2xl sm:text-3xl font-bold text-white">${parseFloat(latest.temperature_outdoor).toFixed(1)}°</div>
                            </div>
                            <div class="bg-primary-light rounded-lg p-3 sm:p-4 transition-transform duration-200 hover:scale-105">
                                <div class="text-orange-400 text-xs font-medium mb-1">Feuchtigkeit</div>
                                <div class="text-2xl sm:text-3xl font-bold text-white">${parseFloat(latest.humidity_outdoor).toFixed(0)}%</div>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>
                ` : `
                <!-- Legacy Single Sensor Display -->
                <div class="text-center">
                    <div class="grid grid-cols-${latest.pressure ? '3' : '2'} gap-4 sm:gap-6">
                        <div class="bg-primary-light rounded-lg p-4 sm:p-6 transition-transform duration-200 hover:scale-105">
                            <div class="text-blue-400 text-sm font-medium mb-2">Temperatur</div>
                            <div class="text-4xl sm:text-5xl font-bold text-white">${parseFloat(latest.temperature).toFixed(1)}°</div>
                            <div class="text-gray-400 text-xs sm:text-sm mt-1">Celsius</div>
                        </div>
                        <div class="bg-primary-light rounded-lg p-4 sm:p-6 transition-transform duration-200 hover:scale-105">
                            <div class="text-blue-400 text-sm font-medium mb-2">Luftfeuchtigkeit</div>
                            <div class="text-4xl sm:text-5xl font-bold text-white">${parseFloat(latest.humidity).toFixed(0)}%</div>
                            <div class="text-gray-400 text-xs sm:text-sm mt-1">Relative</div>
                        </div>
                        ${latest.pressure ? `
                        <div class="bg-primary-light rounded-lg p-4 sm:p-6 transition-transform duration-200 hover:scale-105">
                            <div class="text-green-400 text-sm font-medium mb-2">Luftdruck</div>
                            <div class="text-4xl sm:text-5xl font-bold text-white">${parseFloat(latest.pressure).toFixed(1)}</div>
                            <div class="text-gray-400 text-xs sm:text-sm mt-1">hPa</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                `}
                <div class="text-gray-500 text-xs sm:text-sm mt-4 pt-4 border-t border-gray-600 text-center">
                    Zuletzt aktualisiert: ${formatTimestamp(latest.timestamp)}
                </div>
            </div>
            ` : '<div class="bg-primary rounded-lg p-6 text-center"><p class="text-gray-400">Keine Daten verfügbar</p></div>'}
            
            <!-- Time Range Selector -->
            <div class="bg-primary-light rounded-lg p-3 mb-6 flex flex-wrap justify-center gap-2 animate-slideIn">
                <button class="range-btn px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500" data-hours="24">24 Stunden</button>
                <button class="range-btn px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 bg-gray-600 text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" data-hours="168">7 Tage</button>
                <button class="range-btn px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 bg-gray-600 text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" data-hours="720">30 Tage</button>
                <button class="range-btn px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 bg-gray-600 text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" data-hours="4320">6 Monate</button>
            </div>
            
            <!-- Temperature Chart -->
            <div class="bg-primary rounded-lg shadow-md p-4 sm:p-6 mb-6 animate-chartLoad">
                <h2 id="tempChartTitle" class="text-lg sm:text-xl font-semibold mb-4 text-blue-300">Temperaturverlauf</h2>
                <div class="chart-container" style="height: 300px;">
                    <canvas id="tempChart"></canvas>
                    <div id="tempNameOverlay" class="name-overlay">
                        <div class="name-text uli">LOVIN'</div>
                    </div>
                </div>
            </div>
            
            <!-- Humidity Chart -->
            <div class="bg-primary rounded-lg shadow-md p-4 sm:p-6 mb-6 animate-chartLoad" style="animation-delay: 0.1s">
                <h2 id="humChartTitle" class="text-lg sm:text-xl font-semibold mb-4 text-blue-300">Luftfeuchtigkeitsverlauf</h2>
                <div class="chart-container" style="height: 300px;">
                    <canvas id="humChart"></canvas>
                    <div id="humNameOverlay" class="name-overlay">
                        <div class="name-text martin">ULI 💋</div>
                    </div>
                </div>
            </div>
            
            <!-- Pressure Chart -->
            <div class="bg-primary rounded-lg shadow-md p-4 sm:p-6 mb-6 animate-chartLoad" style="animation-delay: 0.2s">
                <h2 id="pressChartTitle" class="text-lg sm:text-xl font-semibold mb-4 text-blue-300">Luftdruckverlauf</h2>
                <div class="chart-container" style="height: 300px;">
                    <canvas id="pressChart"></canvas>
                </div>
            </div>
            
            <!-- Statistics -->
            <div class="bg-primary rounded-lg shadow-md p-4 sm:p-6 mb-6 animate-slideIn" style="animation-delay: 0.2s">
                <h2 class="text-lg sm:text-xl font-semibold mb-4 text-blue-300">Statistiken (24 Stunden)</h2>
                
                <div id="legacyStats">
                    <!-- Legacy Stats for single sensor -->
                    <!-- MAX Values Row -->
                    <div class="mb-3">
                        <div class="text-xs text-gray-500 font-medium mb-2 text-center">MAXIMUM WERTE</div>
                        <div class="grid gap-3 sm:gap-4" id="maxStatsGrid">
                            <div class="bg-primary-light rounded-lg p-3 sm:p-4 text-center transition-transform duration-200 hover:scale-105">
                                <div class="text-xs text-gray-400 font-medium">MAX TEMP</div>
                                <div class="text-2xl sm:text-3xl font-bold text-red-400 mt-1" id="maxTemp">--</div>
                            </div>
                            <div class="bg-primary-light rounded-lg p-3 sm:p-4 text-center transition-transform duration-200 hover:scale-105">
                                <div class="text-xs text-gray-400 font-medium">MAX FEUCHTE</div>
                                <div class="text-2xl sm:text-3xl font-bold text-green-400 mt-1" id="maxHum">--</div>
                            </div>
                            <div class="bg-primary-light rounded-lg p-3 sm:p-4 text-center transition-transform duration-200 hover:scale-105" id="maxPressureStat" style="display: none;">
                                <div class="text-xs text-gray-400 font-medium">MAX DRUCK</div>
                                <div class="text-2xl sm:text-3xl font-bold text-purple-400 mt-1" id="maxPressure">--</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- MIN Values Row -->
                    <div>
                        <div class="text-xs text-gray-500 font-medium mb-2 text-center">MINIMUM WERTE</div>
                        <div class="grid gap-3 sm:gap-4" id="minStatsGrid">
                            <div class="bg-primary-light rounded-lg p-3 sm:p-4 text-center transition-transform duration-200 hover:scale-105">
                                <div class="text-xs text-gray-400 font-medium">MIN TEMP</div>
                                <div class="text-2xl sm:text-3xl font-bold text-blue-400 mt-1" id="minTemp">--</div>
                            </div>
                            <div class="bg-primary-light rounded-lg p-3 sm:p-4 text-center transition-transform duration-200 hover:scale-105">
                                <div class="text-xs text-gray-400 font-medium">MIN FEUCHTE</div>
                                <div class="text-2xl sm:text-3xl font-bold text-blue-400 mt-1" id="minHum">--</div>
                            </div>
                            <div class="bg-primary-light rounded-lg p-3 sm:p-4 text-center transition-transform duration-200 hover:scale-105" id="minPressureStat" style="display: none;">
                                <div class="text-xs text-gray-400 font-medium">MIN DRUCK</div>
                                <div class="text-2xl sm:text-3xl font-bold text-blue-400 mt-1" id="minPressure">--</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div id="indoorOutdoorStats" style="display: none;">
                    <!-- Indoor/Outdoor Stats -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Indoor Stats -->
                        <div id="indoorStatsSection" style="display: none;">
                            <h3 class="text-md font-semibold text-blue-300 mb-3 text-center">🏠 Indoor Extremwerte</h3>
                            <div class="grid grid-cols-2 gap-2">
                                <div class="bg-primary-light rounded-lg p-2 text-center">
                                    <div class="text-xs text-red-400 font-medium">MAX</div>
                                    <div class="text-lg font-bold text-white" id="maxTempIndoor">--</div>
                                    <div class="text-xs text-gray-400">TEMP</div>
                                </div>
                                <div class="bg-primary-light rounded-lg p-2 text-center">
                                    <div class="text-xs text-blue-400 font-medium">MIN</div>
                                    <div class="text-lg font-bold text-white" id="minTempIndoor">--</div>
                                    <div class="text-xs text-gray-400">TEMP</div>
                                </div>
                                <div class="bg-primary-light rounded-lg p-2 text-center">
                                    <div class="text-xs text-green-400 font-medium">MAX</div>
                                    <div class="text-lg font-bold text-white" id="maxHumIndoor">--</div>
                                    <div class="text-xs text-gray-400">FEUCHTE</div>
                                </div>
                                <div class="bg-primary-light rounded-lg p-2 text-center">
                                    <div class="text-xs text-blue-400 font-medium">MIN</div>
                                    <div class="text-lg font-bold text-white" id="minHumIndoor">--</div>
                                    <div class="text-xs text-gray-400">FEUCHTE</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Outdoor Stats -->
                        <div id="outdoorStatsSection" style="display: none;">
                            <h3 class="text-md font-semibold text-orange-300 mb-3 text-center">🌤️ Outdoor Extremwerte</h3>
                            <div class="grid grid-cols-2 gap-2">
                                <div class="bg-primary-light rounded-lg p-2 text-center">
                                    <div class="text-xs text-red-400 font-medium">MAX</div>
                                    <div class="text-lg font-bold text-white" id="maxTempOutdoor">--</div>
                                    <div class="text-xs text-gray-400">TEMP</div>
                                </div>
                                <div class="bg-primary-light rounded-lg p-2 text-center">
                                    <div class="text-xs text-blue-400 font-medium">MIN</div>
                                    <div class="text-lg font-bold text-white" id="minTempOutdoor">--</div>
                                    <div class="text-xs text-gray-400">TEMP</div>
                                </div>
                                <div class="bg-primary-light rounded-lg p-2 text-center">
                                    <div class="text-xs text-green-400 font-medium">MAX</div>
                                    <div class="text-lg font-bold text-white" id="maxHumOutdoor">--</div>
                                    <div class="text-xs text-gray-400">FEUCHTE</div>
                                </div>
                                <div class="bg-primary-light rounded-lg p-2 text-center">
                                    <div class="text-xs text-blue-400 font-medium">MIN</div>
                                    <div class="text-lg font-bold text-white" id="minHumOutdoor">--</div>
                                    <div class="text-xs text-gray-400">FEUCHTE</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Recent Measurements -->
            <div class="bg-primary rounded-lg shadow-md p-4 sm:p-6 mb-6 animate-slideIn" style="animation-delay: 0.3s">
                <h2 class="text-lg sm:text-xl font-semibold mb-4 text-blue-300">Letzte Messungen</h2>
                <div class="max-h-64 overflow-y-auto custom-scrollbar">
                    <div class="space-y-2">
                        ${data.slice(-20).reverse().map((entry, index) => `
                            <div class="bg-primary-light rounded-lg p-3 transition-colors duration-200 hover:bg-gray-700 ${index === 0 ? 'border-l-2 border-blue-500' : ''}">
                                ${entry.temperature_indoor !== null || entry.temperature_outdoor !== null ? `
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    ${entry.temperature_indoor !== null ? `
                                    <div class="text-center sm:text-left">
                                        <div class="text-xs text-blue-400 font-medium mb-1">🏠 Indoor</div>
                                        <div class="flex items-center justify-center sm:justify-start gap-2">
                                            <span class="text-white font-medium">${parseFloat(entry.temperature_indoor).toFixed(1)}°C</span>
                                            <span class="text-gray-400">|</span>
                                            <span class="text-white font-medium">${parseFloat(entry.humidity_indoor).toFixed(1)}%</span>
                                            ${entry.pressure_indoor ? `
                                            <span class="text-gray-400">|</span>
                                            <span class="text-white font-medium">${parseFloat(entry.pressure_indoor).toFixed(1)}hPa</span>
                                            ` : ''}
                                        </div>
                                    </div>
                                    ` : ''}
                                    ${entry.temperature_outdoor !== null ? `
                                    <div class="text-center sm:text-left">
                                        <div class="text-xs text-orange-400 font-medium mb-1">🌤️ Outdoor</div>
                                        <div class="flex items-center justify-center sm:justify-start gap-2">
                                            <span class="text-white font-medium">${parseFloat(entry.temperature_outdoor).toFixed(1)}°C</span>
                                            <span class="text-gray-400">|</span>
                                            <span class="text-white font-medium">${parseFloat(entry.humidity_outdoor).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                    ` : ''}
                                </div>
                                ` : `
                                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                    <div class="flex items-center gap-4">
                                        <span class="text-white font-medium">${parseFloat(entry.temperature).toFixed(1)}°C</span>
                                        <span class="text-gray-400">|</span>
                                        <span class="text-white font-medium">${parseFloat(entry.humidity).toFixed(1)}%</span>
                                        ${entry.pressure ? `
                                        <span class="text-gray-400">|</span>
                                        <span class="text-white font-medium">${parseFloat(entry.pressure).toFixed(1)}hPa</span>
                                        ` : ''}
                                    </div>
                                </div>
                                `}
                                <div class="text-xs sm:text-sm text-gray-500 mt-2 text-center sm:text-right">${formatTimestamp(entry.timestamp)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <!-- Update Button -->
            <div class="mt-6 sm:mt-8 text-center mb-6">
                <button
                    class="text-sm sm:text-base font-semibold py-2 px-4 sm:px-6 rounded-full shadow-md transition duration-300 bg-blue-600 hover:bg-blue-700 text-white"
                    onclick="location.reload()"
                >
                    JETZT AKTUALISIEREN!
                </button>
            </div>
            
            <!-- Weather App Link -->
            <div class="mt-8 text-center">
                <a
                    href="https://mrx3k1.de/weather/"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-block px-6 py-3 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                >
                    Weather App
                </a>
            </div>
            
            <!-- Footer -->
            <div class="mt-4 pt-4 pb-2 text-center text-m text-gray-400">
                Made with ❤️ by Martin Pfeffer
            </div>
        </div>
        <script>
            let tempChart = null;
            let humChart = null;
            let pressChart = null;
            let currentTimeRange = 24;
            let isNameMode = false;
            let originalChartData = null;
            
            // Toggle zwischen Namen- und Normal-Modus
            function toggleNameMode() {
                const tempOverlay = document.getElementById('tempNameOverlay');
                const humOverlay = document.getElementById('humNameOverlay');
                const tempContainer = document.getElementById('tempChart').parentElement;
                const humContainer = document.getElementById('humChart').parentElement;
                
                if (isNameMode) {
                    // Zurück zu normalen Charts
                    isNameMode = false;
                    tempOverlay.classList.remove('active');
                    humOverlay.classList.remove('active');
                    tempContainer.classList.remove('dimmed');
                    humContainer.classList.remove('dimmed');
                    document.getElementById('tempChartTitle').innerHTML = 'Temperaturverlauf';
                    document.getElementById('humChartTitle').innerHTML = 'Luftfeuchtigkeitsverlauf';
                } else {
                    // Zu Namen-Modus wechseln
                    isNameMode = true;
                    tempOverlay.classList.add('active');
                    humOverlay.classList.add('active');
                    tempContainer.classList.add('dimmed');
                    humContainer.classList.add('dimmed');
                    document.getElementById('tempChartTitle').innerHTML = 'Temperaturverlauf';
                    document.getElementById('humChartTitle').innerHTML = 'Luftfeuchtigkeitsverlauf';
                }
            }
            
            // Keyboard Event Listener
            document.addEventListener('keydown', function(event) {
                if (event.key.toLowerCase() === 'x') {
                    event.preventDefault();
                    toggleNameMode();
                }
            });
            
            async function loadChartData(hours = 24) {
                try {
                    const response = await fetch('api/chart-data?hours=' + hours);
                    const data = await response.json();
                    console.log('Loaded data:', data);
                
                // Chart colors - matching weather app theme
                const accentRed = '#ef4444';
                const accentBlue = '#3b82f6';
                const textPrimary = '#ffffff';
                const textSecondary = '#9ca3af';
                const gridColor = 'rgba(255, 255, 255, 0.1)';
                
                // Destroy existing charts
                if (tempChart) {
                    tempChart.destroy();
                    tempChart = null;
                }
                if (humChart) {
                    humChart.destroy();
                    humChart = null;
                }
                if (pressChart) {
                    pressChart.destroy();
                    pressChart = null;
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
                                color: textSecondary,
                                font: {
                                    size: 11
                                }
                            },
                            grid: {
                                color: gridColor
                            }
                        },
                        y: {
                            ticks: {
                                color: textSecondary,
                                font: {
                                    size: 11
                                }
                            },
                            grid: {
                                color: gridColor
                            }
                        }
                    }
                };
                
                // Temperature Chart datasets - Only Indoor/Outdoor
                const tempDatasets = [];
                
                // Add indoor temperature
                if (data.temperatureIndoor && data.temperatureIndoor.length > 0) {
                    tempDatasets.push({
                        label: '🏠 Indoor Temperatur (°C)',
                        data: data.temperatureIndoor,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 6
                    });
                }
                
                // Add outdoor temperature
                if (data.temperatureOutdoor && data.temperatureOutdoor.length > 0) {
                    tempDatasets.push({
                        label: '🌤️ Outdoor Temperatur (°C)',
                        data: data.temperatureOutdoor,
                        borderColor: '#f97316',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        tension: 0.4,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 6
                    });
                }
                
                // Temperature Chart
                const tempCtx = document.getElementById('tempChart').getContext('2d');
                const tempOptions = {
                    ...commonOptions,
                    plugins: {
                        ...commonOptions.plugins,
                        legend: {
                            display: tempDatasets.length > 1,
                            labels: {
                                color: textPrimary,
                                font: {
                                    size: 11
                                }
                            }
                        }
                    },
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
                };
                
                tempChart = new Chart(tempCtx, {
                    type: 'line',
                    data: {
                        labels: data.labels,
                        datasets: tempDatasets
                    },
                    options: tempOptions
                });
                
                // Humidity Chart datasets - Only Indoor/Outdoor
                const humDatasets = [];
                
                // Add indoor humidity
                if (data.humidityIndoor && data.humidityIndoor.length > 0) {
                    humDatasets.push({
                        label: '🏠 Indoor Luftfeuchtigkeit (%)',
                        data: data.humidityIndoor,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 6
                    });
                }
                
                // Add outdoor humidity
                if (data.humidityOutdoor && data.humidityOutdoor.length > 0) {
                    humDatasets.push({
                        label: '🌤️ Outdoor Luftfeuchtigkeit (%)',
                        data: data.humidityOutdoor,
                        borderColor: '#f97316',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        tension: 0.4,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 6
                    });
                }
                
                // Humidity Chart
                const humCtx = document.getElementById('humChart').getContext('2d');
                const humOptions = {
                    ...commonOptions,
                    plugins: {
                        ...commonOptions.plugins,
                        legend: {
                            display: humDatasets.length > 1,
                            labels: {
                                color: textPrimary,
                                font: {
                                    size: 11
                                }
                            }
                        }
                    },
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
                };
                
                humChart = new Chart(humCtx, {
                    type: 'line',
                    data: {
                        labels: data.labels,
                        datasets: humDatasets
                    },
                    options: humOptions
                });
                
                // Pressure Chart (only indoor pressure data)
                const pressureDatasets = [];
                
                // Add indoor pressure only
                if (data.pressureIndoor && data.pressureIndoor.length > 0) {
                    pressureDatasets.push({
                        label: '🏠 Indoor Luftdruck (hPa)',
                        data: data.pressureIndoor,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 6
                    });
                }
                
                if (pressureDatasets.length > 0) {
                    const pressCtx = document.getElementById('pressChart').getContext('2d');
                    const pressOptions = {
                        ...commonOptions,
                        plugins: {
                            ...commonOptions.plugins,
                            legend: {
                                display: pressureDatasets.length > 1,
                                labels: {
                                    color: textPrimary,
                                    font: {
                                        size: 11
                                    }
                                }
                            }
                        },
                        scales: {
                            ...commonOptions.scales,
                            y: {
                                ...commonOptions.scales.y,
                                title: {
                                    display: true,
                                    text: 'Luftdruck (hPa)',
                                    color: textPrimary
                                }
                            }
                        }
                    };
                    
                    pressChart = new Chart(pressCtx, {
                        type: 'line',
                        data: {
                            labels: data.labels,
                            datasets: pressureDatasets
                        },
                        options: pressOptions
                    });
                } else {
                    // Hide pressure chart section if no pressure data
                    const pressureChartElement = document.getElementById('pressChart');
                    if (pressureChartElement) {
                        const pressureChartSection = pressureChartElement.parentElement.parentElement;
                        if (pressureChartSection) {
                            pressureChartSection.style.display = 'none';
                        }
                    }
                }
                
                // Check if we have indoor/outdoor data
                if (data.stats.hasIndoorData || data.stats.hasOutdoorData) {
                    // Show indoor/outdoor stats
                    document.getElementById('legacyStats').style.display = 'none';
                    document.getElementById('indoorOutdoorStats').style.display = 'block';
                    
                    // Update indoor stats if available
                    if (data.stats.hasIndoorData) {
                        document.getElementById('indoorStatsSection').style.display = 'block';
                        document.getElementById('minTempIndoor').textContent = data.stats.minTempIndoor + '°C';
                        document.getElementById('maxTempIndoor').textContent = data.stats.maxTempIndoor + '°C';
                        document.getElementById('minHumIndoor').textContent = data.stats.minHumIndoor + '%';
                        document.getElementById('maxHumIndoor').textContent = data.stats.maxHumIndoor + '%';
                    }
                    
                    // Update outdoor stats if available
                    if (data.stats.hasOutdoorData) {
                        document.getElementById('outdoorStatsSection').style.display = 'block';
                        document.getElementById('minTempOutdoor').textContent = data.stats.minTempOutdoor + '°C';
                        document.getElementById('maxTempOutdoor').textContent = data.stats.maxTempOutdoor + '°C';
                        document.getElementById('minHumOutdoor').textContent = data.stats.minHumOutdoor + '%';
                        document.getElementById('maxHumOutdoor').textContent = data.stats.maxHumOutdoor + '%';
                    }
                } else {
                    // Show legacy stats
                    document.getElementById('legacyStats').style.display = 'block';
                    document.getElementById('indoorOutdoorStats').style.display = 'none';
                    
                    // Update legacy stats
                    document.getElementById('minTemp').textContent = data.stats.minTemp + '°C';
                    document.getElementById('maxTemp').textContent = data.stats.maxTemp + '°C';
                    document.getElementById('minHum').textContent = data.stats.minHum + '%';
                    document.getElementById('maxHum').textContent = data.stats.maxHum + '%';
                    
                    // Update pressure stats if available
                    if (data.stats.hasPressureData) {
                        document.getElementById('minPressure').textContent = data.stats.minPressure + 'hPa';
                        document.getElementById('maxPressure').textContent = data.stats.maxPressure + 'hPa';
                        document.getElementById('minPressureStat').style.display = 'block';
                        document.getElementById('maxPressureStat').style.display = 'block';
                        // 3 columns when pressure data is available
                        document.getElementById('maxStatsGrid').className = 'grid grid-cols-3 gap-3 sm:gap-4';
                        document.getElementById('minStatsGrid').className = 'grid grid-cols-3 gap-3 sm:gap-4';
                    } else {
                        document.getElementById('minPressureStat').style.display = 'none';
                        document.getElementById('maxPressureStat').style.display = 'none';
                        // 2 columns when no pressure data
                        document.getElementById('maxStatsGrid').className = 'grid grid-cols-2 gap-3 sm:gap-4';
                        document.getElementById('minStatsGrid').className = 'grid grid-cols-2 gap-3 sm:gap-4';
                    }
                }
                
                // Show data point info
                const tempChartTitle = document.getElementById('tempChartTitle');
                const humChartTitle = document.getElementById('humChartTitle');
                let aggregationText = '';
                
                if (data.aggregation === 'raw') {
                    aggregationText = '<span class="text-sm text-gray-400 font-normal ml-2">(' + data.dataPoints + ' Datenpunkte)</span>';
                } else if (data.aggregation === 'hourly') {
                    aggregationText = '<span class="text-sm text-gray-400 font-normal ml-2">(Stündlich)</span>';
                } else if (data.aggregation === '4hourly') {
                    aggregationText = '<span class="text-sm text-gray-400 font-normal ml-2">(4-Stunden)</span>';
                } else if (data.aggregation === 'daily') {
                    aggregationText = '<span class="text-sm text-gray-400 font-normal ml-2">(Täglich)</span>';
                }
                
                tempChartTitle.innerHTML = 'Temperaturverlauf' + aggregationText;
                humChartTitle.innerHTML = 'Luftfeuchtigkeitsverlauf' + aggregationText;
                
                const pressChartTitle = document.getElementById('pressChartTitle');
                if (pressChartTitle && data.pressure && data.pressure.length > 0) {
                    pressChartTitle.innerHTML = 'Luftdruckverlauf' + aggregationText;
                }
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
                        b.classList.remove('bg-blue-600', 'text-white', 'hover:bg-blue-700');
                        b.classList.add('bg-gray-600', 'text-gray-300', 'hover:bg-gray-700');
                    });
                    this.classList.remove('bg-gray-600', 'text-gray-300', 'hover:bg-gray-700');
                    this.classList.add('bg-blue-600', 'text-white', 'hover:bg-blue-700');
                    
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
                    AVG(temperature_indoor) as temperature,
                    AVG(humidity_indoor) as humidity,
                    AVG(pressure_indoor) as pressure,
                    AVG(temperature_indoor) as temperature_indoor,
                    AVG(humidity_indoor) as humidity_indoor,
                    AVG(pressure_indoor) as pressure_indoor,
                    AVG(temperature_outdoor) as temperature_outdoor,
                    AVG(humidity_outdoor) as humidity_outdoor,
                    MIN(temperature_indoor) as min_temp,
                    MAX(temperature_indoor) as max_temp,
                    MIN(humidity_indoor) as min_hum,
                    MAX(humidity_indoor) as max_hum,
                    MIN(pressure_indoor) as min_pressure,
                    MAX(pressure_indoor) as max_pressure,
                    MIN(temperature_indoor) as min_temp_indoor,
                    MAX(temperature_indoor) as max_temp_indoor,
                    MIN(humidity_indoor) as min_hum_indoor,
                    MAX(humidity_indoor) as max_hum_indoor,
                    MIN(temperature_outdoor) as min_temp_outdoor,
                    MAX(temperature_outdoor) as max_temp_outdoor,
                    MIN(humidity_outdoor) as min_hum_outdoor,
                    MAX(humidity_outdoor) as max_hum_outdoor,
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
        const pressure = [];
        const temperatureIndoor = [];
        const humidityIndoor = [];
        const pressureIndoor = [];
        const temperatureOutdoor = [];
        const humidityOutdoor = [];
        const tempRanges = [];
        const humRanges = [];
        const pressRanges = [];
        const tempIndoorRanges = [];
        const humIndoorRanges = [];
        const tempOutdoorRanges = [];
        const humOutdoorRanges = [];
        
        rows.forEach(row => {
            const timestamp = aggregation === 'raw' ? row.timestamp : row.grouped_timestamp;
            labels.push(formatTimestamp(timestamp));
            // Use indoor values as primary for backward compatibility
            const primaryTemp = row.temperature_indoor || row.temperature;
            const primaryHum = row.humidity_indoor || row.humidity;
            temperature.push(parseFloat(primaryTemp));
            humidity.push(parseFloat(primaryHum));
            if (row.pressure_indoor || row.pressure) {
                pressure.push(parseFloat(row.pressure_indoor || row.pressure));
            }
            
            // Indoor/outdoor data
            if (row.temperature_indoor !== null) {
                temperatureIndoor.push(parseFloat(row.temperature_indoor));
            }
            if (row.humidity_indoor !== null) {
                humidityIndoor.push(parseFloat(row.humidity_indoor));
            }
            if (row.pressure_indoor !== null) {
                pressureIndoor.push(parseFloat(row.pressure_indoor));
            }
            if (row.temperature_outdoor !== null) {
                temperatureOutdoor.push(parseFloat(row.temperature_outdoor));
            }
            if (row.humidity_outdoor !== null) {
                humidityOutdoor.push(parseFloat(row.humidity_outdoor));
            }
            
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
                if (row.min_pressure && row.max_pressure) {
                    pressRanges.push({
                        min: parseFloat(row.min_pressure),
                        max: parseFloat(row.max_pressure)
                    });
                }
                
                // Indoor/outdoor ranges
                if (row.min_temp_indoor && row.max_temp_indoor) {
                    tempIndoorRanges.push({
                        min: parseFloat(row.min_temp_indoor),
                        max: parseFloat(row.max_temp_indoor)
                    });
                }
                if (row.min_hum_indoor && row.max_hum_indoor) {
                    humIndoorRanges.push({
                        min: parseFloat(row.min_hum_indoor),
                        max: parseFloat(row.max_hum_indoor)
                    });
                }
                if (row.min_temp_outdoor && row.max_temp_outdoor) {
                    tempOutdoorRanges.push({
                        min: parseFloat(row.min_temp_outdoor),
                        max: parseFloat(row.max_temp_outdoor)
                    });
                }
                if (row.min_hum_outdoor && row.max_hum_outdoor) {
                    humOutdoorRanges.push({
                        min: parseFloat(row.min_hum_outdoor),
                        max: parseFloat(row.max_hum_outdoor)
                    });
                }
            }
        });
        
        // Calculate stats
        const temps = rows.map(r => parseFloat(r.temperature_indoor || r.temperature || 0));
        const hums = rows.map(r => parseFloat(r.humidity_indoor || r.humidity || 0));
        const pressures = rows.filter(r => r.pressure_indoor || r.pressure).map(r => parseFloat(r.pressure_indoor || r.pressure || 0));
        const tempsIndoor = rows.filter(r => r.temperature_indoor !== null).map(r => parseFloat(r.temperature_indoor));
        const humsIndoor = rows.filter(r => r.humidity_indoor !== null).map(r => parseFloat(r.humidity_indoor));
        const tempsOutdoor = rows.filter(r => r.temperature_outdoor !== null).map(r => parseFloat(r.temperature_outdoor));
        const humsOutdoor = rows.filter(r => r.humidity_outdoor !== null).map(r => parseFloat(r.humidity_outdoor));
        
        const stats = {
            minTemp: temps.length ? Math.min(...temps).toFixed(1) : '--',
            maxTemp: temps.length ? Math.max(...temps).toFixed(1) : '--',
            minHum: hums.length ? Math.min(...hums).toFixed(1) : '--',
            maxHum: hums.length ? Math.max(...hums).toFixed(1) : '--',
            minPressure: pressures.length ? Math.min(...pressures).toFixed(1) : '--',
            maxPressure: pressures.length ? Math.max(...pressures).toFixed(1) : '--',
            hasPressureData: pressures.length > 0,
            // Indoor stats
            minTempIndoor: tempsIndoor.length ? Math.min(...tempsIndoor).toFixed(1) : '--',
            maxTempIndoor: tempsIndoor.length ? Math.max(...tempsIndoor).toFixed(1) : '--',
            minHumIndoor: humsIndoor.length ? Math.min(...humsIndoor).toFixed(1) : '--',
            maxHumIndoor: humsIndoor.length ? Math.max(...humsIndoor).toFixed(1) : '--',
            hasIndoorData: tempsIndoor.length > 0,
            // Outdoor stats
            minTempOutdoor: tempsOutdoor.length ? Math.min(...tempsOutdoor).toFixed(1) : '--',
            maxTempOutdoor: tempsOutdoor.length ? Math.max(...tempsOutdoor).toFixed(1) : '--',
            minHumOutdoor: humsOutdoor.length ? Math.min(...humsOutdoor).toFixed(1) : '--',
            maxHumOutdoor: humsOutdoor.length ? Math.max(...humsOutdoor).toFixed(1) : '--',
            hasOutdoorData: tempsOutdoor.length > 0
        };
        
        const responseData = { 
            labels, 
            temperature, 
            humidity, 
            pressure,
            temperatureIndoor,
            humidityIndoor,
            pressureIndoor,
            temperatureOutdoor,
            humidityOutdoor,
            stats,
            aggregation,
            dataPoints: rows.length
        };
        
        // Include ranges for aggregated data
        if (aggregation !== 'raw') {
            responseData.tempRanges = tempRanges;
            responseData.humRanges = humRanges;
            responseData.pressRanges = pressRanges;
            responseData.tempIndoorRanges = tempIndoorRanges;
            responseData.humIndoorRanges = humIndoorRanges;
            responseData.tempOutdoorRanges = tempOutdoorRanges;
            responseData.humOutdoorRanges = humOutdoorRanges;
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