import { useState, useEffect } from 'react'
import { AreaChart, Area, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts'
import TimeRangeSelector from './TimeRangeSelector'

const API_URL = import.meta.env.VITE_API_URL

function MapClickAnalytics({ token }) {
  const [data, setData] = useState(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [days])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/admin/map-clicks/analytics?days=${days}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setData(await res.json())
    } catch (err) {
      console.error('Map click analytics error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="admin-loading">Lade Map Click Analytics...</div>
  if (!data) return <div className="admin-error">Fehler beim Laden</div>

  return (
    <div className="admin-map-clicks">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Map Click Analytics</h1>
        <TimeRangeSelector value={days} onChange={setDays} />
      </div>

      {/* Daily Trend */}
      <div className="admin-chart-card">
        <h3 className="admin-chart-title">Click-Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data.dailyTrends || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} tickFormatter={d => new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} />
            <YAxis stroke="var(--text-secondary)" fontSize={12} />
            <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)' }} />
            <Area type="monotone" dataKey="clicks" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} name="Clicks" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="admin-charts-row">
        {/* Top Locations */}
        <div className="admin-chart-card">
          <h3 className="admin-chart-title">Top Locations</h3>
          <ResponsiveContainer width="100%" height={Math.max(250, (data.topLocations?.length || 5) * 30)}>
            <BarChart data={(data.topLocations || []).slice(0, 15)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis type="number" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" fontSize={11} width={140} tick={{ fill: 'var(--text-secondary)' }} />
              <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)' }} />
              <Bar dataKey="clicks" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Clicks" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Clicks vs Occupancy */}
        <div className="admin-chart-card">
          <h3 className="admin-chart-title">Clicks vs. Auslastung</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis type="number" dataKey="clicks" name="Clicks" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis type="number" dataKey="avg_occupancy" name="Ø Auslastung" stroke="var(--text-secondary)" fontSize={12} unit="%" />
              <ZAxis range={[40, 400]} />
              <Tooltip
                contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)' }}
                formatter={(value, name) => {
                  if (name === 'Ø Auslastung') return [`${value}%`, name]
                  return [value, name]
                }}
                labelFormatter={() => ''}
                content={({ payload }) => {
                  if (!payload?.length) return null
                  const d = payload[0]?.payload
                  return (
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'var(--text-color)', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 600 }}>{d?.name}</div>
                      <div>Clicks: {d?.clicks}</div>
                      <div>Ø Auslastung: {d?.avg_occupancy}%</div>
                    </div>
                  )
                }}
              />
              <Scatter data={data.correlation || []} fill="#8b5cf6" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default MapClickAnalytics
