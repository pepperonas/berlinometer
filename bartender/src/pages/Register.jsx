import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Container,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  PersonAdd as PersonAddIcon 
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Aktueller API-Kontext
  const apiBaseUrl = process.env.REACT_APP_API_URL || (
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:5024/api' 
      : `${window.location.pathname.match(/^\/([^\/]+)/) ? `/${window.location.pathname.match(/^\/([^\/]+)/)[1]}` : ''}/api`
  );
  
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const handleRegister = async (e) => {
    e.preventDefault();
    console.log('Register form submitted');
    
    // Validierung
    if (!name || !email || !password || !confirmPassword) {
      setError('Bitte alle Felder ausfüllen');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }
    
    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }
    
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    
    try {
      console.log('About to call register function with:', { name, email, password: '***HIDDEN***' });
      
      // Direkter API-Aufruf ohne über AuthContext zu gehen
      try {
        console.log('Trying direct fetch to API:', `${apiBaseUrl}/auth/register`);
        const response = await fetch(`${apiBaseUrl}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            email,
            password
          })
        });
        
        console.log('Direct API registration response status:', response.status);
        
        const data = await response.json();
        console.log('Direct API registration response data:', data);
        
        if (data.success) {
          setSuccess(data.message || 'Registrierung erfolgreich! Dein Konto wird vom Administrator aktiviert.');
          // Formular zurücksetzen
          setName('');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
        } else {
          setError(data.error || 'Registrierung fehlgeschlagen');
        }
      } catch (directApiError) {
        console.error('Direct API registration error:', directApiError);
        
        // Fallback auf AuthContext
        console.log('Falling back to AuthContext.register');
        const result = await register(name, email, password);
        
        if (!result.success) {
          setError(result.error || 'Registrierung fehlgeschlagen');
        } else {
          setSuccess(result.message || 'Registrierung erfolgreich! Dein Konto wird vom Administrator aktiviert.');
          // Formular zurücksetzen
          setName('');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
        }
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten');
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.default' : 'grey.100',
        p: 2
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <PersonAddIcon sx={{ color: 'white', fontSize: 32 }} />
          </Box>
          
          <Typography component="h1" variant="h5" fontWeight="bold" mb={1}>
            Account erstellen
          </Typography>
          
          <Typography variant="subtitle1" color="text.secondary" mb={3}>
            Registriere dich für Bartender
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ width: '100%', mb: 3 }}>
              {success}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleRegister} noValidate sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Name der Bar"
              name="name"
              autoComplete="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="E-Mail Adresse"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Passwort"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Passwort bestätigen"
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={{ mb: 3 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ 
                py: 1.5, 
                position: 'relative',
                fontSize: '1rem'
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                'Registrieren'
              )}
            </Button>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary" sx={{ fontWeight: 'medium' }}>
                  Du hast bereits einen Account? Anmelden
                </Typography>
              </Link>
            </Box>
          </Box>
          
          <Divider sx={{ my: 4, width: '100%' }} />
          
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Bartender App | Alle Rechte vorbehalten
          </Typography>
          
          <Typography variant="caption" color="text.secondary" align="center" mt={1}>
            Hinweis: Nach der Registrierung muss dein Konto vom Administrator aktiviert werden.
            Jeder Account repräsentiert eine Bar.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;