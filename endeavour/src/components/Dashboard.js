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

      const response = await axios.get('http://localhost:5000/api/challenges/current', {
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
        `http://localhost:5000/api/challenges/day/${day}`,
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
