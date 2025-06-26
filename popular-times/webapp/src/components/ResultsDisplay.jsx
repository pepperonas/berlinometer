function ResultsDisplay({ results }) {
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getOccupancyStatus = (occupancy, isLive) => {
    if (!occupancy) return null
    
    if (isLive) {
      return <span className="status status-live">🔴 LIVE</span>
    }
    
    return <span className="status status-success">📊 Historisch</span>
  }

  const parseOccupancyLevel = (occupancyText) => {
    if (!occupancyText) return null
    
    // Extract percentage or level indicators from text
    const percentMatch = occupancyText.match(/(\d+)\s*%/)
    if (percentMatch) {
      return parseInt(percentMatch[1])
    }
    
    // Check for German keywords indicating occupancy levels
    const text = occupancyText.toLowerCase()
    if (text.includes('sehr beliebt') || text.includes('sehr voll') || text.includes('überfüllt')) {
      return 90 // Very busy
    } else if (text.includes('beliebt') || text.includes('voll') || text.includes('geschäftig')) {
      return 70 // Busy
    } else if (text.includes('mäßig') || text.includes('mittlerweile') || text.includes('normal')) {
      return 50 // Moderate
    } else if (text.includes('ruhig') || text.includes('wenig') || text.includes('leer')) {
      return 20 // Quiet
    }
    
    return null
  }

  const compareToUsual = (occupancyText) => {
    if (!occupancyText) return 'unknown'
    
    const text = occupancyText.toLowerCase()
    
    // Check for explicit comparison indicators
    if (text.includes('derzeit mehr') || text.includes('überdurchschnittlich') || 
        text.includes('höher als gewöhnlich') || text.includes('mehr als üblich')) {
      return 'higher' // Green
    } else if (text.includes('derzeit weniger') || text.includes('unterdurchschnittlich') || 
               text.includes('niedriger als gewöhnlich') || text.includes('weniger als üblich')) {
      return 'lower' // Red (unchanged, already red)
    } else if (text.includes('wie gewöhnlich') || text.includes('normal') || 
               text.includes('durchschnittlich') || text.includes('üblich')) {
      return 'normal' // Yellow
    }
    
    return 'unknown'
  }

  const getOccupancyColor = (occupancy, isLive) => {
    if (!occupancy) return 'rgba(156, 163, 175, 0.1)'
    
    if (isLive) {
      const comparison = compareToUsual(occupancy)
      switch (comparison) {
        case 'higher':
          return 'rgba(34, 197, 94, 0.15)' // Green - more than usual
        case 'normal':
          return 'rgba(234, 179, 8, 0.15)' // Yellow - same as usual
        case 'lower':
        default:
          return 'rgba(225, 97, 98, 0.15)' // Red - less than usual or unknown
      }
    }
    
    return 'rgba(156, 182, 143, 0.1)' // Default for historical data
  }

  const getOccupancyBorderColor = (occupancy, isLive) => {
    if (!occupancy) return 'rgba(156, 163, 175, 0.2)'
    
    if (isLive) {
      const comparison = compareToUsual(occupancy)
      switch (comparison) {
        case 'higher':
          return 'rgba(34, 197, 94, 0.3)' // Green border
        case 'normal':
          return 'rgba(234, 179, 8, 0.3)' // Yellow border
        case 'lower':
        default:
          return 'rgba(225, 97, 98, 0.3)' // Red border
      }
    }
    
    return 'rgba(156, 182, 143, 0.2)'
  }

  const getOccupancyIcon = (occupancy, isLive) => {
    if (!isLive) return '📊'
    
    const comparison = compareToUsual(occupancy)
    switch (comparison) {
      case 'higher':
        return '🟢' // Green circle - more than usual
      case 'normal':
        return '🟡' // Yellow circle - same as usual
      case 'lower':
      default:
        return '🔴' // Red circle - less than usual or unknown
    }
  }

  const exportToJson = () => {
    const dataStr = JSON.stringify(results, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `popular-times-export-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportToCsv = () => {
    const headers = ['Location Name', 'Address', 'Rating', 'Live Occupancy', 'Is Live', 'URL', 'Timestamp']
    const csvContent = [
      headers.join(','),
      ...results.map(result => [
        `"${(result.location_name || '').replace(/"/g, '""')}"`,
        `"${(result.address || '').replace(/"/g, '""')}"`,
        result.rating || '',
        `"${(result.live_occupancy || '').replace(/"/g, '""')}"`,
        result.is_live_data ? 'Yes' : 'No',
        `"${result.url}"`,
        `"${result.timestamp}"`
      ].join(','))
    ].join('\n')

    const dataBlob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `popular-times-export-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="card-title mb-0">Scraping Ergebnisse</h3>
            <p className="card-description">
              {results.length} Location{results.length !== 1 ? 's' : ''} analysiert
            </p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={exportToCsv}
              className="btn btn-sm btn-secondary"
            >
              CSV Export
            </button>
            <button 
              onClick={exportToJson}
              className="btn btn-sm btn-primary"
            >
              JSON Export
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {results.map((result, index) => (
          <div 
            key={index} 
            className="p-4"
            style={{ 
              backgroundColor: 'var(--background-darker)', 
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(209, 213, 219, 0.1)'
            }}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h4 className="mb-2">
                  {result.location_name || 'Unbekannte Location'}
                </h4>
                
                {result.address && (
                  <p className="text-sm text-secondary mb-2">
                    📍 {result.address}
                  </p>
                )}
                
                {result.rating && (
                  <p className="text-sm text-secondary mb-2">
                    ⭐ {result.rating} Sterne
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-2 items-end">
                {getOccupancyStatus(result.live_occupancy, result.is_live_data)}
                
                <div className="text-sm text-secondary">
                  {formatTimestamp(result.timestamp)}
                </div>
              </div>
            </div>

            {result.live_occupancy ? (
              <div 
                className="p-3 mb-3"
                style={{ 
                  backgroundColor: getOccupancyColor(result.live_occupancy, result.is_live_data),
                  borderRadius: 'var(--radius)',
                  border: `1px solid ${getOccupancyBorderColor(result.live_occupancy, result.is_live_data)}`
                }}
              >
                <div className="font-weight-500 text-sm mb-1">
                  {result.is_live_data ? `${getOccupancyIcon(result.live_occupancy, result.is_live_data)} Live-Auslastung:` : '📊 Auslastungsdaten:'}
                </div>
                <div className="text-sm">
                  {result.live_occupancy}
                </div>
                {result.is_live_data && (
                  <div className="text-xs text-secondary mt-1">
                    Echtzeitdaten von Google Maps
                  </div>
                )}
              </div>
            ) : (
              <div 
                className="p-3 mb-3"
                style={{ 
                  backgroundColor: 'rgba(156, 163, 175, 0.1)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid rgba(156, 163, 175, 0.2)'
                }}
              >
                <div className="text-sm text-secondary">
                  {result.error ? `Fehler: ${result.error}` : 'Keine Auslastungsdaten verfügbar'}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <a 
                href={result.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-accent hover:underline"
              >
                🔗 Google Maps öffnen
              </a>
              
              <div className="text-xs text-secondary">
                ID: {index + 1}
              </div>
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && (
        <div className="text-center text-secondary py-8">
          <p>Noch keine Ergebnisse verfügbar</p>
        </div>
      )}
    </div>
  )
}

export default ResultsDisplay