import { useState, useEffect } from 'react'
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const API_URL = import.meta.env.VITE_API_URL
const COLORS = ['var(--accent-green)', '#f59e0b', '#ef4444']

function ScrapingHealth({ token }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHealth()
  }, [])

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/scraping/health`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) setData(await res.json())
    } catch (err) {
      console.error('Scraping health error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="admin-loading">Lade Scraping Health...</div>
  if (!data) return <div className="admin-error">Fehler beim Laden</div>

  const coverageData = [
    { name: 'Aktiv (24h)', value: data.coverage?.scraped24h || 0 },
    { name: 'Aktiv (7d)', value: Math.max(0, (data.coverage?.scraped7d || 0) - (data.coverage?.scraped24h || 0)) },
    { name: 'Nie', value: data.coverage?.neverScraped || 0 },
  ].filter(d => d.value > 0)

  return (
    <div className="admin-scraping-health">
      <h1 className="admin-page-title">Scraping Health</h1>

      {/* Coverage Stats */}
      <div className="admin-stats-row">
        <div className="admin-stat">
          <span className="admin-stat__label">Locations gesamt</span>
          <span className="admin-stat__value">{data.coverage?.total}</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__label">Scraped (24h)</span>
          <span className="admin-stat__value" style={{ color: 'var(--accent-green)' }}>{data.coverage?.scraped24h}</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__label">Scraped (7d)</span>
          <span className="admin-stat__value">{data.coverage?.scraped7d}</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__label">Nie gescraped</span>
          <span className="admin-stat__value" style={{ color: '#ef4444' }}>{data.coverage?.neverScraped}</span>
        </div>
      </div>

      <div className="admin-charts-row">
        {/* Daily Stats */}
        <div className="admin-chart-card">
          <h3 className="admin-chart-title">Tägliche Scrapings (7 Tage)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data.dailyStats || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} tickFormatter={d => new Date(d).toLocaleDateString('de-DE', { weekday: 'short' })} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)' }} />
              <Area type="monotone" dataKey="entries" stroke="var(--accent-blue)" fill="var(--accent-blue)" fillOpacity={0.2} name="Einträge" />
              <Area type="monotone" dataKey="uniqueLocations" stroke="var(--accent-green)" fill="var(--accent-green)" fillOpacity={0.2} name="Unique Locations" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Coverage Pie */}
        <div className="admin-chart-card">
          <h3 className="admin-chart-title">Coverage</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={coverageData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {coverageData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Freshness Table */}
      <div className="admin-chart-card">
        <h3 className="admin-chart-title">Staleness-Ranking</h3>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Location</th>
                <th>Letztes Scraping</th>
                <th>Alter (Stunden)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(data.freshness || []).map(loc => (
                <tr key={loc.id}>
                  <td>{loc.name}</td>
                  <td>{loc.lastScraping ? new Date(loc.lastScraping).toLocaleString('de-DE') : 'Nie'}</td>
                  <td>{loc.hoursStale ?? '-'}</td>
                  <td>
                    <span className={`admin-status-dot ${
                      !loc.hoursStale ? 'admin-status-dot--red' :
                      loc.hoursStale < 4 ? 'admin-status-dot--green' :
                      loc.hoursStale < 24 ? 'admin-status-dot--yellow' : 'admin-status-dot--red'
                    }`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ScrapingHealth
