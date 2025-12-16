import { useState, useEffect } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function OccupancyChart({ url, isExpanded }) {
  const { t } = useLanguage()
  const [chartData, setChartData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)

  useEffect(() => {
    if (isExpanded && url) {
      fetchHistoryData()
    }
  }, [isExpanded, url])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchHistoryData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/location-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, hours: 12 })
      })

      if (!response.ok) {
        throw new Error(t('errorLoadingHistory'))
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        // Formatiere Daten für Recharts
        const formattedData = data.data.map(item => ({
          time: new Date(item.timestamp).toLocaleTimeString('de-DE', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          timestamp: item.timestamp,
          auslastung: item.occupancy_percent || 0,
          normal: item.usual_percent || 0,
          isLive: item.is_live_data
        }))
        
        setChartData(formattedData)
      }
    } catch (err) {
      console.error(t('errorLoadingHistory') + ':', err)
      setError('Historie-Feature nicht verfügbar')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isExpanded) return null

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="loading mb-2"></div>
        <p className="text-sm text-secondary">Lade Historie...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-accent-red">❌ {error}</p>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-secondary">Noch keine Historie-Daten verfügbar</p>
      </div>
    )
  }

  return (
    <div className="p-4" style={{ backgroundColor: 'var(--background-darker)', borderRadius: 'var(--radius)' }}>
      <h5 className="text-sm font-semibold mb-3">{t('occupancyLast12Hours')}</h5>
      
      <ResponsiveContainer width="100%" height={isMobile ? 300 : 250}>
        <LineChart 
          data={chartData} 
          margin={{ 
            top: 5, 
            right: isMobile ? 5 : 30, 
            left: isMobile ? -10 : 20, 
            bottom: isMobile ? 40 : 5 
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-3)" />
          <XAxis 
            dataKey="time" 
            stroke="var(--text-secondary)"
            tick={{ fontSize: isMobile ? 10 : 12 }}
            interval={isMobile ? 'preserveStartEnd' : 0}
            angle={isMobile ? -45 : 0}
            textAnchor={isMobile ? 'end' : 'middle'}
            height={isMobile ? 60 : 30}
          />
          <YAxis 
            stroke="var(--text-secondary)"
            tick={{ fontSize: isMobile ? 10 : 12 }}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            width={isMobile ? 35 : 60}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--card-background)',
              border: '1px solid var(--gray-3)',
              borderRadius: 'var(--radius)',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              padding: isMobile ? '4px 8px' : '8px 12px'
            }}
            labelStyle={{ color: 'var(--text-primary)' }}
            itemStyle={{ color: 'var(--text-primary)' }}
            formatter={(value) => `${value}%`}
          />
          <Legend 
            wrapperStyle={{ 
              fontSize: isMobile ? '0.625rem' : '0.875rem',
              paddingTop: isMobile ? '8px' : '0px'
            }}
            iconType="line"
            verticalAlign={isMobile ? 'bottom' : 'top'}
            align="center"
          />
          <Line 
            type="monotone" 
            dataKey="auslastung" 
            stroke="#e16162" 
            strokeWidth={isMobile ? 1.5 : 2}
            name={t('currentOccupancy')}
            dot={{ fill: '#e16162', r: isMobile ? 2 : 3 }}
            activeDot={{ r: isMobile ? 4 : 5 }}
          />
          <Line 
            type="monotone" 
            dataKey="normal" 
            stroke="#688db1" 
            strokeWidth={isMobile ? 1.5 : 2}
            name={t('normalOccupancy')}
            strokeDasharray="5 5"
            dot={{ fill: '#688db1', r: isMobile ? 2 : 3 }}
            activeDot={{ r: isMobile ? 4 : 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div className="text-xs text-secondary mt-3">
        <p>🔴 {t('currentOccupancy')} | 🔵 {t('normalOccupancy')} für diese Uhrzeit</p>
        {chartData.some(d => d.isLive) && (
          <p className="mt-1">✨ {t('containsLiveData')}</p>
        )}
      </div>
    </div>
  )
}

export default OccupancyChart