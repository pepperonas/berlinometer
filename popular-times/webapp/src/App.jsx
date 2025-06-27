import { useState } from 'react'
import URLInput from './components/URLInput'
import DefaultLocations from './components/DefaultLocations'
import ProgressBar from './components/ProgressBar'
import ResultsDisplay from './components/ResultsDisplay'
import AboutDialog from './components/AboutDialog'

function App() {
  const [activeTab, setActiveTab] = useState('default') // 'default' or 'manual'
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
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <h1>Popular Times</h1>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowAboutDialog(true)}
              style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
            >
              Über die App
            </button>
          </div>
          <p className="text-secondary">
            Analysiere die Auslastung von Google Maps Locations in Echtzeit
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6" style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Tab Navigation */}
          <div style={{ 
            backgroundColor: 'var(--background-darker)', 
            borderRadius: 'var(--radius-lg)',
            padding: '4px',
            marginBottom: '1rem'
          }}>
            <div className="flex" style={{ gap: '4px' }}>
              <button
                style={{ 
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  backgroundColor: activeTab === 'default' ? 'var(--background)' : 'transparent',
                  color: activeTab === 'default' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === 'default' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
                onClick={() => setActiveTab('default')}
                onMouseEnter={(e) => {
                  if (activeTab !== 'default') {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'default') {
                    e.target.style.backgroundColor = 'transparent'
                  }
                }}
              >
                Default
              </button>
              <button
                style={{ 
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  backgroundColor: activeTab === 'manual' ? 'var(--background)' : 'transparent',
                  color: activeTab === 'manual' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === 'manual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
                onClick={() => setActiveTab('manual')}
                onMouseEnter={(e) => {
                  if (activeTab !== 'manual') {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'manual') {
                    e.target.style.backgroundColor = 'transparent'
                  }
                }}
              >
                Manuell
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'default' ? (
            <DefaultLocations 
              onStartScraping={handleStartScraping}
              isScrapingActive={isScrapingActive}
            />
          ) : (
            <URLInput 
              onStartScraping={handleStartScraping}
              isScrapingActive={isScrapingActive}
            />
          )}
          
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
      
      <AboutDialog 
        isOpen={showAboutDialog}
        onClose={() => setShowAboutDialog(false)}
      />
    </div>
  )
}

export default App
