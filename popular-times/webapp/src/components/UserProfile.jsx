import { useState, useEffect } from 'react';
import './UserProfile.css';

const UserProfile = ({ user, token, onLogout, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [filters, setFilters] = useState([]);
  const [newFilter, setNewFilter] = useState({ type: 'location_name_contains', value: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  const filterTypes = [
    { value: 'location_name_contains', label: 'Location name contains' },
    { value: 'location_name_equals', label: 'Location name equals' },
    { value: 'address_contains', label: 'Address contains' },
    { value: 'rating_min', label: 'Minimum rating' },
    { value: 'occupancy_max', label: 'Maximum occupancy %' },
    { value: 'occupancy_min', label: 'Minimum occupancy %' },
    { value: 'exclude_location', label: 'Exclude location' },
    { value: 'only_live_data', label: 'Only live data' }
  ];

  useEffect(() => {
    if (token) {
      fetchProfile();
      fetchFilters();
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchFilters = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/filters`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFilters(data.filters);
      } else {
        setError('Failed to load filters');
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
      setError('Network error loading filters');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFilter = async (e) => {
    e.preventDefault();
    if (!newFilter.value.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/filters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newFilter)
      });

      const data = await response.json();

      if (response.ok) {
        setFilters([...filters, data.filter]);
        setNewFilter({ type: 'location_name_contains', value: '' });
        setSuccess('Filter added successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to add filter');
      }
    } catch (error) {
      console.error('Error adding filter:', error);
      setError('Network error adding filter');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFilter = async (filterId, active) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/filters/${filterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ active: !active })
      });

      if (response.ok) {
        const data = await response.json();
        setFilters(filters.map(f => f.id === filterId ? data.filter : f));
      }
    } catch (error) {
      console.error('Error toggling filter:', error);
    }
  };

  const handleDeleteFilter = async (filterId) => {
    if (!confirm('Are you sure you want to delete this filter?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/filters/${filterId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setFilters(filters.filter(f => f.id !== filterId));
        setSuccess('Filter deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting filter:', error);
      setError('Failed to delete filter');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    onLogout();
    onClose();
  };

  return (
    <div className="user-profile">
      <div className="profile-header">
        <h3>User Profile</h3>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="profile-tabs">
        <button 
          className={activeTab === 'profile' ? 'active' : ''} 
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={activeTab === 'filters' ? 'active' : ''} 
          onClick={() => setActiveTab('filters')}
        >
          Filters ({filters.filter(f => f.active).length})
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {activeTab === 'profile' && profile && (
        <div className="profile-info">
          <div className="info-item">
            <label>Username:</label>
            <span>{profile.username}</span>
          </div>
          <div className="info-item">
            <label>Email:</label>
            <span>{profile.email}</span>
          </div>
          <div className="info-item">
            <label>Member since:</label>
            <span>{new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
          {profile.last_login && (
            <div className="info-item">
              <label>Last login:</label>
              <span>{new Date(profile.last_login).toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {activeTab === 'filters' && (
        <div className="filters-section">
          <form onSubmit={handleAddFilter} className="add-filter-form">
            <h4>Add New Filter</h4>
            <div className="filter-inputs">
              <select
                value={newFilter.type}
                onChange={(e) => setNewFilter({ ...newFilter, type: e.target.value })}
                disabled={loading}
              >
                {filterTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              
              <input
                type="text"
                value={newFilter.value}
                onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
                placeholder="Filter value"
                disabled={loading}
                required
              />
              
              <button type="submit" disabled={loading || !newFilter.value.trim()}>
                Add Filter
              </button>
            </div>
          </form>

          <div className="filters-list">
            <h4>Your Filters ({filters.length})</h4>
            {filters.length === 0 ? (
              <p className="no-filters">No filters configured. Add a filter above to automatically filter scraping results.</p>
            ) : (
              filters.map(filter => (
                <div key={filter.id} className={`filter-item ${!filter.active ? 'inactive' : ''}`}>
                  <div className="filter-info">
                    <span className="filter-type">
                      {filterTypes.find(t => t.value === filter.type)?.label}
                    </span>
                    <span className="filter-value">"{filter.value}"</span>
                  </div>
                  <div className="filter-actions">
                    <button
                      onClick={() => handleToggleFilter(filter.id, filter.active)}
                      className={filter.active ? 'toggle-btn active' : 'toggle-btn inactive'}
                      title={filter.active ? 'Disable filter' : 'Enable filter'}
                    >
                      {filter.active ? 'ON' : 'OFF'}
                    </button>
                    <button
                      onClick={() => handleDeleteFilter(filter.id)}
                      className="delete-btn"
                      title="Delete filter"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;