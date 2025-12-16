function MetricsCard({ title, value, icon, color = '#3b82f6' }) {
  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return (val / 1000000).toFixed(1) + 'M'
      } else if (val >= 1000) {
        return (val / 1000).toFixed(1) + 'K'
      }
      return val.toLocaleString()
    }
    return val
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      padding: '1.5rem',
      border: '1px solid #e2e8f0',
      transition: 'all 0.2s',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = 'none'
    }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <p style={{
            color: '#6b7280',
            fontSize: '0.875rem',
            margin: '0 0 0.5rem 0'
          }}>
            {title}
          </p>
          <p style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: color,
            margin: 0
          }}>
            {formatValue(value)}
          </p>
        </div>
        <div style={{
          fontSize: '2rem',
          opacity: 0.8
        }}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default MetricsCard