import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Avatar,
  Fab,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Edit,
  Delete,
  Add,
  Assignment,
  RadioButtonChecked,
  CheckCircle,
  Error,
  Schedule,
} from '@mui/icons-material';

// Mock data for workflows
const mockWorkflows = [
  {
    id: 1,
    name: 'Röntgen Thorax Analyse',
    description: 'Automatische Erkennung von Lungenanomalien in Thorax-Röntgenbildern',
    status: 'active',
    progress: 75,
    type: 'Bildanalyse',
    lastRun: '2024-01-15 14:30',
    totalRuns: 247,
    accuracy: 94.2,
  },
  {
    id: 2,
    name: 'MRT Kopf Segmentierung',
    description: 'Segmentierung von Hirnstrukturen in MRT-Aufnahmen',
    status: 'paused',
    progress: 45,
    type: 'Segmentierung',
    lastRun: '2024-01-14 16:45',
    totalRuns: 89,
    accuracy: 92.8,
  },
  {
    id: 3,
    name: 'CT Abdomen Klassifikation',
    description: 'Klassifikation von abdominalen Pathologien in CT-Scans',
    status: 'active',
    progress: 90,
    type: 'Klassifikation',
    lastRun: '2024-01-15 09:15',
    totalRuns: 156,
    accuracy: 89.5,
  },
  {
    id: 4,
    name: 'Ultraschall Herzfunktion',
    description: 'Bewertung der Herzfunktion basierend auf Ultraschallbildern',
    status: 'inactive',
    progress: 0,
    type: 'Funktionsanalyse',
    lastRun: '2024-01-10 11:20',
    totalRuns: 34,
    accuracy: 87.3,
  },
];

function Workflows() {
  const [workflows, setWorkflows] = useState(mockWorkflows);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'inactive':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <RadioButtonChecked />;
      case 'paused':
        return <Pause />;
      case 'inactive':
        return <Stop />;
      default:
        return <Schedule />;
    }
  };

  const handleStatusChange = (workflowId, newStatus) => {
    setWorkflows(workflows.map(w => 
      w.id === workflowId ? { ...w, status: newStatus } : w
    ));
  };

  const handleOpenDialog = (workflow = null) => {
    if (workflow) {
      setEditingWorkflow(workflow);
      setFormData({
        name: workflow.name,
        description: workflow.description,
        type: workflow.type,
      });
    } else {
      setEditingWorkflow(null);
      setFormData({
        name: '',
        description: '',
        type: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingWorkflow(null);
  };

  const handleFormChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSaveWorkflow = () => {
    if (editingWorkflow) {
      // Update existing workflow
      setWorkflows(workflows.map(w => 
        w.id === editingWorkflow.id 
          ? { ...w, ...formData }
          : w
      ));
    } else {
      // Create new workflow
      const newWorkflow = {
        id: Math.max(...workflows.map(w => w.id)) + 1,
        ...formData,
        status: 'inactive',
        progress: 0,
        lastRun: 'Noch nie ausgeführt',
        totalRuns: 0,
        accuracy: 0,
      };
      setWorkflows([...workflows, newWorkflow]);
    }
    handleCloseDialog();
  };

  const handleDeleteWorkflow = (workflowId) => {
    setWorkflows(workflows.filter(w => w.id !== workflowId));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          KI-Workflows
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Neuer Workflow
        </Button>
      </Box>

      <Grid container spacing={3}>
        {workflows.map((workflow) => (
          <Grid item xs={12} md={6} lg={4} key={workflow.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Assignment />
                  </Avatar>
                  <Chip
                    icon={getStatusIcon(workflow.status)}
                    label={workflow.status === 'active' ? 'Aktiv' : 
                           workflow.status === 'paused' ? 'Pausiert' : 'Inaktiv'}
                    color={getStatusColor(workflow.status)}
                    size="small"
                  />
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {workflow.name}
                </Typography>

                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {workflow.description}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Fortschritt
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <LinearProgress
                      variant="determinate"
                      value={workflow.progress}
                      sx={{ flexGrow: 1, mr: 1 }}
                    />
                    <Typography variant="caption">
                      {workflow.progress}%
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Typ
                    </Typography>
                    <Typography variant="body2">
                      {workflow.type}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Genauigkeit
                    </Typography>
                    <Typography variant="body2">
                      {workflow.accuracy}%
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Letzte Ausführung
                    </Typography>
                    <Typography variant="body2">
                      {workflow.lastRun}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Gesamt Läufe
                    </Typography>
                    <Typography variant="body2">
                      {workflow.totalRuns}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>

              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Box>
                  {workflow.status === 'active' ? (
                    <IconButton
                      color="warning"
                      onClick={() => handleStatusChange(workflow.id, 'paused')}
                      title="Pausieren"
                    >
                      <Pause />
                    </IconButton>
                  ) : (
                    <IconButton
                      color="success"
                      onClick={() => handleStatusChange(workflow.id, 'active')}
                      title="Starten"
                    >
                      <PlayArrow />
                    </IconButton>
                  )}
                  <IconButton
                    color="error"
                    onClick={() => handleStatusChange(workflow.id, 'inactive')}
                    title="Stoppen"
                  >
                    <Stop />
                  </IconButton>
                </Box>
                <Box>
                  <IconButton
                    onClick={() => handleOpenDialog(workflow)}
                    title="Bearbeiten"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteWorkflow(workflow.id)}
                    title="Löschen"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create/Edit Workflow Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingWorkflow ? 'Workflow bearbeiten' : 'Neuer Workflow'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Workflow Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Beschreibung"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={(e) => handleFormChange('description', e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth variant="outlined">
            <InputLabel>Typ</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) => handleFormChange('type', e.target.value)}
              label="Typ"
            >
              <MenuItem value="Bildanalyse">Bildanalyse</MenuItem>
              <MenuItem value="Segmentierung">Segmentierung</MenuItem>
              <MenuItem value="Klassifikation">Klassifikation</MenuItem>
              <MenuItem value="Funktionsanalyse">Funktionsanalyse</MenuItem>
              <MenuItem value="Vorhersage">Vorhersage</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button
            onClick={handleSaveWorkflow}
            variant="contained"
            disabled={!formData.name || !formData.description || !formData.type}
          >
            {editingWorkflow ? 'Aktualisieren' : 'Erstellen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Workflows;