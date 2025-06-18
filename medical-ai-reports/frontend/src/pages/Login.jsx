import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Avatar,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LocalHospital,
  Login as LoginIcon,
} from '@mui/icons-material';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Demo credentials - in real app this would be an API call
      if (formData.username === 'admin' && formData.password === 'admin') {
        // Store auth token (demo)
        localStorage.setItem('authToken', 'demo-token');
        navigate('/');
      } else {
        setError('Ungültige Anmeldedaten. Versuchen Sie admin/admin');
      }
    } catch (err) {
      setError('Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <Paper
        elevation={24}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 400,
          width: '90%',
        }}
      >
          <Avatar
            sx={{
              m: 1,
              bgcolor: 'primary.main',
              width: 56,
              height: 56,
            }}
          >
            <LocalHospital fontSize="large" />
          </Avatar>

          <Typography component="h1" variant="h4" sx={{ mb: 3, color: 'text.primary' }}>
            Medical AI Reports
          </Typography>

          <Typography variant="body1" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
            Anmeldung für medizinische KI-gestützte Berichte
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Benutzername"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Passwort"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading || !formData.username || !formData.password}
              startIcon={<LoginIcon />}
            >
              {loading ? 'Anmeldung läuft...' : 'Anmelden'}
            </Button>

            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Demo-Zugangsdaten:</strong><br />
                Benutzername: admin<br />
                Passwort: admin
              </Typography>
            </Box>
          </Box>
        </Paper>
    </Box>
  );
}

export default Login;