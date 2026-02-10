import { useState } from 'react'

function LocationSelector({ locations, selectedId, onChange, loading }) {
  const [search, setSearch] = useState('')

  const filtered = locations.filter(loc =>
    loc.name?.toLowerCase().includes(search.toLowerCase()) ||
    loc.address?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="admin-location-selector">
      <input
        type="text"
        className="admin-location-selector__search"
        placeholder="Location suchen..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="admin-location-selector__list">
        {loading ? (
          <div className="admin-location-selector__empty">Laden...</div>
        ) : filtered.length === 0 ? (
          <div className="admin-location-selector__empty">Keine Locations gefunden</div>
        ) : (
          filtered.map(loc => (
            <button
              key={loc.id}
              className={`admin-location-selector__item ${selectedId === loc.id ? 'admin-location-selector__item--active' : ''}`}
              onClick={() => onChange(loc.id)}
            >
              <span className="admin-location-selector__name">{loc.name}</span>
              {loc.avg_occupancy_7d != null && (
                <span className="admin-location-selector__occ">{loc.avg_occupancy_7d}%</span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

export default LocationSelector
