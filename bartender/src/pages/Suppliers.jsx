import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon
} from '@mui/icons-material';

import { suppliersApi } from '../services/api';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog-Status für Hinzufügen/Bearbeiten
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Lieferanten laden
  const loadSuppliers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await suppliersApi.getAll();
      setSuppliers(data);
    } catch (err) {
      console.error('Error loading suppliers:', err);
      setError('Fehler beim Laden der Lieferanten');
    } finally {
      setLoading(false);
    }
  };
  
  // Beim ersten Laden die Lieferanten laden
  useEffect(() => {
    loadSuppliers();
  }, []);
  
  // Seitenänderung
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Zeilenanzahl ändern
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Dialog für Hinzufügen öffnen
  const handleAddClick = () => {
    setCurrentSupplier({
      name: '',
      contact: '', // Im Frontend verwenden wir weiterhin contact (wird im handleSaveSupplier zu contactPerson gemappt)
      phone: '',
      email: '',
      address: '',
      notes: '',
    });
    setDialogOpen(true);
  };
  
  // Dialog für Bearbeiten öffnen
  const handleEditClick = (supplier) => {
    // Format für das Frontend vorbereiten
    const formattedSupplier = {
      ...supplier,
      id: supplier._id || supplier.id, // Sicherstellen dass die ID verfügbar ist
      contact: supplier.contactPerson || supplier.contact || '', // contactPerson vom Backend zu contact im Frontend mappen
      address: typeof supplier.address === 'string' 
        ? supplier.address 
        : supplier.address?.street || ''
    };
    setCurrentSupplier(formattedSupplier);
    setDialogOpen(true);
  };
  
  // Dialog schließen
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentSupplier(null);
  };
  
  // Lieferanten speichern
  const handleSaveSupplier = async () => {
    if (!currentSupplier) return;
    
    setSaving(true);
    
    try {
      // Formatieren der Daten für das Backend
      const supplierData = {
        name: currentSupplier.name,
        contactPerson: currentSupplier.contact, // Frontend -> Backend Mapping
        email: currentSupplier.email,
        phone: currentSupplier.phone,
        notes: currentSupplier.notes,
        // Adresse als einfachen String senden
        address: {
          street: currentSupplier.address
        },
        active: true
      };
      
      console.log('Sending to backend:', supplierData);
      
      if (currentSupplier.id) {
        // Bestehenden Lieferanten aktualisieren
        await suppliersApi.update(currentSupplier.id, supplierData);
      } else {
        // Neuen Lieferanten erstellen
        await suppliersApi.create(supplierData);
      }
      loadSuppliers();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving supplier:', err);
      setError('Fehler beim Speichern des Lieferanten: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };
  
  // Lieferanten löschen
  const handleDeleteSupplier = async (id) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diesen Lieferanten löschen möchten?')) {
      return;
    }
    
    setLoading(true);
    
    try {
      await suppliersApi.delete(id);
      loadSuppliers();
    } catch (err) {
      console.error('Error deleting supplier:', err);
      setError('Fehler beim Löschen des Lieferanten');
    } finally {
      setLoading(false);
    }
  };
  
  // Lieferanten filtern
  const filteredSuppliers = suppliers.filter(supplier => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      supplier.name?.toLowerCase().includes(searchLower) ||
      (supplier.contact?.toLowerCase().includes(searchLower) || supplier.contactPerson?.toLowerCase().includes(searchLower)) ||
      (supplier.email?.toLowerCase()?.includes(searchLower) || '') ||
      (supplier.phone?.toLowerCase()?.includes(searchLower) || '')
    );
  });
  
  // Paginierte Lieferantendaten
  const paginatedSuppliers = filteredSuppliers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  return (
    <Box sx={{ flexGrow: 1, pb: 4 }}>
      {/* Seitenkopf */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Lieferanten
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Verwalten Sie Ihre Lieferanten und Kontakte
          </Typography>
        </Box>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={loadSuppliers}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Aktualisieren
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddClick}
          >
            Lieferant hinzufügen
          </Button>
        </Box>
      </Box>
      
      {/* Suchleiste */}
      <Box mb={4}>
        <Paper sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Suchen..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Paper>
      </Box>
      
      {/* Fehlermeldung */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 4 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={loadSuppliers}
            >
              Erneut laden
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
      {/* Tabelle */}
      <Box>
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 640 }}>
            <Table stickyHeader aria-label="suppliers table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 180 }}>Name</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Kontaktperson</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Telefon</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>E-Mail</TableCell>
                  <TableCell sx={{ minWidth: 200 }}>Adresse</TableCell>
                  <TableCell align="right" sx={{ minWidth: 120 }}>Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && !suppliers.length ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 3 }}>
                      <Box display="flex" justifyContent="center">
                        <CircularProgress size={40} thickness={4} />
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : paginatedSuppliers.length > 0 ? (
                  paginatedSuppliers.map((supplier) => (
                    <TableRow key={supplier.id} hover>
                      <TableCell>
                        <Typography fontWeight="medium">{supplier.name}</Typography>
                        {supplier.notes && (
                          <Typography variant="caption" color="text.secondary">
                            {supplier.notes}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{supplier.contact || supplier.contactPerson}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          {supplier.phone || ''}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          {supplier.email || ''}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          {typeof supplier.address === 'string' 
                            ? supplier.address 
                            : supplier.address?.street 
                              ? `${supplier.address.street}${supplier.address.city ? ', ' + supplier.address.city : ''}`
                              : ''}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box>
                          <Tooltip title="Bearbeiten">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleEditClick(supplier)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Löschen">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteSupplier(supplier._id || supplier.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      {searchTerm ? (
                        <Typography color="text.secondary">
                          Keine Ergebnisse für "{searchTerm}"
                        </Typography>
                      ) : (
                        <Typography color="text.secondary">
                          Keine Lieferanten vorhanden
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredSuppliers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Zeilen pro Seite:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} von ${count}`}
          />
        </Paper>
      </Box>
      
      {/* Dialog für Hinzufügen/Bearbeiten */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {currentSupplier?.id ? 'Lieferant bearbeiten' : 'Neuen Lieferanten hinzufügen'}
        </DialogTitle>
        <DialogContent dividers>
          {currentSupplier && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Name"
                  fullWidth
                  value={currentSupplier.name}
                  onChange={(e) => setCurrentSupplier({...currentSupplier, name: e.target.value})}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Kontaktperson"
                  fullWidth
                  value={currentSupplier.contact}
                  onChange={(e) => setCurrentSupplier({...currentSupplier, contact: e.target.value})}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Telefon"
                  fullWidth
                  value={currentSupplier.phone}
                  onChange={(e) => setCurrentSupplier({...currentSupplier, phone: e.target.value})}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="E-Mail"
                  fullWidth
                  value={currentSupplier.email}
                  onChange={(e) => setCurrentSupplier({...currentSupplier, email: e.target.value})}
                  type="email"
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Adresse"
                  fullWidth
                  value={currentSupplier.address}
                  onChange={(e) => setCurrentSupplier({...currentSupplier, address: e.target.value})}
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notizen"
                  fullWidth
                  value={currentSupplier.notes}
                  onChange={(e) => setCurrentSupplier({...currentSupplier, notes: e.target.value})}
                  margin="normal"
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button 
            onClick={handleSaveSupplier} 
            variant="contained" 
            color="primary"
            disabled={saving || !currentSupplier?.name}
          >
            {saving ? 'Wird gespeichert...' : 'Speichern'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Suppliers;