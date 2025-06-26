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
  const [results, setResults] = useState([])
  const [showAboutDialog, setShowAboutDialog] = useState(false)
  const [scrapingLogs, setScrapingLogs] = useState([])
  const [showScrapingDebug, setShowScrapingDebug] = useState(true)

  // Debug-Funktion für Scraping-Logs
  const addScrapingLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const newLog = {
      id: Date.now(),
      timestamp,
      message,
      type // 'info', 'success', 'warning', 'error'
    }
    setScrapingLogs(prev => [newLog, ...prev.slice(0, 99)]) // Keep only last 100 logs
  }

  const clearScrapingLogs = () => {
    setScrapingLogs([])
  }

  const handleStartScraping = async (urls) => {
    setIsScrapingActive(true)
    setProgress(0)
    setResults([])
    setScrapingLogs([]) // Clear logs on new scraping
    
    addScrapingLog(`🚀 Scraping gestartet für ${urls.length} URLs`, 'info')
    
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

      addScrapingLog(`📡 Verbindung zum Server hergestellt (Status: ${response.status})`, 'success')

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
                addScrapingLog(`⏳ Fortschritt: ${data.progress}% (${data.current}/${data.total})${data.location ? ` - ${data.location}` : ''}`, 'info')
              } else if (data.type === 'result') {
                setResults(prev => [...prev, data.data])
                const result = data.data
                if (result.live_occupancy) {
                  addScrapingLog(`✅ ${result.location_name}: ${result.live_occupancy}`, 'success')
                } else if (result.error) {
                  addScrapingLog(`❌ ${result.location_name}: ${result.error}`, 'error')
                } else {
                  addScrapingLog(`⚠️ ${result.location_name}: Keine Auslastungsdaten`, 'warning')
                }
              } else if (data.type === 'complete') {
                setIsScrapingActive(false)
                setProgress(100)
                setCurrentLocation('')
                addScrapingLog(`🎉 Scraping abgeschlossen!`, 'success')
              } else if (data.type === 'error') {
                addScrapingLog(`❌ Server-Fehler: ${data.error}`, 'error')
              }
            } catch (e) {
              console.warn('Failed to parse JSON:', line)
              addScrapingLog(`⚠️ Unbekannte Server-Nachricht: ${line.substring(0, 100)}...`, 'warning')
            }
          }
        }
      }
    } catch (error) {
      console.error('Scraping error:', error)
      addScrapingLog(`❌ Kritischer Fehler: ${error.message}`, 'error')
      setIsScrapingActive(false)
      setProgress(0)
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
            />
          )}
          
          {results.length > 0 && (
            <ResultsDisplay results={results} />
          )}
        </div>

        {/* Scraping Debug-Card - ganz unten außerhalb des Containers */}
        {(scrapingLogs.length > 0 || isScrapingActive) && (
          <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div className="card">
                <div className="card-header" style={{ paddingBottom: '0.5rem' }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 style={{ fontSize: '1rem', margin: 0 }}>🔧 Scraping Debug-Protokoll</h4>
                      <p style={{ fontSize: '0.875rem', margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>
                        Live-Debugging des Scraping-Prozesses
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => setShowScrapingDebug(!showScrapingDebug)}
                      >
                        {showScrapingDebug ? '🔽 Ausblenden' : '🔼 Einblenden'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={clearScrapingLogs}
                      >
                        🗑️ Leeren
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => {
                          const logText = scrapingLogs
                            .map(log => `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`)
                            .join('\n')
                          navigator.clipboard.writeText(logText)
                            .then(() => addScrapingLog('📋 Logs in die Zwischenablage kopiert', 'success'))
                            .catch(() => addScrapingLog('❌ Fehler beim Kopieren der Logs', 'error'))
                        }}
                        disabled={scrapingLogs.length === 0}
                      >
                        📋 Kopieren
                      </button>
                    </div>
                  </div>
                </div>
                
                {showScrapingDebug && (
                  <div style={{ maxHeight: '400px', overflowY: 'auto', padding: 'var(--spacing-4)' }}>
                    {scrapingLogs.length === 0 ? (
                      <div className="text-center text-secondary">
                        <p>Keine Scraping-Logs vorhanden</p>
                        <p className="text-xs mt-2">Starten Sie einen Scraping-Vorgang um Debug-Informationen zu sehen</p>
                      </div>
                    ) : (
                      <div className="debug-logs">
                        {scrapingLogs.map((log) => (
                          <div 
                            key={log.id} 
                            className={`debug-log debug-log-${log.type}`}
                            style={{
                              padding: '0.5rem',
                              marginBottom: '0.5rem',
                              borderRadius: 'var(--radius)',
                              border: '1px solid',
                              borderColor: log.type === 'error' ? 'var(--accent-red)' : 
                                         log.type === 'warning' ? '#ff9800' :
                                         log.type === 'success' ? 'var(--accent-green)' : 'rgba(255, 255, 255, 0.2)',
                              backgroundColor: log.type === 'error' ? 'rgba(225, 97, 98, 0.1)' : 
                                             log.type === 'warning' ? 'rgba(255, 152, 0, 0.1)' :
                                             log.type === 'success' ? 'rgba(156, 182, 143, 0.1)' : 'rgba(255, 255, 255, 0.05)'
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div style={{ flex: 1, wordBreak: 'break-word' }}>
                                <span style={{ 
                                  color: log.type === 'error' ? 'var(--accent-red)' : 
                                       log.type === 'warning' ? '#ff9800' :
                                       log.type === 'success' ? 'var(--accent-green)' : 'var(--text-primary)',
                                  fontWeight: '500'
                                }}>
                                  {log.message}
                                </span>
                              </div>
                              <span style={{ 
                                color: 'var(--text-secondary)', 
                                fontSize: '0.75rem',
                                marginLeft: '0.5rem',
                                whiteSpace: 'nowrap'
                              }}>
                                {log.timestamp}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <AboutDialog 
        isOpen={showAboutDialog}
        onClose={() => setShowAboutDialog(false)}
      />
    </div>
  )
}

export default App
