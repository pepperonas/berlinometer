import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function OccupancyTimeline({ data }) {
  if (!data || data.length === 0) {
    return <div className="admin-chart-empty">Keine Timeline-Daten verfügbar</div>
  }

  return (
    <div className="admin-chart-card">
      <h3 className="admin-chart-title">Auslastung über Zeit</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis
            dataKey="timestamp"
            stroke="var(--text-secondary)"
            fontSize={11}
            tickFormatter={t => new Date(t).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
          />
          <YAxis stroke="var(--text-secondary)" fontSize={12} domain={[0, 100]} unit="%" />
          <Tooltip
            contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)' }}
            labelFormatter={t => new Date(t).toLocaleString('de-DE')}
            formatter={(value) => [`${value}%`]}
          />
          <Legend />
          <Line type="monotone" dataKey="occupancy" stroke="var(--accent-blue)" strokeWidth={2} dot={false} name="Aktuell" />
          <Line type="monotone" dataKey="usual" stroke="var(--text-secondary)" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Üblich" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default OccupancyTimeline
