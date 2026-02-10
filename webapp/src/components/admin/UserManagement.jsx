import { useState, useEffect } from 'react'
import LocationAssignment from './LocationAssignment'

const API_URL = import.meta.env.VITE_API_URL

function UserManagement({ token }) {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [assignUser, setAssignUser] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [page, search, roleFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 25, role: roleFilter, search })
      const res = await fetch(`${API_URL}/admin/users?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const json = await res.json()
        setUsers(json.users || [])
        setTotal(json.total || 0)
      }
    } catch (err) {
      console.error('Fetch users error:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (userId, data) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) fetchUsers()
    } catch (err) {
      console.error('Update user error:', err)
    }
  }

  const totalPages = Math.ceil(total / 25)

  return (
    <div className="admin-user-management">
      <h1 className="admin-page-title">User Management</h1>

      <div className="admin-filters-row">
        <input
          type="text"
          className="admin-search-input"
          placeholder="User suchen..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <select
          className="admin-select"
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
        >
          <option value="all">Alle Rollen</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="location_owner">Location Owner</option>
        </select>
        <span className="admin-text-secondary">{total} User</span>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="admin-table__col--hide-mobile">ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Rolle</th>
              <th>Aktiv</th>
              <th className="admin-table__col--hide-mobile">Google</th>
              <th className="admin-table__col--hide-mobile">Locations</th>
              <th>Registriert</th>
              <th>Letzter Login</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" style={{ textAlign: 'center' }}>Laden...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="10" style={{ textAlign: 'center' }}>Keine User gefunden</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id}>
                  <td className="admin-table__col--hide-mobile">{u.id}</td>
                  <td>{u.username}</td>
                  <td className="admin-text-truncate">{u.email}</td>
                  <td>
                    <select
                      className="admin-select admin-select--inline"
                      value={u.role}
                      onChange={e => updateUser(u.id, { role: e.target.value })}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                      <option value="location_owner">location_owner</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className={`admin-toggle ${u.is_active ? 'admin-toggle--active' : ''}`}
                      onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                      title={u.is_active ? 'Deaktivieren' : 'Aktivieren'}
                    >
                      {u.is_active ? '✓' : '✕'}
                    </button>
                  </td>
                  <td className="admin-table__col--hide-mobile">{u.has_google ? '🔗' : '-'}</td>
                  <td className="admin-table__col--hide-mobile">{u.saved_locations}</td>
                  <td className="admin-text-nowrap">{u.created_at ? new Date(u.created_at).toLocaleDateString('de-DE') : '-'}</td>
                  <td className="admin-text-nowrap">{u.last_login ? new Date(u.last_login).toLocaleDateString('de-DE') : '-'}</td>
                  <td>
                    <button
                      className="admin-btn admin-btn--sm"
                      onClick={() => setAssignUser(u)}
                      title="Locations zuweisen"
                    >
                      📍
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button className="admin-btn admin-btn--sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
          <span className="admin-text-secondary">Seite {page} von {totalPages}</span>
          <button className="admin-btn admin-btn--sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</button>
        </div>
      )}

      {/* Location Assignment Dialog */}
      {assignUser && (
        <LocationAssignment
          token={token}
          userId={assignUser.id}
          userName={assignUser.username}
          onClose={() => setAssignUser(null)}
          onSaved={fetchUsers}
        />
      )}
    </div>
  )
}

export default UserManagement
