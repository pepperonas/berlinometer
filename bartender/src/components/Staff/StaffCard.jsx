import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  IconButton, 
  CardActionArea, 
  Tooltip, 
  Avatar,
  Divider
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/helpers';

const StaffCard = ({ staff, onDelete, onEdit }) => {
  const navigate = useNavigate();
  
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
  
  // Berechnung des monatlichen Gehalts (geschätzt)
  // Wenn das Backend salary bereitstellt, verwenden wir das, ansonsten berechnen wir es aus hourlyRate und hoursPerWeek
  const estimatedMonthlySalary = staff.salary || 
    (staff.hourlyRate && staff.hoursPerWeek ? (staff.hourlyRate * staff.hoursPerWeek * 4.33).toFixed(0) : 0);
  
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
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        }
      }}
    >
      <CardActionArea 
        onClick={() => navigate(`/staff/${staff._id || staff.id}`)}
        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <CardContent sx={{ p: 0 }}>
          <Box 
            sx={{ 
              p: 3, 
              display: 'flex', 
              alignItems: 'center', 
              backgroundColor: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.03)',
            }}
          >
            <Avatar
              sx={{ 
                width: 56, 
                height: 56, 
                bgcolor: getAvatarColor(staff.role),
                mr: 2
              }}
            >
              {getInitials(staff.name)}
            </Avatar>
            
            <Box>
              <Typography variant="h6" component="div">
                {staff.name}
              </Typography>
              
              <Chip 
                label={getRoleLabel(staff.role)} 
                size="small" 
                color={getRoleColor(staff.role)}
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>
          
          <Box p={2}>
            <Box 
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 1.5
              }}
            >
              <PhoneIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {staff.phone}
              </Typography>
            </Box>
            
            <Box 
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 1.5
              }}
            >
              <EmailIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {staff.email}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Arbeitsdaten
              </Typography>
              
              <Grid container spacing={1}>
                {staff.hourlyRate && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Stundenlohn:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(staff.hourlyRate)}
                      </Typography>
                    </Grid>
                  </>
                )}
                
                {staff.hoursPerWeek && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Stunden/Woche:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="medium">
                        {staff.hoursPerWeek} h
                      </Typography>
                    </Grid>
                  </>
                )}
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    {staff.salary ? 'Monatliches Gehalt:' : 'Monatlich (ca.):'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    {formatCurrency(estimatedMonthlySalary)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
      
      <Divider />
      
      <Box 
        sx={{ 
          p: 1,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Tooltip title="Bearbeiten">
          <IconButton 
            size="small" 
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(staff);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Löschen">
          <IconButton 
            size="small" 
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(staff._id || staff.id);
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      {!staff.isActive && (
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'inherit',
          }}
        >
          <Chip 
            label="Inaktiv" 
            color="default"
            sx={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              fontWeight: 'bold',
            }}
          />
        </Box>
      )}
    </Card>
  );
};

// Grid Komponente für das Layout innerhalb der Karte
const Grid = ({ container, item, xs, spacing, children, ...rest }) => {
  if (container) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          margin: spacing ? -0.5 * spacing : 0 
        }}
        {...rest}
      >
        {children}
      </Box>
    );
  }
  
  if (item) {
    return (
      <Box 
        sx={{ 
          flexBasis: `${(xs / 12) * 100}%`, 
          maxWidth: `${(xs / 12) * 100}%`,
          padding: spacing ? 0.5 * spacing : 0
        }}
        {...rest}
      >
        {children}
      </Box>
    );
  }
  
  return <Box {...rest}>{children}</Box>;
};

export default StaffCard;