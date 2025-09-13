import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './RegisterForm.css';

const RegisterForm = ({ onRegister, onSwitchToLogin, onClose }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError(t('passwordMismatch'));
      setLoading(false);
      return;
    }

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
          password: '',
          confirmPassword: ''
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

  return (
    <div className="register-form">
      <h3>{t('registerTitle')}</h3>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">{t('username')}:</label>
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

        <div className="form-group">
          <label htmlFor="email">{t('email')}:</label>
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
            placeholder={t('passwordPlaceholderRegister')}
            minLength={6}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">{t('confirmPassword')}:</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder={t('confirmPasswordPlaceholder')}
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="register-btn">
            {loading ? t('registerInProgress') : t('registerButton')}
          </button>
          <button type="button" onClick={onClose} disabled={loading} className="cancel-btn">
            {t('cancel')}
          </button>
        </div>
      </form>

      <div className="auth-switch">
        {t('alreadyHaveAccount')}{' '}
        <button type="button" onClick={onSwitchToLogin} className="link-btn">
          {t('loginHere')}
        </button>
      </div>

      <div className="activation-note">
        <small>
          <strong>{t('noteLabel')}</strong> {t('activationNote')}
        </small>
      </div>
    </div>
  );
};

export default RegisterForm;