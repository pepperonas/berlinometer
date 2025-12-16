import { useLanguage } from '../contexts/LanguageContext'

function MoodBarometer({ results }) {
  const { t } = useLanguage()
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

  // Zusätzliche Statistiken ZUERST berechnen
  const avgOccupancy = occupancyData.reduce((sum, data) => sum + data.current, 0) / occupancyData.length
  const locationsAnalyzed = validLocations.length

  // Bestimme Gesamtstimmung und Fazit
  let moodIcon, moodTitle, moodDescription

  if (highPercent >= 50) {
    moodIcon = '🟢'
    moodTitle = t('livelyMood')
    moodDescription = t('livelyMoodDesc').replace('{highPercent}', highPercent) + ` ${t('averageOccupancy')}: ${Math.round(avgOccupancy)}% (${locationsAnalyzed} Locations).`
  } else if (lowPercent >= 50) {
    moodIcon = '🔴'
    moodTitle = t('relaxedMood')
    moodDescription = t('relaxedMoodDesc').replace('{lowPercent}', lowPercent) + ` ${t('averageOccupancy')}: ${Math.round(avgOccupancy)}% (${locationsAnalyzed} Locations).`
  } else if (mediumPercent >= 40) {
    moodIcon = '🟡'
    moodTitle = t('balancedMood')
    moodDescription = t('balancedMoodDesc').replace('{mediumPercent}', mediumPercent) + ` ${t('averageOccupancy')}: ${Math.round(avgOccupancy)}% (${locationsAnalyzed} Locations).`
  } else {
    // Gemischte Verteilung
    moodIcon = '🟠'
    moodTitle = t('diverseMood')
    moodDescription = t('diverseMoodDesc').replace('{highPercent}', highPercent).replace('{normalPercent}', mediumPercent).replace('{lowPercent}', lowPercent) + ` ${t('averageOccupancy')}: ${Math.round(avgOccupancy)}% (${locationsAnalyzed} Locations).`
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{t('moodBarometer')}</h3>
        <p className="card-description">
          {t('occupancyAnalysis').replace('{totalLocations}', total)}
        </p>
      </div>

      <div style={{ padding: window.innerWidth <= 480 ? '1rem' : '1.5rem' }}>
        {/* Mobile-optimized Mood Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth <= 480 ? '1fr' : 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: window.innerWidth <= 480 ? '0.5rem' : '0.75rem',
          marginBottom: window.innerWidth <= 480 ? '1rem' : '1.5rem'
        }}>
          <div style={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            padding: window.innerWidth <= 480 ? '0.75rem' : '1rem',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            border: window.innerWidth <= 480 ? '1px solid rgba(34, 197, 94, 0.3)' : '2px solid rgba(34, 197, 94, 0.3)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              fontSize: window.innerWidth <= 480 ? '1.5rem' : '2rem',
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
              {t('stronglyVisited')}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            padding: window.innerWidth <= 480 ? '0.75rem' : '1rem',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            border: window.innerWidth <= 480 ? '1px solid rgba(234, 179, 8, 0.3)' : '2px solid rgba(234, 179, 8, 0.3)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              fontSize: window.innerWidth <= 480 ? '1.5rem' : '2rem',
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
              {t('averageVisited')}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(225, 97, 98, 0.1)',
            padding: window.innerWidth <= 480 ? '0.75rem' : '1rem',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            border: window.innerWidth <= 480 ? '1px solid rgba(225, 97, 98, 0.3)' : '2px solid rgba(225, 97, 98, 0.3)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              fontSize: window.innerWidth <= 480 ? '1.5rem' : '2rem',
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
              {t('lightlyVisited')}
            </div>
          </div>
        </div>

        {/* Mood Conclusion */}
        <div style={{
          backgroundColor: 'var(--background-darker)',
          padding: window.innerWidth <= 480 ? '1rem' : '1.5rem',
          borderRadius: 'var(--radius)',
          display: 'flex',
          alignItems: 'center',
          gap: window.innerWidth <= 480 ? '0.75rem' : '1rem'
        }}>
          <div style={{
            fontSize: window.innerWidth <= 480 ? '2.5rem' : '3rem',
            flexShrink: 0
          }}>
            {moodIcon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: window.innerWidth <= 480 ? '1.125rem' : '1.25rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
              color: 'var(--text-primary)'
            }}>
              {moodTitle}
            </div>
            <div style={{
              color: 'var(--text-secondary)',
              fontSize: window.innerWidth <= 480 ? '0.875rem' : '1rem',
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