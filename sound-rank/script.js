let currentGenre = 'italo-disco';
let currentAI = 'claude';
let allTracks = [];
let filteredTracks = [];

const genreSelect = document.getElementById('genre');
const aiSelect = document.getElementById('ai-source');
const searchInput = document.getElementById('search');
const tracksGrid = document.getElementById('tracks-grid');
const loadingDiv = document.querySelector('.loading');
const noResultsDiv = document.getElementById('no-results');
const totalTracksEl = document.getElementById('total-tracks');
const filteredTracksEl = document.getElementById('filtered-tracks');
const currentGenreEl = document.getElementById('current-genre');
const currentAIEl = document.getElementById('current-ai');

// Genre-Namen für Anzeige
const genreNames = {
    'italo-disco': 'Italo Disco',
    'nu-disco': 'Nu Disco'
};

// AI-Namen für Anzeige
const aiNames = {
    'claude': 'Claude',
    'grok': 'Grok'
};

// CSV Parser für das neue Format (Artist,Title,Year,Description)
function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length === 0) return [];
    
    const tracks = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse CSV mit Anführungszeichen-Unterstützung
        const values = parseCSVLine(line);
        
        if (values.length >= 4) {
            tracks.push({
                rank: i,
                artist: values[0].replace(/^"|"$/g, ''),
                title: values[1].replace(/^"|"$/g, ''),
                year: values[2],
                description: values[3].replace(/^"|"$/g, '')
            });
        }
    }
    
    return tracks;
}

// Hilfsfunktion zum Parsen von CSV-Zeilen mit Anführungszeichen
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

// Tracks laden
async function loadTracks(genre, ai) {
    loadingDiv.style.display = 'block';
    tracksGrid.style.display = 'none';
    noResultsDiv.style.display = 'none';
    
    try {
        const response = await fetch(`data/${genre}-${ai}.csv`);
        if (!response.ok) {
            throw new Error('CSV-Datei nicht gefunden');
        }
        
        const csvText = await response.text();
        allTracks = parseCSV(csvText);
        
        filterTracks();
    } catch (error) {
        console.error('Fehler beim Laden der Tracks:', error);
        loadingDiv.style.display = 'none';
        noResultsDiv.style.display = 'block';
        noResultsDiv.innerHTML = '<p>Fehler beim Laden der Daten. Bitte CSV-Dateien in /data/ bereitstellen.</p>';
    }
}

// Tracks filtern
function filterTracks() {
    const searchTerm = searchInput.value.toLowerCase();
    
    if (searchTerm) {
        filteredTracks = allTracks.filter(track => {
            return (
                (track.title && track.title.toLowerCase().includes(searchTerm)) ||
                (track.artist && track.artist.toLowerCase().includes(searchTerm)) ||
                (track.description && track.description.toLowerCase().includes(searchTerm))
            );
        });
    } else {
        filteredTracks = [...allTracks];
    }
    
    updateStats();
    displayTracks();
}

// Tracks anzeigen
function displayTracks() {
    loadingDiv.style.display = 'none';
    
    if (filteredTracks.length === 0) {
        tracksGrid.style.display = 'none';
        noResultsDiv.style.display = 'block';
        noResultsDiv.innerHTML = '<p>Keine Tracks gefunden</p>';
        return;
    }
    
    noResultsDiv.style.display = 'none';
    tracksGrid.style.display = 'grid';
    
    tracksGrid.innerHTML = filteredTracks.map(track => {
        const searchQuery = encodeURIComponent(`${track.artist || ''} ${track.title || ''}`);
        const googleSearchUrl = `https://www.google.com/search?q=${searchQuery}`;
        const spotifySearchUrl = `https://open.spotify.com/search/${searchQuery}`;
        
        return `
        <div class="track-card">
            <div class="track-rank">#${track.rank || ''}</div>
            <div class="track-info">
                <div class="track-title">${track.title || 'Unbekannter Track'}</div>
                <div class="track-artist">${track.artist || 'Unbekannter Künstler'}</div>
                <div class="track-description">${track.description || ''}</div>
            </div>
            <div class="track-actions">
                ${track.year ? `<div class="track-year">${track.year}</div>` : ''}
                <div class="action-buttons">
                    <a href="${googleSearchUrl}" target="_blank" rel="noopener noreferrer" class="search-link google-link" title="Bei Google suchen: ${track.artist || ''} - ${track.title || ''}">
                        <span class="google-g">G</span>
                    </a>
                    <a href="${spotifySearchUrl}" target="_blank" rel="noopener noreferrer" class="search-link spotify-link" title="In Spotify öffnen: ${track.artist || ''} - ${track.title || ''}">
                        <span class="spotify-icon">♫</span>
                    </a>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Statistiken aktualisieren
function updateStats() {
    totalTracksEl.textContent = allTracks.length;
    filteredTracksEl.textContent = filteredTracks.length;
    currentGenreEl.textContent = genreNames[currentGenre];
    currentAIEl.textContent = aiNames[currentAI];
}

// Event Listeners
genreSelect.addEventListener('change', (e) => {
    currentGenre = e.target.value;
    loadTracks(currentGenre, currentAI);
});

aiSelect.addEventListener('change', (e) => {
    currentAI = e.target.value;
    loadTracks(currentGenre, currentAI);
});

searchInput.addEventListener('input', filterTracks);

// Initial laden
loadTracks(currentGenre, currentAI);