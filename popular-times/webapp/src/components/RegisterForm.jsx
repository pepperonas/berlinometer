import { useState } from 'react';
import './RegisterForm.css';

const RegisterForm = ({ onRegister, onSwitchToLogin, onClose }) => {
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
      setError('Passwörter stimmen nicht überein');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      setLoading(false);
      return;
    }

    // Validate username length
    if (formData.username.length < 3) {
      setError('Benutzername muss mindestens 3 Zeichen lang sein');
      setLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein');
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
        setSuccess('Registrierung erfolgreich! Ihr Konto wartet auf Aktivierung. Sie können sich anmelden, sobald ein Administrator Ihr Konto aktiviert hat.');
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
        setError(data.error || 'Registrierung fehlgeschlagen');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.');
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
      <h3>Konto erstellen</h3>
      
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
          <label htmlFor="username">Benutzername:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Wählen Sie einen Benutzernamen (min. 3 Zeichen)"
            minLength={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Geben Sie Ihre E-Mail-Adresse ein"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Passwort:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Wählen Sie ein Passwort (min. 6 Zeichen)"
            minLength={6}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Passwort bestätigen:</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Bestätigen Sie Ihr Passwort"
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="register-btn">
            {loading ? 'Konto wird erstellt...' : 'Konto erstellen'}
          </button>
          <button type="button" onClick={onClose} disabled={loading} className="cancel-btn">
            Abbrechen
          </button>
        </div>
      </form>

      <div className="auth-switch">
        Bereits ein Konto?{' '}
        <button type="button" onClick={onSwitchToLogin} className="link-btn">
          Hier anmelden
        </button>
      </div>

      <div className="activation-note">
        <small>
          <strong>Hinweis:</strong> Neue Konten erfordern eine manuelle Aktivierung durch einen Administrator. 
          Sie können sich anmelden, sobald Ihr Konto aktiviert wurde.
        </small>
      </div>
    </div>
  );
};

export default RegisterForm;