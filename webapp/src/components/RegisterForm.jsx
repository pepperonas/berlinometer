import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { GoogleLogin } from '@react-oauth/google';
import './RegisterForm.css';

const RegisterForm = ({ onRegister, onSwitchToLogin, onClose }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate password length
    if (formData.password.length < 6) {
      setError(t('passwordTooShort'));
      setLoading(false);
      return;
    }

    // Validate username length
    if (formData.username.length < 3) {
      setError(t('usernameTooShort'));
      setLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(t('invalidEmail'));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(t('registrationSuccess'));
        setFormData({
          username: '',
          email: '',
          password: ''
        });
        
        if (onRegister) {
          onRegister(data);
        }
      } else {
        setError(data.error || t('registerFailed'));
      }
    } catch (error) {
      console.error('Registration error:', error);
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
    setSuccess('');

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
        setSuccess(t('googleRegistrationSuccess') || 'Registration successful! You are now logged in.');

        // Store token and user info
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_info', JSON.stringify(data.user));

        // Call onRegister if provided (to update parent state)
        if (onRegister) {
          onRegister(data);
        }

        // Close dialog after short delay to show success message
        setTimeout(() => {
          if (onClose) onClose();
        }, 1500);
      } else {
        setError(data.error || t('registerFailed'));
      }
    } catch (error) {
      console.error('Google registration error:', error);
      setError(t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError(t('googleLoginFailed') || 'Google registration failed');
  };

  return (
    <div className="register-form">
      {/* Header with Icon */}
      <div className="register-header">
        <div className="register-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
            <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        <h3>{t('registerTitle')}</h3>
        <p className="register-subtitle">Erstelle deinen Berlinometer Account</p>
      </div>

      {error && (
        <div className="error-message">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="success-message">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
          </svg>
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">{t('username')}</label>
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
              placeholder={t('usernamePlaceholderRegister')}
              minLength={3}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">{t('email')}</label>
          <div className="input-wrapper">
            <svg className="input-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder={t('emailPlaceholder')}
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
              placeholder={t('passwordPlaceholderRegister')}
              minLength={6}
            />
          </div>
          <small className="password-hint">
            {t('passwordHint') || 'Mindestens 6 Zeichen'}
          </small>
        </div>

        <button type="submit" disabled={loading} className="register-btn primary">
          {loading ? (
            <>
              <span className="spinner"></span>
              {t('registerInProgress')}
            </>
          ) : (
            t('registerButton')
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
          text="signup_with"
          shape="rectangular"
        />
      </div>

      <div className="auth-switch">
        {t('alreadyHaveAccount')}{' '}
        <button type="button" onClick={onSwitchToLogin} className="link-btn">
          {t('loginHere')}
        </button>
      </div>
    </div>
  );
};

export default RegisterForm;