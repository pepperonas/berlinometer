import { useState, useRef, useEffect } from 'react'
import { cleanAddress } from '../../utils/locationUtils'

function LocationSelector({ locations, selectedId, onChange, loading }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const selected = locations.find(l => l.id === selectedId)

  const filtered = locations.filter(loc =>
    loc.name?.toLowerCase().includes(search.toLowerCase()) ||
    loc.address?.toLowerCase().includes(search.toLowerCase())
  )

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }
  }, [open])

  const handleSelect = (id) => {
    onChange(id)
    setOpen(false)
    setSearch('')
  }

  const handleOpen = () => {
    setOpen(true)
    setSearch('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div className="admin-location-dropdown" ref={containerRef}>
      {/* Trigger button */}
      <button
        className="admin-location-dropdown__trigger"
        onClick={handleOpen}
        type="button"
      >
        {loading ? (
          <span className="admin-location-dropdown__placeholder">Laden...</span>
        ) : selected ? (
          <>
            <div className="admin-location-dropdown__selected">
              <span className="admin-location-dropdown__selected-name">{selected.name}</span>
              {selected.address && (
                <span className="admin-location-dropdown__selected-addr">{cleanAddress(selected.address)}</span>
              )}
            </div>
            {selected.avg_occupancy_7d != null && (
              <span className="admin-location-dropdown__occ">{selected.avg_occupancy_7d}%</span>
            )}
          </>
        ) : (
          <span className="admin-location-dropdown__placeholder">Location wählen...</span>
        )}
        <span className="admin-location-dropdown__chevron">{open ? '\u25B2' : '\u25BC'}</span>
      </button>

      {/* Dropdown overlay */}
      {open && (
        <div className="admin-location-dropdown__menu">
          <input
            ref={inputRef}
            type="text"
            className="admin-location-dropdown__search"
            placeholder="Suchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="admin-location-dropdown__list">
            {filtered.length === 0 ? (
              <div className="admin-location-dropdown__empty">Keine Locations gefunden</div>
            ) : (
              filtered.map(loc => (
                <button
                  key={loc.id}
                  className={`admin-location-dropdown__item ${selectedId === loc.id ? 'admin-location-dropdown__item--active' : ''}`}
                  onClick={() => handleSelect(loc.id)}
                  type="button"
                >
                  <div className="admin-location-dropdown__item-info">
                    <span className="admin-location-dropdown__item-name">{loc.name}</span>
                    {loc.address && (
                      <span className="admin-location-dropdown__item-addr">{cleanAddress(loc.address)}</span>
                    )}
                  </div>
                  {loc.avg_occupancy_7d != null && (
                    <span className="admin-location-dropdown__item-occ">{loc.avg_occupancy_7d}%</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LocationSelector
