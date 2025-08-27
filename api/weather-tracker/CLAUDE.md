# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Weather Tracker is a dual-sensor weather monitoring system that collects indoor and outdoor temperature/humidity data from Raspberry Pi sensors and displays them via a web dashboard with real-time charts.

## Architecture

### Data Flow
1. **Raspberry Pi**: Dual-sensor setup with ENV3 (indoor I2C sensor) + DHT22 (outdoor GPIO sensor)
2. **API Server**: Node.js/Express with MySQL storage (Port 5033)  
3. **Frontend**: Embedded HTML dashboard with Chart.js visualizations

### Database Schema
The system uses a clean indoor/outdoor data structure:
- `temperature_indoor`, `humidity_indoor`, `pressure_indoor` (ENV3 sensor data)
- `temperature_outdoor`, `humidity_outdoor` (DHT22 sensor data)
- `sensor_indoor`, `sensor_outdoor` (sensor type identification)

## Development Commands

### Local Development
```bash
npm install                    # Install dependencies
node weather_api.js           # Start server on localhost:5033
```

### Database Setup
```bash
mysql -u root -p < schema.sql # Create database and tables
```

### Production Deployment (VPS)
```bash
# Deploy updated API
scp weather_api.js root@69.62.121.168:/var/www/html/api/weather-tracker/
ssh root@69.62.121.168 "cd /var/www/html/api/weather-tracker && pm2 restart weather-tracker"
```

### Raspberry Pi Integration
The `env3_dht22_combined.py` script runs on Raspberry Pi and sends data to the API:
- ENV3 sensor (I2C, GPIO2/GPIO3) for indoor readings
- DHT22 sensor (GPIO4) for outdoor readings
- Sends POST requests to `/weather-tracker` endpoint every 60 seconds

## Key Technical Details

### Rate Limiting
- Only accepts one reading per minute to prevent data spam
- Uses both in-memory cache and database checks
- Returns 429 status for rate-limited requests

### Data Validation
- Temperature: -50°C to 60°C range, max 2°C change per minute
- Humidity: 0% to 100% range, max 5% change per minute
- Sensors must be identified in requests

### Frontend Architecture
- Single-page application embedded in `weather_api.js`
- Chart.js for data visualization with separate indoor/outdoor datasets
- Responsive design with time range selection (24h, 7d, 30d, 6m)
- Real-time statistics display with min/max values

### API Endpoints
- `POST /weather-tracker` - Receive sensor data from Raspberry Pi
- `GET /` - Main dashboard with embedded charts
- `GET /api/data` - Raw data export
- `GET /api/chart-data?hours=24` - Chart data for specified time range

## Configuration

### Environment Variables
Database connection configured via `db-config.js` (not `.env`)

### Production Notes
- Runs on PM2 process manager as `weather-tracker`
- MySQL database: `weather_tracker`
- Server timezone: Europe/Berlin for all timestamps