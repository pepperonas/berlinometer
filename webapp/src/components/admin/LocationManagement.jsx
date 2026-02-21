import { useState, useEffect, useCallback } from 'react'
import Dialog from '../ui/Dialog'
import { cleanAddress } from '../../utils/locationUtils'

const API = import.meta.env.VITE_API_URL || ''

function LocationManagement({ token }) {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/locations/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.locations) {
        setLocations(data.locations)
      }
    } catch (err) {
      console.error('Failed to fetch locations:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const trimmedName = name.trim()
    const trimmedUrl = url.trim()

    if (!trimmedName || !trimmedUrl) {
      setError('Beide Felder sind erforderlich.')
      return
    }

    if (!trimmedUrl.includes('google.de/maps') && !trimmedUrl.includes('google.com/maps')) {
      setError('Bitte eine gültige Google Maps URL eingeben.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API}/admin/locations/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: trimmedName, google_maps_url: trimmedUrl })
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Fehler beim Hinzufügen.')
        return
      }

      setSuccess(`"${data.name}" wurde hinzugefügt (ID ${data.location_id}).`)
      setName('')
      setUrl('')
      fetchLocations()
    } catch (err) {
      setError('Netzwerkfehler. Bitte erneut versuchen.')
    } finally {
      setSubmitting(false)
    }
  }

  const closeDialog = () => {
    setShowDialog(false)
    setError('')
    setSuccess('')
    setName('')
    setUrl('')
  }

  const filtered = search
    ? locations.filter(l =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        (l.address || '').toLowerCase().includes(search.toLowerCase())
      )
    : locations

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Location Management</h1>
        <button className="admin-btn admin-btn--primary" onClick={() => setShowDialog(true)}>
          + Neue Location
        </button>
      </div>

      <div className="admin-filters-row">
        <input
          type="text"
          className="admin-search-input"
          placeholder="Location suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="admin-text-secondary" style={{ fontSize: '0.85rem' }}>
          {filtered.length} von {locations.length} Locations
        </span>
      </div>

      {loading ? (
        <div className="admin-loading">Lade Locations...</div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th className="admin-table__col--hide-mobile">Adresse</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((loc) => (
                <tr key={loc.id}>
                  <td>{loc.id}</td>
                  <td>{loc.name}</td>
                  <td className="admin-table__col--hide-mobile">
                    <span className="admin-text-truncate" style={{ display: 'block' }}>
                      {cleanAddress(loc.address) || '–'}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                    Keine Locations gefunden.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        isOpen={showDialog}
        onClose={closeDialog}
        title="Neue Location hinzufügen"
        fullscreenOnMobile={false}
      >
        <form onSubmit={handleSubmit}>
          {error && <div className="admin-alert admin-alert--error">{error}</div>}
          {success && <div className="admin-alert admin-alert--success">{success}</div>}

          <div style={{ marginBottom: '1rem' }}>
            <label className="admin-form-label">Name</label>
            <input
              type="text"
              className="admin-input"
              placeholder="z.B. Berghain"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="admin-form-label">Google Maps URL</label>
            <input
              type="url"
              className="admin-input"
              placeholder="https://www.google.de/maps/place/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={submitting}
            />
            <span className="admin-form-help">
              Öffne Google Maps, suche die Location und kopiere die URL aus der Adressleiste.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="admin-btn" onClick={closeDialog} disabled={submitting}>
              Abbrechen
            </button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={submitting}>
              {submitting ? 'Wird hinzugefügt...' : 'Hinzufügen'}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}

export default LocationManagement
