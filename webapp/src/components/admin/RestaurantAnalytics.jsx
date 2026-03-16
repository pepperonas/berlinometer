import { useState, useEffect } from 'react'
import { cleanAddress } from '../../utils/locationUtils'
import LocationSelector from './LocationSelector'
import OccupancyTimeline from './OccupancyTimeline'
import OccupancyHeatmap from './OccupancyHeatmap'
import PeakHoursChart from './PeakHoursChart'
import TimeRangeSelector from './TimeRangeSelector'
import LocationComparison from './LocationComparison'

const API_URL = import.meta.env.VITE_API_URL

function RestaurantAnalytics({ token }) {
  const [restaurants, setRestaurants] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  const headers = { 'Authorization': `Bearer ${token}` }

  useEffect(() => {
    fetchRestaurants()
  }, [token])

  useEffect(() => {
    if (selectedId) fetchAnalytics()
  }, [selectedId, days])

  const fetchRestaurants = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/restaurants?sort_by=name&sort_dir=asc`, { headers })
      if (res.ok) {
        const json = await res.json()
        const locs = json.locations || []
        setRestaurants(locs)
        if (locs.length > 0 && !selectedId) setSelectedId(locs[0].id)
      }
    } catch (err) {
      console.error('Fetch restaurants error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true)
    try {
      // Reuse same analytics endpoint — works for any location regardless of category
      const res = await fetch(`${API_URL}/admin/locations/${selectedId}/analytics?days=${days}`, { headers })
      if (res.ok) {
        const json = await res.json()
        setAnalytics(json)
      }
    } catch (err) {
      console.error('Fetch restaurant analytics error:', err)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  return (
    <div className="admin-location-analytics">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Restaurant Analytics</h1>
        <div className="admin-page-header__controls">
          <LocationSelector
            locations={restaurants}
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
            {/* Restaurant Info Header */}
            <div className="admin-location-header">
              <h2>
                {analytics.location?.name}
                {analytics.location?.google_maps_url && (
                  <a href={analytics.location.google_maps_url} target="_blank" rel="noopener noreferrer"
                    title="In Google Maps öffnen"
                    style={{ marginLeft: '0.5rem', fontSize: '0.75rem', opacity: 0.6, textDecoration: 'none' }}>
                    &#x1F4CD;
                  </a>
                )}
              </h2>
              <p className="admin-text-secondary">{cleanAddress(analytics.location?.address)}</p>
              {analytics.trends && (
                <span className={`admin-badge ${analytics.trends.change > 0 ? 'admin-badge--warning' : 'admin-badge--success'}`}>
                  {analytics.trends.change > 0 ? '↑' : '↓'} {Math.abs(analytics.trends.change)}% vs. Vorperiode
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="admin-stats-row">
              <div className="admin-stat">
                <span className="admin-stat__label">Ø Auslastung</span>
                <span className="admin-stat__value">{analytics.trends?.current ?? '-'}%</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat__label">Datenpunkte</span>
                <span className="admin-stat__value">{analytics.timeline?.length ?? 0}</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat__label">Vorperiode</span>
                <span className="admin-stat__value">{analytics.trends?.previous ?? '-'}%</span>
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
          <div className="admin-empty">Wähle ein Restaurant aus</div>
        )}

        {/* Comparison Section */}
        {restaurants.length >= 2 && (
          <LocationComparison token={token} locations={restaurants} days={days} />
        )}
      </div>
    </div>
  )
}

export default RestaurantAnalytics
