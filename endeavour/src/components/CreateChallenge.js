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

        const response = await axios.get('http://localhost:5000/api/challenges/current', {
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
        'http://localhost:5000/api/users/notification-time',
        { notificationTime: format(notificationTime, 'HH:mm') },
        { headers: { 'x-auth-token': token } }
      );

      // Erstelle Challenge
      await axios.post(
        'http://localhost:5000/api/challenges',
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
