#!/bin/bash

# Endeavour Projekt Setup Script
# ------------------------------

echo "🚀 Endeavour Projekt-Setup wird gestartet..."
echo "-------------------------------------------"

# Prüfe, ob Node.js installiert ist
if ! command -v node &> /dev/null; then
    echo "❌ Node.js ist nicht installiert. Bitte installiere Node.js (https://nodejs.org)"
    exit 1
fi

# Prüfe, ob npm installiert ist
if ! command -v npm &> /dev/null; then
    echo "❌ npm ist nicht installiert. Bitte installiere npm"
    exit 1
fi

# Erstelle React-App
echo "📦 React-App wird erstellt..."
npx create-react-app endeavour
cd endeavour

# Erstelle Backend-Ordner
echo "📂 Backend-Ordner wird erstellt..."
mkdir -p backend

# Installiere Frontend-Abhängigkeiten
echo "📚 Frontend-Abhängigkeiten werden installiert..."
npm install axios react-router-dom recharts @mui/material @mui/icons-material @mui/x-date-pickers date-fns @emotion/react @emotion/styled react-toastify

# Installiere Backend-Abhängigkeiten
echo "📚 Backend-Abhängigkeiten werden installiert..."
cd backend
npm init -y
npm install express mongoose bcrypt jsonwebtoken dotenv node-schedule cors axios
cd ..

# Erstelle Komponentenordner
echo "📂 Komponentenordner wird erstellt..."
mkdir -p src/components

# Erstelle Frontend-Dateien
echo "📝 Frontend-Dateien werden erstellt..."

# App.js
cat > src/App.js << 'EOF'
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import CreateChallenge from './components/CreateChallenge';
import PrivateRoute from './components/PrivateRoute';

// Material Design Theme mit dem gewünschten Farbschema #2C2E3B
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#5D5FEF',
    },
    secondary: {
      main: '#4CAF50',
    },
    background: {
      default: '#2C2E3B',
      paper: '#363848',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          padding: '10px 20px',
        },
        containedPrimary: {
          boxShadow: '0 4px 10px rgba(93, 95, 239, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 15px rgba(93, 95, 239, 0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContainer position="top-right" autoClose={5018} />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/create-challenge" 
            element={
              <PrivateRoute>
                <CreateChallenge />
              </PrivateRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
EOF

# PrivateRoute.js
cat > src/components/PrivateRoute.js << 'EOF'
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

const PrivateRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Überprüfe, ob ein Token existiert
    const token = localStorage.getItem('token');
    setAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return authenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
EOF

# Login.js
cat > src/components/Login.js << 'EOF'
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
      const response = await axios.post('http://localhost:5018/api/login', {
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
EOF

# Register.js
cat > src/components/Register.js << 'EOF'
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
      const response = await axios.post('http://localhost:5018/api/register', {
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
EOF

# CreateChallenge.js
cat > src/components/CreateChallenge.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CircularProgress,
  Paper,
  Chip,
  Grid
} from '@mui/material';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parse } from 'date-fns';
import { de } from 'date-fns/locale';

const topicSuggestions = [
  'Fitness', 'Meditation', 'Lesen', 'Schreiben', 'Programmieren',
  'Gitarre lernen', 'Zeichnen', 'Kochen', 'Sprache lernen', 'Fotografie',
  'Wasser trinken', 'Früh aufstehen', 'Joggen', 'Yoga', 'Muskelaufbau'
];

const CreateChallenge = () => {
  const [topic, setTopic] = useState('');
  const [notificationTime, setNotificationTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Prüfe, ob Nutzer bereits eine aktive Challenge hat
    const checkExistingChallenge = async () => {
      try {
        const token = localStorage.getItem('token');
        
        const response = await axios.get('http://localhost:5018/api/challenges/current', {
          headers: { 'x-auth-token': token }
        });
        
        // Wenn eine Challenge existiert, weiterleiten zum Dashboard
        if (response.data && !response.data.completed) {
          toast.info('Du hast bereits eine aktive Challenge');
          navigate('/dashboard');
          return;
        }
        
        setCheckingExisting(false);
      } catch (error) {
        // Wenn 404 (keine Challenge), dann weiter
        if (error.response?.status === 404) {
          setCheckingExisting(false);
          return;
        }
        
        console.error('Fehler beim Prüfen existierender Challenges:', error);
        toast.error('Fehler beim Laden. Bitte versuche es erneut.');
      }
    };
    
    checkExistingChallenge();
  }, [navigate]);

  const handleCreateChallenge = async () => {
    if (!topic.trim()) {
      toast.error('Bitte gib ein Thema für deine Challenge ein');
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Speichere Benachrichtigungszeit
      await axios.patch(
        'http://localhost:5018/api/users/notification-time',
        { notificationTime: format(notificationTime, 'HH:mm') },
        { headers: { 'x-auth-token': token } }
      );
      
      // Erstelle Challenge
      await axios.post(
        'http://localhost:5018/api/challenges',
        { topic },
        { headers: { 'x-auth-token': token } }
      );
      
      toast.success('Challenge erfolgreich erstellt!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Fehler beim Erstellen der Challenge:', error);
      toast.error(
        error.response?.data?.message || 
        'Fehler beim Erstellen der Challenge. Bitte versuche es erneut.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingExisting) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 8,
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom>
          Neue Challenge erstellen
        </Typography>
        
        <Card sx={{ width: '100%', mt: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
              Wähle dein Challenge-Thema
            </Typography>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Gib 1-2 Worte ein, die deine Challenge beschreiben. Beispiele: "Gitarre lernen", "Muskelaufbau", "Meditation"
            </Typography>
            
            <TextField
              label="Challenge-Thema"
              variant="outlined"
              fullWidth
              margin="normal"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="z.B. Gitarre lernen"
            />
            
            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
              Vorschläge:
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
              {topicSuggestions.map((suggestion) => (
                <Chip
                  key={suggestion}
                  label={suggestion}
                  clickable
                  onClick={() => setTopic(suggestion)}
                  sx={{ 
                    borderColor: topic === suggestion ? 'primary.main' : 'default',
                    bgcolor: topic === suggestion ? 'primary.dark' : 'default',
                  }}
                />
              ))}
            </Box>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Erinnerungszeit
            </Typography>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Zu welcher Uhrzeit möchtest du täglich an deine Challenge erinnert werden?
            </Typography>
            
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
              <TimePicker
                label="Erinnerungszeit"
                value={notificationTime}
                onChange={(newTime) => setNotificationTime(newTime)}
                sx={{ width: '100%' }}
              />
            </LocalizationProvider>
            
            <Box sx={{ mt: 6 }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={handleCreateChallenge}
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Challenge erstellen'
                )}
              </Button>
            </Box>
          </CardContent>
        </Card>
        
        <Paper 
          elevation={2} 
          sx={{ 
            mt: 4, 
            p: 3, 
            width: '100%', 
            bgcolor: 'background.paper',
            borderLeft: '4px solid #4CAF50',
          }}
        >
          <Typography variant="h6" gutterBottom>
            So funktioniert's:
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  1. Thema wählen
                </Typography>
                <Typography variant="body2">
                  Wähle ein Thema für deine 30-Tage-Challenge
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  2. Täglich trainieren
                </Typography>
                <Typography variant="body2">
                  Erhalte jeden Tag eine neue Aufgabe und markiere sie als erledigt
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  3. Fortschritt sehen
                </Typography>
                <Typography variant="body2">
                  Verfolge deinen Fortschritt und feiere deine Erfolge
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateChallenge;
EOF

# Dashboard.js
cat > src/components/Dashboard.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  BarChart,
  EmojiEvents,
  Logout,
  CalendarToday,
  Notifications
} from '@mui/icons-material';
import { 
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { format, addDays, isSameDay, isAfter, isBefore, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';

// Motivational messages
const motivationalMessages = [
  "Du machst das großartig! Weiter so!",
  "Jeder kleine Schritt zählt. Bleib dran!",
  "Deine Beständigkeit zahlt sich aus!",
  "Gewohnheiten formen dein Leben. Du bist auf dem richtigen Weg!",
  "Heute investierst du in dein zukünftiges Ich!",
  "Fortschritt entsteht durch kleine, tägliche Schritte.",
  "Du kommst deinem Ziel jeden Tag näher!",
  "Nicht aufgeben - die Belohnung wartet auf dich!",
  "Disziplin ist der Schlüssel zum Erfolg. Du hast sie!",
  "Sei stolz auf deinen Fortschritt bis hierher!"
];

const Dashboard = () => {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState(0);
  const [streak, setStreak] = useState(0);
  const [completion, setCompletion] = useState(0);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadChallenge();
    // Wähle zufällige motivierende Nachricht
    const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
    setMotivationalMessage(motivationalMessages[randomIndex]);
  }, []);

  const loadChallenge = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get('http://localhost:5018/api/challenges/current', {
        headers: { 'x-auth-token': token }
      });
      
      const challengeData = response.data;
      setChallenge(challengeData);
      
      // Berechne aktuellen Tag
      const startDate = new Date(challengeData.startDate);
      const today = new Date();
      const daysDiff = Math.min(
        differenceInDays(today, startDate), 
        29
      );
      setCurrentDay(Math.max(0, daysDiff));
      
      // Berechne Streak und Completion
      calculateStats(challengeData);
    } catch (error) {
      console.error('Fehler beim Laden der Challenge:', error);
      
      if (error.response?.status === 404) {
        // Keine aktive Challenge gefunden
        toast.info('Du hast noch keine aktive Challenge');
        navigate('/create-challenge');
      } else {
        toast.error('Fehler beim Laden der Challenge');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (challengeData) => {
    if (!challengeData || !challengeData.days || challengeData.days.length === 0) {
      return;
    }
    
    // Berechne aktuelle Streak
    let currentStreak = 0;
    const today = new Date();
    let checkedDays = 0;
    
    // Von heute aus rückwärts zählen
    for (let i = 0; i < challengeData.days.length; i++) {
      const dayData = challengeData.days[i];
      const dayDate = new Date(dayData.date);
      
      // Zähle nur vergangene Tage
      if (isAfter(dayDate, today)) {
        continue;
      }
      
      checkedDays++;
      
      if (dayData.completed) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    setStreak(currentStreak);
    
    // Berechne Abschlussrate
    if (checkedDays > 0) {
      const completedDays = challengeData.days
        .filter(day => {
          const dayDate = new Date(day.date);
          return isBefore(dayDate, today) && day.completed;
        })
        .length;
      
      setCompletion(Math.round((completedDays / checkedDays) * 100));
    }
  };

  const handleToggleDay = async (day, completed) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.patch(
        `http://localhost:5018/api/challenges/day/${day}`,
        { completed },
        { headers: { 'x-auth-token': token } }
      );
      
      // Update lokalen State
      setChallenge(response.data);
      
      // Update Statistiken
      calculateStats(response.data);
      
      // Zeige Bestätigung
      if (completed) {
        toast.success('Tag als erledigt markiert!');
      } else {
        toast.info('Tag als nicht erledigt markiert');
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Tages:', error);
      toast.error('Fehler beim Aktualisieren. Bitte versuche es erneut.');
    }
  };

  const handleLogout = () => {
    // Lösche alle lokalen Daten
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    
    // Navigiere zur Login-Seite
    navigate('/login');
  };

  const getCompletionColor = (percentage) => {
    if (percentage < 30) return '#f44336'; // Rot
    if (percentage < 70) return '#ff9800'; // Orange
    return '#4caf50'; // Grün
  };

  const getDayStatus = (dayNumber) => {
    if (!challenge || !challenge.days) return 'future';
    
    const dayData = challenge.days.find(d => d.day === dayNumber);
    if (!dayData) return 'future';
    
    const dayDate = new Date(dayData.date);
    const today = new Date();
    
    if (isAfter(dayDate, today)) return 'future';
    if (dayData.completed) return 'completed';
    return 'missed';
  };

  const getChartData = () => {
    if (!challenge || !challenge.days) return [];
    
    return challenge.days.map(day => {
      const status = getDayStatus(day.day);
      return {
        day: `Tag ${day.day}`,
        erledigt: status === 'completed' ? 1 : 0,
        status
      };
    });
  };

  const renderDayList = () => {
    if (!challenge || !challenge.days) return null;
    
    // Sortiere nach Tagnummer
    const sortedDays = [...challenge.days].sort((a, b) => a.day - b.day);
    
    return (
      <List sx={{ width: '100%' }}>
        {sortedDays.map((day) => {
          const dayDate = new Date(day.date);
          const today = new Date();
          const isToday = isSameDay(dayDate, today);
          const isPast = isBefore(dayDate, today);
          const isFuture = isAfter(dayDate, today);
          
          return (
            <React.Fragment key={day.day}>
              <ListItem
                secondaryAction={
                  isPast || isToday ? (
                    <Checkbox
                      edge="end"
                      checked={day.completed}
                      onChange={(e) => handleToggleDay(day.day, e.target.checked)}
                      disabled={loading}
                    />
                  ) : (
                    <Typography variant="caption" color="textSecondary">
                      {format(dayDate, 'dd.MM.', { locale: de })}
                    </Typography>
                  )
                }
                sx={{
                  bgcolor: isToday ? 'rgba(93, 95, 239, 0.1)' : 'transparent',
                  borderLeft: isToday ? '4px solid #5D5FEF' : 'none',
                  pl: isToday ? 2 : 3,
                  opacity: isFuture ? 0.6 : 1,
                }}
              >
                <ListItemIcon>
                  {day.completed ? (
                    <CheckCircle color="success" />
                  ) : isPast ? (
                    <Cancel color="error" />
                  ) : (
                    <CalendarToday color="primary" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={`Tag ${day.day}: ${day.task}`}
                  secondary={isToday ? 'Heute' : format(dayDate, 'EEEE, dd. MMMM', { locale: de })}
                  primaryTypographyProps={{
                    fontWeight: isToday ? 'bold' : 'normal',
                  }}
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          );
        })}
      </List>
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!challenge) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Keine aktive Challenge
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/create-challenge')}
            sx={{ mt: 2 }}
          >
            Challenge erstellen
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Deine 30-Tage Challenge
          </Typography>
          
          <IconButton color="inherit" onClick={() => setOpenLogoutDialog(true)}>
            <Logout />
          </IconButton>
        </Box>
        
        <Grid container spacing={4}>
          {/* Linke Spalte - Challenge-Details */}
          <Grid item xs={12} md={7}>
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {challenge.topic}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip 
                    label={`Tag ${currentDay + 1} von 30`} 
                    color="primary" 
                    variant="outlined"
                    sx={{ mr: 2 }} 
                  />
                  
                  <Typography variant="body2" color="textSecondary">
                    Gestartet am {format(new Date(challenge.startDate), 'dd.MM.yyyy', { locale: de })}
                  </Typography>
                </Box>
                
                <Typography variant="body1" sx={{ fontStyle: 'italic', mb: 4 }}>
                  {motivationalMessage}
                </Typography>
                
                <Divider sx={{ mb: 3 }} />
                
                {/* Aktuelle Aufgabe hervorheben */}
                {challenge.days && challenge.days[currentDay] && (
                  <Paper
                    elevation={2}
                    sx={{
                      p: 3,
                      mb: 4,
                      bgcolor: 'background.paper',
                      borderLeft: '4px solid #5D5FEF',
                    }}
                  >
                    <Typography variant="subtitle1" gutterBottom>
                      Heutige Aufgabe:
                    </Typography>
                    
                    <Typography variant="h6" gutterBottom>
                      {challenge.days[currentDay].task}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={() => handleToggleDay(currentDay + 1, true)}
                        disabled={challenge.days[currentDay].completed}
                      >
                        {challenge.days[currentDay].completed ? 'Erledigt' : 'Als erledigt markieren'}
                      </Button>
                    </Box>
                  </Paper>
                )}
                
                {/* Aufgabenliste */}
                <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                  Alle Aufgaben
                </Typography>
                
                {renderDayList()}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Rechte Spalte - Statistiken und Fortschritt */}
          <Grid item xs={12} md={5}>
            {/* Statistiken */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Deine Statistiken
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 2, 
                      borderRadius: 2,
                      bgcolor: 'background.paper' 
                    }}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Aktuelle Streak
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                        {streak} Tage
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 2, 
                      borderRadius: 2,
                      bgcolor: 'background.paper' 
                    }}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Abschlussrate
                      </Typography>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 'bold', 
                          color: getCompletionColor(completion)
                        }}
                      >
                        {completion}%
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                {/* Fortschritts-Chart */}
                <Box sx={{ mt: 4, height: 300 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Dein Fortschritt
                  </Typography>
                  
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getChartData()}
                      margin={{ top: 5, right: 20, left: 10, bottom: 50 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fontSize: 12 }}
                        interval={4}
                        angle={-45}
                        textAnchor="end"
                      />
                      <YAxis domain={[0, 1]} hide />
                      <Tooltip 
                        formatter={(value) => [value === 1 ? 'Erledigt' : 'Nicht erledigt', 'Status']}
                        labelFormatter={(label) => `${label}`}
                      />
                      <Bar 
                        dataKey="erledigt" 
                        fill="#5D5FEF"
                        name="Erledigt"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
                
                {/* Streak-Chart */}
                <Box sx={{ mt: 6, height: 200 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Deine Streak
                  </Typography>
                  
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={getChartData().slice(0, currentDay + 1)}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fontSize: 10 }}
                        interval={2}
                      />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="erledigt" 
                        stroke="#ff9800" 
                        name="Täglicher Erfolg"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
                
                {/* Neues Challenge-Button */}
                {challenge.completed && (
                  <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                      Challenge abgeschlossen!
                    </Typography>
                    
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<EmojiEvents />}
                      onClick={() => navigate('/create-challenge')}
                      fullWidth
                      sx={{ mt: 2 }}
                    >
                      Neue Challenge starten
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
            
            {/* Motivations-Box */}
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: '#363848',
                mb: 4
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                Halte durch!
              </Typography>
              
              <Typography variant="body2" sx={{ color: '#ccc', mb: 2 }}>
                Es dauert 30 Tage, um eine Gewohnheit zu formen.
                Jeder Tag bringt dich deinem Ziel näher!
              </Typography>
              
              <Typography variant="body1" sx={{ color: '#fff', fontWeight: 'bold' }}>
                {((currentDay + 1) / 30 * 100).toFixed(0)}% geschafft
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      {/* Logout Dialog */}
      <Dialog
        open={openLogoutDialog}
        onClose={() => setOpenLogoutDialog(false)}
      >
        <DialogTitle>Abmelden?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Möchtest du dich wirklich abmelden?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLogoutDialog(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleLogout} color="primary" autoFocus>
            Abmelden
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
EOF

# Erstelle Server-Dateien
echo "📝 Backend-Dateien werden erstellt..."

# server.js im Backend-Ordner
cat > backend/server.js << 'EOF'
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const schedule = require('node-schedule');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Verbindung
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error('MongoDB Verbindungsfehler:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  currentChallenge: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Challenge',
    default: null
  },
  notificationTime: { type: String, default: '09:00' }
});

// Challenge Schema
const challengeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true },
  days: [{
    day: Number,
    task: String,
    completed: { type: Boolean, default: false },
    date: Date
  }],
  startDate: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);
const Challenge = mongoose.model('Challenge', challengeSchema);

// Generiere Challenge mit OpenAI API
async function generateChallenge(topic) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein Coach, der 30-Tage-Challenges erstellt.'
          },
          {
            role: 'user',
            content: `Erstelle eine 30-Tage-Challenge zum Thema "${topic}". 
                      Gib einen JSON-Array zurück mit genau 30 Objekten, jedes mit dem Format: 
                      {"day": Nummer, "task": "Aufgabenbeschreibung"}. 
                      Die Aufgaben sollten progressiv aufeinander aufbauen.`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extrahiere JSON aus der Antwort
    const content = response.data.choices[0].message.content;
    const jsonStartIndex = content.indexOf('[');
    const jsonEndIndex = content.lastIndexOf(']') + 1;
    const jsonStr = content.substring(jsonStartIndex, jsonEndIndex);
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Fehler bei der OpenAI API:', error);
    throw new Error('Challenge konnte nicht generiert werden');
  }
}

// API Endpunkte
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Prüfe, ob Username bereits existiert
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Benutzername bereits vergeben' });
    }
    
    // Hash Passwort
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Erstelle neuen User
    const user = new User({
      username,
      password: hashedPassword
    });
    
    await user.save();
    
    // Erstelle Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ token, userId: user._id });
  } catch (error) {
    console.error('Registrierungsfehler:', error);
    res.status(500).json({ message: 'Serverfehler bei der Registrierung' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Suche User
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Ungültiger Benutzername oder Passwort' });
    }
    
    // Überprüfe Passwort
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Ungültiger Benutzername oder Passwort' });
    }
    
    // Erstelle Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(200).json({ token, userId: user._id });
  } catch (error) {
    console.error('Login-Fehler:', error);
    res.status(500).json({ message: 'Serverfehler beim Login' });
  }
});

// Auth Middleware
function auth(req, res, next) {
  const token = req.header('x-auth-token');
  if (!token) return res.status(401).json({ message: 'Zugriff verweigert. Kein Token vorhanden.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Ungültiger Token.' });
  }
}

app.post('/api/challenges', auth, async (req, res) => {
  try {
    const { topic } = req.body;
    const userId = req.user.id;
    
    // Prüfe, ob Nutzer bereits eine aktive Challenge hat
    const user = await User.findById(userId);
    if (user.currentChallenge) {
      const currentChallenge = await Challenge.findById(user.currentChallenge);
      
      // Wenn Challenge nicht abgeschlossen, ablehnen
      if (currentChallenge && !currentChallenge.completed) {
        return res.status(400).json({ 
          message: 'Du hast bereits eine aktive Challenge',
          challengeId: currentChallenge._id
        });
      }
    }
    
    // Generiere Aufgaben mit ChatGPT
    const tasks = await generateChallenge(topic);
    
    // Bereite Tage vor
    const startDate = new Date();
    const days = tasks.map((task, index) => {
      const taskDate = new Date(startDate);
      taskDate.setDate(startDate.getDate() + index);
      return {
        day: task.day,
        task: task.task,
        completed: false,
        date: taskDate
      };
    });
    
    // Erstelle neue Challenge
    const challenge = new Challenge({
      userId,
      topic,
      days,
      startDate
    });
    
    await challenge.save();
    
    // Update User mit aktueller Challenge
    await User.findByIdAndUpdate(userId, { currentChallenge: challenge._id });
    
    // Plane Benachrichtigungen
    scheduleNotifications(user, challenge);
    
    res.status(201).json(challenge);
  } catch (error) {
    console.error('Fehler beim Erstellen der Challenge:', error);
    res.status(500).json({ message: 'Serverfehler beim Erstellen der Challenge' });
  }
});

app.get('/api/challenges/current', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user.currentChallenge) {
      return res.status(404).json({ message: 'Keine aktive Challenge gefunden' });
    }
    
    const challenge = await Challenge.findById(user.currentChallenge);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge nicht gefunden' });
    }
    
    res.status(200).json(challenge);
  } catch (error) {
    console.error('Fehler beim Abrufen der Challenge:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Challenge' });
  }
});

app.patch('/api/challenges/day/:day', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { day } = req.params;
    const { completed } = req.body;
    
    const user = await User.findById(userId);
    if (!user.currentChallenge) {
      return res.status(404).json({ message: 'Keine aktive Challenge gefunden' });
    }
    
    const challenge = await Challenge.findById(user.currentChallenge);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge nicht gefunden' });
    }
    
    // Update Tag-Status
    const dayIndex = challenge.days.findIndex(d => d.day === parseInt(day));
    if (dayIndex === -1) {
      return res.status(404).json({ message: 'Tag nicht gefunden' });
    }
    
    challenge.days[dayIndex].completed = completed;
    await challenge.save();
    
    // Prüfe, ob Challenge abgeschlossen ist
    const allCompleted = challenge.days.every(day => {
      const dayDate = new Date(day.date);
      const today = new Date();
      return day.completed || dayDate > today;
    });
    
    const pastDue = challenge.days.every(day => {
      const dayDate = new Date(day.date);
      const today = new Date();
      return dayDate < today;
    });
    
    if (pastDue || allCompleted) {
      challenge.completed = true;
      await challenge.save();
    }
    
    res.status(200).json(challenge);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Tages:', error);
    res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Tages' });
  }
});

app.patch('/api/users/notification-time', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationTime } = req.body;
    
    await User.findByIdAndUpdate(userId, { notificationTime });
    
    // Plane Benachrichtigungen neu
    const user = await User.findById(userId);
    if (user.currentChallenge) {
      const challenge = await Challenge.findById(user.currentChallenge);
      if (challenge && !challenge.completed) {
        scheduleNotifications(user, challenge);
      }
    }
    
    res.status(200).json({ message: 'Benachrichtigungszeit aktualisiert' });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Benachrichtigungszeit:', error);
    res.status(500).json({ message: 'Serverfehler beim Aktualisieren der Benachrichtigungszeit' });
  }
});

// Benachrichtigungsfunktion
function scheduleNotifications(user, challenge) {
  const [hours, minutes] = user.notificationTime.split(':').map(Number);
  
  challenge.days.forEach(day => {
    const dayDate = new Date(day.date);
    dayDate.setHours(hours, minutes, 0);
    
    if (dayDate > new Date()) {
      schedule.scheduleJob(dayDate, async () => {
        // Hier würde die Push-Benachrichtigung gesendet werden
        // Für eine reale Anwendung müsste man Push-Notifications oder E-Mail-Service einbinden
        console.log(`Benachrichtigung für ${user.username}: Tag ${day.day} - ${day.task}`);
      });
    }
  });
}

const PORT = process.env.PORT || 5018;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
EOF

# Erstelle .env Datei im Backend-Ordner
cat > backend/.env << 'EOF'
MONGODB_URI=mongodb://localhost:27017/endeavour
JWT_SECRET=endeavour_secret_key_change_in_production
OPENAI_API_KEY=dein_openai_api_key_hier
PORT=5018
EOF

# Erstelle Start-Skripte im package.json
echo "📝 package.json wird aktualisiert..."

# Erstelle package.json im Hauptverzeichnis
cat > package.json << 'EOF'
{
  "name": "endeavour",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "@mui/icons-material": "^5.11.16",
    "@mui/material": "^5.13.0",
    "@mui/x-date-pickers": "^6.4.0",
    "axios": "^1.4.0",
    "date-fns": "^2.30.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.11.1",
    "react-scripts": "5.0.1",
    "react-toastify": "^9.1.2",
    "recharts": "^2.6.2"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "server": "cd backend && node server.js",
    "dev": "concurrently \"npm run server\" \"npm start\""
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "concurrently": "^8.0.1"
  }
}
EOF

# Installiere zusätzliche Entwicklungs-Abhängigkeiten
npm install -D concurrently

# Füge Urheberrechtshinweis hinzu
echo "# Endeavour - 30-Tage Challenge App" > README.md
echo "Eine App zur Erstellung und Verfolgung von 30-Tage-Challenges mit KI-Unterstützung." >> README.md

# Mache Script ausführbar (falls benötigt)
chmod +x setup.sh

echo "✅ Setup abgeschlossen!"
echo "-------------------------------------------"
echo "🎉 Das Endeavour Projekt wurde erfolgreich erstellt!"
echo ""
echo "Um die Anwendung zu starten:"
echo "1. MongoDB starten"
echo "2. Ins Projektverzeichnis wechseln: cd endeavour"
echo "3. Backend-Umgebungsvariablen anpassen:"
echo "   - backend/.env bearbeiten und deinen OpenAI API-Key eintragen"
echo "4. Frontend und Backend parallel starten:"
echo "   npm run dev"
echo ""
echo "Frontend läuft dann auf: http://localhost:3000"
echo "Backend-API läuft auf: http://localhost:5018"
echo "-------------------------------------------"
EOF
