import { useState, useEffect } from 'react'
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import AdminMetricsCard from './AdminMetricsCard'

const API_URL = import.meta.env.VITE_API_URL

function AdminOverview({ token, isAdmin }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchOverview()
  }, [token])

  const fetchOverview = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/admin/overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Fehler beim Laden')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="admin-loading">Lade Übersicht...</div>
  if (error) return <div className="admin-error">Fehler: {error}</div>
  if (!data) return null

  const COLORS = ['var(--accent-blue)', 'var(--accent-green)', '#f59e0b', '#ef4444']

  const roleData = data.usersByRole
    ? Object.entries(data.usersByRole).map(([name, value]) => ({ name, value }))
    : []

  return (
    <div className="admin-overview">
      <h1 className="admin-page-title">Übersicht</h1>

      <div className="admin-metrics-grid">
        <AdminMetricsCard title="Locations" value={data.totalLocations} icon="📍" color="var(--accent-blue)" />
        <AdminMetricsCard title="Datenpunkte" value={data.totalDataPoints?.toLocaleString('de-DE')} icon="📈" color="var(--accent-green)" />
        <AdminMetricsCard title="User" value={data.totalUsers} icon="👥" color="#f59e0b" />
        <AdminMetricsCard title="Map Clicks" value={data.totalMapClicks?.toLocaleString('de-DE')} icon="🖱️" color="#8b5cf6" />
        <AdminMetricsCard title="Scrapings heute" value={data.scrapingsToday?.toLocaleString('de-DE')} icon="🔄" subtitle="Einträge" color="var(--accent-blue)" />
        <AdminMetricsCard title="Scrapings Woche" value={data.scrapingsWeek?.toLocaleString('de-DE')} icon="📅" trend={data.weeklyTrend} color="var(--accent-green)" />
        <AdminMetricsCard title="Live-Quote" value={`${data.liveDataQuote}%`} icon="📡" subtitle="heute" color="#f59e0b" />
        <AdminMetricsCard title="Aktive User" value={data.activeUsersWeek} icon="🟢" subtitle={`${data.activeUsersToday} heute`} color="#10b981" />
      </div>

      <div className="admin-charts-row">
        {/* Scraping Trend Chart */}
        <div className="admin-chart-card">
          <h3 className="admin-chart-title">Scraping-Trend (7 Tage)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data.dailyScrapings || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis
                dataKey="date"
                stroke="var(--text-secondary)"
                fontSize={12}
                tickFormatter={d => new Date(d).toLocaleDateString('de-DE', { weekday: 'short' })}
              />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip
                contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)' }}
                labelFormatter={d => new Date(d).toLocaleDateString('de-DE')}
              />
              <Area type="monotone" dataKey="count" stroke="var(--accent-blue)" fill="var(--accent-blue)" fillOpacity={0.2} name="Einträge" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Role Distribution */}
        {isAdmin && roleData.length > 0 && (
          <div className="admin-chart-card">
            <h3 className="admin-chart-title">Rollen-Verteilung</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={roleData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {roleData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminOverview
