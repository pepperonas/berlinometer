import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  Divider, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Switch,
  FormControlLabel,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Admin = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [scriptOutput, setScriptOutput] = useState('');
  const [users, setUsers] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: null
  });

  // Prüfen, ob der Benutzer berechtigt ist
  useEffect(() => {
    if (currentUser && currentUser.email !== 'martin.pfeffer@celox.io') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Benutzer laden
  useEffect(() => {
    const fetchUsers = async () => {
      if (currentUser && currentUser.email === 'martin.pfeffer@celox.io') {
        try {
          setLoading(true);
          const token = localStorage.getItem('token');
          
          // Verwende den speziellen Admin-Endpunkt anstelle des allgemeinen Users-Endpunkts
          // Debug für API URL
          const apiUrl = `${process.env.REACT_APP_API_URL || '/api'}/admin/users`;
          console.log('Benutzerabfrage-URL:', apiUrl);
          console.log('Authorization Header:', token ? 'Bearer Token gesetzt' : 'Kein Token');
          
          const response = await axios.get(apiUrl, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Benutzerabfrage-Antwort:', response.data);
          
          if (response.data && response.data.success) {
            setUsers(response.data.data);
          } else {
            throw new Error(response.data?.error || 'Fehler beim Laden der Benutzer');
          }
        } catch (error) {
          console.error('Fehler beim Laden der Benutzer:', error);
          
          let errorMessage = 'Fehler beim Laden der Benutzer';
          if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
          }
          
          setSnackbar({
            open: true,
            message: errorMessage,
            severity: 'error'
          });
          
          // Setze leere Benutzerliste, um keine alten Daten anzuzeigen
          setUsers([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUsers();
  }, [currentUser]);

  // State für E-Mail-Eingabe
  const [emailInput, setEmailInput] = useState('');
  
  // Skript ausführen
  const runScript = async (scriptName, email = null) => {
    try {
      setScriptLoading(true);
      setScriptOutput('');
      
      const token = localStorage.getItem('token');
      const requestData = { script: scriptName };
      
      // E-Mail-Adresse für spezifische Skripte hinzufügen
      if ((scriptName === 'seed-bar-data.js' || scriptName === 'delete-bar-data.js') && email) {
        requestData.email = email;
      }
      
      console.log('Sende Anfrage mit Daten:', requestData);
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || '/api'}/admin/run-script`, 
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.success) {
        setScriptOutput(response.data.output);
        setSnackbar({
          open: true,
          message: `Skript ${scriptName} erfolgreich ausgeführt`,
          severity: 'success'
        });
      } else {
        throw new Error(response.data?.error || 'Unbekannter Fehler');
      }
    } catch (error) {
      console.error(`Fehler beim Ausführen des Skripts ${scriptName}:`, error);
      
      // Detailliertere Fehlermeldung anzeigen
      let errorMessage = error.message;
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      if (error.response?.data?.details) {
        errorMessage += '\n\n' + error.response.data.details;
      }
      
      setScriptOutput(errorMessage);
      setSnackbar({
        open: true,
        message: `Fehler beim Ausführen des Skripts ${scriptName}`,
        severity: 'error'
      });
    } finally {
      setScriptLoading(false);
    }
  };

  // Benutzer aktivieren/deaktivieren
  const toggleUserActive = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      // Verwende den Admin-Endpunkt, um sicherzustellen, dass die Berechtigungen korrekt sind
      // Dieser Endpunkt prüft nur die E-Mail-Adresse und nicht die Rolle
      const apiUrl = `${process.env.REACT_APP_API_URL || '/api'}/admin/toggle-user-active/${userId}`;
      console.log('Toggle User Active URL:', apiUrl);
      
      const response = await axios.put(
        apiUrl,
        { active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data && response.data.success) {
        // Aktualisiere den Benutzer in der Liste
        setUsers(users.map(user => 
          user._id === userId ? { ...user, active: !currentStatus } : user
        ));
        
        setSnackbar({
          open: true,
          message: `Benutzer wurde ${!currentStatus ? 'aktiviert' : 'deaktiviert'}`,
          severity: 'success'
        });
      } else {
        throw new Error(response.data?.error || 'Unbekannter Fehler beim Aktualisieren des Benutzers');
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Benutzerstatus:', error);
      
      let errorMessage = 'Fehler beim Aktualisieren des Benutzerstatus';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  // Dialog schließen
  const handleCloseDialog = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  // Bestätigungsdialog vor dem Ausführen eines Skripts
  const confirmRunScript = (scriptName, description) => {
    // Für bestimmte Skripte E-Mail-Adresse prüfen
    if ((scriptName === 'seed-bar-data.js' || scriptName === 'delete-bar-data.js') && !emailInput.trim()) {
      setSnackbar({
        open: true,
        message: `Bitte geben Sie eine E-Mail-Adresse ein, um die entsprechende Bar zu identifizieren`,
        severity: 'warning'
      });
      return;
    }
    
    const message = (scriptName === 'seed-bar-data.js' || scriptName === 'delete-bar-data.js')
      ? `Möchten Sie wirklich das Skript "${scriptName}" für die Bar des Benutzers mit der E-Mail "${emailInput}" ausführen? ${description}`
      : `Möchten Sie wirklich das Skript "${scriptName}" ausführen? ${description}`;
    
    setConfirmDialog({
      open: true,
      title: `${scriptName} ausführen`,
      message,
      action: () => {
        handleCloseDialog();
        runScript(scriptName, emailInput);
      }
    });
  };

  // Bestätigungsdialog vor dem Ändern des Benutzerstatus
  const confirmToggleUser = (userId, currentStatus, userName) => {
    const actionType = currentStatus ? 'deaktivieren' : 'aktivieren';
    
    setConfirmDialog({
      open: true,
      title: `Benutzer ${actionType}`,
      message: `Möchten Sie wirklich den Benutzer "${userName}" ${actionType}?`,
      action: () => {
        handleCloseDialog();
        toggleUserActive(userId, currentStatus);
      }
    });
  };

  // Snackbar schließen
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (currentUser && currentUser.email !== 'martin.pfeffer@celox.io') {
    return (
      <Container>
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Zugriff verweigert
          </Typography>
          <Typography variant="body1">
            Sie haben keine Berechtigung, auf diese Seite zuzugreifen.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin-Panel
        </Typography>
        
        {/* System-Skripte */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              System-Skripte
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Hier können Sie verschiedene Systemskripte ausführen. Bitte seien Sie vorsichtig, da diese Aktionen nicht rückgängig gemacht werden können.
            </Typography>
            
            {/* E-Mail-Eingabefeld */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="E-Mail-Adresse für Bar-Operationen"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  variant="outlined"
                  size="medium"
                  placeholder="z.B. user@example.com"
                  helperText="Diese E-Mail-Adresse wird verwendet, um die entsprechende Bar für die Skript-Ausführung zu identifizieren"
                />
              </Grid>
            </Grid>
            
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={4}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  onClick={() => confirmRunScript('seed-bar-data.js', 'Dies erstellt Testdaten für eine Bar.')}
                >
                  Seed Bar Data
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button 
                  variant="contained" 
                  color="error" 
                  fullWidth
                  onClick={() => confirmRunScript('delete-bar-data.js', 'Dies löscht alle Daten einer Bar.')}
                >
                  Bar-Daten löschen
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button 
                  variant="contained" 
                  color="warning" 
                  fullWidth
                  onClick={() => confirmRunScript('reset-admin.js', 'Dies setzt das Admin-Passwort zurück.')}
                >
                  Admin zurücksetzen
                </Button>
              </Grid>
            </Grid>
            
            {scriptLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <CircularProgress />
              </Box>
            )}
            
            {scriptOutput && (
              <Paper variant="outlined" sx={{ mt: 3, p: 2, maxHeight: '300px', overflow: 'auto' }}>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  {scriptOutput}
                </Typography>
              </Paper>
            )}
          </CardContent>
        </Card>
        
        {/* Benutzer-Verwaltung */}
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Benutzer-Verwaltung
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Hier können Sie Benutzer aktivieren oder deaktivieren.
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>E-Mail</TableCell>
                      <TableCell>Rolle</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Aktionen</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          {user.active ? (
                            <Typography color="success.main">Aktiv</Typography>
                          ) : (
                            <Typography color="error.main">Inaktiv</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <FormControlLabel
                            control={
                              <Switch 
                                checked={user.active} 
                                onChange={() => confirmToggleUser(user._id, user.active, user.name)}
                                color={user.active ? "success" : "error"}
                              />
                            }
                            label={user.active ? "Aktiv" : "Inaktiv"}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Snackbar für Benachrichtigungen */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Bestätigungsdialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseDialog}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Abbrechen
          </Button>
          <Button onClick={confirmDialog.action} color="primary" autoFocus>
            Bestätigen
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Admin;