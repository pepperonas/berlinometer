import { useState, useEffect } from 'react'
import DefaultLocations from './components/DefaultLocations'
import ProgressBar from './components/ProgressBar'
import ResultsDisplay from './components/ResultsDisplay'
import MoodBarometer from './components/MoodBarometer'
import AboutDialog from './components/AboutDialog'

function App() {
  const [isScrapingActive, setIsScrapingActive] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentLocation, setCurrentLocation] = useState('')
  const [batchInfo, setBatchInfo] = useState(null)
  const [results, setResults] = useState([])
  const [showAboutDialog, setShowAboutDialog] = useState(false)
  const [unsortedResults, setUnsortedResults] = useState([])
  const [cachedResults, setCachedResults] = useState(null)
  const [lastUpdateTime, setLastUpdateTime] = useState(null)
  const [isLoadingCached, setIsLoadingCached] = useState(true)

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

  // Load cached results on startup
  const loadCachedResults = async () => {
    try {
      setIsLoadingCached(true)
      const response = await fetch(`https://mrx3k1.de/api/popular-times/latest-results`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.cached && data.results.length > 0) {
          const sortedResults = sortResultsByOccupancy(data.results)
          setResults(sortedResults)
          setCachedResults(data)
          setLastUpdateTime(new Date(data.timestamp))
          console.log(`Loaded ${data.results.length} cached results from ${data.age_minutes} minutes ago`)
        } else {
          console.log('No cached results available')
        }
      } else {
        console.warn('Failed to load cached results:', response.status)
      }
    } catch (error) {
      console.error('Error loading cached results:', error)
    } finally {
      setIsLoadingCached(false)
    }
  }

  // Manual refresh function
  const handleManualRefresh = async () => {
    try {
      const response = await fetch(`https://mrx3k1.de/api/popular-times/trigger-scraping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          console.log('Manual scraping triggered successfully')
          // Optionally show a notification to user
        }
      }
    } catch (error) {
      console.error('Error triggering manual refresh:', error)
    }
  }

  // Load cached results on component mount
  useEffect(() => {
    loadCachedResults()
  }, [])

  // Sortiere Ergebnisse wenn Scraping abgeschlossen ist
  useEffect(() => {
    if (!isScrapingActive && unsortedResults.length > 0) {
      const sorted = sortResultsByOccupancy(unsortedResults)
      setResults(sorted)
      // Clear cached results when new scraping results are available
      setCachedResults(null)
      setLastUpdateTime(new Date())
    }
  }, [isScrapingActive, unsortedResults])


  const handleStartScraping = async (urls) => {
    setIsScrapingActive(true)
    setProgress(0)
    setResults([])
    setUnsortedResults([])
    setBatchInfo(null)
    setCachedResults(null)  // Clear cached results when starting new scraping
    
    try {
      const response = await fetch(`https://mrx3k1.de/api/popular-times/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls })
      })

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`)
      }


      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line)
              
              if (data.type === 'progress') {
                console.log('Progress update received:', data) // Debug log
                setProgress(data.progress)
                setCurrentLocation(data.location || '')
                setBatchInfo(data.batchInfo || null)
              } else if (data.type === 'result') {
                setUnsortedResults(prev => [...prev, data.data])
                // Zeige Ergebnisse während des Scrapings unsortiert an
                setResults(prev => [...prev, data.data])
              } else if (data.type === 'complete') {
                setIsScrapingActive(false)
                setProgress(100)
                setCurrentLocation('')
                setBatchInfo(null)
              }
            } catch (e) {
              console.warn('Failed to parse JSON:', line)
            }
          }
        }
      }
    } catch (error) {
      console.error('Scraping error:', error)
      setIsScrapingActive(false)
      setProgress(0)
      setBatchInfo(null)
    }
  }

  // Format timestamp for display
  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Unbekannt'
    
    const now = new Date()
    const diffMinutes = Math.floor((now - timestamp) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Gerade eben'
    if (diffMinutes === 1) return 'Vor 1 Minute'
    if (diffMinutes < 60) return `Vor ${diffMinutes} Minuten`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours === 1) return 'Vor 1 Stunde'
    if (diffHours < 24) return `Vor ${diffHours} Stunden`
    
    return timestamp.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen">
      <div className="container" style={{ 
        paddingTop: '1.5rem', 
        paddingBottom: '2rem',
        paddingLeft: '1rem',
        paddingRight: '1rem'
      }}>
        <div className="text-center mb-6">
          <h1 style={{ 
            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
            marginBottom: '0.75rem',
            lineHeight: '1.2'
          }}>🍷 Popular Times</h1>
          <p className="text-secondary" style={{
            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
            lineHeight: '1.4',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Analysiere die Auslastung von Google Maps Locations in Echtzeit
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4" style={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          padding: '0'
        }}>
          <DefaultLocations 
            onStartScraping={handleStartScraping}
            isScrapingActive={isScrapingActive}
            onShowAbout={() => setShowAboutDialog(true)}
          />
          
          {isScrapingActive && (
            <ProgressBar 
              progress={progress}
              currentLocation={currentLocation}
              batchInfo={batchInfo}
            />
          )}
          
          {/* Loading indicator for cached results */}
          {isLoadingCached && results.length === 0 && !isScrapingActive && (
            <div style={{
              padding: '1rem',
              textAlign: 'center',
              background: 'var(--card-background)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <div>🔄 Lade gespeicherte Ergebnisse...</div>
            </div>
          )}
          
          {/* Timestamp and refresh button */}
          {(results.length > 0 || cachedResults) && !isScrapingActive && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              background: 'var(--card-background)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
            }}>
              <div style={{ color: 'var(--text-secondary)' }}>
                {cachedResults ? '📋 Gespeicherte Daten' : '🔴 Live Daten'} • 
                Letztes Update: {formatLastUpdate(lastUpdateTime)}
              </div>
              <button
                onClick={handleManualRefresh}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => e.target.style.opacity = '0.9'}
                onMouseOut={(e) => e.target.style.opacity = '1'}
              >
                🔄 Aktualisieren
              </button>
            </div>
          )}
          
          {results.length > 0 && (
            <>
              <MoodBarometer results={results} />
              <ResultsDisplay results={results} />
            </>
          )}
        </div>

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
    </div>
  )
}

export default App
