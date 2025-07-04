import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Divider,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  ContentCopy as CopyIcon,
  CloudDownload as ExportIcon,
  CloudUpload as ImportIcon,
  Analytics as AnalyticsIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchWorkflows,
  createWorkflow,
  deleteWorkflow,
  cloneWorkflow,
  fetchWorkflowById,
  selectWorkflows,
  selectIsLoading,
  selectError,
  clearError
} from '../../store/processIntelligenceSlice';
import { 
  ProcessWorkflow, 
  CreateProcessWorkflowRequest,
  WORKFLOW_CATEGORIES,
  RISK_LEVELS
} from '../../types/process-intelligence.types';
import { WorkflowCanvas } from './WorkflowCanvas';
import { WorkflowProperties } from './WorkflowProperties';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`process-tabpanel-${index}`}
      aria-labelledby={`process-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

export const ProcessIntelligenceDashboard: React.FC = () => {
  const dispatch = useDispatch<any>();
  const workflows = useSelector(selectWorkflows);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  
  const [tabValue, setTabValue] = useState(0);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ProcessWorkflow | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<ProcessWorkflow | null>(null);
  const [showProperties, setShowProperties] = useState(true);
  
  // Form state for creating new workflow
  const [newWorkflow, setNewWorkflow] = useState<Partial<CreateProcessWorkflowRequest>>({
    name: '',
    description: '',
    category: 'data_processing',
    industry: 'generic',
    tags: [],
    settings: {
      timeoutMinutes: 60,
      maxRetries: 3,
      errorHandling: 'stop',
      logging: {
        level: 'info',
        includeData: false,
        retention: 30,
        destinations: ['console']
      },
      notifications: {
        channels: ['email'],
        events: ['start', 'complete', 'error'],
        templates: ['default']
      }
    }
  });

  useEffect(() => {
    dispatch(fetchWorkflows());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleCreateWorkflow = async () => {
    try {
      const result = await dispatch(createWorkflow(newWorkflow as CreateProcessWorkflowRequest)).unwrap();
      setSelectedWorkflow(result);
      setTabValue(1); // Switch to editor tab
      setCreateDialogOpen(false);
      
      // Reset form
      setNewWorkflow({
        name: '',
        description: '',
        category: 'data_processing',
        industry: 'generic',
        tags: [],
        settings: {
          timeoutMinutes: 60,
          maxRetries: 3,
          errorHandling: 'stop',
          logging: {
            level: 'info',
            includeData: false,
            retention: 30,
            destinations: ['console']
          },
          notifications: {
            channels: ['email'],
            events: ['start', 'complete', 'error'],
            templates: ['default']
          }
        }
      });
    } catch (error) {
      console.error('Failed to create workflow:', error);
    }
  };

  const handleEditWorkflow = async (workflow: ProcessWorkflow) => {
    await dispatch(fetchWorkflowById(workflow.id));
    setSelectedWorkflow(workflow);
    setTabValue(1);
  };

  const handleDeleteWorkflow = async () => {
    if (workflowToDelete) {
      await dispatch(deleteWorkflow(workflowToDelete.id));
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
      
      if (selectedWorkflow?.id === workflowToDelete.id) {
        setSelectedWorkflow(null);
        setTabValue(0);
      }
    }
  };

  const handleCloneWorkflow = async (workflow: ProcessWorkflow) => {
    await dispatch(cloneWorkflow({ id: workflow.id, name: `${workflow.name} (Copy)` }));
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'very_low': return 'success';
      case 'low': return 'info';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'very_high': return 'error';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'testing': return 'info';
      case 'draft': return 'default';
      case 'paused': return 'warning';
      case 'archived': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {isLoading && <LinearProgress />}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Workflow Library" />
          <Tab label="Visual Editor" disabled={!selectedWorkflow} />
          <Tab label="Analytics" />
          <Tab label="Templates" />
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" component="h1">
                Process Intelligence
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<ImportIcon />}
                >
                  Import
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  New Workflow
                </Button>
              </Box>
            </Box>

            <Grid container spacing={3}>
              {workflows.map((workflow: ProcessWorkflow) => (
                <Grid item xs={12} sm={6} md={4} key={workflow.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                          {workflow.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditWorkflow(workflow)}
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleCloneWorkflow(workflow)}
                          >
                            <CopyIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              setWorkflowToDelete(workflow);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {workflow.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        <Chip 
                          label={WORKFLOW_CATEGORIES[workflow.category]} 
                          size="small" 
                          variant="outlined" 
                        />
                        <Chip 
                          label={workflow.status} 
                          size="small" 
                          color={getStatusColor(workflow.status) as any}
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          {workflow.nodes.length} nodes, {workflow.connections.length} connections
                        </Typography>
                        <Chip 
                          label={RISK_LEVELS[workflow.analytics.riskAssessment.overallRisk]} 
                          size="small"
                          color={getRiskColor(workflow.analytics.riskAssessment.overallRisk) as any}
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {workflow.tags.slice(0, 3).map((tag) => (
                          <Chip key={tag} label={tag} size="small" variant="outlined" />
                        ))}
                        {workflow.tags.length > 3 && (
                          <Chip label={`+${workflow.tags.length - 3}`} size="small" variant="outlined" />
                        )}
                      </Box>
                    </CardContent>
                    
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditWorkflow(workflow)}
                          fullWidth
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<PlayIcon />}
                          fullWidth
                        >
                          Execute
                        </Button>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ height: '100%', display: 'flex' }}>
            <Box sx={{ flex: 1 }}>
              <WorkflowCanvas
                onSave={() => {
                  // Handle save workflow
                }}
                onExecute={() => {
                  // Handle execute workflow
                }}
                onStop={() => {
                  // Handle stop execution
                }}
              />
            </Box>
            
            {showProperties && (
              <Box sx={{ width: 350, borderLeft: 1, borderColor: 'divider' }}>
                <WorkflowProperties
                  workflow={selectedWorkflow}
                  onClose={() => setShowProperties(false)}
                />
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Analytics Dashboard
            </Typography>
            <Typography color="text.secondary">
              Workflow analytics and performance metrics will be displayed here.
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Workflow Templates
            </Typography>
            <Typography color="text.secondary">
              Pre-built workflow templates for common business processes.
            </Typography>
          </Box>
        </TabPanel>
      </Box>

      {/* Create Workflow Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Workflow</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Workflow Name"
              value={newWorkflow.name}
              onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={newWorkflow.description}
              onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={newWorkflow.category}
                onChange={(e) => setNewWorkflow(prev => ({ ...prev, category: e.target.value as any }))}
                label="Category"
              >
                {Object.entries(WORKFLOW_CATEGORIES).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Industry</InputLabel>
              <Select
                value={newWorkflow.industry}
                onChange={(e) => setNewWorkflow(prev => ({ ...prev, industry: e.target.value as any }))}
                label="Industry"
              >
                <MenuItem value="generic">Generic</MenuItem>
                <MenuItem value="healthcare">Healthcare</MenuItem>
                <MenuItem value="finance">Finance</MenuItem>
                <MenuItem value="manufacturing">Manufacturing</MenuItem>
                <MenuItem value="retail">Retail</MenuItem>
                <MenuItem value="education">Education</MenuItem>
                <MenuItem value="government">Government</MenuItem>
                <MenuItem value="technology">Technology</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateWorkflow} 
            variant="contained"
            disabled={!newWorkflow.name || !newWorkflow.description}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Workflow</DialogTitle>
        <DialogContent>
          Are you sure you want to delete "{workflowToDelete?.name}"? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteWorkflow} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};