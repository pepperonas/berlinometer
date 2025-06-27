function MoodBarometer({ results }) {
  if (!results || results.length === 0) return null

  // Analysiere Auslastung aller Locations
  const validLocations = results.filter(r => r.live_occupancy && !r.error)
  
  if (validLocations.length === 0) {
    return null // Keine gültigen Daten für Analyse
  }

  const extractOccupancyNumbers = (liveOccupancyText) => {
    if (!liveOccupancyText) return [null, null]
    
    const currentMatch = liveOccupancyText.match(/derzeit\s+zu\s+(\d+)\s*%\s*ausgelastet/i)
    const normalMatch = liveOccupancyText.match(/normal\s+sind\s+(\d+)\s*%/i)
    
    let currentPercent = currentMatch ? parseInt(currentMatch[1]) : null
    const normalPercent = normalMatch ? parseInt(normalMatch[1]) : null
    
    // Fallback: Einzelner Prozent-Wert
    if (currentPercent === null) {
      const singleMatch = liveOccupancyText.match(/(\d+)\s*%\s*ausgelastet/i)
      if (singleMatch) {
        currentPercent = parseInt(singleMatch[1])
      }
    }
    
    return [currentPercent, normalPercent]
  }

  let high = 0, medium = 0, low = 0
  const occupancyData = []

  validLocations.forEach(location => {
    const [currentPercent, normalPercent] = extractOccupancyNumbers(location.live_occupancy)
    if (currentPercent !== null) {
      occupancyData.push({ current: currentPercent, normal: normalPercent })
      
      // Klassifizierung basierend auf absoluter Auslastung und Vergleich mit normal
      if (normalPercent !== null) {
        const difference = currentPercent - normalPercent
        if (difference > 5) {
          high++
        } else if (difference < -5) {
          low++
        } else {
          medium++
        }
      } else {
        // Fallback: Klassifizierung nur basierend auf absoluter Auslastung
        if (currentPercent > 70) {
          high++
        } else if (currentPercent > 30) {
          medium++
        } else {
          low++
        }
      }
    }
  })

  const total = high + medium + low
  if (total === 0) return null

  const highPercent = Math.round((high / total) * 100)
  const mediumPercent = Math.round((medium / total) * 100)
  const lowPercent = Math.round((low / total) * 100)

  // Bestimme Gesamtstimmung und Fazit
  let moodIcon, moodTitle, moodDescription

  if (highPercent >= 50) {
    moodIcon = '🟢'
    moodTitle = 'Lebendige Atmosphäre'
    moodDescription = `${highPercent}% der Locations sind überdurchschnittlich gut besucht. Die Bars und Lokale erleben einen regen Zulauf - perfekte Zeit für einen Besuch!`
  } else if (lowPercent >= 50) {
    moodIcon = '🔴'
    moodTitle = 'Entspannte Stimmung'
    moodDescription = `${lowPercent}% der Locations sind unterdurchschnittlich besucht. Ideal für einen ruhigen Abend ohne Gedränge und mit entspannter Atmosphäre.`
  } else if (mediumPercent >= 40) {
    moodIcon = '🟡'
    moodTitle = 'Ausgeglichene Stimmung'
    moodDescription = `${mediumPercent}% der Locations haben normale Auslastung. Eine ausgewogene Mischung aus lebendiger und entspannter Atmosphäre erwartet Sie.`
  } else {
    // Gemischte Verteilung
    moodIcon = '🟠'
    moodTitle = 'Vielfältige Stimmung'
    moodDescription = `Die Auslastung variiert stark (${highPercent}% hoch, ${mediumPercent}% normal, ${lowPercent}% niedrig). Je nach Vorliebe finden Sie sowohl lebendige als auch entspannte Locations.`
  }

  // Zusätzliche Statistiken
  const avgOccupancy = occupancyData.reduce((sum, data) => sum + data.current, 0) / occupancyData.length
  const locationsAnalyzed = validLocations.length
  
  moodDescription += ` Durchschnittliche Auslastung: ${Math.round(avgOccupancy)}% (${locationsAnalyzed} Locations analysiert).`

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">🌡️ Stimmungsbarometer</h3>
        <p className="card-description">
          Auslastungsanalyse aller {total} erfolgreich gescrapten Locations
        </p>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* Mood Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            padding: '1rem',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            border: '2px solid rgba(34, 197, 94, 0.3)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: 'rgba(34, 197, 94, 1)',
              marginBottom: '0.5rem'
            }}>
              {highPercent}%
            </div>
            <div style={{
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Stark besucht
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            padding: '1rem',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            border: '2px solid rgba(234, 179, 8, 0.3)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: 'rgba(234, 179, 8, 1)',
              marginBottom: '0.5rem'
            }}>
              {mediumPercent}%
            </div>
            <div style={{
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Durchschnittlich
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(225, 97, 98, 0.1)',
            padding: '1rem',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            border: '2px solid rgba(225, 97, 98, 0.3)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: 'rgba(225, 97, 98, 1)',
              marginBottom: '0.5rem'
            }}>
              {lowPercent}%
            </div>
            <div style={{
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Wenig besucht
            </div>
          </div>
        </div>

        {/* Mood Conclusion */}
        <div style={{
          backgroundColor: 'var(--background-darker)',
          padding: '1.5rem',
          borderRadius: 'var(--radius)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            fontSize: '3rem',
            flexShrink: 0
          }}>
            {moodIcon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
              color: 'var(--text-primary)'
            }}>
              {moodTitle}
            </div>
            <div style={{
              color: 'var(--text-secondary)',
              lineHeight: '1.6'
            }}>
              {moodDescription}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MoodBarometer