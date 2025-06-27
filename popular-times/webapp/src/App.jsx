import { useState } from 'react'
import DefaultLocations from './components/DefaultLocations'
import ProgressBar from './components/ProgressBar'
import ResultsDisplay from './components/ResultsDisplay'
import AboutDialog from './components/AboutDialog'

function App() {
  const [isScrapingActive, setIsScrapingActive] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentLocation, setCurrentLocation] = useState('')
  const [batchInfo, setBatchInfo] = useState(null)
  const [results, setResults] = useState([])
  const [showAboutDialog, setShowAboutDialog] = useState(false)


  const handleStartScraping = async (urls) => {
    setIsScrapingActive(true)
    setProgress(0)
    setResults([])
    setBatchInfo(null)
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5044'}/scrape`, {
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
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="text-center mb-8">
          <h1>🍷 Popular Times</h1>
          <p className="text-secondary">
            Analysiere die Auslastung von Google Maps Locations in Echtzeit
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6" style={{ maxWidth: '800px', margin: '0 auto' }}>
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
          
          {results.length > 0 && (
            <ResultsDisplay results={results} />
          )}
        </div>

      </div>
      
      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '2rem 1rem 1rem 1rem',
        color: 'var(--text-secondary)',
        fontSize: '0.875rem',
        opacity: 0.7
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
