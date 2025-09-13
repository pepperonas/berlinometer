import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
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

  return (
    <div className="login-form">
      <h3>{t('loginTitle')}</h3>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">{t('usernameOrEmail')}:</label>
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

        <div className="form-group">
          <label htmlFor="password">{t('password')}:</label>
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

        <div className="form-actions">
          <button type="submit" disabled={loading} className="login-btn">
            {loading ? t('loginInProgress') : t('loginButton')}
          </button>
          <button type="button" onClick={onClose} disabled={loading} className="cancel-btn">
            {t('cancel')}
          </button>
        </div>
      </form>

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