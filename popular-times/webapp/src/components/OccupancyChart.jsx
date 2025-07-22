import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function OccupancyChart({ url, isExpanded }) {
  const [chartData, setChartData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isExpanded && url) {
      fetchHistoryData()
    }
  }, [isExpanded, url])

  const fetchHistoryData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`https://mrx3k1.de/api/popular-times/location-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, hours: 12 })
      })

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Historie')
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
      console.error('Fehler beim Laden der Historie:', err)
      setError(err.message)
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
      <h5 className="text-sm font-semibold mb-3">Auslastung der letzten 12 Stunden</h5>
      
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-3)" />
          <XAxis 
            dataKey="time" 
            stroke="var(--text-secondary)"
            style={{ fontSize: '0.75rem' }}
          />
          <YAxis 
            stroke="var(--text-secondary)"
            style={{ fontSize: '0.75rem' }}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--card-background)',
              border: '1px solid var(--gray-3)',
              borderRadius: 'var(--radius)',
              fontSize: '0.875rem'
            }}
            labelStyle={{ color: 'var(--text-primary)' }}
            itemStyle={{ color: 'var(--text-primary)' }}
            formatter={(value) => `${value}%`}
          />
          <Legend 
            wrapperStyle={{ fontSize: '0.875rem' }}
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="auslastung" 
            stroke="#e16162" 
            strokeWidth={2}
            name="Aktuelle Auslastung"
            dot={{ fill: '#e16162', r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line 
            type="monotone" 
            dataKey="normal" 
            stroke="#688db1" 
            strokeWidth={2}
            name="Normale Auslastung"
            strokeDasharray="5 5"
            dot={{ fill: '#688db1', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div className="text-xs text-secondary mt-3">
        <p>🔴 Aktuelle Auslastung | 🔵 Normale Auslastung für diese Uhrzeit</p>
        {chartData.some(d => d.isLive) && (
          <p className="mt-1">✨ Enthält Live-Daten</p>
        )}
      </div>
    </div>
  )
}

export default OccupancyChart