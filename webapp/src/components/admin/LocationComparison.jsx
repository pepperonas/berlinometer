import { useState, useEffect } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const API_URL = import.meta.env.VITE_API_URL
const COLORS = ['var(--accent-blue)', 'var(--accent-green)', '#f59e0b', '#ef4444', '#8b5cf6']

function LocationComparison({ token, locations, days = 30 }) {
  const [selectedIds, setSelectedIds] = useState([])
  const [comparisons, setComparisons] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 480px)')
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggleLocation = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 5) return prev
      return [...prev, id]
    })
  }

  const fetchComparison = async () => {
    if (selectedIds.length < 2) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/admin/locations/compare?ids=${selectedIds.join(',')}&days=${days}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const json = await res.json()
        setComparisons(json.comparisons || [])
      }
    } catch (err) {
      console.error('Compare error:', err)
    } finally {
      setLoading(false)
    }
  }

  const allLocs = locations || []
  const selectedLocs = allLocs.filter(l => selectedIds.includes(l.id))
  const filteredUnselected = allLocs.filter(l =>
    !selectedIds.includes(l.id) && (
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.address?.toLowerCase().includes(search.toLowerCase())
    )
  )

  // Build radar data from hourly averages (14:00 - 05:00, bar-friendly range)
  const radarData = []
  if (comparisons.length > 0) {
    const hours = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5]
    for (const h of hours) {
      const point = { hour: `${h}:00` }
      comparisons.forEach(c => {
        point[c.name] = c.hourlyAverage?.[h] || 0
      })
      radarData.push(point)
    }
  }

  return (
    <div className="admin-chart-card">
      <h3 className="admin-chart-title">Location-Vergleich</h3>
      <div className="admin-compare-selector">
        <input
          type="text"
          className="admin-compare-search"
          placeholder="Locations filtern..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="admin-compare-chips-wrapper">
          {/* Pinned: selected chips always on top */}
          {selectedLocs.map(loc => (
            <button
              key={loc.id}
              className="admin-chip admin-chip--active"
              onClick={() => toggleLocation(loc.id)}
            >
              {loc.name}
            </button>
          ))}
          {/* Unselected, filtered */}
          {filteredUnselected.map(loc => (
            <button
              key={loc.id}
              className="admin-chip"
              onClick={() => toggleLocation(loc.id)}
            >
              {loc.name}
            </button>
          ))}
        </div>
        <div className="admin-compare-footer">
          <span className="admin-compare-count">
            {selectedIds.length} von max. 5 ausgewählt
          </span>
          <button
            className="admin-btn admin-btn--primary"
            onClick={fetchComparison}
            disabled={selectedIds.length < 2 || loading}
          >
            {loading ? 'Laden...' : 'Vergleichen'}
          </button>
        </div>
      </div>

      {comparisons.length > 0 && (
        <>
          {/* Summary Table */}
          <div className="admin-table-wrapper" style={{ marginBottom: '1.5rem' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Ø Auslastung</th>
                  <th>Max</th>
                  <th>Peak Hour</th>
                  <th>Clicks</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.avgOccupancy ?? '-'}%</td>
                    <td>{c.maxOccupancy ?? '-'}%</td>
                    <td>{c.peakHour != null ? `${c.peakHour}:00` : '-'}</td>
                    <td>{c.mapClicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Radar Chart */}
          {radarData.length > 0 && (
            <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border-color)" />
                <PolarAngleAxis dataKey="hour" stroke="var(--text-secondary)" fontSize={isMobile ? 9 : 10} />
                <PolarRadiusAxis stroke="var(--text-secondary)" fontSize={10} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)' }} />
                <Legend />
                {comparisons.map((c, i) => (
                  <Radar key={c.id} name={c.name} dataKey={c.name} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.15} />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  )
}

export default LocationComparison
