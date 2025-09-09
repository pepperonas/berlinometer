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
    </div>
  );
};

export default Settings;