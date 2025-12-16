import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { GoogleLogin } from '@react-oauth/google';
import './LoginForm.css';

const LoginForm = ({ onLogin, onSwitchToRegister, onClose }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user info
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_info', JSON.stringify(data.user));
        
        onLogin(data.user, data.token);
        onClose();
      } else {
        setError(data.error || t('loginFailed'));
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialResponse.credential
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user info
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_info', JSON.stringify(data.user));

        onLogin(data.user, data.token);
        onClose();
      } else {
        setError(data.error || t('loginFailed'));
      }
    } catch (error) {
      console.error('Google login error:', error);
      setError(t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError(t('googleLoginFailed') || 'Google login failed');
  };

  return (
    <div className="login-form">
      {/* Header with Icon */}
      <div className="login-header">
        <div className="login-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </div>
        <h3>{t('loginTitle')}</h3>
        <p className="login-subtitle">Willkommen zurück bei Berlinometer</p>
      </div>

      {error && (
        <div className="error-message">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">{t('usernameOrEmail')}</label>
          <div className="input-wrapper">
            <svg className="input-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder={t('usernamePlaceholder')}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="password">{t('password')}</label>
          <div className="input-wrapper">
            <svg className="input-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder={t('passwordPlaceholder')}
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="login-btn primary">
          {loading ? (
            <>
              <span className="spinner"></span>
              {t('loginInProgress')}
            </>
          ) : (
            t('loginButton')
          )}
        </button>

        <button type="button" onClick={onClose} disabled={loading} className="cancel-btn">
          {t('cancel')}
        </button>
      </form>

      <div className="divider">
        <span>{t('orContinueWith') || 'oder weiter mit'}</span>
      </div>

      <div className="google-login-wrapper">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          theme="outline"
          size="large"
          text="signin_with"
          shape="rectangular"
        />
      </div>

      <div className="auth-switch">
        {t('noAccount')}{' '}
        <button type="button" onClick={onSwitchToRegister} className="link-btn">
          {t('registerHere')}
        </button>
      </div>
    </div>
  );
};

export default LoginForm;