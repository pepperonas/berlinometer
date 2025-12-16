import { useState, useEffect } from 'react'

function OpeningHoursAnalytics({ token }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchOpeningHoursData = async () => {
    setLoading(true)
    setError('')

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Fetch opening hours analytics data
      const response = await fetch(`${import.meta.env.VITE_API_URL}/insights/opening-hours`, { headers })

      if (response.ok) {
        const hoursData = await response.json()
        setData(hoursData)
      } else {
        throw new Error('Failed to fetch opening hours data')
      }
    } catch (error) {
      console.error('Error fetching opening hours:', error)
      setError('Failed to load opening hours data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchOpeningHoursData()
    }
  }, [token])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        color: '#6b7280'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 0.5rem auto'
          }}></div>
          Loading opening hours...
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
        textAlign: 'center',
        fontSize: '0.875rem'
      }}>
        {error}
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{
        textAlign: 'center',
        color: '#6b7280',
        padding: '2rem',
        fontSize: '0.875rem'
      }}>
        No opening hours data available yet. Data will appear after locations are scraped.
      </div>
    )
  }

  const getCurrentlyOpenCount = () => {
    if (!data.currentStatus) return 0
    return data.currentStatus.filter(status => status.isOpen).length
  }

  const getCurrentlyClosedCount = () => {
    if (!data.currentStatus) return 0
    return data.currentStatus.filter(status => !status.isOpen).length
  }

  return (
    <div style={{ padding: '0' }}>
      {/* Opening Hours Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#16a34a',
            marginBottom: '0.5rem'
          }}>
            {getCurrentlyOpenCount()}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              background: '#16a34a',
              borderRadius: '50%'
            }}></span>
            Currently Open
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#dc2626',
            marginBottom: '0.5rem'
          }}>
            {getCurrentlyClosedCount()}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              background: '#dc2626',
              borderRadius: '50%'
            }}></span>
            Currently Closed
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#667eea',
            marginBottom: '0.5rem'
          }}>
            {data.totalWithHours || 0}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            With Hours Data
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#f59e0b',
            marginBottom: '0.5rem'
          }}>
            {data.averageConfidence ? Math.round(data.averageConfidence * 100) : 0}%
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            Avg Confidence
          </div>
        </div>
      </div>

      {/* Weekly Hours Pattern */}
      {data.weeklyPattern && (
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          border: '1px solid #e2e8f0',
          marginBottom: '2rem'
        }}>
          <h4 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '1rem'
          }}>
            Weekly Opening Patterns
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '0.5rem'
          }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
              const dayData = data.weeklyPattern.find(d => d.weekday === index)
              const openLocations = dayData?.openLocations || 0
              const totalLocations = dayData?.totalLocations || 1
              const percentage = Math.round((openLocations / totalLocations) * 100)

              return (
                <div
                  key={day}
                  style={{
                    background: '#f8fafc',
                    padding: '1rem',
                    borderRadius: '6px',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    {day}
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: percentage > 70 ? '#16a34a' : percentage > 40 ? '#f59e0b' : '#dc2626',
                    marginBottom: '0.25rem'
                  }}>
                    {percentage}%
                  </div>
                  <div style={{
                    fontSize: '0.625rem',
                    color: '#6b7280'
                  }}>
                    {openLocations}/{totalLocations}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Most Common Opening Hours */}
      {data.commonHours && data.commonHours.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '1rem'
          }}>
            Most Common Opening Hours
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            {data.commonHours.slice(0, 6).map((hours, index) => (
              <div
                key={index}
                style={{
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '0.5rem'
                }}>
                  {hours.openTime} - {hours.closeTime}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>{hours.count} locations</span>
                  <span>{Math.round((hours.count / (data.totalWithHours || 1)) * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default OpeningHoursAnalytics