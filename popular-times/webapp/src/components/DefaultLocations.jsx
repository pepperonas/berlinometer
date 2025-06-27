import { useState, useEffect } from 'react'

function DefaultLocations({ onStartScraping, isScrapingActive, onShowAbout }) {
  const [locations, setLocations] = useState([])
  const [selectedLocations, setSelectedLocations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDefaultLocations()
  }, [])

  const fetchDefaultLocations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`https://mrx3k1.de/api/popular-times/default-locations`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch locations: ${response.status}`)
      }
      
      const data = await response.json()
      // Sort locations: active (aktiv=1) first, then inactive (aktiv=0)
      const sortedLocations = (data.locations || []).sort((a, b) => {
        if (a.aktiv === b.aktiv) return 0
        return b.aktiv - a.aktiv // 1 before 0
      })
      setLocations(sortedLocations)
      // Select only active locations by default (aktiv = 1)
      setSelectedLocations(sortedLocations.filter(loc => loc.aktiv === 1).map(loc => loc.url) || [])
    } catch (err) {
      console.error('Error fetching default locations:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleLocation = (url) => {
    setSelectedLocations(prev => {
      if (prev.includes(url)) {
        return prev.filter(u => u !== url)
      } else {
        return [...prev, url]
      }
    })
  }

  const handleSelectAll = () => {
    setSelectedLocations(locations.map(loc => loc.url))
  }

  const handleSelectNone = () => {
    setSelectedLocations([])
  }

  const handleStartScraping = () => {
    if (selectedLocations.length === 0) {
      alert('Bitte wählen Sie mindestens eine Location aus')
      return
    }
    onStartScraping(selectedLocations)
  }

  if (isLoading) {
    return (
      <div className="card">
        <div className="text-center p-8">
          <div className="loading mb-4"></div>
          <p>Lade Standard-Locations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center p-8">
          <p className="text-accent-red mb-4">❌ Fehler beim Laden der Locations</p>
          <p className="text-secondary">{error}</p>
          <button 
            className="btn btn-secondary mt-4"
            onClick={fetchDefaultLocations}
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="card-title">Standard Locations</h3>
            <p className="card-description">
              Wählen Sie die Locations aus, deren Auslastung Sie analysieren möchten
            </p>
          </div>
          <button 
            onClick={onShowAbout}
            style={{
              padding: '10px',
              backgroundColor: 'transparent',
              border: '1px solid var(--gray-3)',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              marginLeft: '16px',
              width: '40px',
              height: '40px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--gray-2)'
              e.target.style.borderColor = 'var(--gray-4)'
              e.target.querySelector('svg').style.stroke = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
              e.target.style.borderColor = 'var(--gray-3)'
              e.target.querySelector('svg').style.stroke = 'var(--text-secondary)'
            }}
            title="Über die App"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ 
                transition: 'all 0.2s ease'
              }}
            >
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <circle cx="12" cy="17" r="1" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Mobile-optimized button layout */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex gap-2">
            <button 
              className="btn btn-sm btn-outline flex-1"
              onClick={handleSelectAll}
            >
              Alle auswählen
            </button>
            <button 
              className="btn btn-sm btn-outline flex-1"
              onClick={handleSelectNone}
            >
              Keine auswählen
            </button>
          </div>
          <div className="text-center text-sm text-secondary">
            {selectedLocations.length} von {locations.length} ausgewählt
          </div>
        </div>

        {/* Mobile-optimized table */}
        <div className="mobile-table-wrapper" style={{ 
          maxHeight: '400px', 
          overflowY: 'auto',
          border: '1px solid rgba(156, 163, 175, 0.2)',
          borderRadius: 'var(--radius)',
          backgroundColor: 'var(--background-darker)'
        }}>
          <table className="mobile-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ 
              position: 'sticky', 
              top: 0, 
              backgroundColor: 'var(--card-background)',
              borderBottom: '2px solid rgba(156, 163, 175, 0.2)',
              zIndex: 10
            }}>
              <tr>
                <th style={{ 
                  padding: '12px 8px', 
                  textAlign: 'left', 
                  width: '50px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedLocations.length === locations.length && locations.length > 0}
                    onChange={(e) => e.target.checked ? handleSelectAll() : handleSelectNone()}
                    style={{
                      width: '1.25rem',
                      height: '1.25rem',
                      cursor: 'pointer'
                    }}
                  />
                </th>
                <th style={{ 
                  padding: '12px 8px', 
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em'
                }}>Location</th>
                <th style={{ 
                  padding: '12px 8px', 
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em',
                  minWidth: '120px'
                }}>Link</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location, index) => (
                <tr 
                  key={location.url}
                  style={{ 
                    borderBottom: '1px solid rgba(156, 163, 175, 0.1)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    backgroundColor: 'transparent'
                  }}
                  onClick={() => handleToggleLocation(location.url)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(104, 141, 177, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedLocations.includes(location.url)}
                      onChange={() => handleToggleLocation(location.url)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '1.25rem',
                        height: '1.25rem',
                        cursor: 'pointer'
                      }}
                    />
                  </td>
                  <td style={{ 
                    padding: '12px 8px', 
                    fontWeight: '500',
                    opacity: location.aktiv === 0 ? '0.6' : '1',
                    color: location.aktiv === 0 ? 'var(--text-secondary)' : 'var(--text-primary)',
                    fontSize: '0.875rem',
                    lineHeight: '1.4'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span>{location.name}</span>
                      {location.aktiv === 0 && (
                        <span style={{ 
                          fontSize: '0.7rem', 
                          color: 'var(--text-secondary)',
                          opacity: '0.8',
                          fontWeight: '400'
                        }}>
                          (inaktiv)
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <a 
                      href={location.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-accent-green hover:underline"
                      onClick={(e) => e.stopPropagation()}
                      style={{ 
                        fontSize: '0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: 'rgba(156, 182, 143, 0.1)',
                        borderRadius: 'var(--radius-sm)',
                        transition: 'all 0.2s ease',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'rgba(156, 182, 143, 0.2)'
                        e.target.style.transform = 'translateY(-1px)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'rgba(156, 182, 143, 0.1)'
                        e.target.style.transform = 'translateY(0)'
                      }}
                    >
                      <span>🔗</span>
                      <span>Maps</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile-optimized action button */}
        <div className="flex justify-center mt-4">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleStartScraping}
            disabled={isScrapingActive || selectedLocations.length === 0}
            style={{
              width: '100%',
              maxWidth: '400px',
              fontSize: '1rem',
              fontWeight: '600',
              minHeight: '3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {isScrapingActive ? (
              <>
                <div className="loading" style={{ width: '1.25rem', height: '1.25rem' }}></div>
                <span>Scraping läuft...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Scraping starten ({selectedLocations.length})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DefaultLocations