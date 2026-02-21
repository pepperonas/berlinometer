function AdminSidebar({ activeTab, onTabChange, isAdmin }) {
  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: '📊', roles: ['admin', 'location_owner'] },
    { id: 'locations', label: 'Location Analytics', icon: '📍', roles: ['admin', 'location_owner'] },
    { id: 'users', label: 'User Management', icon: '👥', roles: ['admin'] },
    { id: 'scraping', label: 'Scraping Health', icon: '🔄', roles: ['admin'] },
    { id: 'clicks', label: 'Map Clicks', icon: '🖱️', roles: ['admin', 'location_owner'] },
    { id: 'location-management', label: 'Locations', icon: '➕', roles: ['admin'] },
  ]

  const visibleTabs = tabs.filter(tab => isAdmin || tab.roles.includes('location_owner'))

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__header">
          <a href="/" className="admin-sidebar__back">← Zurück</a>
          <h2 className="admin-sidebar__title">Admin</h2>
        </div>
        <nav className="admin-sidebar__nav">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              className={`admin-sidebar__item ${activeTab === tab.id ? 'admin-sidebar__item--active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <span className="admin-sidebar__icon">{tab.icon}</span>
              <span className="admin-sidebar__label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile Tab Bar */}
      <div className="admin-tabs-mobile">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            className={`admin-tabs-mobile__item ${activeTab === tab.id ? 'admin-tabs-mobile__item--active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="admin-tabs-mobile__icon">{tab.icon}</span>
            <span className="admin-tabs-mobile__label">{tab.label}</span>
          </button>
        ))}
      </div>
    </>
  )
}

export default AdminSidebar
