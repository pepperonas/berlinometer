import { useState, useEffect } from 'react'
import ResultsDisplay from '../components/ResultsDisplay'
import MoodBarometer from '../components/MoodBarometer'
import AboutDialog from '../components/AboutDialog'
import AuthDialog from '../components/AuthDialog'
import UserProfile from '../components/UserProfile'
import UserLocations from '../components/UserLocations'
import CookieBanner from '../components/CookieBanner'
import ActionBar from '../components/layout/ActionBar'
import SideDrawer from '../components/layout/SideDrawer'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useNavigate } from 'react-router-dom'

function HomePage() {
  const { user, token, loading, login, logout, getAuthHeaders } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [results, setResults] = useState([])
  const [showAboutDialog, setShowAboutDialog] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [showUserLocations, setShowUserLocations] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Handle navigation from drawer
  const handleDrawerNavigation = (itemId) => {
    switch (itemId) {
      case 'locations':
        setShowUserLocations(true)
        break
      case 'profile':
        setShowUserProfile(true)
        break
      case 'about':
        setShowAboutDialog(true)
        break
      default:
        break
    }
  }


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
        error: t('errorLoadingHistory'),
        location_name: t('errorLoadingHistory'),
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
      {/* ActionBar */}
      <ActionBar
        onMenuClick={() => setIsDrawerOpen(true)}
        showLoginButton={!user}
        showMenuButton={!!user}
        onLoginClick={() => setShowAuthDialog(true)}
      />

      {/* SideDrawer (only when logged in) */}
      {user && (
        <SideDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          user={user}
          onNavigate={handleDrawerNavigation}
          onLogout={logout}
        />
      )}

      <div className="container" style={{
        paddingTop: window.innerWidth <= 480 ? 'calc(56px + 1rem)' : 'calc(60px + 1.5rem)', // ActionBar height + spacing
        paddingBottom: '2rem',
        paddingLeft: '1rem',
        paddingRight: '1rem'
      }}>
        <div className="text-center mb-6">
          {/* Subtitle */}
          <p className="text-secondary" style={{
            fontSize: window.innerWidth <= 480 ? '0.75rem' : 'clamp(0.875rem, 2.5vw, 1rem)',
            lineHeight: '1.4',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {t('berlinometerSubtitle')}
            {user && (
              <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.8 }}>
                {t('resultsFilteredByProfile')}
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
              <ResultsDisplay results={results} user={user} token={token} />
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
                🔄 {t('automatedScrapingActive')}
              </h3>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                lineHeight: '1.6',
                maxWidth: '400px',
                margin: '0 auto 1.5rem auto'
              }}>
                {t('automatedScrapingDescription')}
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
                📋 {t('aboutTheApp')}
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
          {t('missingLocation')}
        </p>
        <a
          href={`mailto:martin.pfeffer@celox.io?subject=${encodeURIComponent(t('emailSubjectNewLocation'))}`}
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
        <div style={{ marginBottom: '0.75rem' }}>
          {t('madeWith')}
        </div>

        {/* Social Links */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <a
            href="https://www.linkedin.com/in/martin-pfeffer-020831134/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--text-secondary)',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--accent-blue)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
            title="LinkedIn"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          </a>
          <a
            href="https://github.com/pepperonas"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--text-secondary)',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--accent-blue)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
            title="GitHub"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </div>

        <div style={{
          fontSize: '0.75rem',
          opacity: 0.6,
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <a
            href="https://celox.io/impressum"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            {t('imprint')}
          </a>
          <a
            href="https://celox.io/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            {t('privacy')}
          </a>
          <span style={{
            color: 'var(--text-secondary)',
            fontSize: '0.7rem',
            opacity: 0.5
          }}>
            v2.7.2
          </span>
        </div>
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

      <UserProfile
        isOpen={showUserProfile && !!user && !!token}
        user={user}
        token={token}
        onLogout={() => {
          logout()
          setShowUserProfile(false)
        }}
        onClose={() => setShowUserProfile(false)}
      />

      <UserLocations
        isOpen={showUserLocations && !!user && !!token}
        onClose={() => setShowUserLocations(false)}
        onLocationsSaved={() => {
          // Reload the latest results after scraping user locations
          loadExistingResults()
        }}
      />

      <CookieBanner />
    </div>
  )
}

export default HomePage