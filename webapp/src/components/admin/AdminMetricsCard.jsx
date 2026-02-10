function AdminMetricsCard({ title, value, subtitle, icon, trend, color = 'var(--accent-blue)' }) {
  const trendColor = trend > 0 ? 'var(--accent-green)' : trend < 0 ? '#ef4444' : 'var(--text-secondary)'
  const trendArrow = trend > 0 ? '\u2191' : trend < 0 ? '\u2193' : ''

  return (
    <div className="admin-metrics-card">
      <div className="admin-metrics-card__header">
        <span className="admin-metrics-card__icon" style={{ color }}>{icon}</span>
        <span className="admin-metrics-card__title">{title}</span>
      </div>
      <div className="admin-metrics-card__value" style={{ color }}>{value}</div>
      <div className="admin-metrics-card__footer">
        {subtitle && <span className="admin-metrics-card__subtitle">{subtitle}</span>}
        {trend !== undefined && trend !== null && (
          <span className="admin-metrics-card__trend" style={{ color: trendColor }}>
            {trendArrow} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  )
}

export default AdminMetricsCard
