import React, { useState, useEffect, forwardRef } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Button, 
  CircularProgress, 
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Slide,
  useMediaQuery,
  useTheme,
  Backdrop
} from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import StaffCard from '../components/Staff/StaffCard';
import StaffFilter from '../components/Staff/StaffFilter';
import StaffForm from '../components/Staff/StaffForm';
import { staffApi } from '../services/api';
import { filterBySearchTerm } from '../utils/helpers';

// Transition für Dialog
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Staff = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [openForm, setOpenForm] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(null);
  
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  
  const [filters, setFilters] = useState({
    search: '',
    roles: [],
    minHourlyRate: '',
    maxHourlyRate: '',
    minHoursPerWeek: '',
    maxHoursPerWeek: '',
    onlyActive: true
  });

  // Mitarbeiter laden
  const loadStaff = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await staffApi.getAll();
      console.log('Geladene Mitarbeiter:', data);
      
      // Daten für das Frontend formatieren
      const processedStaff = data.map(staffMember => {
        // Berechne hourlyRate und hoursPerWeek falls nicht vorhanden
        let hourlyRate = staffMember.hourlyRate;
        let hoursPerWeek = staffMember.hoursPerWeek;
        
        // Konvertiere beide Werte zu Zahlen, falls sie als Strings vorliegen
        if (hourlyRate !== undefined) {
          hourlyRate = typeof hourlyRate === 'string' ? parseFloat(hourlyRate) : hourlyRate;
        }
        
        if (hoursPerWeek !== undefined) {
          hoursPerWeek = typeof hoursPerWeek === 'string' ? parseFloat(hoursPerWeek) : hoursPerWeek;
        }
        
        // Wenn salary existiert aber hourlyRate oder hoursPerWeek nicht oder 0 sind, führe eine umgekehrte Berechnung durch
        if (staffMember.salary && (hourlyRate === undefined || hourlyRate === 0 || hoursPerWeek === undefined || hoursPerWeek === 0)) {
          // Standardwert für hoursPerWeek: 40 Stunden
          const standardHoursPerWeek = 40;
          
          if ((!hoursPerWeek || hoursPerWeek === 0) && (!hourlyRate || hourlyRate === 0)) {
            // Wenn beide fehlen oder 0 sind, nutze Standardstunden und berechne hourlyRate
            hoursPerWeek = standardHoursPerWeek;
            hourlyRate = parseFloat((staffMember.salary / (hoursPerWeek * 4.33)).toFixed(2));
          } else if (!hourlyRate || hourlyRate === 0) {
            // Wenn nur hourlyRate fehlt oder 0 ist, berechne es
            hourlyRate = parseFloat((staffMember.salary / (hoursPerWeek * 4.33)).toFixed(2));
          } else if (!hoursPerWeek || hoursPerWeek === 0) {
            // Wenn nur hoursPerWeek fehlt oder 0 ist, berechne es
            hoursPerWeek = parseFloat((staffMember.salary / (hourlyRate * 4.33)).toFixed(2));
          }
        }
        
        const processedData = {
          ...staffMember,
          id: staffMember._id || staffMember.id, // Beide ID-Formate unterstützen
          role: staffMember.position || staffMember.role, // Backend nutzt 'position', Frontend 'role'
          isActive: staffMember.active !== undefined ? staffMember.active : true, // Backend nutzt 'active', Frontend 'isActive'
          hourlyRate: hourlyRate || 0,
          hoursPerWeek: hoursPerWeek || 0
        };
        
        console.log('Verarbeitete Mitarbeiterdaten:', {
          name: processedData.name,
          original: {
            hourlyRate: staffMember.hourlyRate,
            hoursPerWeek: staffMember.hoursPerWeek,
            salary: staffMember.salary
          },
          processed: {
            hourlyRate: processedData.hourlyRate,
            hoursPerWeek: processedData.hoursPerWeek
          }
        });
        
        return processedData;
      });
      
      setStaff(processedStaff);
    } catch (err) {
      console.error('Error loading staff:', err);
      setError(`Fehler beim Laden der Mitarbeiterdaten: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Beim ersten Laden die Mitarbeiter laden
  useEffect(() => {
    loadStaff();
  }, []);

  // Mitarbeiter hinzufügen/bearbeiten Dialog öffnen
  const handleOpenForm = (staffMember = null) => {
    console.log('Öffne Formular mit Daten:', staffMember);
    setCurrentStaff(staffMember);
    setOpenForm(true);
  };

  // Mitarbeiter hinzufügen/bearbeiten Dialog schließen
  const handleCloseForm = () => {
    setOpenForm(false);
    setCurrentStaff(null);
  };

  // Formular speichern
  const handleSaveForm = async (values) => {
    setLoading(true);
    try {
      console.log('Sende formatierte Daten an API:', values);
      
      if (currentStaff) {
        // Mitarbeiter aktualisieren
        const staffId = currentStaff._id || currentStaff.id;
        await staffApi.update(staffId, values);
      } else {
        // Neuen Mitarbeiter erstellen
        await staffApi.create(values);
      }
      
      loadStaff();
      handleCloseForm();
    } catch (err) {
      console.error('Error saving staff:', err);
      setError(`Fehler beim Speichern des Mitarbeiters: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Lösch-Dialog öffnen
  const handleDeleteConfirm = (staffId) => {
    // MongoDB verwendet _id statt id
    const staffMember = staff.find(s => s._id === staffId || s.id === staffId);
    if (staffMember) {
      setStaffToDelete(staffMember);
      setDeleteConfirm(true);
    } else {
      console.error('Mitarbeiter nicht gefunden:', staffId);
      setError('Mitarbeiter nicht gefunden');
    }
  };

  // Mitarbeiter löschen
  const handleDelete = async () => {
    if (!staffToDelete) return;
    
    setLoading(true);
    try {
      // Verwende entweder _id oder id, je nachdem was verfügbar ist
      const staffId = staffToDelete._id || staffToDelete.id;
      await staffApi.delete(staffId);
      setDeleteConfirm(false);
      setStaffToDelete(null);
      loadStaff();
    } catch (err) {
      console.error('Error deleting staff:', err);
      setError(`Fehler beim Löschen des Mitarbeiters: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter anwenden
  const filteredStaff = staff.filter(member => {
    // Aktiv-Filter
    if (filters.onlyActive && !member.isActive) {
      return false;
    }
    
    // Rolle-Filter
    if (filters.roles?.length > 0 && !filters.roles.includes(member.role)) {
      return false;
    }
    
    // Stundenlohn-Filter
    if (filters.minHourlyRate && member.hourlyRate < parseFloat(filters.minHourlyRate)) {
      return false;
    }
    
    if (filters.maxHourlyRate && member.hourlyRate > parseFloat(filters.maxHourlyRate)) {
      return false;
    }
    
    // Wochenstunden-Filter
    if (filters.minHoursPerWeek && member.hoursPerWeek < parseFloat(filters.minHoursPerWeek)) {
      return false;
    }
    
    if (filters.maxHoursPerWeek && member.hoursPerWeek > parseFloat(filters.maxHoursPerWeek)) {
      return false;
    }
    
    // Suchfilter
    if (filters.search) {
      return (
        member.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        member.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        member.phone.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    
    return true;
  });

  return (
    <Box sx={{ flexGrow: 1, pb: 4 }}>
      {/* Titel und Aktionsbuttons */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Personal
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Verwalten Sie Ihre Mitarbeiter und deren Arbeitsdaten
          </Typography>
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
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
          >
            Mitarbeiter hinzufügen
          </Button>
        </Box>
      </Box>

      {/* Filter */}
      <StaffFilter 
        filters={filters}
        onFilterChange={setFilters}
      />

      {/* Fehlermeldung */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 4 }}
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
      )}

      {/* Mitarbeiterliste */}
      {loading && !staff.length ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress size={60} thickness={4} />
        </Box>
      ) : filteredStaff.length > 0 ? (
        <Grid container spacing={3}>
          {filteredStaff.map(member => (
            <Grid item key={member.id} xs={12} sm={6} md={4}>
              <StaffCard 
                staff={member} 
                onDelete={handleDeleteConfirm}
                onEdit={() => handleOpenForm(member)}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box 
          sx={{ 
            py: 8, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            bgcolor: 'background.paper',
            borderRadius: 2,
            p: 4,
          }}
        >
          <PersonIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Keine Mitarbeiter gefunden
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" mb={3}>
            {staff.length > 0 
              ? 'Keine Mitarbeiter entsprechen den ausgewählten Filterkriterien.'
              : 'Es wurden noch keine Mitarbeiter hinzugefügt. Fügen Sie jetzt einen Mitarbeiter hinzu!'
            }
          </Typography>
          {staff.length > 0 ? (
            <Button 
              variant="outlined" 
              onClick={() => setFilters({
                search: '',
                roles: [],
                minHourlyRate: '',
                maxHourlyRate: '',
                minHoursPerWeek: '',
                maxHoursPerWeek: '',
                onlyActive: true
              })}
              startIcon={<RefreshIcon />}
            >
              Filter zurücksetzen
            </Button>
          ) : (
            <Button 
              variant="contained" 
              onClick={() => handleOpenForm()}
              startIcon={<AddIcon />}
            >
              Mitarbeiter hinzufügen
            </Button>
          )}
        </Box>
      )}

      {/* Floating Action Button auf kleinen Bildschirmen */}
      {useMediaQuery(theme.breakpoints.down('sm')) && (
        <Fab 
          color="primary" 
          aria-label="Mitarbeiter hinzufügen"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => handleOpenForm()}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Mitarbeiter hinzufügen/bearbeiten Dialog */}
      <Dialog 
        open={openForm} 
        onClose={handleCloseForm}
        fullScreen={fullScreen}
        fullWidth
        maxWidth="md"
        TransitionComponent={Transition}
      >
        <DialogTitle>
          {currentStaff ? 'Mitarbeiter bearbeiten' : 'Neuen Mitarbeiter hinzufügen'}
        </DialogTitle>
        <DialogContent dividers>
          <StaffForm 
            initialValues={currentStaff}
            onSubmit={handleSaveForm}
            onCancel={handleCloseForm}
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
            Sind Sie sicher, dass Sie den Mitarbeiter "{staffToDelete?.name}" löschen möchten?
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

export default Staff;