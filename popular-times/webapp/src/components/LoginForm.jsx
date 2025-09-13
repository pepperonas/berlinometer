import { useState } from 'react';
import './LoginForm.css';

const LoginForm = ({ onLogin, onSwitchToRegister, onClose }) => {
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
        setError(data.error || 'Anmeldung fehlgeschlagen');
      }
    } catch (error) {
      console.error('Login error:', error);
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
    <div className="login-form">
      <h3>Anmelden</h3>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Benutzername oder E-Mail:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Geben Sie Ihren Benutzername oder E-Mail ein"
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
            placeholder="Geben Sie Ihr Passwort ein"
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Anmeldung läuft...' : 'Anmelden'}
          </button>
          <button type="button" onClick={onClose} disabled={loading} className="cancel-btn">
            Abbrechen
          </button>
        </div>
      </form>

      <div className="auth-switch">
        Noch kein Konto?{' '}
        <button type="button" onClick={onSwitchToRegister} className="link-btn">
          Hier registrieren
        </button>
      </div>
    </div>
  );
};

export default LoginForm;