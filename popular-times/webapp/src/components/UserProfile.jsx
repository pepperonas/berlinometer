import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import './UserProfile.css';
import './ThemeSelector.css';

const UserProfile = ({ user, token, onLogout, onClose }) => {
  const { theme, switchTheme, themeNames, availableThemes } = useTheme();
  const { language, switchLanguage, t, availableLanguages } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [filters, setFilters] = useState([]);
  const [newFilter, setNewFilter] = useState({ type: 'location_name_contains', value: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  const filterTypes = [
    { value: 'location_name_contains', label: 'Location-Name enthält' },
    { value: 'location_name_equals', label: 'Location-Name ist' },
    { value: 'address_contains', label: 'Adresse enthält' },
    { value: 'rating_min', label: 'Mindestbewertung' },
    { value: 'occupancy_max', label: 'Max. Auslastung %' },
    { value: 'occupancy_min', label: 'Min. Auslastung %' },
    { value: 'exclude_location', label: 'Location ausschließen' },
    { value: 'only_live_data', label: 'Nur Live-Daten' }
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
        setError('Filter konnten nicht geladen werden');
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
      setError('Netzwerkfehler beim Laden der Filter');
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
        setSuccess('Filter erfolgreich hinzugefügt!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Filter konnte nicht hinzugefügt werden');
      }
    } catch (error) {
      console.error('Error adding filter:', error);
      setError('Netzwerkfehler beim Hinzufügen des Filters');
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
    if (!confirm('Möchten Sie diesen Filter wirklich löschen?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/filters/${filterId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setFilters(filters.filter(f => f.id !== filterId));
        setSuccess('Filter erfolgreich gelöscht!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting filter:', error);
      setError('Filter konnte nicht gelöscht werden');
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
        <h3>{t('welcome')}, {profile?.username || t('username')}!</h3>
        <button className="logout-btn" onClick={handleLogout}>
          {t('logout')}
        </button>
      </div>

      <div className="profile-tabs">
        <button 
          className={activeTab === 'profile' ? 'active' : ''} 
          onClick={() => setActiveTab('profile')}
        >
          {t('profile')}
        </button>
        <button 
          className={activeTab === 'filters' ? 'active' : ''} 
          onClick={() => setActiveTab('filters')}
        >
          {t('filters')} ({filters.filter(f => f.active).length})
        </button>
        <button 
          className={activeTab === 'themes' ? 'active' : ''} 
          onClick={() => setActiveTab('themes')}
        >
          {t('themes')}
        </button>
        <button 
          className={activeTab === 'language' ? 'active' : ''} 
          onClick={() => setActiveTab('language')}
        >
          {t('language')}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {activeTab === 'profile' && profile && (
        <div className="profile-info">
          <div className="info-item">
            <label>{t('username')}:</label>
            <span>{profile.username}</span>
          </div>
          <div className="info-item">
            <label>{t('email')}:</label>
            <span>{profile.email}</span>
          </div>
          <div className="info-item">
            <label>{t('memberSince')}:</label>
            <span>{new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
          {profile.last_login && (
            <div className="info-item">
              <label>{t('lastLogin')}:</label>
              <span>{new Date(profile.last_login).toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {activeTab === 'filters' && (
        <div className="filters-section">
          <form onSubmit={handleAddFilter} className="add-filter-form">
            <h4>Neuen Filter hinzufügen</h4>
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
                placeholder="Filterwert"
                disabled={loading}
                required
              />
              
              <button type="submit" disabled={loading || !newFilter.value.trim()}>
                Filter hinzufügen
              </button>
            </div>
          </form>

          <div className="filters-list">
            <h4>Ihre Filter ({filters.length})</h4>
            {filters.length === 0 ? (
              <p className="no-filters">Keine Filter konfiguriert. Fügen Sie oben einen Filter hinzu, um die Scraping-Ergebnisse automatisch zu filtern.</p>
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
                      title={filter.active ? 'Filter deaktivieren' : 'Filter aktivieren'}
                    >
                      {filter.active ? 'ON' : 'OFF'}
                    </button>
                    <button
                      onClick={() => handleDeleteFilter(filter.id)}
                      className="delete-btn"
                      title="Filter löschen"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'themes' && (
        <div className="themes-section">
          <h4>Theme auswählen</h4>
          <p className="themes-description">
            Wählen Sie das gewünschte Design für die Benutzeroberfläche.
          </p>
          
          <div className="theme-options">
            {Object.entries(availableThemes).map(([themeKey, config]) => (
              <div 
                key={themeKey}
                className={`theme-option ${theme === themeKey ? 'selected' : ''}`}
                onClick={() => switchTheme(themeKey)}
              >
                <div className="theme-preview">
                  <div 
                    className={`preview-circle theme-${themeKey}`}
                    style={{
                      background: themeKey === 'psychedelic' 
                        ? 'linear-gradient(45deg, #FF00FF, #00FFFF, #FFFF00)' 
                        : themeKey === 'light' 
                        ? 'linear-gradient(45deg, #3B82F6, #10B981)' 
                        : 'linear-gradient(45deg, #688db1, #9cb68f)'
                    }}
                  ></div>
                </div>
                <div className="theme-info">
                  <h5>{config.name}</h5>
                  <p>{config.description}</p>
                  {theme === themeKey && <span className="selected-indicator">✓ Aktiv</span>}
                </div>
              </div>
            ))}
          </div>
          
          <div className="theme-note">
            <p>
              <strong>💡 Tipp:</strong> Das ausgewählte Theme wird automatisch gespeichert 
              und bei Ihrem nächsten Besuch wiederhergestellt.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'language' && (
        <div className="language-section">
          <h4>Sprache auswählen</h4>
          <p className="language-description">
            Wählen Sie Ihre bevorzugte Sprache für die Benutzeroberfläche.
          </p>
          
          <div className="language-options">
            {Object.entries(availableLanguages).map(([langKey, langName]) => (
              <div 
                key={langKey}
                className={`language-option ${language === langKey ? 'selected' : ''}`}
                onClick={() => switchLanguage(langKey)}
              >
                <div className="language-info">
                  <h5>{langName}</h5>
                  <p>{langKey === 'de' ? 'Deutsche Benutzeroberfläche' : 'English user interface'}</p>
                  {language === langKey && <span className="selected-indicator">✓ Aktiv</span>}
                </div>
              </div>
            ))}
          </div>
          
          <div className="language-note">
            <p>
              <strong>💡 Tipp:</strong> Die ausgewählte Sprache wird automatisch gespeichert 
              und bei Ihrem nächsten Besuch wiederhergestellt.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;