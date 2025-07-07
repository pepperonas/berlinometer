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

  const extractPercentageValues = (occupancyText) => {
    if (!occupancyText) return { current: null, usual: null }
    
    // Verschiedene Muster für Prozentangaben
    const patterns = [
      // "Derzeit zu 32 % ausgelastet; normal sind 65 %."
      /derzeit\s+zu\s+(\d+)\s*%.*?normal\s+sind\s+(\d+)\s*%/i,
      // "Derzeit 50% (gewöhnlich 30%)"
      /derzeit\s+(\d+)%.*?gewöhnlich\s+(\d+)%/i,
      // "Currently 50% (usually 30%)"
      /currently\s+(\d+)%.*?usually\s+(\d+)%/i,
      // "50% busy (typical: 30%)"
      /(\d+)%.*?typical:?\s*(\d+)%/i,
      // "50% (normal: 30%)"
      /(\d+)%.*?normal:?\s*(\d+)%/i,
      // Weitere deutsche Muster
      /aktuell\s+(\d+)%.*?üblich\s+(\d+)%/i,
      /(\d+)%.*?normalerweise\s+(\d+)%/i,
      // Zusätzliche Muster
      /zu\s+(\d+)\s*%\s+ausgelastet.*?normal.*?(\d+)\s*%/i
    ]
    
    for (const pattern of patterns) {
      const match = occupancyText.match(pattern)
      if (match) {
        const current = parseInt(match[1])
        const usual = parseInt(match[2])
        console.log('📊 Extracted percentages:', { current, usual, text: occupancyText })
        return { current, usual }
      }
    }
    
    return { current: null, usual: null }
  }

  const compareToUsual = (occupancyText) => {
    if (!occupancyText) return 'unknown'
    
    const text = occupancyText.toLowerCase()
    const { current, usual } = extractPercentageValues(occupancyText)
    
    // Wenn wir Prozent-Werte extrahieren können, verwende numerischen Vergleich
    if (current !== null && usual !== null) {
      const difference = current - usual
      
      if (difference > 5) {
        console.log('🟢 Numeric analysis:', occupancyText, `→ higher (${current}% vs ${usual}% = +${difference}%)`)
        return 'higher' // Grün: Aktuelle Auslastung > 5% über gewöhnlich
      } else if (Math.abs(difference) <= 5) {
        console.log('🟡 Numeric analysis:', occupancyText, `→ normal (${current}% vs ${usual}% = ${difference >= 0 ? '+' : ''}${difference}%)`)
        return 'normal' // Gelb: Innerhalb ±5% der gewöhnlichen Auslastung
      } else {
        console.log('🔴 Numeric analysis:', occupancyText, `→ lower (${current}% vs ${usual}% = ${difference}%)`)
        return 'lower' // Rot: Aktuelle Auslastung < 5% unter gewöhnlich
      }
    }
    
    // Fallback: Textbasierte Analyse für Fälle ohne klare Prozent-Werte
    if (text.includes('derzeit mehr') || text.includes('mehr als gewöhnlich') || 
        text.includes('mehr als üblich') || text.includes('überdurchschnittlich voll') ||
        text.includes('stärker frequentiert') || text.includes('busier than usual') ||
        text.includes('mehr besucht') || text.includes('höher als gewöhnlich')) {
      console.log('🟢 Text analysis:', occupancyText, '→ higher (green)')
      return 'higher'
    }
    
    if (text.includes('derzeit weniger') || text.includes('weniger als gewöhnlich') || 
        text.includes('weniger als üblich') || text.includes('unterdurchschnittlich') ||
        text.includes('weniger besucht') || text.includes('ruhiger als') ||
        text.includes('less busy than usual') || text.includes('niedriger als gewöhnlich')) {
      console.log('🔴 Text analysis:', occupancyText, '→ lower (red)')
      return 'lower'
    }
    
    if (text.includes('wie gewöhnlich') || text.includes('wie üblich') || 
        text.includes('usual for') || text.includes('normal für') ||
        text.includes('typisch für') || text.includes('as busy as usual')) {
      console.log('🟡 Text analysis:', occupancyText, '→ normal (yellow)')
      return 'normal'
    }
    
    console.log('🔍 Analysis result:', occupancyText, '→ unknown (default red)')
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

  // Hilfsfunktion für Sortierung - gleiche Logik wie in App.jsx
  const extractOccupancyPercentage = (occupancyText) => {
    if (!occupancyText) return -1
    
    const matches = occupancyText.match(/(\d+)\s*%/g)
    if (matches && matches.length > 0) {
      return parseInt(matches[0].replace('%', '').trim())
    }
    
    return -1
  }

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

  const exportToJson = () => {
    const sortedResults = sortResultsByOccupancy(results)
    const dataStr = JSON.stringify(sortedResults, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `popular-times-export-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportToCsv = () => {
    const sortedResults = sortResultsByOccupancy(results)
    const headers = ['Location Name', 'Address', 'Rating', 'Live Occupancy', 'Is Live', 'URL', 'Timestamp']
    const csvContent = [
      headers.join(','),
      ...sortedResults.map(result => [
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

  const generateHtmlReport = (reportData) => {
    const timestamp = new Date().toLocaleString('de-DE')
    const totalLocations = reportData.metadata.total_locations
    const liveCount = reportData.locations.filter(l => l.is_live_data).length
    const historicalCount = reportData.locations.filter(l => !l.is_live_data && !l.error).length
    const errorCount = reportData.locations.filter(l => l.error).length

    const generateLocationCard = (location) => {
      const extractOccupancyNumbers = (text) => {
        if (!text) return [null, null]
        const currentMatch = text.match(/derzeit\s+zu\s+(\d+)\s*%\s*ausgelastet/i)
        const normalMatch = text.match(/normal\s+sind\s+(\d+)\s*%/i)
        let currentPercent = currentMatch ? parseInt(currentMatch[1]) : null
        const normalPercent = normalMatch ? parseInt(normalMatch[1]) : null
        if (currentPercent === null) {
          const singleMatch = text.match(/(\d+)\s*%\s*ausgelastet/i)
          if (singleMatch) currentPercent = parseInt(singleMatch[1])
        }
        return [currentPercent, normalPercent]
      }

      const getOccupancyColor = (currentPercent, normalPercent) => {
        if (currentPercent === null) return ["rgba(156, 163, 175, 0.5)", "Keine Daten"]
        if (normalPercent === null) {
          if (currentPercent > 70) return ["rgba(234, 179, 8, 0.8)", "Hoch"]
          else if (currentPercent > 30) return ["rgba(234, 179, 8, 0.5)", "Mittel"]
          else return ["rgba(104, 141, 177, 0.6)", "Niedrig"]
        }
        const difference = currentPercent - normalPercent
        if (difference > 5) return ["rgba(34, 197, 94, 0.8)", "+" + difference + "% über normal"]
        else if (difference < -5) return ["rgba(225, 97, 98, 0.8)", difference + "% unter normal"]
        else return ["rgba(234, 179, 8, 0.8)", "±" + Math.abs(difference) + "% normal"]
      }

      const [currentPercent, normalPercent] = extractOccupancyNumbers(location.live_occupancy)
      const [color, description] = getOccupancyColor(currentPercent, normalPercent)
      const barWidth = currentPercent || 0
      const liveBadge = location.is_live_data 
        ? '<span class="live-badge live">🔴 LIVE</span>' 
        : '<span class="live-badge historical">⚫ Historisch</span>'

      if (location.error) {
        return '<div class="location-card">' +
          '<div class="location-header" style="background-color: #666;">' +
            '<span>' + location.location_name + '</span>' +
          '</div>' +
          '<div class="location-body">' +
            '<p style="color: red;">❌ Fehler beim Scraping: ' + location.error + '</p>' +
            '<div class="meta-info">' +
              '<div class="meta-item">' +
                '<span class="meta-label">🔗 URL:</span>' +
                '<a href="' + location.url + '" target="_blank">Google Maps öffnen</a>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      } else {
        return '<div class="location-card">' +
          '<div class="location-header" style="background-color: ' + color + ';">' +
            '<span>' + location.location_name + '</span>' +
            liveBadge +
          '</div>' +
          '<div class="location-body">' +
            '<div class="occupancy-text">' +
              (location.live_occupancy || 'Keine Auslastungsdaten verfügbar') +
            '</div>' +
            '<div class="occupancy-bar">' +
              '<div class="occupancy-fill" style="background-color: ' + color + '; width: ' + barWidth + '%;"></div>' +
            '</div>' +
            '<p><strong>Analyse:</strong> ' + description + '</p>' +
            '<div class="meta-info">' +
              '<div class="meta-item">' +
                '<span class="meta-label">📍 Adresse:</span>' +
                '<span>' + location.address + '</span>' +
              '</div>' +
              '<div class="meta-item">' +
                '<span class="meta-label">⭐ Bewertung:</span>' +
                '<span>' + location.rating + '</span>' +
              '</div>' +
              '<div class="meta-item">' +
                '<span class="meta-label">🔗 URL:</span>' +
                '<a href="' + location.url + '" target="_blank">Google Maps öffnen</a>' +
              '</div>' +
              '<div class="meta-item">' +
                '<span class="meta-label">⏰ Erfasst:</span>' +
                '<span>' + new Date(location.timestamp).toLocaleString('de-DE') + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      }
    }

    const locationCards = reportData.locations.map(generateLocationCard).join('')

    return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Popular Times Report - ${new Date().toLocaleDateString('de-DE')}</title>
    <style>
        :root {
            --background-dark: #2B2E3B;
            --background-darker: #252830;
            --card-background: #343845;
            --accent-blue: #688db1;
            --text-primary: #d1d5db;
            --text-secondary: #9ca3af;
            --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
            --radius: 0.75rem;
            --radius-lg: 1rem;
            --radius-xl: 1.5rem;
        }
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6; margin: 0; padding: 1.25rem;
            background-color: var(--background-dark);
            color: var(--text-primary); min-height: 100vh;
        }
        .container {
            max-width: 1200px; margin: 0 auto;
            background: var(--background-darker);
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-lg); overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, var(--accent-blue) 0%, #5a7ea0 100%);
            color: white; padding: 3rem; text-align: center;
        }
        .header h1 { margin: 0; font-size: 3rem; font-weight: 700; }
        .header p { margin: 0.75rem 0 0 0; opacity: 0.9; font-size: 1.125rem; }
        .stats {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem; padding: 2rem; background: var(--card-background);
        }
        .stat-card {
            background: var(--background-darker); padding: 1.5rem;
            border-radius: var(--radius-lg); text-align: center;
            box-shadow: var(--shadow); border: 1px solid rgba(156, 163, 175, 0.1);
        }
        .stat-number {
            font-size: 2.5rem; font-weight: 700;
            color: var(--accent-blue); margin-bottom: 0.5rem;
        }
        .stat-label {
            color: var(--text-secondary); font-size: 0.875rem;
            font-weight: 500; text-transform: uppercase;
        }
        .locations { padding: 2rem; background: var(--background-dark); }
        .location-card {
            border: 1px solid rgba(156, 163, 175, 0.2);
            border-radius: var(--radius-lg); margin-bottom: 1.5rem;
            overflow: hidden; background: var(--card-background);
            box-shadow: var(--shadow);
        }
        .location-header {
            padding: 1.5rem; color: white; font-weight: 600;
            font-size: 1.25rem; display: flex;
            justify-content: space-between; align-items: center;
        }
        .location-body { padding: 1.5rem; background: var(--background-darker); }
        .occupancy-bar {
            height: 12px; border-radius: var(--radius); margin: 1rem 0;
            position: relative; overflow: hidden;
            background: rgba(156, 163, 175, 0.2);
        }
        .occupancy-fill {
            height: 100%; border-radius: var(--radius);
            background: linear-gradient(90deg, currentColor 0%, rgba(255, 255, 255, 0.8) 100%);
        }
        .occupancy-text {
            font-weight: 600; margin: 1rem 0;
            color: var(--text-primary); font-size: 1.125rem;
        }
        .meta-info {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem; margin-top: 1.25rem; padding-top: 1.25rem;
            border-top: 1px solid rgba(156, 163, 175, 0.2);
        }
        .meta-item { display: flex; align-items: center; font-size: 0.875rem; }
        .meta-label {
            font-weight: 600; margin-right: 0.5rem;
            color: var(--text-secondary); min-width: fit-content;
        }
        .meta-item a { color: var(--accent-blue); text-decoration: none; }
        .meta-item a:hover { color: #7ea4c7; text-decoration: underline; }
        .live-badge {
            display: inline-block; padding: 0.5rem 0.75rem;
            border-radius: var(--radius); font-size: 0.75rem;
            font-weight: 600; text-transform: uppercase;
        }
        .live { background: #e16162; color: white; }
        .historical { background: var(--text-secondary); color: var(--background-dark); }
        @media (max-width: 768px) {
            body { padding: 0.75rem; }
            .header h1 { font-size: 2rem; }
            .stats { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
            .meta-info { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🍷 Popular Times Report</h1>
            <p>Erstellt am ${timestamp}</p>
        </div>
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${totalLocations}</div>
                <div class="stat-label">Locations gesamt</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${liveCount}</div>
                <div class="stat-label">Live-Daten</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${historicalCount}</div>
                <div class="stat-label">Historische Daten</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${errorCount}</div>
                <div class="stat-label">Fehler</div>
            </div>
        </div>
        <div class="locations">${locationCards}</div>
    </div>
</body>
</html>`
  }

  const exportToHtml = async () => {
    try {
      const sortedResults = sortResultsByOccupancy(results)
      // Erstelle Datenstruktur im erwarteten Format
      const reportData = {
        metadata: {
          scraping_timestamp: new Date().toISOString(),
          total_locations: sortedResults.length,
          success_rate_percent: Math.round((sortedResults.filter(r => !r.error).length / sortedResults.length) * 100),
          total_execution_time_seconds: 'N/A',
          average_processing_time_seconds: 'N/A',
          locations_per_minute: 'N/A',
          total_retries_needed: 0
        },
        locations: sortedResults.map(result => ({
          location_name: result.location_name || 'Unbekannte Location',
          live_occupancy: result.live_occupancy || '',
          is_live_data: result.is_live_data || false,
          address: result.address || 'Adresse nicht verfügbar',
          rating: result.rating || 'Keine Bewertung',
          url: result.url || '',
          timestamp: result.timestamp,
          error: result.error || null
        }))
      }

      const htmlTemplate = generateHtmlReport(reportData)
      const dataBlob = new Blob([htmlTemplate], { type: 'text/html' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `popular-times-report-${new Date().toISOString().split('T')[0]}.html`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Fehler beim HTML-Export:', error)
      alert('Fehler beim Erstellen des HTML-Reports')
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex flex-col gap-3 mb-4" style={{
          alignItems: 'stretch'
        }}>
          <div className="text-center">
            <h3 className="card-title mb-2" style={{ fontSize: '1.25rem' }}>Scraping Ergebnisse</h3>
            <p className="card-description" style={{ fontSize: '0.875rem' }}>
              {results.length} Location{results.length !== 1 ? 's' : ''} analysiert
            </p>
          </div>
          
          {/* Mobile-optimized export buttons */}
          <div className="mobile-button-group" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            width: '100%',
            maxWidth: '200px'
          }}>
            <button 
              onClick={exportToCsv}
              className="btn btn-sm btn-secondary"
              style={{
                width: '100%',
                fontSize: '0.75rem',
                padding: '0.5rem 0.75rem'
              }}
            >
              📈 CSV Export
            </button>
            <button 
              onClick={exportToJson}
              className="btn btn-sm btn-secondary"
              style={{
                width: '100%',
                fontSize: '0.75rem',
                padding: '0.5rem 0.75rem'
              }}
            >
              📊 JSON Export
            </button>
            <button 
              onClick={exportToHtml}
              className="btn btn-sm btn-primary"
              style={{
                width: '100%',
                fontSize: '0.75rem',
                padding: '0.5rem 0.75rem',
                fontWeight: '600'
              }}
            >
              📄 HTML Report
            </button>
          </div>
          
          {/* Desktop layout */}
          <div className="flex gap-2" style={{
            display: 'none'
          }}>
            <button 
              onClick={exportToCsv}
              className="btn btn-sm btn-secondary"
            >
              CSV Export
            </button>
            <button 
              onClick={exportToJson}
              className="btn btn-sm btn-secondary"
            >
              JSON Export
            </button>
            <button 
              onClick={exportToHtml}
              className="btn btn-sm btn-primary"
            >
              📄 HTML Report
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
              border: '1px solid rgba(209, 213, 219, 0.1)',
              marginBottom: '1rem'
            }}
          >
            {/* Mobile-optimized header */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex justify-between items-start">
                <h4 className="mb-0 flex-1" style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  lineHeight: '1.3',
                  paddingRight: '0.5rem'
                }}>
                  {result.location_name || 'Unbekannte Location'}
                </h4>
                
                <div className="flex flex-col gap-1 items-end" style={{ flexShrink: 0 }}>
                  {getOccupancyStatus(result.live_occupancy, result.is_live_data)}
                </div>
              </div>
              
              {/* Mobile-optimized metadata */}
              <div className="flex flex-col gap-2" style={{ fontSize: '0.875rem' }}>
                {result.address && (
                  <div className="flex items-start gap-2 text-secondary">
                    <span style={{ flexShrink: 0 }}>📍</span>
                    <span style={{ lineHeight: '1.4' }}>{result.address}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  {result.rating && (
                    <div className="flex items-center gap-1 text-secondary">
                      <span>⭐</span>
                      <span>{result.rating} Sterne</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-secondary" style={{ textAlign: 'right' }}>
                    {formatTimestamp(result.timestamp)}
                  </div>
                </div>
              </div>
            </div>

            {result.live_occupancy ? (
              <div 
                className="p-4 mb-4"
                style={{ 
                  backgroundColor: getOccupancyColor(result.live_occupancy, result.is_live_data),
                  borderRadius: 'var(--radius)',
                  border: `1px solid ${getOccupancyBorderColor(result.live_occupancy, result.is_live_data)}`
                }}
              >
                <div className="font-weight-500 text-sm mb-2">
                  {result.is_live_data ? `${getOccupancyIcon(result.live_occupancy, result.is_live_data)} Live-Auslastung:` : '📊 Auslastungsdaten:'}
                </div>
                <div className="text-sm mb-2">
                  {result.live_occupancy}
                </div>
                {result.is_live_data && (
                  <div className="text-xs text-secondary">
                    Echtzeitdaten von Google Maps
                  </div>
                )}
              </div>
            ) : (
              <div 
                className="p-4 mb-4"
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

            {/* Mobile-optimized footer */}
            <div className="flex flex-col gap-2">
              <a 
                href={result.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-accent hover:underline"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: 'rgba(104, 141, 177, 0.1)',
                  borderRadius: 'var(--radius)',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(104, 141, 177, 0.2)'
                  e.target.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(104, 141, 177, 0.1)'
                  e.target.style.transform = 'translateY(0)'
                }}
              >
                <span>🔗</span>
                <span>Google Maps öffnen</span>
              </a>
              
              <div className="text-xs text-secondary text-center" style={{ opacity: '0.7' }}>
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