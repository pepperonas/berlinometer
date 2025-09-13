# Popular Times - Google Maps Occupancy Analyzer

A modern web application for analyzing Google Maps location occupancy data with automated scraping and user authentication. View real-time foot traffic data from Google Maps places with personalized location preferences.

![Popular Times Screenshot](popular-times.jpg)

## ✨ Features

- 🔐 **User Authentication**: Secure user registration and login system
- 📍 **Personal Location Lists**: Save and manage your favorite locations
- ⏰ **Automated Scraping**: Automatic data collection every 20-30 minutes
- 🎨 **Multiple Themes**: Dark, Light, and Psychedelic theme options
- 🌍 **Full Multilingual Support**: Complete German/English interface (v2.3.0+)
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- 🔍 **Smart Filtering**: Results filtered based on your saved locations (Beta)
- 📊 **Live Occupancy Data**: Real-time foot traffic information with dynamic translations
- 📈 **Historical Data**: 12-hour occupancy charts with trend analysis
- 📊 **Mood Barometer**: City-wide occupancy mood analysis
- 🚀 **High Performance**: Optimized Python backend with MySQL database
- 🔄 **PWA Support**: Progressive Web App with offline capabilities

## 🆕 Latest Updates (v2.3.1)

### Complete Multilingual Support
- Full German/English interface translation with 200+ translation keys
- Dynamic translation of server-side occupancy texts
- Language preference persistence in localStorage
- All UI components, dialogs, and messages translated
- Fixed hardcoded English text in filtered results message

### UI/UX Improvements
- Fixed dialog size consistency for user profile (600px fixed height)
- Added scrollable content wrapper for profile sections
- Renamed Filter tab to "Filter (Beta)" 
- Translated all theme names (Dark/Dunkel, Light/Hell, Psychedelic/Psychedelisch)
- Added "Contains Live Data" indicator with translations
- Improved mood barometer with localized descriptions
- Fixed "Tip/Tipp" translation in theme selection

### Technical Enhancements
- Optimized build configuration for berlinometer.de deployment
- Separated build outputs for different domains
- Fixed variable initialization order preventing runtime errors
- Added comprehensive deployment documentation (DEPLOYMENT.md)
- Resolved duplicate translation key warnings

## 🏗️ Architecture

### Frontend (React + Vite)
- **Framework**: React 19 with Vite build system
- **Styling**: Custom CSS with CSS variables for theming
- **API Communication**: Fetch API with Server-Sent Events for streaming
- **State Management**: React hooks for local state

### Backend (Python Flask)
- **Framework**: Flask with CORS support and JWT authentication
- **Web Scraping**: Playwright for automated Google Maps data extraction
- **Database**: MySQL for user management and location preferences
- **Authentication**: JWT tokens with bcrypt password hashing
- **API Design**: RESTful endpoints for user management and data access

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+
- **MySQL** 8.0+ database server
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

3. **Set up the database**:
   ```bash
   # Create MySQL database
   mysql -u root -p -e "CREATE DATABASE popular_times_db;"
   
   # Import the database schema
   mysql -u root -p popular_times_db < database_schema.sql
   ```

4. **Configure environment variables**:
   ```bash
   # Copy and edit the environment file
   cp .env.example .env
   # Edit .env with your database credentials
   ```

5. **Install frontend dependencies**:
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

### User Authentication

1. **Register**: Create a new account (admin activation required)
2. **Login**: Access your personalized dashboard
3. **My Locations**: Add and manage your favorite locations
4. **Profile**: Update your account settings

### Location Management

1. **Add Locations**: Search and save Google Maps locations
2. **Organize**: Drag and drop to reorder your location list
3. **Filter Results**: See only results from your saved locations
4. **Auto-Sync**: New locations are automatically scraped in the background

### Viewing Results

- **Automatic Updates**: Data refreshes every 20-30 minutes automatically
- **Live Data**: View real-time occupancy percentages when available
- **Personalized**: Results filtered based on your location preferences
- **Mood Barometer**: Visual overview of overall occupancy levels

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

### Authentication Endpoints

#### `POST /register`
Register a new user account.

**Request Body:**
```json
{
  "username": "user123",
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### `POST /login`
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "user123",
  "password": "securepassword"
}
```

### Location Management Endpoints

#### `GET /user-locations`
Get user's saved locations (requires authentication).

#### `POST /user-locations`
Add a new location to user's list (requires authentication).

**Request Body:**
```json
{
  "google_maps_url": "https://www.google.com/maps/place/Location+Name",
  "display_name": "Custom Location Name"
}
```

#### `DELETE /user-locations/{id}`
Remove a location from user's list (requires authentication).

### Data Endpoints

#### `GET /latest-scraping`
Get the latest scraping results, filtered by user's locations if authenticated.

## ⚙️ Configuration

### Environment Variables

Create a `.env` file for backend configuration:
```bash
# Required: Database configuration
MYSQL_HOST=localhost
MYSQL_USER=your_username
MYSQL_PASSWORD=your_secure_password
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
│   │   ├── components/         # React components
│   │   │   ├── AuthDialog.jsx  # Login/register modal
│   │   │   ├── UserProfile.jsx # User profile management
│   │   │   ├── UserLocations.jsx # Location management
│   │   │   └── ...            # Other UI components
│   │   ├── contexts/          # React contexts
│   │   │   └── AuthContext.jsx # Authentication state
│   │   ├── App.jsx            # Main application component
│   │   ├── index.css          # Global styles and CSS variables
│   │   └── main.jsx           # Application entry point
│   ├── package.json           # Frontend dependencies
│   └── vite.config.js         # Vite build configuration
├── server.py                   # Flask backend API server
├── database_schema.sql         # MySQL database schema
├── requirements.txt            # Python dependencies
├── .env.example               # Example environment configuration
├── .gitignore                 # Git ignore patterns (includes .env)
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

- **Security**: JWT authentication with bcrypt password hashing and secure session management
- **Database**: MySQL with proper indexing and foreign key constraints
- **Automated Scraping**: Background scraping runs every 20-30 minutes via scheduled tasks
- **Smart Filtering**: URL normalization for intelligent location matching
- **User Experience**: Personalized results based on saved location preferences
- **Performance**: Optimized queries and efficient data filtering
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