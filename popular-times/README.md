# Popular Times - Google Maps Occupancy Analyzer

A modern web application for analyzing Google Maps location occupancy data in real-time. Extract live foot traffic data from Google Maps places to understand when locations are busiest.

![Popular Times Screenshot](popular-times.jpg)

## ✨ Features

- 🎯 **Real-time Scraping**: Extract live occupancy data from Google Maps
- 🎨 **Modern Dark UI**: Professional interface with Material Design
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- 🔄 **Live Progress**: Real-time progress updates during data extraction
- 📊 **Multiple Export Formats**: Export results to JSON and CSV
- 🚀 **High Performance**: Optimized Python backend with Playwright
- 🔍 **Batch Processing**: Analyze multiple locations simultaneously
- 📈 **Historical Data**: Capture popular times charts when available

## 🏗️ Architecture

### Frontend (React + Vite)
- **Framework**: React 19 with Vite build system
- **Styling**: Custom CSS with CSS variables for theming
- **API Communication**: Fetch API with Server-Sent Events for streaming
- **State Management**: React hooks for local state

### Backend (Python Flask)
- **Framework**: Flask with CORS support
- **Web Scraping**: Playwright for automated Google Maps data extraction
- **API Design**: RESTful endpoints with streaming responses
- **Database**: Optional MySQL integration for data persistence

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+
- **Git**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/pepperonas/popular-times.git
   cd popular-times
   ```

2. **Install backend dependencies**:
   ```bash
   pip install -r requirements.txt
   python -m playwright install chromium
   ```

3. **Install frontend dependencies**:
   ```bash
   cd webapp
   npm install
   cd ..
   ```

### Development

1. **Start the backend server**:
   ```bash
   python server.py
   ```
   The API will be available at `http://localhost:5044`

2. **Start the frontend development server** (in a new terminal):
   ```bash
   cd webapp
   npm run dev
   ```
   The web app will be available at `http://localhost:3000`

### Production Build

1. **Build the React application**:
   ```bash
   cd webapp
   npm run build
   ```

2. **Deploy using your preferred method** (static hosting, Docker, etc.)

## 📖 Usage

### Web Interface

1. Open the application in your browser
2. Enter Google Maps URLs for the locations you want to analyze
3. Click "Start Scraping" to begin data extraction
4. Monitor real-time progress as data is collected
5. Export results in JSON or CSV format when complete

### Supported URL Formats

The application accepts various Google Maps URL formats:
```
https://www.google.com/maps/place/Location+Name/@lat,lng,zoom
https://maps.google.com/maps/place/Location+Name
https://goo.gl/maps/shortcode
```

### Example Data Output

```json
{
  "location_name": "Café Example",
  "address": "123 Main St, City",
  "live_occupancy": "Moderately busy",
  "occupancy_percent": 65,
  "popular_times": {
    "Monday": [0, 0, 0, 10, 20, 30, 50, 70, 60, 40, 30, 35, 45, 55, 65, 70, 75, 80, 60, 40, 20, 10, 5, 0],
    // ... other days
  },
  "scraped_at": "2025-01-15T14:30:00Z"
}
```

## 🔌 API Reference

### Endpoints

#### `GET /`
Returns service information and health status.

#### `GET /health`
Health check endpoint for monitoring.

#### `POST /scrape`
Scrapes Google Maps locations with real-time progress streaming.

**Request Body:**
```json
{
  "urls": [
    "https://www.google.com/maps/place/Location+One",
    "https://www.google.com/maps/place/Location+Two"
  ]
}
```

**Streaming Response:**
```json
{"type": "progress", "progress": 50, "current": 1, "total": 2, "location": "Processing location 1/2"}
{"type": "result", "data": {"location_name": "...", "live_occupancy": "...", ...}}
{"type": "complete", "timestamp": "2025-01-15T14:30:00Z"}
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file for backend configuration:
```bash
# Optional: Database configuration for data persistence
MYSQL_HOST=localhost
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=popular_times_db
MYSQL_PORT=3306
```

Create `webapp/.env.local` for frontend configuration:
```bash
# API URL for development
VITE_API_URL=http://localhost:5044
```

## 📁 Project Structure

```
popular-times/
├── webapp/                     # React frontend application
│   ├── public/                 # Static assets and PWA files
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   ├── App.jsx            # Main application component
│   │   ├── App.css            # Application-specific styles
│   │   ├── index.css          # Global styles and CSS variables
│   │   └── main.jsx           # Application entry point
│   ├── package.json           # Frontend dependencies
│   └── vite.config.js         # Vite build configuration
├── server.py                   # Flask backend API server
├── requirements.txt            # Python dependencies
├── .env.example               # Example environment configuration
├── .gitignore                 # Git ignore patterns
└── README.md                  # Project documentation
```

## 🎨 Design System

The application features a modern dark theme with carefully selected colors:

- **Background**: Dark navy (`#2B2E3B`) with subtle variations
- **Cards**: Elevated surfaces with soft shadows
- **Accents**: Blue (`#688db1`), Green (`#9cb68f`), Red (`#e16162`)
- **Typography**: System font stack for optimal readability
- **Components**: Consistent button styles, forms, and progress indicators

## 🛠️ Development Notes

- **Rate Limiting**: Implements 3-5 second delays between requests to respect Google's servers
- **Error Handling**: Comprehensive error handling with user-friendly feedback
- **Performance**: Resource blocking in Playwright for faster scraping
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox
- **Accessibility**: Proper focus states and keyboard navigation

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **Playwright browser not found** | Run `python -m playwright install chromium` |
| **CORS errors in development** | Ensure Flask-CORS is installed and configured |
| **Module not found errors** | Verify all dependencies are installed: `pip install -r requirements.txt` |
| **Port already in use** | Change the port in `server.py` or kill the existing process |
| **Build failures** | Clear `node_modules` and reinstall: `rm -rf node_modules && npm install` |

### Debug Mode

Enable debug logging by setting the log level:
```python
logging.basicConfig(level=logging.DEBUG)
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests if applicable
4. Run the application locally to test
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a Pull Request

## 📄 License

MIT License

Copyright (c) 2025 Martin Pfeffer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 👨‍💻 Author

**Martin Pfeffer**
- Email: martinpaush@gmail.com
- GitHub: [@pepperonas](https://github.com/pepperonas)

---

⭐ Star this repository if you find it helpful!