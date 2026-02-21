import { useState, useEffect } from 'react'
import { cleanAddress } from '../../utils/locationUtils'

const API_URL = import.meta.env.VITE_API_URL

function LocationAssignment({ token, userId, userName, onClose, onSaved }) {
  const [locations, setLocations] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/locations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const json = await res.json()
        setLocations(json.locations || [])
      }
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleLocation = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/assign-locations`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ location_ids: selected })
      })
      if (res.ok) {
        onSaved?.()
        onClose()
      }
    } catch (err) {
      console.error('Assign error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <div className="admin-modal__header">
          <h3>Locations zuweisen: {userName}</h3>
          <button className="admin-modal__close" onClick={onClose}>×</button>
        </div>
        <div className="admin-modal__body">
          {loading ? (
            <div className="admin-loading">Laden...</div>
          ) : (
            <div className="admin-checkbox-list">
              {locations.map(loc => (
                <label key={loc.id} className="admin-checkbox-item">
                  <input
                    type="checkbox"
                    checked={selected.includes(loc.id)}
                    onChange={() => toggleLocation(loc.id)}
                  />
                  <span>{loc.name}</span>
                  <span className="admin-text-secondary" style={{ fontSize: '0.8rem', marginLeft: 'auto' }}>
                    {cleanAddress(loc.address)}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="admin-modal__footer">
          <button className="admin-btn" onClick={onClose}>Abbrechen</button>
          <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Speichern...' : `${selected.length} Locations zuweisen`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LocationAssignment
