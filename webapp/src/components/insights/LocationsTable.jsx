import { useState, useEffect } from 'react'

// Add CSS for spinner animation
const spinnerCSS = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

function LocationsTable({ data, onRefresh }) {
  // Add the CSS to the document head
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = spinnerCSS
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])
  const [sortBy, setSortBy] = useState('scraping_count')
  const [timeRange, setTimeRange] = useState(30)
  const [limit, setLimit] = useState(25)
  const [loading, setLoading] = useState(false)

  if (!data || !data.topLocations) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        color: '#6b7280'
      }}>
        No location data available
      </div>
    )
  }

  const handleFilterChange = async (newSortBy, newTimeRange, newLimit) => {
    if (onRefresh) {
      setLoading(true)
      setSortBy(newSortBy)
      setTimeRange(newTimeRange)
      if (newLimit !== undefined) {
        setLimit(newLimit)
      }
      await onRefresh({
        sort_by: newSortBy,
        days: newTimeRange,
        limit: newLimit !== undefined ? newLimit : limit
      })
      setLoading(false)
    }
  }

  const handleSortChange = (newSortBy) => {
    handleFilterChange(newSortBy, timeRange, undefined)
  }

  const handleTimeRangeChange = (newTimeRange) => {
    handleFilterChange(sortBy, newTimeRange, undefined)
  }

  const handleLimitChange = (newLimit) => {
    handleFilterChange(sortBy, timeRange, newLimit)
  }

  // Modern dropdown styles
  const dropdownStyle = {
    padding: '0.625rem 2.5rem 0.625rem 0.75rem',
    borderRadius: '8px',
    border: '1.5px solid #e2e8f0',
    fontSize: '0.875rem',
    fontWeight: '500',
    backgroundColor: loading ? '#f8fafc' : 'white',
    color: '#374151',
    cursor: loading ? 'not-allowed' : 'pointer',
    outline: 'none',
    transition: 'all 0.2s ease',
    background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e") no-repeat right 0.75rem center/1rem 1rem`,
    backgroundSize: '1rem 1rem',
    backgroundPosition: 'right 0.75rem center',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none'
  }

  const dropdownHoverStyle = {
    ...dropdownStyle,
    borderColor: '#c7d2fe',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
  }

  const labelStyle = {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.5rem',
    display: 'block'
  }

  return (
    <div>
      {/* Categories Overview */}
      {data.categories && data.categories.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.75rem'
          }}>
            Location Categories
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.75rem'
          }}>
            {data.categories.map((category, index) => (
              <div
                key={index}
                style={{
                  background: '#f8fafc',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  textAlign: 'center',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#667eea',
                  marginBottom: '0.25rem'
                }}>
                  {category.count}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#4a5568',
                  fontWeight: '500'
                }}>
                  {category.category}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
        padding: '1.5rem',
        background: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <div>
          <label style={labelStyle}>
            Sort by
          </label>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            disabled={loading}
            style={dropdownStyle}
            onMouseEnter={(e) => !loading && Object.assign(e.target.style, dropdownHoverStyle)}
            onMouseLeave={(e) => Object.assign(e.target.style, dropdownStyle)}
          >
            <option value="scraping_count">Scrapings</option>
            <option value="map_clicks">Map Clicks</option>
            <option value="avg_occupancy">Avg Occupancy</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>
            Time range
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[7, 14, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => handleTimeRangeChange(days)}
                disabled={loading}
                style={{
                  padding: '0.625rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  borderRadius: '8px',
                  border: '1.5px solid #e2e8f0',
                  backgroundColor: timeRange === days ? '#6366f1' : (loading ? '#f8fafc' : 'white'),
                  color: timeRange === days ? 'white' : '#374151',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: timeRange === days ? '0 4px 12px rgba(99, 102, 241, 0.15)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!loading && timeRange !== days) {
                    e.target.style.borderColor = '#c7d2fe'
                    e.target.style.backgroundColor = '#f1f5f9'
                  }
                }}
                onMouseLeave={(e) => {
                  if (timeRange !== days) {
                    e.target.style.borderColor = '#e2e8f0'
                    e.target.style.backgroundColor = loading ? '#f8fafc' : 'white'
                  }
                }}
              >
                {days} days
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>
            Show entries
          </label>
          <select
            value={limit}
            onChange={(e) => handleLimitChange(parseInt(e.target.value))}
            disabled={loading}
            style={dropdownStyle}
            onMouseEnter={(e) => !loading && Object.assign(e.target.style, dropdownHoverStyle)}
            onMouseLeave={(e) => Object.assign(e.target.style, dropdownStyle)}
          >
            <option value={25}>25 entries</option>
            <option value={50}>50 entries</option>
            <option value={100}>100 entries</option>
            <option value={-1}>All entries</option>
          </select>
        </div>

        {loading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            <div style={{
              width: '1rem',
              height: '1rem',
              border: '2px solid #e2e8f0',
              borderTop: '2px solid #6366f1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            Loading...
          </div>
        )}
      </div>

      {/* Top Locations Table */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h4 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#1f2937',
          margin: 0
        }}>
          Most Active Locations
        </h4>
        <div style={{
          fontSize: '0.875rem',
          color: '#6b7280',
          fontWeight: '500'
        }}>
          Last {timeRange} days • {(() => {
            const displayedEntries = data.topLocations.length
            const totalEntries = data.totalCount || displayedEntries
            const limitText = limit === -1 ? 'all' : limit
            return `Showing ${displayedEntries} of ${totalEntries} locations (limit: ${limitText})`
          })()}
        </div>
      </div>

      <div style={{
        overflowX: 'auto',
        border: '1px solid #e2e8f0',
        borderRadius: '6px'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.875rem'
        }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{
                padding: '0.75rem',
                textAlign: 'left',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '1px solid #e2e8f0'
              }}>
                Location
              </th>
              <th style={{
                padding: '0.75rem',
                textAlign: 'center',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '1px solid #e2e8f0'
              }}>
                Scrapings
              </th>
              <th style={{
                padding: '0.75rem',
                textAlign: 'center',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '1px solid #e2e8f0'
              }}>
                Map Clicks
              </th>
              <th style={{
                padding: '0.75rem',
                textAlign: 'center',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '1px solid #e2e8f0'
              }}>
                Avg Occupancy
              </th>
              <th style={{
                padding: '0.75rem',
                textAlign: 'center',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '1px solid #e2e8f0'
              }}>
                Opening Status
              </th>
              <th style={{
                padding: '0.75rem',
                textAlign: 'center',
                fontWeight: '600',
                color: '#374151',
                borderBottom: '1px solid #e2e8f0'
              }}>
                Last Scraped
              </th>
            </tr>
          </thead>
          <tbody>
            {data.topLocations.map((location, index, array) => (
              <tr
                key={index}
                style={{
                  borderBottom: index < array.length - 1 ? '1px solid #f3f4f6' : 'none',
                  backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                }}
              >
                <td style={{ padding: '0.75rem' }}>
                  <div>
                    <div style={{
                      fontWeight: '500',
                      color: '#1f2937',
                      marginBottom: '0.25rem'
                    }}>
                      {location.name || 'Unknown Location'}
                    </div>
                    {location.address && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {location.address}
                      </div>
                    )}
                  </div>
                </td>
                <td style={{
                  padding: '0.75rem',
                  textAlign: 'center',
                  fontWeight: '600',
                  color: '#667eea'
                }}>
                  {location.scraping_count || 0}
                </td>
                <td style={{
                  padding: '0.75rem',
                  textAlign: 'center',
                  fontWeight: '600',
                  color: '#16a34a'
                }}>
                  {location.map_clicks || 0}
                </td>
                <td style={{
                  padding: '0.75rem',
                  textAlign: 'center'
                }}>
                  {location.avg_occupancy ? (
                    <span style={{
                      background: location.avg_occupancy > 70 ? '#fee2e2' :
                                location.avg_occupancy > 40 ? '#fef3c7' : '#dcfce7',
                      color: location.avg_occupancy > 70 ? '#dc2626' :
                             location.avg_occupancy > 40 ? '#d97706' : '#16a34a',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {location.avg_occupancy}%
                    </span>
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                      N/A
                    </span>
                  )}
                </td>
                <td style={{
                  padding: '0.75rem',
                  textAlign: 'center'
                }}>
                  {location.is_open !== undefined ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      background: location.is_open ? '#dcfce7' : '#fee2e2',
                      color: location.is_open ? '#166534' : '#991b1b'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: location.is_open ? '#16a34a' : '#dc2626'
                      }}></span>
                      {location.is_open ? 'Open' : 'Closed'}
                    </span>
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                      Unknown
                    </span>
                  )}
                </td>
                <td style={{
                  padding: '0.75rem',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  color: '#6b7280'
                }}>
                  {location.last_scraped ?
                    new Date(location.last_scraped).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) :
                    'Never'
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default LocationsTable