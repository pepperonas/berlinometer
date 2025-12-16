import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import InsightsDashboard from '../components/insights/InsightsDashboard'

function InsightsPage() {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [token, setToken] = useState(null)

  // Check if already authenticated
  useEffect(() => {
    const savedToken = localStorage.getItem('insights_token')
    if (savedToken) {
      verifyToken(savedToken)
    }
  }, [])

  const verifyToken = async (tokenToCheck) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/insights/overview`, {
        headers: {
          'Authorization': `Bearer ${tokenToCheck}`
        }
      })

      if (response.ok) {
        setToken(tokenToCheck)
        setIsAuthenticated(true)
      } else {
        // Token expired or invalid
        localStorage.removeItem('insights_token')
        setToken(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      localStorage.removeItem('insights_token')
      setToken(null)
      setIsAuthenticated(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/insights/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (response.ok) {
        const { token: newToken } = data
        localStorage.setItem('insights_token', newToken)
        setToken(newToken)
        setIsAuthenticated(true)
        setPassword('')
      } else {
        setError(data.error || 'Authentication failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('insights_token')
    setToken(null)
    setIsAuthenticated(false)
    setPassword('')
    navigate('/')
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '0.5rem'
            }}>
              📊 Insights Dashboard
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Enter password to access analytics
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter insights password"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              style={{
                width: '100%',
                background: isLoading || !password.trim() ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: isLoading || !password.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {isLoading ? 'Authenticating...' : 'Access Dashboard'}
            </button>
          </form>

          <div style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                fontSize: '0.875rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              ← Back to Berlinometer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* Header - Mobile Optimized */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '1rem'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth <= 640 ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: window.innerWidth <= 640 ? 'stretch' : 'center',
          gap: '1rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1a202c',
              margin: 0
            }}>
              📊 Berlinometer Insights
            </h1>
            <p style={{
              color: '#718096',
              fontSize: '0.875rem',
              margin: '0.25rem 0 0 0'
            }}>
              Analytics Dashboard
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            flexDirection: window.innerWidth <= 640 ? 'column' : 'row'
          }}>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '0.5rem 1rem',
                background: '#e2e8f0',
                color: '#4a5568',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                cursor: 'pointer',
                width: window.innerWidth <= 640 ? '100%' : 'auto'
              }}
            >
              🏠 Home
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                background: '#fed7d7',
                color: '#c53030',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                cursor: 'pointer',
                width: window.innerWidth <= 640 ? '100%' : 'auto'
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Content - Mobile Optimized */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: window.innerWidth <= 640 ? '1rem' : '2rem'
      }}>
        <InsightsDashboard token={token} />
      </main>
    </div>
  )
}

export default InsightsPage