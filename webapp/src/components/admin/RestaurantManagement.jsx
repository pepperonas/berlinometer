import { useState, useEffect, useCallback } from 'react'
import AdminMetricsCard from './AdminMetricsCard'
import { cleanAddress } from '../../utils/locationUtils'

const API = import.meta.env.VITE_API_URL || ''

function RestaurantManagement({ token }) {
  const [overview, setOverview] = useState(null)
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [selectedId, setSelectedId] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  const headers = { 'Authorization': `Bearer ${token}` }

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/restaurants/overview`, { headers })
      const data = await res.json()
      if (!res.ok) return
      setOverview(data)
    } catch (err) {
      console.error('Failed to fetch restaurant overview:', err)
    }
  }, [token])

  const fetchRestaurants = useCallback(async () => {
    try {
      const params = new URLSearchParams({ sort_by: sortBy, sort_dir: sortDir })
      if (search) params.set('search', search)
      const res = await fetch(`${API}/admin/restaurants?${params}`, { headers })
      const data = await res.json()
      if (data.locations) {
        setRestaurants(data.locations)
      }
    } catch (err) {
      console.error('Failed to fetch restaurants:', err)
    } finally {
      setLoading(false)
    }
  }, [token, sortBy, sortDir, search])

  const fetchAnalytics = useCallback(async (id) => {
    setAnalyticsLoading(true)
    try {
      const res = await fetch(`${API}/admin/restaurants/${id}/analytics?days=30`, { headers })
      const data = await res.json()
      if (!res.ok) return
      setAnalytics(data)
    } catch (err) {
      console.error('Failed to fetch restaurant analytics:', err)
    } finally {
      setAnalyticsLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchOverview()
    fetchRestaurants()
  }, [fetchOverview, fetchRestaurants])

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
  }

  const sortArrow = (col) => {
    if (sortBy !== col) return ''
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  const handleRowClick = (id) => {
    if (selectedId === id) {
      setSelectedId(null)
      setAnalytics(null)
    } else {
      setSelectedId(id)
      fetchAnalytics(id)
    }
  }

  const formatOccupancy = (val) => {
    if (val === null || val === undefined) return '–'
    return `${val}%`
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Restaurant Management</h1>
        <span className="admin-text-secondary" style={{ fontSize: '0.85rem' }}>
          {overview ? `${overview.total_restaurants} Restaurants` : '...'}
        </span>
      </div>

      {/* Overview Metrics */}
      {overview && (
        <div className="admin-metrics-grid">
          <AdminMetricsCard
            title="Restaurants gesamt"
            value={overview.total_restaurants}
            icon="🍽️"
            color="var(--accent-blue)"
          />
          <AdminMetricsCard
            title="Aktiv (24h)"
            value={overview.active_last_24h}
            subtitle={`von ${overview.total_restaurants}`}
            icon="📡"
            color="var(--accent-green)"
          />
          <AdminMetricsCard
            title="Ø Auslastung jetzt"
            value={overview.avg_occupancy_now ? `${overview.avg_occupancy_now}%` : '–'}
            icon="📊"
            color="#f59e0b"
          />
          <AdminMetricsCard
            title="Datenpunkte"
            value={overview.total_data_points?.toLocaleString() || '0'}
            icon="💾"
            color="var(--text-secondary)"
          />
        </div>
      )}

      {/* Top 10 busiest */}
      {overview?.busiest_now?.length > 0 && (
        <div className="admin-chart-card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Top 10 ausgelastet (aktuell)</h3>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Restaurant</th>
                  <th>Auslastung</th>
                  <th className="admin-table__col--hide-mobile">Adresse</th>
                </tr>
              </thead>
              <tbody>
                {overview.busiest_now.map(r => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.name}</strong>
                      {r.google_maps_url && (
                        <a href={r.google_maps_url} target="_blank" rel="noopener noreferrer"
                          title="In Google Maps öffnen"
                          style={{ marginLeft: '0.4rem', fontSize: '0.75rem', opacity: 0.6, textDecoration: 'none' }}>
                          &#x1F4CD;
                        </a>
                      )}
                    </td>
                    <td>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        background: r.occupancy_percent > 70 ? '#ef444420' : r.occupancy_percent > 40 ? '#f59e0b20' : '#22c55e20',
                        color: r.occupancy_percent > 70 ? '#ef4444' : r.occupancy_percent > 40 ? '#f59e0b' : '#22c55e'
                      }}>
                        {r.occupancy_percent}%
                      </span>
                    </td>
                    <td className="admin-table__col--hide-mobile">
                      <span className="admin-text-truncate" style={{ display: 'block' }}>
                        {cleanAddress(r.address) || '–'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Search + Table */}
      <div className="admin-filters-row">
        <input
          type="text"
          className="admin-search-input"
          placeholder="Restaurant suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="admin-text-secondary" style={{ fontSize: '0.85rem' }}>
          {restaurants.length} Restaurants
        </span>
      </div>

      {loading ? (
        <div className="admin-loading">Lade Restaurants...</div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                  Name{sortArrow('name')}
                </th>
                <th className="admin-table__col--hide-mobile" style={{ cursor: 'pointer' }} onClick={() => handleSort('avg_occupancy_7d')}>
                  Ø 7d{sortArrow('avg_occupancy_7d')}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('data_points')}>
                  Daten{sortArrow('data_points')}
                </th>
                <th className="admin-table__col--hide-mobile" style={{ cursor: 'pointer' }} onClick={() => handleSort('last_scraping')}>
                  Letztes Scraping{sortArrow('last_scraping')}
                </th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map(r => (
                <>
                  <tr
                    key={r.id}
                    onClick={() => handleRowClick(r.id)}
                    style={{ cursor: 'pointer', background: selectedId === r.id ? 'var(--hover-bg)' : undefined }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {r.name}
                        {r.google_maps_url && (
                          <a href={r.google_maps_url} target="_blank" rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="In Google Maps öffnen"
                            style={{ fontSize: '0.75rem', opacity: 0.6, textDecoration: 'none' }}>
                            &#x1F4CD;
                          </a>
                        )}
                      </div>
                      <div className="admin-text-secondary" style={{ fontSize: '0.75rem' }}>
                        {cleanAddress(r.address) || ''}
                      </div>
                    </td>
                    <td className="admin-table__col--hide-mobile">{formatOccupancy(r.avg_occupancy_7d)}</td>
                    <td>{r.data_points}</td>
                    <td className="admin-table__col--hide-mobile admin-text-nowrap">
                      {r.last_scraping ? new Date(r.last_scraping).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '–'}
                    </td>
                  </tr>
                  {selectedId === r.id && (
                    <tr key={`${r.id}-detail`}>
                      <td colSpan={4} style={{ padding: '1rem', background: 'var(--hover-bg)' }}>
                        {analyticsLoading ? (
                          <div className="admin-loading">Lade Analytics...</div>
                        ) : analytics ? (
                          <div>
                            <h4 style={{ margin: '0 0 0.75rem 0' }}>{analytics.location?.name} — 30-Tage-Analyse</h4>

                            {/* Peak Hours */}
                            {analytics.peak_hours?.length > 0 && (
                              <div style={{ marginBottom: '1rem' }}>
                                <strong>Peak Hours:</strong>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                  {analytics.peak_hours.slice(0, 6).map(ph => (
                                    <span key={ph.hour} style={{
                                      padding: '4px 10px',
                                      borderRadius: '6px',
                                      fontSize: '0.8rem',
                                      background: ph.avg_occupancy > 60 ? '#ef444420' : '#22c55e20',
                                      color: ph.avg_occupancy > 60 ? '#ef4444' : '#22c55e'
                                    }}>
                                      {ph.hour}:00 — {ph.avg_occupancy}%
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Heatmap Summary */}
                            {analytics.heatmap && Object.keys(analytics.heatmap).length > 0 && (
                              <div>
                                <strong>Wochentag-Durchschnitt:</strong>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                  {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((day, i) => {
                                    const dow = i + 1
                                    const hours = analytics.heatmap[dow]
                                    if (!hours) return null
                                    const vals = Object.values(hours)
                                    const avg = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
                                    return (
                                      <span key={dow} style={{
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--border-color)'
                                      }}>
                                        {day}: {avg !== null ? `${avg}%` : '–'}
                                      </span>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            <div className="admin-text-secondary" style={{ fontSize: '0.75rem', marginTop: '0.75rem' }}>
                              {analytics.timeline?.length || 0} Datenpunkte in den letzten 30 Tagen
                            </div>
                          </div>
                        ) : (
                          <div className="admin-text-secondary">Keine Analytics verfügbar.</div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {restaurants.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                    Keine Restaurants gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default RestaurantManagement
