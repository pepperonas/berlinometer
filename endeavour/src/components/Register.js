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

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validiere Eingaben
    if (!username || !password || !confirmPassword) {
      toast.error('Bitte fülle alle Felder aus');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }

    if (password.length < 6) {
      toast.error('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/register', {
        username,
        password
      });

      // Speichere Token und User-ID
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);

      toast.success('Registrierung erfolgreich!');
      navigate('/create-challenge');
    } catch (error) {
      console.error('Registrierungsfehler:', error);

      if (error.response?.status === 400 && error.response?.data?.message === 'Benutzername bereits vergeben') {
        toast.error('Dieser Benutzername ist bereits vergeben. Bitte wähle einen anderen.');
      } else {
        toast.error(
          error.response?.data?.message ||
          'Registrierung fehlgeschlagen. Bitte versuche es erneut.'
        );
      }
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
          Starte deine 30-Tage Challenge
        </Typography>

        <Card sx={{ width: '100%', mt: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Registrieren
            </Typography>

            <Box component="form" onSubmit={handleRegister} sx={{ mt: 2 }}>
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

              <TextField
                label="Passwort bestätigen"
                variant="outlined"
                fullWidth
                margin="normal"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                {loading ? 'Wird geladen...' : 'Registrieren'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2">
                  Bereits registriert?
                  <Link to="/login" style={{ marginLeft: 8, color: '#5D5FEF' }}>
                    Zum Login
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

export default Register;
