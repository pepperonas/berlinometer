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
  const [dataTimestamp, setDataTimestamp] = useState(null)
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true)

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

  // Lade automatisch die letzten Scraping-Daten beim Start
  useEffect(() => {
    loadLatestScrapingData()
  }, [])

  // Sortiere Ergebnisse wenn Scraping abgeschlossen ist
  useEffect(() => {
    if (!isScrapingActive && unsortedResults.length > 0) {
      const sorted = sortResultsByOccupancy(unsortedResults)
      setResults(sorted)
    }
  }, [isScrapingActive, unsortedResults])

  const loadLatestScrapingData = async () => {
    try {
      setIsLoadingInitialData(true)
      const response = await fetch(`https://mrx3k1.de/api/popular-times/latest-scraping`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.data && data.data.results) {
          const sortedResults = sortResultsByOccupancy(data.data.results)
          setResults(sortedResults)
          setUnsortedResults(data.data.results)
          setDataTimestamp(data.data.timestamp)
          console.log(`✅ Initial data loaded: ${data.data.total_locations} Locations`)
        }
      }
    } catch (error) {
      console.log('Keine vorherigen Scraping-Daten verfügbar')
    } finally {
      setIsLoadingInitialData(false)
    }
  }



  const handleStartScraping = async (urls) => {
    setIsScrapingActive(true)
    setProgress(0)
    setResults([])
    setUnsortedResults([])
    setBatchInfo(null)
    
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
                setDataTimestamp(new Date().toISOString())
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
          {/* Zeitstempel-Überschrift */}
          {results.length > 0 && dataTimestamp && !isScrapingActive && (
            <div className="text-center" style={{
              padding: '1rem 0',
              borderBottom: '1px solid var(--gray-3)',
              marginBottom: '0.5rem'
            }}>
              <h3 style={{ 
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '0.25rem'
              }}>
                Aktuelle Auslastungsdaten
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
              }}>
                Stand: {new Date(dataTimestamp).toLocaleString('de-DE', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
            </div>
          )}
          
          {/* Stimmungsbarometer und Ergebnisse (oben) */}
          {results.length > 0 && (
            <>
              <MoodBarometer results={results} />
              <ResultsDisplay results={results} />
            </>
          )}
          
          {/* Scraping Section (unten) */}
          <DefaultLocations 
            onStartScraping={handleStartScraping}
            isScrapingActive={isScrapingActive}
            onShowAbout={() => setShowAboutDialog(true)}
          />
          
          {/* Progress Bar beim aktiven Scraping */}
          {isScrapingActive && (
            <ProgressBar 
              progress={progress}
              currentLocation={currentLocation}
              batchInfo={batchInfo}
            />
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
