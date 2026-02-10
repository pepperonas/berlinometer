import { useState } from 'react'
import AdminSidebar from './AdminSidebar'
import AdminOverview from './AdminOverview'
import LocationAnalytics from './LocationAnalytics'
import UserManagement from './UserManagement'
import ScrapingHealth from './ScrapingHealth'
import MapClickAnalytics from './MapClickAnalytics'
import '../../styles/admin.css'

function AdminDashboard({ user, token }) {
  const [activeTab, setActiveTab] = useState('overview')
  const isAdmin = user?.role === 'admin'

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview token={token} isAdmin={isAdmin} />
      case 'locations':
        return <LocationAnalytics token={token} isAdmin={isAdmin} />
      case 'users':
        return isAdmin ? <UserManagement token={token} /> : null
      case 'scraping':
        return isAdmin ? <ScrapingHealth token={token} /> : null
      case 'clicks':
        return <MapClickAnalytics token={token} isAdmin={isAdmin} />
      default:
        return <AdminOverview token={token} isAdmin={isAdmin} />
    }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} />
      <main className="admin-content">
        {renderContent()}
      </main>
    </div>
  )
}

export default AdminDashboard
