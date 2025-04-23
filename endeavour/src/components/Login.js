import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error('Bitte fülle alle Felder aus');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        username,
        password
      });

      // Speichere Token und User-ID
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);

      toast.success('Login erfolgreich!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login-Fehler:', error);
      toast.error(
        error.response?.data?.message ||
        'Login fehlgeschlagen. Bitte versuche es erneut.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom>
          Endeavour
        </Typography>

        <Typography variant="h5" component="h2" gutterBottom>
          Deine 30-Tage Challenge App
        </Typography>

        <Card sx={{ width: '100%', mt: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Login
            </Typography>

            <Box component="form" onSubmit={handleLogin} sx={{ mt: 2 }}>
              <TextField
                label="Benutzername"
                variant="outlined"
                fullWidth
                margin="normal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <TextField
                label="Passwort"
                variant="outlined"
                fullWidth
                margin="normal"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
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
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? 'Wird geladen...' : 'Einloggen'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2">
                  Noch kein Konto?
                  <Link to="/register" style={{ marginLeft: 8, color: '#5D5FEF' }}>
                    Jetzt registrieren
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Login;
