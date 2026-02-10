import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function PeakHoursChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="admin-chart-empty">Keine Peak-Daten verfügbar</div>
  }

  const chartData = data.map(d => ({
    ...d,
    label: `${d.hour}:00`
  }))

  return (
    <div className="admin-chart-card">
      <h3 className="admin-chart-title">Peak Hours (Top 10)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis type="number" stroke="var(--text-secondary)" fontSize={12} domain={[0, 100]} unit="%" />
          <YAxis type="category" dataKey="label" stroke="var(--text-secondary)" fontSize={12} width={50} />
          <Tooltip
            contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-color)' }}
            formatter={(value) => [`${value}%`, 'Ø Auslastung']}
          />
          <Bar dataKey="avg" fill="var(--accent-blue)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PeakHoursChart
