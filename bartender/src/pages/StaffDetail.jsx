import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  Divider, 
  Chip, 
  CircularProgress, 
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Backdrop,
  useTheme,
  Avatar
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Euro as EuroIcon,
  ContactMail as ContactIcon,
  Work as WorkIcon,
  Event as EventIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

import StaffForm from '../components/Staff/StaffForm';
import { staffApi } from '../services/api';
import { formatCurrency } from '../utils/helpers';

const StaffDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [openForm, setOpenForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Mitarbeiter laden
  const loadStaff = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await staffApi.getById(id);
      setStaff(data);
    } catch (err) {
      console.error('Error loading staff:', err);
      setError('Mitarbeiter konnte nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  // Beim ersten Laden und wenn sich die ID ändert
  useEffect(() => {
    loadStaff();
  }, [id]);

  // Rolle als lesbarer Text
  const getRoleLabel = (role) => {
    switch (role) {
      case 'bartender': return 'Barkeeper';
      case 'waiter': return 'Kellner';
      case 'manager': return 'Manager';
      case 'chef': return 'Koch';
      case 'cleaner': return 'Reinigungskraft';
      default: return role;
    }
  };

  // Rollenfarbe
  const getRoleColor = (role) => {
    switch (role) {
      case 'manager': return 'error';
      case 'bartender': return 'primary';
      case 'waiter': return 'info';
      case 'chef': return 'warning';
      case 'cleaner': return 'success';
      default: return 'default';
    }
  };

  // Formular speichern
  const handleSaveForm = async (values) => {
    setLoading(true);
    try {
      await staffApi.update(id, values);
      setOpenForm(false);
      loadStaff();
    } catch (err) {
      console.error('Error updating staff:', err);
      setError('Fehler beim Speichern des Mitarbeiters');
    } finally {
      setLoading(false);
    }
  };

  // Mitarbeiter löschen
  const handleDelete = async () => {
    setLoading(true);
    try {
      await staffApi.delete(id);
      navigate('/staff');
    } catch (err) {
      console.error('Error deleting staff:', err);
      setError('Fehler beim Löschen des Mitarbeiters');
      setLoading(false);
    }
  };

  // Laden oder Fehler
  if (loading && !staff) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="500px">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  if (error && !staff) {
    return (
      <Box p={3}>
        <Alert 
          severity="error" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={loadStaff}
            >
              Erneut laden
            </Button>
          }
        >
          {error}
        </Alert>
        <Box mt={2} display="flex" justifyContent="center">
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/staff')}
          >
            Zurück zur Personalliste
          </Button>
        </Box>
      </Box>
    );
  }

  if (!staff) {
    return (
      <Box p={3}>
        <Alert severity="warning">Mitarbeiter nicht gefunden</Alert>
        <Box mt={2} display="flex" justifyContent="center">
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/staff')}
          >
            Zurück zur Personalliste
          </Button>
        </Box>
      </Box>
    );
  }

  // Berechnung des monatlichen Gehalts (geschätzt)
  const estimatedMonthlySalary = (staff.hourlyRate * staff.hoursPerWeek * 4).toFixed(0);
  
  // Avatar Initialen generieren
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  // Avatar-Hintergrundfarbe basierend auf der Rolle
  const getAvatarColor = (role) => {
    switch (role) {
      case 'manager': return '#e53935'; // Rot
      case 'bartender': return '#1976d2'; // Blau
      case 'waiter': return '#03a9f4'; // Hellblau
      case 'chef': return '#ff9800'; // Orange
      case 'cleaner': return '#4caf50'; // Grün
      default: return '#9e9e9e'; // Grau
    }
  };

  // Datum formatieren
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('de-DE', options);
  };

  return (
    <Box sx={{ flexGrow: 1, pb: 4 }}>
      {/* Titel und Aktionsbuttons */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center">
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/staff')}
            sx={{ mr: 2 }}
          >
            Zurück
          </Button>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              {staff.name}
            </Typography>
            <Box display="flex" alignItems="center">
              <Chip 
                label={getRoleLabel(staff.role)} 
                color={getRoleColor(staff.role)}
                sx={{ mr: 1 }}
              />
              {!staff.isActive && (
                <Chip 
                  label="Inaktiv" 
                  color="default"
                />
              )}
            </Box>
          </Box>
        </Box>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={loadStaff}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Aktualisieren
          </Button>
          <Button 
            variant="outlined" 
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => setOpenForm(true)}
            sx={{ mr: 1 }}
          >
            Bearbeiten
          </Button>
          <Button 
            variant="outlined" 
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteConfirm(true)}
          >
            Löschen
          </Button>
        </Box>
      </Box>

      {/* Mitarbeiterdetails */}
      <Grid container spacing={3}>
        {/* Hauptinfos */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" flexDirection="column" alignItems="center">
              <Avatar
                sx={{ 
                  width: 120, 
                  height: 120, 
                  bgcolor: getAvatarColor(staff.role),
                  fontSize: '2.5rem',
                  mb: 2
                }}
              >
                {getInitials(staff.name)}
              </Avatar>
              
              <Typography variant="h5" gutterBottom>
                {staff.name}
              </Typography>
              
              <Chip 
                label={getRoleLabel(staff.role)} 
                color={getRoleColor(staff.role)}
                sx={{ mb: 2 }}
              />
              
              <Typography variant="body1" color="text.secondary" display="flex" alignItems="center" gutterBottom>
                <EventIcon fontSize="small" sx={{ mr: 1 }} />
                Eingestellt am {formatDate(staff.startDate)}
              </Typography>
              
              <Typography variant="body1" display="flex" alignItems="center">
                <Chip 
                  label={staff.isActive ? 'Aktiv' : 'Inaktiv'} 
                  color={staff.isActive ? 'success' : 'default'}
                  size="small"
                />
              </Typography>
            </Box>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
              <ContactIcon sx={{ mr: 1 }} />
              Kontaktdaten
            </Typography>
            
            <TableContainer>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', borderBottom: 'none' }}>
                      Telefon
                    </TableCell>
                    <TableCell sx={{ borderBottom: 'none' }}>
                      {staff.phone}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 'bold', borderBottom: 'none' }}>
                      E-Mail
                    </TableCell>
                    <TableCell sx={{ borderBottom: 'none' }}>
                      {staff.email}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Arbeitsdetails */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
              <WorkIcon sx={{ mr: 1 }} />
              Arbeitsverhältnis
            </Typography>
            
            <Grid container spacing={3} mt={1}>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <EuroIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="subtitle2">
                        Stundenlohn
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold">
                      {formatCurrency(staff.hourlyRate)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <TimeIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="subtitle2" color="text.secondary">
                        Wochenstunden
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="text.primary">
                      {staff.hoursPerWeek}h
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <EuroIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="subtitle2">
                        Monatl. (geschätzt)
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold">
                      {formatCurrency(estimatedMonthlySalary)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Box mt={3}>
              <Typography variant="subtitle1" gutterBottom>
                Arbeitszeit pro Woche
              </Typography>
              <Box 
                sx={{ 
                  mt: 1,
                  height: 10, 
                  bgcolor: 'background.paper',
                  borderRadius: 5,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box 
                  sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${(staff.hoursPerWeek / 40) * 100}%`,
                    bgcolor: staff.hoursPerWeek >= 35 ? 'success.main' : 
                             staff.hoursPerWeek >= 20 ? 'primary.main' : 'info.main',
                    borderRadius: 5,
                  }}
                />
              </Box>
              <Box display="flex" justifyContent="space-between" mt={0.5}>
                <Typography variant="caption" color="text.secondary">
                  0h
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  20h
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  40h
                </Typography>
              </Box>
            </Box>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
              <AssignmentIcon sx={{ mr: 1 }} />
              Personalaktionen
            </Typography>
            
            <Grid container spacing={2} mt={1}>
              <Grid item xs={12} md={6}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  startIcon={<TimeIcon />}
                >
                  Arbeitszeiten anzeigen
                </Button>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  startIcon={<EuroIcon />}
                >
                  Gehaltsverlauf anzeigen
                </Button>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => setOpenForm(true)}
                >
                  Mitarbeiter bearbeiten
                </Button>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteConfirm(true)}
                >
                  Mitarbeiter löschen
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Mitarbeiter bearbeiten Dialog */}
      <Dialog 
        open={openForm} 
        onClose={() => setOpenForm(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Mitarbeiter bearbeiten
        </DialogTitle>
        <DialogContent dividers>
          <StaffForm 
            initialValues={staff}
            onSubmit={handleSaveForm}
            onCancel={() => setOpenForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Lösch-Dialog */}
      <Dialog 
        open={deleteConfirm} 
        onClose={() => setDeleteConfirm(false)}
      >
        <DialogTitle>
          Mitarbeiter löschen
        </DialogTitle>
        <DialogContent>
          <Typography>
            Sind Sie sicher, dass Sie den Mitarbeiter "{staff.name}" löschen möchten?
            Diese Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteConfirm(false)}
          >
            Abbrechen
          </Button>
          <Button 
            color="error" 
            onClick={handleDelete}
            startIcon={<DeleteIcon />}
          >
            Löschen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: theme.zIndex.drawer + 1 }}
        open={loading && (openForm || deleteConfirm)}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default StaffDetail;