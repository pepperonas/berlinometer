# Sound Rank

A modern web application for exploring curated music charts across different genres. Discover the top 200 tracks in various musical styles, from classic 80s hits to modern nu-disco, all ranked and described by AI sources.

![Sound Rank Preview](sound-rank.jpg)

## Features

- **5 Music Genres**: 80s, Italo Disco, Nu Disco, Postmodern Jukebox, Rock
- **AI-Curated Lists**: Compare rankings from Claude and Grok AI sources
- **200 Tracks per Genre**: Comprehensive coverage with detailed descriptions
- **Real-time Search**: Filter tracks by artist, title, or description
- **Interactive UI**: Modern dark theme with responsive design
- **External Links**: Direct integration with Google Search and Spotify
- **Dynamic Loading**: Automatically detects available CSV files
- **Mobile Optimized**: Responsive grid layout for all devices

## Quick Start

1. Open `index.html` in a web browser
2. Select a genre from the dropdown
3. Choose an AI source (Claude or Grok)
4. Browse the ranked tracks or use the search function

## File Structure

```
sound-rank/
├── index.html          # Main application file
├── script.js           # JavaScript functionality
├── styles.css          # CSS styling
├── genres.json         # Genre configuration
├── get-genres.php      # PHP backend (optional)
├── sound-rank.jpg      # Preview image
└── data/              # CSV track data
    ├── 80s_claude.csv
    ├── 80s_grok.csv
    ├── italo-disco_claude.csv
    ├── italo-disco_grok.csv
    ├── nu-disco_claude.csv
    ├── nu-disco_grok.csv
    ├── postmodern-jukebox_claude.csv
    ├── postmodern-jukebox_grok.csv
    ├── rock_claude.csv
    └── rock_grok.csv
```

## Data Format

Each CSV file contains 200 tracks with the following structure:

```csv
Artist,Title,Year,Description
"Artist Name","Track Title",Year,"Detailed description of the track"
```

### Example Entry
```csv
"Daft Punk","Get Lucky",2013,"Iconic Nu Disco anthem with Nile Rodgers guitar and Pharrell vocals"
```

## Technical Details

### Frontend Technologies
- **Vanilla JavaScript**: No external dependencies
- **CSS Grid**: Responsive layout system
- **Fetch API**: Dynamic data loading
- **Local Storage**: User preferences

### Data Loading
The application uses a hierarchical loading system:
1. **JSON Configuration**: `genres.json` (primary)
2. **PHP Backend**: `get-genres.php` (fallback)
3. **Static Detection**: Direct CSV file testing (final fallback)

### CSV Parser
Custom CSV parser handles:
- Quoted fields with commas
- Multi-line descriptions
- Special characters and unicode

## Adding New Genres

1. Create CSV files following the naming convention: `{genre}_{ai-source}.csv`
2. Update `genres.json` with the new genre name
3. Ensure each file contains exactly 200 unique tracks

### Genre Name Formatting
- `italo-disco` → "Italo Disco"
- `nu-disco` → "Nu Disco"
- `postmodern-jukebox` → "Postmodern Jukebox"
- `80s` → "80s"
- `rock` → "Rock"

## Search Functionality

The search feature filters tracks across:
- Artist names
- Track titles
- Descriptions

Results update in real-time as you type, with track count statistics.

## External Integrations

### Google Search
Each track includes a Google search link with pre-formatted queries:
```
https://www.google.com/search?q={artist}+{title}
```

### Spotify Integration
Direct Spotify search links for immediate music discovery:
```
https://open.spotify.com/search/{artist}+{title}
```

## Browser Compatibility

- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Mobile Support**: iOS Safari, Chrome Mobile, Samsung Internet
- **Required APIs**: Fetch API, CSS Grid, ES6 features

## Performance

- **Lazy Loading**: CSV files loaded on demand
- **Efficient Parsing**: Optimized CSV processing
- **Responsive Design**: Smooth performance on all devices
- **Minimal Dependencies**: Fast loading times

## SEO Features

- **Open Graph**: Rich social media previews
- **Structured Data**: Schema.org markup for search engines
- **Meta Tags**: Comprehensive SEO optimization
- **Mobile Optimization**: Responsive viewport settings

## Analytics

The application includes Google Analytics tracking for:
- Page views
- Genre selections
- Search queries
- External link clicks

Analytics ID: `G-CFB9X06V8L`

## Development

### Local Development
No build process required - simply serve the files via HTTP:

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve .

# PHP
php -S localhost:8080
```

### Adding Tracks
1. Edit the appropriate CSV file in `/data/`
2. Follow the existing format
3. Ensure no duplicate entries
4. Maintain 200 tracks per file

### Modifying Styles
The CSS uses CSS custom properties for easy theming:

```css
:root {
    --primary-bg: #1a1d29;
    --secondary-bg: #2b2e3b;
    --accent-color: #6c5ce7;
    --text-primary: #ffffff;
    --text-secondary: #a0a0a0;
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your changes
4. Test across different browsers
5. Submit a pull request

## License

This project is part of the mrx3k1.de web application portfolio. See the main repository for licensing information.

## Support

For issues or feature requests, please contact the development team through the main mrx3k1.de portal.

---

**Sound Rank** - Discover music through AI-curated charts