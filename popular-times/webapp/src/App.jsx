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

  // Load existing results on component mount
  useEffect(() => {
    const loadExistingResults = async () => {
      try {
        console.log('Attempting to load existing results...')
        const response = await fetch(`${import.meta.env.VITE_API_URL}/latest-scraping`)
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
    
    loadExistingResults()
  }, [])

  // Sortiere Ergebnisse wenn Scraping abgeschlossen ist
  useEffect(() => {
    if (!isScrapingActive && unsortedResults.length > 0) {
      const sorted = sortResultsByOccupancy(unsortedResults)
      setResults(sorted)
    }
  }, [isScrapingActive, unsortedResults])


  const handleStartScraping = async (urls) => {
    setIsScrapingActive(true)
    setProgress(0)
    setResults([])
    setUnsortedResults([])
    setBatchInfo(null)
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/scrape`, {
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
          {isScrapingActive && (
            <ProgressBar 
              progress={progress}
              currentLocation={currentLocation}
              batchInfo={batchInfo}
            />
          )}
          
          {results.length > 0 && (
            <>
              <MoodBarometer results={results} />
              <ResultsDisplay results={results} />
            </>
          )}
          
          <DefaultLocations 
            onStartScraping={handleStartScraping}
            isScrapingActive={isScrapingActive}
            onShowAbout={() => setShowAboutDialog(true)}
          />
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
