import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Grid,
  Paper,
  InputAdornment,
  IconButton,
  Chip,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  Button,
  useTheme
} from '@mui/material';
import { 
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { STAFF_ROLES } from '../../utils/constants';

const StaffFilter = ({ filters, onFilterChange }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Verschiedene Feldtypen behandeln
    const newValue = type === 'checkbox' ? checked : value;
    
    onFilterChange({
      ...filters,
      [name]: newValue
    });
  };
  
  const handleRoleChange = (roleId) => {
    const currentRoles = [...(filters.roles || [])];
    const roleIndex = currentRoles.indexOf(roleId);
    
    if (roleIndex === -1) {
      // Rolle hinzufügen
      currentRoles.push(roleId);
    } else {
      // Rolle entfernen
      currentRoles.splice(roleIndex, 1);
    }
    
    onFilterChange({
      ...filters,
      roles: currentRoles
    });
  };
  
  const handleClearFilters = () => {
    onFilterChange({
      search: '',
      roles: [],
      minHourlyRate: '',
      maxHourlyRate: '',
      minHoursPerWeek: '',
      maxHoursPerWeek: '',
      onlyActive: true
    });
  };
  
  // Rolle-Hintergrundfarbe
  const getRoleColor = (role) => {
    switch (role) {
      case 'manager': return theme.palette.error.light;
      case 'bartender': return theme.palette.primary.light;
      case 'waiter': return theme.palette.info.light;
      case 'chef': return theme.palette.warning.light;
      case 'cleaner': return theme.palette.success.light;
      default: return theme.palette.grey[300];
    }
  };
  
  // Rolle-Textfarbe
  const getRoleTextColor = (role) => {
    switch (role) {
      case 'manager': return theme.palette.error.main;
      case 'bartender': return theme.palette.primary.main;
      case 'waiter': return theme.palette.info.main;
      case 'chef': return theme.palette.warning.main;
      case 'cleaner': return theme.palette.success.main;
      default: return theme.palette.text.primary;
    }
  };
  
  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
          <FilterIcon sx={{ mr: 1 }} />
          Filter
        </Typography>
        
        <Button 
          size="small" 
          variant="text" 
          onClick={() => setExpanded(!expanded)}
          endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        >
          {expanded ? 'Weniger' : 'Mehr Filter'}
        </Button>
      </Box>
      
      <Box mb={2}>
        <TextField
          fullWidth
          label="Mitarbeiter suchen"
          name="search"
          value={filters.search || ''}
          onChange={handleChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: filters.search ? (
              <InputAdornment position="end">
                <IconButton 
                  size="small" 
                  onClick={() => onFilterChange({ ...filters, search: '' })}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
        />
      </Box>
      
      <Box mb={3}>
        <Typography variant="subtitle2" gutterBottom>
          Rollen
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {STAFF_ROLES.map(role => (
            <Chip
              key={role.id}
              label={role.name}
              onClick={() => handleRoleChange(role.id)}
              color={filters.roles?.includes(role.id) ? 'primary' : 'default'}
              variant={filters.roles?.includes(role.id) ? 'filled' : 'outlined'}
              sx={{ 
                backgroundColor: filters.roles?.includes(role.id) 
                  ? getRoleColor(role.id)
                  : 'transparent',
                color: filters.roles?.includes(role.id) 
                  ? getRoleTextColor(role.id)
                  : 'text.primary',
                borderColor: filters.roles?.includes(role.id) 
                  ? 'transparent'
                  : getRoleTextColor(role.id),
                '&:hover': {
                  backgroundColor: filters.roles?.includes(role.id) 
                    ? getRoleColor(role.id)
                    : `${getRoleColor(role.id)}33`,
                }
              }}
            />
          ))}
        </Box>
      </Box>
      
      {expanded && (
        <>
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Stundenlohn
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Von"
                    name="minHourlyRate"
                    value={filters.minHourlyRate || ''}
                    onChange={handleChange}
                    type="number"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">€</InputAdornment>,
                      inputProps: { min: 0, step: 0.5 }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Bis"
                    name="maxHourlyRate"
                    value={filters.maxHourlyRate || ''}
                    onChange={handleChange}
                    type="number"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">€</InputAdornment>,
                      inputProps: { min: 0, step: 0.5 }
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Wochenstunden
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Von"
                    name="minHoursPerWeek"
                    value={filters.minHoursPerWeek || ''}
                    onChange={handleChange}
                    type="number"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">h</InputAdornment>,
                      inputProps: { min: 0, step: 0.5 }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Bis"
                    name="maxHoursPerWeek"
                    value={filters.maxHoursPerWeek || ''}
                    onChange={handleChange}
                    type="number"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">h</InputAdornment>,
                      inputProps: { min: 0, step: 0.5 }
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={filters.onlyActive || false}
                    onChange={handleChange}
                    name="onlyActive"
                  />
                }
                label="Nur aktive Mitarbeiter anzeigen"
              />
            </Grid>
          </Grid>
        </>
      )}
      
      <Box mt={3} display="flex" justifyContent="flex-end">
        <Button 
          variant="outlined" 
          color="inherit"
          onClick={handleClearFilters}
          startIcon={<ClearIcon />}
          size="small"
        >
          Filter zurücksetzen
        </Button>
      </Box>
    </Paper>
  );
};

export default StaffFilter;