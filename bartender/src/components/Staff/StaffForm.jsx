import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText,
  Grid,
  Divider,
  Typography,
  Switch,
  FormControlLabel,
  Paper,
  InputAdornment
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Save as SaveIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { de } from 'date-fns/locale';
import { STAFF_ROLES } from '../../utils/constants';

const StaffForm = ({ initialValues, onSubmit, onCancel }) => {
  const [values, setValues] = useState({
    name: '',
    role: '',
    hourlyRate: '',
    hoursPerWeek: '',
    startDate: null,
    phone: '',
    email: '',
    isActive: true,
    ...initialValues,
    // Startdatum als Date-Objekt umwandeln, falls es ein String ist
    startDate: initialValues?.startDate ? new Date(initialValues.startDate) : null,
  });

  const [errors, setErrors] = useState({});
  
  // Formularfelder aktualisieren
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Verschiedene Feldtypen behandeln
    const newValue = type === 'checkbox' ? checked : value;
    
    // Numerische Felder validieren
    if ((name === 'hourlyRate' || name === 'hoursPerWeek') && value !== '') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        setErrors(prev => ({ ...prev, [name]: 'Bitte geben Sie einen gültigen Wert ein' }));
        return;
      }
    }
    
    // Fehler zurücksetzen
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setValues(prev => ({ ...prev, [name]: newValue }));
  };
  
  // Datumsfeld aktualisieren
  const handleDateChange = (date) => {
    setValues(prev => ({ ...prev, startDate: date }));
    
    // Fehler zurücksetzen
    if (errors.startDate) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.startDate;
        return newErrors;
      });
    }
  };
  
  // Formular validieren
  const validateForm = () => {
    const newErrors = {};
    
    if (!values.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }
    
    if (!values.role) {
      newErrors.role = 'Rolle ist erforderlich';
    }
    
    if (!values.hourlyRate) {
      newErrors.hourlyRate = 'Stundenlohn ist erforderlich';
    } else if (isNaN(parseFloat(values.hourlyRate)) || parseFloat(values.hourlyRate) <= 0) {
      newErrors.hourlyRate = 'Bitte geben Sie einen gültigen Stundenlohn ein';
    }
    
    if (!values.hoursPerWeek) {
      newErrors.hoursPerWeek = 'Wochenstunden sind erforderlich';
    } else if (isNaN(parseFloat(values.hoursPerWeek)) || parseFloat(values.hoursPerWeek) <= 0) {
      newErrors.hoursPerWeek = 'Bitte geben Sie gültige Wochenstunden ein';
    }
    
    if (!values.startDate) {
      newErrors.startDate = 'Einstellungsdatum ist erforderlich';
    }
    
    if (!values.phone.trim()) {
      newErrors.phone = 'Telefonnummer ist erforderlich';
    }
    
    if (!values.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      newErrors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Formular absenden
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Numerische Werte konvertieren
      const formattedValues = {
        ...values,
        hourlyRate: parseFloat(values.hourlyRate),
        hoursPerWeek: parseFloat(values.hoursPerWeek),
        // Datum in ISO-String umwandeln
        startDate: values.startDate.toISOString().split('T')[0],
      };
      
      onSubmit(formattedValues);
    }
  };
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center">
            <PersonIcon sx={{ mr: 1 }} />
            Mitarbeiter-Details
          </Typography>
          
          <Grid container spacing={3} mt={1}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Name"
                name="name"
                value={values.name}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors.role}>
                <InputLabel id="role-label">Rolle</InputLabel>
                <Select
                  labelId="role-label"
                  name="role"
                  value={values.role}
                  onChange={handleChange}
                  label="Rolle"
                >
                  {STAFF_ROLES.map(role => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" gutterBottom>
                Arbeitsdetails
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                label="Stundenlohn"
                name="hourlyRate"
                value={values.hourlyRate}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.hourlyRate}
                helperText={errors.hourlyRate}
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>,
                  type: 'number',
                  step: '0.01',
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                label="Stunden pro Woche"
                name="hoursPerWeek"
                value={values.hoursPerWeek}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.hoursPerWeek}
                helperText={errors.hoursPerWeek}
                InputProps={{
                  endAdornment: <InputAdornment position="end">h</InputAdornment>,
                  type: 'number',
                  step: '0.5',
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <DatePicker
                label="Einstellungsdatum"
                value={values.startDate}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!errors.startDate,
                    helperText: errors.startDate,
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" gutterBottom>
                Kontaktdaten
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Telefonnummer"
                name="phone"
                value={values.phone}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.phone}
                helperText={errors.phone}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="E-Mail"
                name="email"
                value={values.email}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.email}
                helperText={errors.email}
                type="email"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={values.isActive}
                    onChange={handleChange}
                    name="isActive"
                    color="primary"
                  />
                }
                label="Aktiv"
              />
            </Grid>
          </Grid>
        </Paper>
        
        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button 
            variant="outlined" 
            onClick={onCancel}
          >
            Abbrechen
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            startIcon={<SaveIcon />}
          >
            {initialValues ? 'Speichern' : 'Erstellen'}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default StaffForm;