import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Menu,
  MenuItem as MenuItemComponent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  GetApp as ExportIcon,
  Upload as ImportIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridActionsCellItem, GridRowParams } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { 
  ProcessingActivity, 
  ProcessingActivityFilter, 
  ProcessingActivityStatus,
  LegalBasis,
  LEGAL_BASIS_LABELS 
} from '../../types/processing-activity.types';

// Mock data - in real app this would come from API/store
const mockActivities: ProcessingActivity[] = [
  {
    id: 1,
    organizationId: 1,
    name: 'Kundendatenverarbeitung',
    purpose: 'Vertragsabwicklung und Kundenbetreuung',
    legalBasis: 'contract',
    dataCategories: ['Stammdaten', 'Kontaktdaten', 'Vertragsdaten'],
    dataSubjects: ['Kunden'],
    recipients: ['Interne Mitarbeiter', 'IT-Dienstleister'],
    thirdCountryTransfers: false,
    retentionPeriod: '10 Jahre nach Vertragsende',
    isJointProcessing: false,
    tomIds: [1, 2, 3],
    status: 'active',
    createdBy: 1,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 2,
    organizationId: 1,
    name: 'Bewerberdatenverarbeitung',
    purpose: 'Recruiting und Personalauswahl',
    legalBasis: 'legitimate_interests',
    dataCategories: ['Stammdaten', 'Kontaktdaten', 'Bewerbungsunterlagen'],
    dataSubjects: ['Bewerber'],
    recipients: ['HR-Team', 'Fachabteilungen'],
    thirdCountryTransfers: false,
    retentionPeriod: '6 Monate nach Absage',
    isJointProcessing: false,
    tomIds: [1, 4],
    status: 'active',
    createdBy: 1,
    createdAt: '2024-01-10T14:20:00Z',
    updatedAt: '2024-01-10T14:20:00Z',
  },
];

export const ProcessingActivityList: React.FC = () => {
  const navigate = useNavigate();
  const [activities] = useState<ProcessingActivity[]>(mockActivities);
  const [filteredActivities, setFilteredActivities] = useState<ProcessingActivity[]>(mockActivities);
  const [filters, setFilters] = useState<ProcessingActivityFilter>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ProcessingActivity | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    // Apply filters
    let filtered = activities;

    if (filters.search) {
      filtered = filtered.filter(activity =>
        activity.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
        activity.purpose.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(activity => activity.status === filters.status);
    }

    if (filters.legalBasis) {
      filtered = filtered.filter(activity => activity.legalBasis === filters.legalBasis);
    }

    if (filters.thirdCountryTransfers !== undefined) {
      filtered = filtered.filter(activity => activity.thirdCountryTransfers === filters.thirdCountryTransfers);
    }

    setFilteredActivities(filtered);
  }, [activities, filters]);

  const handleFilterChange = (key: keyof ProcessingActivityFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const handleView = (id: number) => {
    navigate(`/processing-activities/${id}`);
  };

  const handleEdit = (id: number) => {
    navigate(`/processing-activities/${id}/edit`);
  };

  const handleDelete = (activity: ProcessingActivity) => {
    setSelectedActivity(activity);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedActivity) {
      console.log('Delete activity:', selectedActivity.id);
      // In real app: dispatch delete action
      setDeleteDialogOpen(false);
      setSelectedActivity(null);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const getStatusColor = (status: ProcessingActivityStatus) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: ProcessingActivityStatus) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'inactive': return 'Inaktiv';
      case 'draft': return 'Entwurf';
      default: return status;
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Bezeichnung',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'purpose',
      headerName: 'Zweck',
      flex: 1,
      minWidth: 250,
    },
    {
      field: 'legalBasis',
      headerName: 'Rechtsgrundlage',
      width: 200,
      renderCell: (params) => LEGAL_BASIS_LABELS[params.value as LegalBasis],
    },
    {
      field: 'dataSubjects',
      headerName: 'Betroffene',
      width: 150,
      renderCell: (params) => (
        <Tooltip title={params.value.join(', ')}>
          <Chip
            label={`${params.value.length} Kategorien`}
            size="small"
            variant="outlined"
          />
        </Tooltip>
      ),
    },
    {
      field: 'thirdCountryTransfers',
      headerName: 'Drittland',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Ja' : 'Nein'}
          color={params.value ? 'warning' : 'default'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={getStatusLabel(params.value)}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Aktionen',
      width: 120,
      getActions: (params: GridRowParams) => [
        <GridActionsCellItem
          icon={<ViewIcon />}
          label="Ansehen"
          onClick={() => handleView(params.id as number)}
        />,
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Bearbeiten"
          onClick={() => handleEdit(params.id as number)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Löschen"
          onClick={() => handleDelete(params.row)}
        />,
      ],
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Verzeichnis von Verarbeitungstätigkeiten
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Verwalten Sie alle Verarbeitungstätigkeiten gemäß Art. 30 DSGVO
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/processing-activities/new')}
          >
            Neue Tätigkeit
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Suchen"
                placeholder="Name oder Zweck..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  label="Status"
                >
                  <MenuItem value="">Alle</MenuItem>
                  <MenuItem value="active">Aktiv</MenuItem>
                  <MenuItem value="inactive">Inaktiv</MenuItem>
                  <MenuItem value="draft">Entwurf</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Rechtsgrundlage</InputLabel>
                <Select
                  value={filters.legalBasis || ''}
                  onChange={(e) => handleFilterChange('legalBasis', e.target.value || undefined)}
                  label="Rechtsgrundlage"
                >
                  <MenuItem value="">Alle</MenuItem>
                  {Object.entries(LEGAL_BASIS_LABELS).map(([key, label]) => (
                    <MenuItem key={key} value={key}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Drittland</InputLabel>
                <Select
                  value={filters.thirdCountryTransfers === undefined ? '' : String(filters.thirdCountryTransfers)}
                  onChange={(e) => handleFilterChange('thirdCountryTransfers', 
                    e.target.value === '' ? undefined : e.target.value === 'true'
                  )}
                  label="Drittland"
                >
                  <MenuItem value="">Alle</MenuItem>
                  <MenuItem value="true">Ja</MenuItem>
                  <MenuItem value="false">Nein</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={clearFilters}
                startIcon={<FilterIcon />}
              >
                Filter löschen
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <DataGrid
            rows={filteredActivities}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            autoHeight
            sx={{ border: 'none' }}
          />
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItemComponent onClick={handleMenuClose}>
          <ExportIcon sx={{ mr: 1 }} />
          VVT exportieren
        </MenuItemComponent>
        <MenuItemComponent onClick={handleMenuClose}>
          <ImportIcon sx={{ mr: 1 }} />
          Daten importieren
        </MenuItemComponent>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Verarbeitungstätigkeit löschen</DialogTitle>
        <DialogContent>
          <Typography>
            Sind Sie sicher, dass Sie die Verarbeitungstätigkeit "{selectedActivity?.name}" 
            löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={confirmDelete} variant="contained" color="error">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mobile FAB */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => navigate('/processing-activities/new')}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' },
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};