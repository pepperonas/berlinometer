import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

function UserAnalytics({ data }) {
  if (!data || !data.growth) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        color: '#6b7280'
      }}>
        No user data available
      </div>
    )
  }

  const chartData = {
    labels: data.growth.map(item => {
      const date = new Date(item.date)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: 'New Users',
        data: data.growth.map(item => item.new_users),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: '#10b981',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#10b981',
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
          color: '#6b7280',
          stepSize: 1
        }
      }
    }
  }

  return (
    <div style={{ height: '300px' }}>
      <div style={{ height: '200px', marginBottom: '1rem' }}>
        <Bar data={chartData} options={options} />
      </div>

      {/* Engagement Metrics */}
      {data.engagement && (
        <div style={{
          background: '#f8fafc',
          padding: '1rem',
          borderRadius: '6px',
          fontSize: '0.875rem'
        }}>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            User Engagement
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '0.5rem',
            color: '#4a5568'
          }}>
            <div>
              <strong>Avg Locations:</strong><br />
              {data.engagement.avg_locations_per_user || 0}
            </div>
            <div>
              <strong>Avg Filters:</strong><br />
              {data.engagement.avg_filters_per_user || 0}
            </div>
            <div>
              <strong>Total Users:</strong><br />
              {data.engagement.total_users || 0}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {data.activity && data.activity.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Recent User Activity
          </h4>
          <div style={{
            maxHeight: '120px',
            overflowY: 'auto',
            fontSize: '0.75rem',
            color: '#4a5568'
          }}>
            {data.activity.slice(0, 5).map((user, index) => (
              <div
                key={user.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.25rem 0',
                  borderBottom: index < 4 ? '1px solid #e5e7eb' : 'none'
                }}
              >
                <span style={{ fontWeight: '500' }}>
                  {user.username}
                </span>
                <span style={{ opacity: 0.7 }}>
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default UserAnalytics