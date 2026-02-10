import { useState, useRef, useEffect } from 'react'

const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function getColor(value) {
  if (value == null) return 'var(--hover-bg)'
  if (value < 20) return '#22c55e'
  if (value < 40) return '#84cc16'
  if (value < 60) return '#eab308'
  if (value < 80) return '#f97316'
  return '#ef4444'
}

function OccupancyHeatmap({ data }) {
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(containerRef.current)
    setContainerWidth(containerRef.current.offsetWidth)
    return () => observer.disconnect()
  }, [])

  if (!data || Object.keys(data).length === 0) {
    return <div className="admin-chart-empty">Keine Heatmap-Daten verfügbar</div>
  }

  const labelWidth = 30
  const cellSize = containerWidth > 0
    ? Math.max(12, Math.floor((containerWidth - labelWidth - 10) / 24))
    : 28
  const headerHeight = 24
  const fontSize = cellSize < 20 ? 9 : 10
  const labelFontSize = cellSize < 20 ? 9 : 11

  return (
    <div className="admin-chart-card">
      <h3 className="admin-chart-title">Wochentag × Stunde Heatmap</h3>
      <div ref={containerRef} style={{ overflowX: 'auto' }}>
        <svg
          width={labelWidth + HOURS.length * cellSize + 10}
          height={headerHeight + DAYS.length * cellSize + 10}
          style={{ display: 'block', margin: '0 auto' }}
        >
          {/* Hour headers */}
          {HOURS.map(h => (
            <text
              key={`h-${h}`}
              x={labelWidth + h * cellSize + cellSize / 2}
              y={headerHeight - 4}
              textAnchor="middle"
              fontSize={fontSize}
              fill="var(--text-secondary)"
            >
              {h}
            </text>
          ))}

          {/* Day rows */}
          {DAYS.map((day, dayIdx) => {
            const dow = dayIdx + 1 // 1=Sunday matches MySQL DAYOFWEEK
            return (
              <g key={day}>
                <text
                  x={2}
                  y={headerHeight + dayIdx * cellSize + cellSize / 2 + 4}
                  fontSize={labelFontSize}
                  fill="var(--text-secondary)"
                >
                  {day}
                </text>
                {HOURS.map(h => {
                  const val = data[dow]?.[h]
                  return (
                    <g key={`${day}-${h}`}>
                      <rect
                        x={labelWidth + h * cellSize}
                        y={headerHeight + dayIdx * cellSize}
                        width={cellSize - 2}
                        height={cellSize - 2}
                        rx={cellSize < 20 ? 2 : 3}
                        fill={getColor(val)}
                        opacity={val != null ? 0.85 : 0.3}
                      />
                      {val != null && (
                        <title>{`${day} ${h}:00 - ${val}%`}</title>
                      )}
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>
      </div>
      <div className="admin-heatmap-legend">
        <span>0%</span>
        <div className="admin-heatmap-legend__bar" />
        <span>100%</span>
      </div>
    </div>
  )
}

export default OccupancyHeatmap
