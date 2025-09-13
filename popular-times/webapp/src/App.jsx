import { useState, useEffect } from 'react'
import ResultsDisplay from './components/ResultsDisplay'
import MoodBarometer from './components/MoodBarometer'
import AboutDialog from './components/AboutDialog'
import AuthDialog from './components/AuthDialog'
import UserProfile from './components/UserProfile'
import UserLocations from './components/UserLocations'
import { useAuth } from './contexts/AuthContext'

function App() {
  const { user, token, loading, login, logout, getAuthHeaders } = useAuth()
  const [results, setResults] = useState([])
  const [showAboutDialog, setShowAboutDialog] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [showUserLocations, setShowUserLocations] = useState(false)


  // Funktion zum Extrahieren der Auslastung in Prozent
  const extractOccupancyPercentage = (occupancyText) => {
    if (!occupancyText || typeof occupancyText !== 'string') return -1
    
    // Suche nach "zu X %" Pattern
    const match = occupancyText.match(/zu\s+(\d+)\s*%/)
    if (match) {
      return parseInt(match[1])
    }
    
    // Wenn kein Prozentsatz gefunden wurde
    return -1
  }

  // Sortiere Ergebnisse nach Auslastung
  const sortResultsByOccupancy = (results) => {
    return [...results].sort((a, b) => {
      const occupancyA = extractOccupancyPercentage(a.live_occupancy)
      const occupancyB = extractOccupancyPercentage(b.live_occupancy)
      const isLiveA = a.is_live_data === true
      const isLiveB = b.is_live_data === true
      
      // Live-Daten haben höchste Priorität
      if (isLiveA && !isLiveB) return -1
      if (!isLiveA && isLiveB) return 1
      
      // Wenn beide live oder beide nicht live sind
      if (isLiveA === isLiveB) {
        // Locations ohne Daten ans Ende
        if (occupancyA === -1 && occupancyB === -1) return 0
        if (occupancyA === -1) return 1
        if (occupancyB === -1) return -1
        
        // Höhere Auslastung zuerst
        return occupancyB - occupancyA
      }
      
      return 0
    })
  }

  // Function to load existing results
  const loadExistingResults = async () => {
    try {
      console.log('Attempting to load existing results...')
      const headers = {
        ...getAuthHeaders()
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/latest-scraping`, {
        headers
      })
      console.log('Response status:', response.status, response.statusText)
      
      if (response.ok) {
        const text = await response.text()
        console.log('Response text length:', text.length)
        
        let data
        try {
          data = JSON.parse(text)
        } catch (parseError) {
          console.error('JSON parsing error:', parseError)
          throw new Error('Invalid JSON format')
        }
        
        // Handle different JSON formats
        let resultsArray = []
        if (Array.isArray(data)) {
          resultsArray = data
        } else if (data && data.data && Array.isArray(data.data.results)) {
          // API format: {data: {results: [...]}}
          resultsArray = data.data.results
        } else if (data && Array.isArray(data.results)) {
          resultsArray = data.results
        } else if (data && data.locations && Array.isArray(data.locations)) {
          resultsArray = data.locations
        }
        
        console.log('Parsed results array length:', resultsArray.length)
        
        if (resultsArray.length > 0) {
          console.log('Loaded existing results:', resultsArray.length, 'locations')
          const sorted = sortResultsByOccupancy(resultsArray)
          setResults(sorted)
        } else {
          console.log('No results found in JSON data')
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error loading existing results:', error)
      // Show error message in UI
      setResults([{
        error: 'Fehler beim Laden der Historie',
        location_name: 'Fehler beim Laden der Historie',
        timestamp: new Date().toISOString()
      }])
    }
  }

  // Load existing results on component mount
  useEffect(() => {
    if (loading) return; // Wait for auth to load
    loadExistingResults()
  }, [loading, getAuthHeaders])

  // Auto-refresh results every 5 minutes to get latest scraping data
  useEffect(() => {
    const interval = setInterval(() => {
      loadExistingResults()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen">
      <div className="container" style={{ 
        paddingTop: '1.5rem', 
        paddingBottom: '2rem',
        paddingLeft: '1rem',
        paddingRight: '1rem'
      }}>
        <div className="text-center mb-6">
          {/* Authentication Controls */}
          <div style={{ 
            position: 'absolute', 
            top: '1rem', 
            right: '1rem',
            display: 'flex',
            gap: '0.5rem',
            zIndex: 100
          }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ 
                  color: 'var(--text-color)', 
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  Welcome, {user.username}
                </span>
                <button
                  onClick={() => setShowUserLocations(true)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  My Locations
                </button>
                <button
                  onClick={() => setShowUserProfile(true)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Profile
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthDialog(true)}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Login / Register
              </button>
            )}
          </div>

          <h1 style={{ 
            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
            marginBottom: '0.75rem',
            lineHeight: '1.2'
          }}>🍷 Berlinometer</h1>
          <p className="text-secondary" style={{
            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
            lineHeight: '1.4',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Analysiere die Auslastung von Google Maps Locations in Echtzeit
            {user && (
              <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8 }}>
                Results are filtered based on your profile settings
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4" style={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          padding: '0'
        }}>          
          {results.length > 0 ? (
            <>
              <MoodBarometer results={results} />
              <ResultsDisplay results={results} />
            </>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              background: 'var(--card-bg)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
              <h3 style={{ 
                marginBottom: '1rem',
                color: 'var(--text-color)'
              }}>
                🔄 Automatisches Scraping aktiv
              </h3>
              <p style={{ 
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                lineHeight: '1.6',
                maxWidth: '400px',
                margin: '0 auto 1.5rem auto'
              }}>
                Die Locations werden automatisch alle 20-30 Minuten gescrapt. 
                Die neuesten Ergebnisse werden automatisch geladen.
              </p>
              <button
                onClick={() => setShowAboutDialog(true)}
                style={{
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                📋 Über die App
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Location request info */}
      <div style={{
        textAlign: 'center',
        padding: '2rem 1rem 1rem 1rem',
        color: 'var(--text-secondary)',
        fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <p style={{ marginBottom: '0.5rem', opacity: 0.8 }}>
          Dir fehlt eine Location?
        </p>
        <a 
          href="mailto:martin.pfeffer@celox.io?subject=Berlinometer - Neue Location vorschlagen" 
          style={{
            color: 'var(--primary-color)',
            textDecoration: 'none',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
        >
          📧 martin.pfeffer@celox.io
        </a>
      </div>
      
      {/* Mobile-optimized footer */}
      <footer style={{
        textAlign: 'center',
        padding: '1.5rem 1rem 1rem 1rem',
        color: 'var(--text-secondary)',
        fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
        opacity: 0.7,
        marginTop: 'auto'
      }}>
        Made with ❤️ by Martin Pfeffer
      </footer>
      
      <AboutDialog 
        isOpen={showAboutDialog}
        onClose={() => setShowAboutDialog(false)}
      />

      <AuthDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        onLogin={(userData, authToken) => {
          login(userData, authToken)
          setShowAuthDialog(false)
        }}
      />

      {showUserProfile && user && token && (
        <div className="auth-dialog-overlay" onClick={() => setShowUserProfile(false)}>
          <div className="auth-dialog-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="auth-dialog-close" 
              onClick={() => setShowUserProfile(false)} 
              aria-label="Close"
            >
              ×
            </button>
            <UserProfile
              user={user}
              token={token}
              onLogout={() => {
                logout()
                setShowUserProfile(false)
              }}
              onClose={() => setShowUserProfile(false)}
            />
          </div>
        </div>
      )}

      {showUserLocations && user && token && (
        <div className="auth-dialog-overlay" onClick={() => setShowUserLocations(false)}>
          <div className="auth-dialog-content" onClick={(e) => e.stopPropagation()}>
            <UserLocations
              onClose={() => setShowUserLocations(false)}
              onLocationsSaved={() => {
                // Reload the latest results after scraping user locations
                loadExistingResults()
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
