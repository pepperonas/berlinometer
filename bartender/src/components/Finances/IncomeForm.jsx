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
  Typography,
  Paper,
  InputAdornment
} from '@mui/material';
import { 
  Save as SaveIcon,
  AddCircle as AddCircleIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { de } from 'date-fns/locale';

const INCOME_CATEGORIES = [
  { id: 'bar', name: 'Bar' },
  { id: 'food', name: 'Essen' },
  { id: 'events', name: 'Events' },
];

const IncomeForm = ({ initialValues, onSubmit, onCancel }) => {
  const [values, setValues] = useState({
    category: '',
    amount: '',
    date: new Date(),
    description: '',
    ...initialValues,
    // Datum als Date-Objekt umwandeln, falls es ein String ist
    date: initialValues?.date ? new Date(initialValues.date) : new Date(),
  });

  const [errors, setErrors] = useState({});
  
  // Formularfelder aktualisieren
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Numerische Felder validieren
    if (name === 'amount' && value !== '') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        setErrors(prev => ({ ...prev, [name]: 'Bitte geben Sie einen gültigen Betrag ein' }));
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
    
    setValues(prev => ({ ...prev, [name]: value }));
  };
  
  // Datumsfeld aktualisieren
  const handleDateChange = (date) => {
    setValues(prev => ({ ...prev, date }));
    
    // Fehler zurücksetzen
    if (errors.date) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.date;
        return newErrors;
      });
    }
  };
  
  // Formular validieren
  const validateForm = () => {
    const newErrors = {};
    
    if (!values.category) {
      newErrors.category = 'Kategorie ist erforderlich';
    }
    
    if (!values.amount) {
      newErrors.amount = 'Betrag ist erforderlich';
    } else if (isNaN(parseFloat(values.amount)) || parseFloat(values.amount) <= 0) {
      newErrors.amount = 'Bitte geben Sie einen gültigen Betrag ein';
    }
    
    if (!values.date) {
      newErrors.date = 'Datum ist erforderlich';
    }
    
    if (!values.description.trim()) {
      newErrors.description = 'Beschreibung ist erforderlich';
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
        amount: parseFloat(values.amount),
        // Datum in ISO-String umwandeln
        date: values.date.toISOString().split('T')[0],
      };
      
      onSubmit(formattedValues);
    }
  };
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center">
            <AddCircleIcon sx={{ mr: 1 }} />
            Einnahme {initialValues ? 'bearbeiten' : 'hinzufügen'}
          </Typography>
          
          <Grid container spacing={3} mt={1}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors.category}>
                <InputLabel id="category-label">Kategorie</InputLabel>
                <Select
                  labelId="category-label"
                  name="category"
                  value={values.category}
                  onChange={handleChange}
                  label="Kategorie"
                >
                  {INCOME_CATEGORIES.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Betrag"
                name="amount"
                value={values.amount}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.amount}
                helperText={errors.amount}
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>,
                  type: 'number',
                  step: '0.01',
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Datum"
                value={values.date}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!errors.date,
                    helperText: errors.date,
                  },
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Beschreibung"
                name="description"
                value={values.description}
                onChange={handleChange}
                fullWidth
                required
                error={!!errors.description}
                helperText={errors.description}
                multiline
                rows={3}
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
            {initialValues ? 'Speichern' : 'Hinzufügen'}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default IncomeForm;