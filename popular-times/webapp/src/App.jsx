import { useState } from 'react'
import URLInput from './components/URLInput'
import ProgressBar from './components/ProgressBar'
import ResultsDisplay from './components/ResultsDisplay'

function App() {
  const [isScrapingActive, setIsScrapingActive] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentLocation, setCurrentLocation] = useState('')
  const [results, setResults] = useState([])

  const handleStartScraping = async (urls) => {
    setIsScrapingActive(true)
    setProgress(0)
    setResults([])
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5044'}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls })
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
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
                setProgress(data.progress)
                setCurrentLocation(data.location || '')
              } else if (data.type === 'result') {
                setResults(prev => [...prev, data.data])
              } else if (data.type === 'complete') {
                setIsScrapingActive(false)
                setProgress(100)
                setCurrentLocation('')
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
    }
  }

  return (
    <div className="min-h-screen">
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="text-center mb-8">
          <h1 className="mb-4">Popular Times</h1>
          <p className="text-secondary">
            Analysiere die Auslastung von Google Maps Locations in Echtzeit
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <URLInput 
            onStartScraping={handleStartScraping}
            isScrapingActive={isScrapingActive}
          />
          
          {isScrapingActive && (
            <ProgressBar 
              progress={progress}
              currentLocation={currentLocation}
            />
          )}
          
          {results.length > 0 && (
            <ResultsDisplay results={results} />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
