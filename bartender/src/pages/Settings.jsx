import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tab,
  Tabs,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Brush as BrushIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { currentUser, updateProfile } = useAuth();
  
  // User Settings
  const [settings, setSettings] = useState({
    // Profilsettings
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    currentPassword: '',
    
    // Geschäftssettings
    businessName: 'Meine Bar',
    address: 'Musterstraße 123, 12345 Berlin',
    phone: '+49 123 456789',
    website: 'www.meine-bar.de',
    taxId: 'DE123456789',
    
    // Anzeigeeinstellungen
    darkMode: true,
    fontSize: 'medium',
    language: 'de',
    currency: 'EUR',
    
    // Benachrichtigungseinstellungen
    emailNotifications: true,
    stockAlerts: true,
    financialReports: true,
    marketingEmails: false,
    
    // Systemeinstellungen
    dataBackup: true,
    backupFrequency: 'weekly',
    autoUpdate: true,
    anonymousUsage: true
  });
  
  // Load current user data
  useEffect(() => {
    if (currentUser) {
      const updatedSettings = {
        ...settings,
        username: currentUser.name || '',
        email: currentUser.email || ''
      };
      
      // Load bar data if available
      if (currentUser.bar) {
        // Bar name
        if (currentUser.bar.name) {
          updatedSettings.businessName = currentUser.bar.name;
        }
        
        // Address
        if (currentUser.bar.address) {
          const address = currentUser.bar.address;
          const addressParts = [];
          
          if (address.street) addressParts.push(address.street);
          
          const cityPart = [];
          if (address.zipCode) cityPart.push(address.zipCode);
          if (address.city) cityPart.push(address.city);
          
          if (cityPart.length > 0) {
            addressParts.push(cityPart.join(' '));
          }
          
          if (addressParts.length > 0) {
            updatedSettings.address = addressParts.join(', ');
          }
        }
        
        // Contact info
        if (currentUser.bar.contact) {
          if (currentUser.bar.contact.phone) {
            updatedSettings.phone = currentUser.bar.contact.phone;
          }
          if (currentUser.bar.contact.website) {
            updatedSettings.website = currentUser.bar.contact.website;
          }
        }
      }
      
      setSettings(updatedSettings);
    }
  }, [currentUser]);
  
  // Formularänderungen verarbeiten
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Tab wechseln
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
    
    // When business tab is selected, make sure to load all bar data
    if (newValue === 1 && currentUser && currentUser.bar) {
      // Load bar data into settings
      const updatedSettings = { ...settings };
      
      if (currentUser.bar.name) {
        updatedSettings.businessName = currentUser.bar.name;
      }
      
      if (currentUser.bar.address) {
        const address = currentUser.bar.address;
        const addressParts = [];
        
        if (address.street) addressParts.push(address.street);
        
        const cityPart = [];
        if (address.zipCode) cityPart.push(address.zipCode);
        if (address.city) cityPart.push(address.city);
        
        if (cityPart.length > 0) {
          addressParts.push(cityPart.join(' '));
        }
        
        if (addressParts.length > 0) {
          updatedSettings.address = addressParts.join(', ');
        }
      }
      
      if (currentUser.bar.contact) {
        if (currentUser.bar.contact.phone) {
          updatedSettings.phone = currentUser.bar.contact.phone;
        }
        if (currentUser.bar.contact.website) {
          updatedSettings.website = currentUser.bar.contact.website;
        }
      }
      
      if (currentUser.bar.taxId) {
        updatedSettings.taxId = currentUser.bar.taxId;
      }
      
      setSettings(updatedSettings);
    }
  };
  
  // Validate password change
  const validatePasswordChange = () => {
    if (settings.password && !settings.currentPassword) {
      setError('Bitte geben Sie Ihr aktuelles Passwort ein');
      return false;
    }
    
    if (settings.password && settings.password.length < 6) {
      setError('Das neue Passwort muss mindestens 6 Zeichen lang sein');
      return false;
    }
    
    if (settings.password !== settings.confirmPassword) {
      setError('Die Passwörter stimmen nicht überein');
      return false;
    }
    
    return true;
  };
  
  // Einstellungen speichern
  const handleSave = async () => {
    if (activeTab === 0 && settings.password) {
      // Wenn im Profil-Tab und Passwort-Änderung
      if (!validatePasswordChange()) {
        return;
      }
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Build update data based on active tab
      let userData = {};
      
      // Profile tab
      if (activeTab === 0) {
        userData = {
          name: settings.username
        };
        
        if (settings.password && settings.currentPassword) {
          userData.currentPassword = settings.currentPassword;
          userData.newPassword = settings.password;
        }
      } 
      // Business tab
      else if (activeTab === 1) {
        userData = {
          businessName: settings.businessName,
          address: settings.address,
          phone: settings.phone,
          website: settings.website,
          taxId: settings.taxId
        };
      }
      // For now, we only handle profile and business tabs
      
      console.log('Sending update data:', JSON.stringify(userData));
      const result = await updateProfile(userData);
      
      if (result.success) {
        setSaveSuccess(true);
        // Clear sensitive fields
        if (activeTab === 0) {
          setSettings(prev => ({
            ...prev,
            password: '',
            confirmPassword: '',
            currentPassword: ''
          }));
        }
      } else {
        setError(result.error || 'Fehler beim Aktualisieren der Einstellungen');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Snackbar schließen
  const handleCloseSnackbar = () => {
    setSaveSuccess(false);
  };
  
  return (
    <Box sx={{ flexGrow: 1, pb: 4 }}>
      {/* Seitenkopf */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Einstellungen
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Passen Sie Ihre Bar Management App an Ihre Bedürfnisse an
        </Typography>
      </Box>
      
      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<PersonIcon />} label="Profil" />
          <Tab icon={<BusinessIcon />} label="Geschäft" />
          <Tab icon={<BrushIcon />} label="Anzeige" />
          <Tab icon={<NotificationsIcon />} label="Benachrichtigungen" />
          <Tab icon={<SecurityIcon />} label="Sicherheit" />
          <Tab icon={<StorageIcon />} label="System" />
        </Tabs>
      </Paper>
      
      {/* Tab-Inhalte */}
      <Paper sx={{ p: 3 }}>
        {/* Profil */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Profilsettings
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Benutzername"
                name="username"
                value={settings.username}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="E-Mail"
                name="email"
                value={settings.email}
                disabled={true}
                type="email"
                helperText="Die E-Mail-Adresse kann nicht geändert werden"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Passwort ändern
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Lassen Sie diese Felder leer, wenn Sie Ihr Passwort nicht ändern möchten.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Aktuelles Passwort"
                name="currentPassword"
                value={settings.currentPassword}
                onChange={handleChange}
                type="password"
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Neues Passwort"
                name="password"
                value={settings.password}
                onChange={handleChange}
                type="password"
                disabled={isLoading}
                helperText="Mindestens 6 Zeichen"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Passwort bestätigen"
                name="confirmPassword"
                value={settings.confirmPassword}
                onChange={handleChange}
                type="password"
                disabled={isLoading}
              />
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Geschäft */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Geschäftseinstellungen
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name der Bar"
                name="businessName"
                value={settings.businessName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adresse"
                name="address"
                value={settings.address}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefon"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Website"
                name="website"
                value={settings.website}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Steuer-ID"
                name="taxId"
                value={settings.taxId}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Anzeige */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Anzeigeeinstellungen
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <List>
            <ListItem>
              <ListItemText 
                primary="Dunkler Modus" 
                secondary="Umschalten zwischen hellem und dunklem Farbschema"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  name="darkMode"
                  checked={settings.darkMode}
                  onChange={handleChange}
                  color="primary"
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            
            <ListItem>
              <ListItemText 
                primary="Schriftgröße" 
                secondary="Passen Sie die Größe der Schrift an"
              />
              <ListItemSecondaryAction sx={{ minWidth: '120px' }}>
                <FormControl fullWidth size="small">
                  <Select
                    name="fontSize"
                    value={settings.fontSize}
                    onChange={handleChange}
                  >
                    <MenuItem value="small">Klein</MenuItem>
                    <MenuItem value="medium">Mittel</MenuItem>
                    <MenuItem value="large">Groß</MenuItem>
                  </Select>
                </FormControl>
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            
            <ListItem>
              <ListItemText 
                primary="Sprache" 
                secondary="Ändern Sie die Sprache der Benutzeroberfläche"
              />
              <ListItemSecondaryAction sx={{ minWidth: '120px' }}>
                <FormControl fullWidth size="small">
                  <Select
                    name="language"
                    value={settings.language}
                    onChange={handleChange}
                  >
                    <MenuItem value="de">Deutsch</MenuItem>
                    <MenuItem value="en">Englisch</MenuItem>
                  </Select>
                </FormControl>
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            
            <ListItem>
              <ListItemText 
                primary="Währung" 
                secondary="Währung für alle Finanzberechnungen"
              />
              <ListItemSecondaryAction sx={{ minWidth: '120px' }}>
                <FormControl fullWidth size="small">
                  <Select
                    name="currency"
                    value={settings.currency}
                    onChange={handleChange}
                  >
                    <MenuItem value="EUR">Euro (€)</MenuItem>
                    <MenuItem value="USD">Dollar ($)</MenuItem>
                    <MenuItem value="GBP">Pfund (£)</MenuItem>
                  </Select>
                </FormControl>
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </TabPanel>
        
        {/* Benachrichtigungen */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Benachrichtigungseinstellungen
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <List>
            <ListItem>
              <ListItemText 
                primary="E-Mail-Benachrichtigungen" 
                secondary="Allgemeine E-Mail-Benachrichtigungen aktivieren"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  name="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={handleChange}
                  color="primary"
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            
            <ListItem>
              <ListItemText 
                primary="Bestandswarnungen" 
                secondary="Warnungen bei niedrigem Bestand erhalten"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  name="stockAlerts"
                  checked={settings.stockAlerts}
                  onChange={handleChange}
                  color="primary"
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            
            <ListItem>
              <ListItemText 
                primary="Finanzberichte" 
                secondary="Regelmäßige Finanzberichte per E-Mail erhalten"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  name="financialReports"
                  checked={settings.financialReports}
                  onChange={handleChange}
                  color="primary"
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            
            <ListItem>
              <ListItemText 
                primary="Marketing E-Mails" 
                secondary="Updates und Angebote erhalten"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  name="marketingEmails"
                  checked={settings.marketingEmails}
                  onChange={handleChange}
                  color="primary"
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </TabPanel>
        
        {/* Sicherheit */}
        <TabPanel value={activeTab} index={4}>
          <Typography variant="h6" gutterBottom>
            Sicherheitseinstellungen
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Sicherheitseinstellungen helfen Ihnen, Ihre Daten zu schützen.
          </Alert>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Button 
                variant="outlined" 
                startIcon={<SecurityIcon />}
              >
                Zwei-Faktor-Authentifizierung aktivieren
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button 
                variant="outlined" 
                color="error"
              >
                Alle Sitzungen abmelden
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button 
                variant="outlined" 
              >
                Passwort zurücksetzen
              </Button>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* System */}
        <TabPanel value={activeTab} index={5}>
          <Typography variant="h6" gutterBottom>
            Systemeinstellungen
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <List>
            <ListItem>
              <ListItemText 
                primary="Automatische Datensicherung" 
                secondary="Regelmäßige Backups Ihrer Daten"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  name="dataBackup"
                  checked={settings.dataBackup}
                  onChange={handleChange}
                  color="primary"
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            
            {settings.dataBackup && (
              <>
                <ListItem>
                  <ListItemText 
                    primary="Backup-Häufigkeit" 
                    secondary="Wie oft sollen Backups erstellt werden"
                  />
                  <ListItemSecondaryAction sx={{ minWidth: '120px' }}>
                    <FormControl fullWidth size="small">
                      <Select
                        name="backupFrequency"
                        value={settings.backupFrequency}
                        onChange={handleChange}
                      >
                        <MenuItem value="daily">Täglich</MenuItem>
                        <MenuItem value="weekly">Wöchentlich</MenuItem>
                        <MenuItem value="monthly">Monatlich</MenuItem>
                      </Select>
                    </FormControl>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </>
            )}
            
            <ListItem>
              <ListItemText 
                primary="Automatische Updates" 
                secondary="Immer auf dem neuesten Stand bleiben"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  name="autoUpdate"
                  checked={settings.autoUpdate}
                  onChange={handleChange}
                  color="primary"
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            
            <ListItem>
              <ListItemText 
                primary="Anonyme Nutzungsstatistiken" 
                secondary="Hilft uns, die App zu verbessern"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  name="anonymousUsage"
                  checked={settings.anonymousUsage}
                  onChange={handleChange}
                  color="primary"
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
            
            <ListItem>
              <ListItemText 
                primary="Daten importieren/exportieren" 
                secondary="Sichern oder übertragen Sie Ihre Daten"
              />
              <ListItemSecondaryAction>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<CloudUploadIcon />}
                >
                  Import/Export
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </TabPanel>
        
        {/* Speichern-Button */}
        <Box mt={3} display="flex" justifyContent="flex-end">
          <Button 
            variant="contained" 
            color="primary"
            startIcon={isLoading ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Wird gespeichert...' : 'Einstellungen speichern'}
          </Button>
        </Box>
      </Paper>
      
      {/* Erfolgs-Snackbar */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          Einstellungen erfolgreich gespeichert!
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Tab-Panel-Komponente
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

export default Settings;