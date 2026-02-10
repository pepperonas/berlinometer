import { useState, useEffect } from 'react'
import LocationSelector from './LocationSelector'
import OccupancyTimeline from './OccupancyTimeline'
import OccupancyHeatmap from './OccupancyHeatmap'
import PeakHoursChart from './PeakHoursChart'
import LocationComparison from './LocationComparison'
import TimeRangeSelector from './TimeRangeSelector'

const API_URL = import.meta.env.VITE_API_URL

function LocationAnalytics({ token, isAdmin }) {
  const [locations, setLocations] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  useEffect(() => {
    fetchLocations()
  }, [token])

  useEffect(() => {
    if (selectedId) fetchAnalytics()
  }, [selectedId, days])

  const fetchLocations = async () => {
    try {
      const endpoint = isAdmin ? '/admin/locations' : '/admin/my-locations'
      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const json = await res.json()
        const locs = json.locations || []
        setLocations(locs)
        if (locs.length > 0 && !selectedId) setSelectedId(locs[0].id)
      }
    } catch (err) {
      console.error('Fetch locations error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true)
    try {
      const res = await fetch(`${API_URL}/admin/locations/${selectedId}/analytics?days=${days}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const json = await res.json()
        setAnalytics(json)
      }
    } catch (err) {
      console.error('Fetch analytics error:', err)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  return (
    <div className="admin-location-analytics">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Location Analytics</h1>
        <div className="admin-page-header__controls">
          <LocationSelector
            locations={locations}
            selectedId={selectedId}
            onChange={setSelectedId}
            loading={loading}
          />
          <TimeRangeSelector value={days} onChange={setDays} />
        </div>
      </div>

      <div className="admin-location-analytics__content">
        {analyticsLoading ? (
          <div className="admin-loading">Lade Analytics...</div>
        ) : analytics ? (
          <>
            {/* Location Info Header */}
            <div className="admin-location-header">
              <h2>{analytics.location?.name}</h2>
              <p className="admin-text-secondary">{analytics.location?.address}</p>
              {analytics.location?.rating && (
                <span className="admin-badge">⭐ {analytics.location.rating}</span>
              )}
              {analytics.trends && (
                <span className={`admin-badge ${analytics.trends.change > 0 ? 'admin-badge--warning' : 'admin-badge--success'}`}>
                  {analytics.trends.change > 0 ? '↑' : '↓'} {Math.abs(analytics.trends.change)}% vs. Vorperiode
                </span>
              )}
            </div>

            {/* Map Click Stats */}
            <div className="admin-stats-row">
              <div className="admin-stat">
                <span className="admin-stat__label">Ø Auslastung</span>
                <span className="admin-stat__value">{analytics.trends?.current ?? '-'}%</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat__label">Map Clicks</span>
                <span className="admin-stat__value">{analytics.mapClicks?.total ?? 0}</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat__label">Datenpunkte</span>
                <span className="admin-stat__value">{analytics.timeline?.length ?? 0}</span>
              </div>
            </div>

            <OccupancyTimeline data={analytics.timeline} />
            <OccupancyHeatmap data={analytics.weekdayHourly} />
            <PeakHoursChart data={analytics.peakHours} />

            {/* Opening Hours */}
            {analytics.openingHours && analytics.openingHours.length > 0 && (
              <div className="admin-chart-card">
                <h3 className="admin-chart-title">Öffnungszeiten</h3>
                <div className="admin-opening-hours">
                  {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((day, idx) => {
                    const entry = analytics.openingHours.find(h => h.weekday === idx)
                    return (
                      <div key={day} className="admin-opening-hours__row">
                        <span className="admin-opening-hours__day">{day}</span>
                        <span className="admin-opening-hours__time">
                          {entry?.is_closed ? 'Geschlossen' : entry?.is_24h ? '24h' : entry ? `${entry.open_time} - ${entry.close_time}` : '-'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="admin-empty">Wähle eine Location aus</div>
        )}

        {/* Comparison Section */}
        {locations.length >= 2 && (
          <LocationComparison token={token} locations={locations} days={days} />
        )}
      </div>
    </div>
  )
}

export default LocationAnalytics
