import { useState, useEffect } from 'react'
import MetricsCard from './MetricsCard'
import TrafficChart from './TrafficChart'
import LocationsTable from './LocationsTable'
import UserAnalytics from './UserAnalytics'
import OpeningHoursAnalytics from './OpeningHoursAnalytics'

function InsightsDashboard({ token }) {
  const [overview, setOverview] = useState(null)
  const [traffic, setTraffic] = useState(null)
  const [locations, setLocations] = useState(null)
  const [users, setUsers] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeRange, setTimeRange] = useState(7) // Default 7 days

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Fetch all analytics data in parallel
      const [overviewRes, trafficRes, locationsRes, usersRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/insights/overview`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/insights/traffic?days=${timeRange}`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/insights/locations?days=30&sort_by=scraping_count&limit=25`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/insights/users`, { headers })
      ])

      if (overviewRes.ok && trafficRes.ok && locationsRes.ok && usersRes.ok) {
        const [overviewData, trafficData, locationsData, usersData] = await Promise.all([
          overviewRes.json(),
          trafficRes.json(),
          locationsRes.json(),
          usersRes.json()
        ])


        setOverview(overviewData)
        setTraffic(trafficData)
        setLocations(locationsData)
        setUsers(usersData)
      } else {
        throw new Error('Failed to fetch analytics data')
      }
    } catch (error) {
      console.error('Error fetching insights:', error)
      setError('Failed to load analytics data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const refreshLocations = async (params = {}) => {
    try {
      const { sort_by = 'scraping_count', days = 30, limit = 25 } = params
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/insights/locations?sort_by=${sort_by}&days=${days}&limit=${limit}`,
        { headers }
      )

      if (response.ok) {
        const locationsData = await response.json()
        setLocations(locationsData)
      } else {
        throw new Error('Failed to fetch locations data')
      }
    } catch (error) {
      console.error('Error refreshing locations:', error)
      setError('Failed to refresh locations data')
    }
  }

  useEffect(() => {
    if (token) {
      fetchData()
    }
  }, [token, timeRange])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4rem',
        color: '#6b7280'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem auto'
          }}></div>
          Loading analytics...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        background: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#dc2626',
        padding: '1rem',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>Error</h3>
        <p style={{ margin: 0 }}>{error}</p>
        <button
          onClick={fetchData}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '0' }}>
      {/* Time Range Selector - Mobile Optimized */}
      <div style={{
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: window.innerWidth <= 640 ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: window.innerWidth <= 640 ? 'stretch' : 'center',
        gap: '1rem'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#1a202c',
          margin: 0,
          textAlign: window.innerWidth <= 640 ? 'center' : 'left'
        }}>
          Analytics Overview
        </h2>
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: window.innerWidth <= 640 ? 'center' : 'flex-end',
          flexWrap: 'wrap'
        }}>
          {[7, 14, 30].map(days => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              style={{
                padding: '0.5rem 1rem',
                background: timeRange === days ? '#667eea' : '#e2e8f0',
                color: timeRange === days ? 'white' : '#4a5568',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                flex: window.innerWidth <= 640 ? '1' : 'none',
                minWidth: window.innerWidth <= 640 ? '0' : 'auto'
              }}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Overview Metrics - Mobile Optimized */}
      {overview && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth <= 480 ? '1fr' : window.innerWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <MetricsCard
            title="Total Locations"
            value={overview.totalLocations}
            icon="📍"
            color="#3b82f6"
          />
          <MetricsCard
            title="Data Points"
            value={overview.totalDataPoints}
            icon="📊"
            color="#10b981"
          />
          <MetricsCard
            title="Today's Scrapings"
            value={overview.todayScrapings}
            icon="🔄"
            color="#f59e0b"
          />
          <MetricsCard
            title="Total Users"
            value={overview.totalUsers}
            icon="👥"
            color="#8b5cf6"
          />
          <MetricsCard
            title="Active Users"
            value={overview.activeUsers}
            icon="🟢"
            color="#06b6d4"
          />
          <MetricsCard
            title="Avg Data/Location"
            value={overview.avgDataPerLocation}
            icon="📈"
            color="#ef4444"
          />
          <MetricsCard
            title="Currently Open"
            value={overview.currentlyOpen || 0}
            icon="🕐"
            color="#16a34a"
          />
          <MetricsCard
            title="With Hours Data"
            value={overview.locationsWithHours || 0}
            icon="⏰"
            color="#7c3aed"
          />
        </div>
      )}

      {/* Charts and Tables - Mobile Optimized */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: window.innerWidth <= 640 ? '1rem' : '2rem'
      }}>
        {/* Traffic Chart */}
        {traffic && (
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: window.innerWidth <= 640 ? '1rem' : '1.5rem',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: '1rem'
            }}>
              Traffic Patterns
            </h3>
            <TrafficChart data={traffic} />
          </div>
        )}

        {/* User Analytics */}
        {users && (
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: window.innerWidth <= 640 ? '1rem' : '1.5rem',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1a202c',
              marginBottom: '1rem'
            }}>
              User Growth
            </h3>
            <UserAnalytics data={users} />
          </div>
        )}
      </div>

      {/* Opening Hours Analytics - Mobile Optimized */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: window.innerWidth <= 640 ? '1rem' : '1.5rem',
        border: '1px solid #e2e8f0',
        marginTop: window.innerWidth <= 640 ? '1rem' : '2rem'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#1a202c',
          marginBottom: '1rem'
        }}>
          Opening Hours Analytics
        </h3>
        <OpeningHoursAnalytics token={token} />
      </div>

      {/* Locations Table - Mobile Optimized */}
      {locations && (
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: window.innerWidth <= 640 ? '1rem' : '1.5rem',
          border: '1px solid #e2e8f0',
          marginTop: window.innerWidth <= 640 ? '1rem' : '2rem'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#1a202c',
            marginBottom: '1rem'
          }}>
            Top Locations
          </h3>
          <LocationsTable data={locations} onRefresh={refreshLocations} />
        </div>
      )}
    </div>
  )
}

export default InsightsDashboard