function TimeRangeSelector({ value, onChange, options = [7, 30, 90] }) {
  const labels = { 7: '7 Tage', 14: '14 Tage', 30: '30 Tage', 90: '90 Tage' }

  return (
    <div className="admin-time-range">
      {options.map(days => (
        <button
          key={days}
          className={`admin-time-range__btn ${value === days ? 'admin-time-range__btn--active' : ''}`}
          onClick={() => onChange(days)}
        >
          {labels[days] || `${days}d`}
        </button>
      ))}
    </div>
  )
}

export default TimeRangeSelector
