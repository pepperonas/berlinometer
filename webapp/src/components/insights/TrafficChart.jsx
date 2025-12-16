import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

function TrafficChart({ data }) {
  if (!data || !data.dailyTraffic) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        color: '#6b7280'
      }}>
        No traffic data available
      </div>
    )
  }

  const chartData = {
    labels: data.dailyTraffic.map(item => {
      const date = new Date(item.date)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: 'Scrapings',
        data: data.dailyTraffic.map(item => item.scrapings),
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Unique Locations',
        data: data.dailyTraffic.map(item => item.unique_locations),
        borderColor: '#f093fb',
        backgroundColor: 'rgba(240, 147, 251, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#667eea',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#6b7280'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f3f4f6'
        },
        ticks: {
          color: '#6b7280'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  }

  return (
    <div style={{ height: '300px' }}>
      <Line data={chartData} options={options} />

      {/* Hourly Pattern Summary */}
      {data.hourlyPattern && data.hourlyPattern.length > 0 && (
        <div style={{ marginTop: '1rem', padding: '1rem 0' }}>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Peak Hours
          </h4>
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            {data.hourlyPattern
              .sort((a, b) => b.count - a.count)
              .slice(0, 3)
              .map((hour, index) => (
                <div
                  key={hour.hour}
                  style={{
                    background: '#f8fafc',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: '#4a5568'
                  }}
                >
                  <strong>{hour.hour}:00</strong> - {hour.count} requests
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TrafficChart