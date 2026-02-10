import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AdminDashboard from '../components/admin/AdminDashboard'

function AdminPage() {
  const navigate = useNavigate()
  const { user, token, loading, canAccessAdmin } = useAuth()

  useEffect(() => {
    if (!loading && !canAccessAdmin()) {
      navigate('/')
    }
  }, [loading, user, navigate, canAccessAdmin])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--background)' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Laden...</div>
      </div>
    )
  }

  if (!canAccessAdmin()) return null

  return <AdminDashboard user={user} token={token} />
}

export default AdminPage
