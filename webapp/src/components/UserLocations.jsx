import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Dialog from './ui/Dialog';
import {
  MapPin,
  Plus,
  Trash2,
  GripVertical,
  Search,
  RefreshCw,
  Save,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import './UserLocations.css';

const UserLocations = ({ onClose, onLocationsSaved, isOpen }) => {
  const { getAuthHeaders, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [savedLocations, setSavedLocations] = useState([]);
  const [defaultLocations, setDefaultLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);
  const [showDefaultLocations, setShowDefaultLocations] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      fetchUserLocations();
      fetchDefaultLocations();
    }
  }, []);

  const fetchUserLocations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/user-locations`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch saved locations');
      }

      const data = await response.json();
      setSavedLocations(data.locations || []);
    } catch (err) {
      setError('Could not load your saved locations');
      console.error('Error fetching user locations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDefaultLocations = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/default-locations`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch default locations');
      }

      const data = await response.json();
      setDefaultLocations(data.locations || []);
    } catch (err) {
      console.error('Error fetching default locations:', err);
    }
  };

  const addLocation = async (location) => {
    setError(null);
    setSuccessMessage('');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/user-locations`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          google_maps_url: location.url,
          name: location.name,
          address: location.address || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add location');
      }

      await fetchUserLocations();
      setSuccessMessage(`${location.name} added to your locations`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  const removeLocation = async (locationId, locationName) => {
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/user-locations/${locationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to remove location');
      }

      await fetchUserLocations();
      setSuccessMessage(`${locationName} removed`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Could not remove location');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === dropIndex) return;

    const reorderedLocations = [...savedLocations];
    const [movedItem] = reorderedLocations.splice(draggedItem, 1);
    reorderedLocations.splice(dropIndex, 0, movedItem);
    
    setSavedLocations(reorderedLocations);
    setDraggedItem(null);

    // Update order on server
    try {
      const locationIds = reorderedLocations.map(loc => loc.location_id);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/user-locations/reorder`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ location_ids: locationIds })
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }
    } catch (err) {
      setError('Could not save new order');
      fetchUserLocations(); // Revert to server order
    }
  };

  const scrapeUserLocations = async () => {
    if (savedLocations.length === 0) {
      setError('No locations to check');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/user-locations/scrape`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to check locations');
      }

      // Call the parent callback to refresh the main display
      if (onLocationsSaved) {
        onLocationsSaved();
      }
      
      setSuccessMessage('Successfully checked all your locations');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Could not check locations');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDefaultLocations = defaultLocations.filter(loc => {
    const savedUrls = savedLocations.map(s => s.google_maps_url);
    return !savedUrls.includes(loc.url) && 
           loc.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={24} />
          {t('myLocations')}
        </div>
      }
      fullscreenOnMobile={true}
    >
      <div className="user-locations-container">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        <div className="saved-locations-section">
        <div className="section-header">
          <h3>{t('savedLocations')} ({savedLocations.length})</h3>
        </div>

        {savedLocations.length === 0 ? (
          <div className="empty-state">
            <MapPin size={48} />
            <p>No saved locations yet</p>
            <span>Add locations from the list below</span>
          </div>
        ) : (
          <div className="locations-list">
            {savedLocations.map((location, index) => (
              <div
                key={location.id}
                className="location-item"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                <div className="drag-handle">
                  <GripVertical size={16} />
                </div>
                <div className="location-info">
                  <div className="location-name">{location.name}</div>
                  {location.address && (
                    <div className="location-address">{location.address}</div>
                  )}
                </div>
                <button
                  onClick={() => removeLocation(location.location_id, location.name)}
                  className="remove-button"
                  title="Remove location"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="add-locations-section">
        <div className="section-header">
          <button
            onClick={() => setShowDefaultLocations(!showDefaultLocations)}
            className="toggle-section-button"
          >
            <h3>{t('addLocations')}</h3>
            {showDefaultLocations ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {showDefaultLocations && (
          <>
            <div className="search-bar">
              <Search size={20} />
              <input
                type="text"
                placeholder={t('searchLocations')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="available-locations">
              {filteredDefaultLocations.length === 0 ? (
                <div className="empty-search">
                  {searchTerm ? t('noSearchResults') : t('allLocationsAdded')}
                </div>
              ) : (
                filteredDefaultLocations.map((location) => (
                  <div key={location.url} className="available-location-item">
                    <div className="location-info">
                      <div className="location-name">{location.name}</div>
                    </div>
                    <button
                      onClick={() => addLocation(location)}
                      className="add-button"
                      title="Add to saved locations"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
      </div>
    </Dialog>
  );
};

export default UserLocations;