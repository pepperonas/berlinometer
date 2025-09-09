import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const [preferences, setPreferences] = useState({
    defaultGameMode: '501',
    soundEnabled: true,
    vibrationEnabled: true,
    checkoutSuggestions: true
  });
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(null);

  useEffect(() => {
    if (user) {
      setPreferences(user.preferences || preferences);
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handlePreferencesUpdate = async () => {
    try {
      setLoading(true);
      const response = await api.put('/users/preferences', { preferences });
      updateUser(response.data.user);
      setMessage('Preferences updated successfully');
      setError('');
    } catch (error) {
      setError('Failed to update preferences');
      console.error('Error updating preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      const response = await api.put('/users/profile', profileData);
      updateUser(response.data.user);
      setMessage('Profile updated successfully');
      setError('');
    } catch (error) {
      setError('Failed to update profile');
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await api.put('/users/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setMessage('Password changed successfully');
      setError('');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setError('Failed to change password. Check your current password.');
      console.error('Error changing password:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete('/users/account');
      logout();
    } catch (error) {
      setError('Failed to delete account');
      console.error('Error deleting account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = async (type) => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      
      if (type === 'games') {
        await api.delete('/users/reset/games');
        setMessage('Alle Spiele wurden erfolgreich gelöscht');
      } else if (type === 'players') {
        await api.delete('/users/reset/players');
        setMessage('Alle Spieler wurden erfolgreich gelöscht');
      } else if (type === 'all') {
        await api.delete('/users/reset/all');
        setMessage('Alle Daten wurden erfolgreich zurückgesetzt');
      }
      
      setShowResetConfirm(null);
    } catch (error) {
      console.error('Error resetting data:', error);
      setError(`Fehler beim Zurücksetzen der Daten: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="card">
        <h1>⚙️ Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage your account and preferences
        </p>
      </div>

      {message && (
        <div className="card" style={{ backgroundColor: 'var(--accent-green)', color: 'white' }}>
          ✅ {message}
        </div>
      )}

      {error && (
        <div className="card" style={{ backgroundColor: 'var(--accent-red)', color: 'white' }}>
          ❌ {error}
        </div>
      )}

      {/* Game Preferences */}
      <div className="card">
        <h3>Game Preferences</h3>
        <div className="space-y-4" style={{ marginTop: 'var(--spacing-4)' }}>
          <div>
            <label className="form-label">Default Game Mode</label>
            <select
              className="form-select"
              value={preferences.defaultGameMode}
              onChange={(e) => setPreferences({ ...preferences, defaultGameMode: e.target.value })}
            >
              <option value="301">301</option>
              <option value="501">501</option>
              <option value="701">701</option>
              <option value="cricket">Cricket</option>
              <option value="around-the-clock">Around the Clock</option>
            </select>
          </div>
          
          <div>
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={preferences.soundEnabled}
                onChange={(e) => setPreferences({ ...preferences, soundEnabled: e.target.checked })}
              />
              <span className="checkmark"></span>
              <span>Sound Effects aktivieren</span>
            </label>
          </div>

          <div>
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={preferences.vibrationEnabled}
                onChange={(e) => setPreferences({ ...preferences, vibrationEnabled: e.target.checked })}
              />
              <span className="checkmark"></span>
              <span>Vibration aktivieren (Mobile)</span>
            </label>
          </div>

          <div>
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={preferences.checkoutSuggestions}
                onChange={(e) => setPreferences({ ...preferences, checkoutSuggestions: e.target.checked })}
              />
              <span className="checkmark"></span>
              <span>Checkout-Vorschläge anzeigen</span>
            </label>
          </div>

          <button
            className="btn btn-primary"
            onClick={handlePreferencesUpdate}
            disabled={loading}
          >
            Save Preferences
          </button>
        </div>
      </div>

      {/* Profile Information */}
      <div className="card">
        <h3>Profile Information</h3>
        <div className="space-y-4" style={{ marginTop: 'var(--spacing-4)' }}>
          <div className="grid grid-2" style={{ gap: 'var(--spacing-4)' }}>
            <div>
              <label className="form-label">First Name</label>
              <input
                type="text"
                className="form-input"
                value={profileData.firstName}
                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-input"
                value={profileData.lastName}
                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                placeholder="Enter last name"
              />
            </div>
          </div>
          
          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              placeholder="Enter email"
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleProfileUpdate}
            disabled={loading}
          >
            Update Profile
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <h3>Change Password</h3>
        <div className="space-y-4" style={{ marginTop: 'var(--spacing-4)' }}>
          <div>
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="form-input"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              placeholder="Enter current password"
            />
          </div>
          
          <div>
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-input"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              placeholder="Enter new password (min 6 characters)"
            />
          </div>
          
          <div>
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              className="form-input"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handlePasswordChange}
            disabled={loading}
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Account Actions */}
      <div className="card">
        <h3>Account Actions</h3>
        <div className="space-y-4" style={{ marginTop: 'var(--spacing-4)' }}>
          <div style={{ padding: 'var(--spacing-4)', backgroundColor: 'var(--background-darker)', borderRadius: 'var(--radius)' }}>
            <p style={{ marginBottom: 'var(--spacing-2)' }}>
              <strong>Username:</strong> {user?.username}
            </p>
            <p style={{ marginBottom: 'var(--spacing-2)' }}>
              <strong>Account Status:</strong> {user?.status}
            </p>
            <p>
              <strong>Member Since:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          
          <button
            className="btn btn-danger"
            onClick={handleDeleteAccount}
            disabled={loading}
          >
            🗑️ Delete Account
          </button>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Warning: Deleting your account will permanently remove all your data including players, games, and statistics.
          </p>
        </div>
      </div>

      {/* Data Reset Options */}
      <div className="card">
        <h3 style={{ color: 'var(--accent-red)' }}>⚠️ Daten zurücksetzen</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-4)' }}>
          Diese Optionen löschen dauerhaft Daten aus deinem Account. Diese Aktionen können nicht rückgängig gemacht werden.
        </p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 'var(--spacing-3)' 
        }}>
          <div style={{ 
            padding: 'var(--spacing-4)', 
            backgroundColor: 'var(--background-darker)', 
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-color)'
          }}>
            <h4 style={{ marginBottom: 'var(--spacing-2)' }}>🎯 Alle Spiele löschen</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-3)' }}>
              Löscht alle Spiele und Spielhistorien. Spieler bleiben erhalten.
            </p>
            <button
              className="btn"
              style={{
                width: '100%',
                backgroundColor: 'var(--accent-red)',
                color: 'white',
                border: '1px solid var(--accent-red)'
              }}
              onClick={() => setShowResetConfirm('games')}
              disabled={loading}
            >
              Alle Spiele löschen
            </button>
          </div>

          <div style={{ 
            padding: 'var(--spacing-4)', 
            backgroundColor: 'var(--background-darker)', 
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-color)'
          }}>
            <h4 style={{ marginBottom: 'var(--spacing-2)' }}>👥 Alle Spieler löschen</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-3)' }}>
              Löscht alle erstellten Spieler. Spiele werden ebenfalls gelöscht.
            </p>
            <button
              className="btn"
              style={{
                width: '100%',
                backgroundColor: 'var(--accent-red)',
                color: 'white',
                border: '1px solid var(--accent-red)'
              }}
              onClick={() => setShowResetConfirm('players')}
              disabled={loading}
            >
              Alle Spieler löschen
            </button>
          </div>

          <div style={{ 
            padding: 'var(--spacing-4)', 
            backgroundColor: 'var(--background-darker)', 
            borderRadius: 'var(--radius)',
            border: '2px solid var(--accent-red)'
          }}>
            <h4 style={{ marginBottom: 'var(--spacing-2)', color: 'var(--accent-red)' }}>🚨 Komplett zurücksetzen</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-3)' }}>
              Löscht alle Daten: Spiele, Spieler und Statistiken.
            </p>
            <button
              className="btn"
              style={{
                width: '100%',
                backgroundColor: 'var(--accent-red)',
                color: 'white',
                border: '1px solid var(--accent-red)'
              }}
              onClick={() => setShowResetConfirm('all')}
              disabled={loading}
            >
              ALLES LÖSCHEN
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ 
            maxWidth: '500px',
            margin: 'var(--spacing-4)',
            backgroundColor: 'var(--background-dark)',
            border: '3px solid var(--accent-red)'
          }}>
            <h3 style={{ color: 'var(--accent-red)', marginBottom: 'var(--spacing-3)' }}>
              🚨 ACHTUNG - Unwiderrufliche Aktion
            </h3>
            <p style={{ marginBottom: 'var(--spacing-4)', fontSize: '1.1rem' }}>
              {showResetConfirm === 'games' && 'Du bist dabei, ALLE SPIELE dauerhaft zu löschen. Alle Spielhistorien und Statistiken gehen verloren.'}
              {showResetConfirm === 'players' && 'Du bist dabei, ALLE SPIELER dauerhaft zu löschen. Dadurch werden auch alle zugehörigen Spiele gelöscht.'}
              {showResetConfirm === 'all' && 'Du bist dabei, ALLE DATEN dauerhaft zu löschen. Spiele, Spieler, Statistiken - alles wird unwiderruflich gelöscht!'}
            </p>
            <div style={{ 
              padding: 'var(--spacing-3)',
              backgroundColor: 'rgba(225, 97, 98, 0.1)',
              borderRadius: '6px',
              marginBottom: 'var(--spacing-4)',
              border: '1px solid var(--accent-red)'
            }}>
              <p style={{ 
                margin: 0, 
                fontWeight: 'bold',
                color: 'var(--accent-red)'
              }}>
                ⚠️ Diese Aktion kann NICHT rückgängig gemacht werden!
              </p>
            </div>
            <div style={{ 
              display: 'flex', 
              gap: 'var(--spacing-3)', 
              justifyContent: 'flex-end' 
            }}>
              <button
                className="btn btn-outline"
                onClick={() => setShowResetConfirm(null)}
              >
                Abbrechen
              </button>
              <button
                className="btn"
                style={{
                  backgroundColor: 'var(--accent-red)',
                  color: 'white',
                  border: '1px solid var(--accent-red)'
                }}
                onClick={() => handleResetData(showResetConfirm)}
                disabled={loading}
              >
                {loading ? 'Lösche...' : '🗑️ Endgültig löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;