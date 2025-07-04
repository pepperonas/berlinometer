import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Button,
  Divider,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectCurrentWorkflow,
  selectSelectedNode,
  selectSelectedConnection,
  selectSelectedNodeId,
  selectSelectedConnectionId
} from '../../store/processIntelligenceSlice';
import { 
  ProcessWorkflow, 
  ProcessNode, 
  ProcessConnection,
  PROCESS_NODE_TYPES,
  WORKFLOW_CATEGORIES,
  RISK_LEVELS 
} from '../../types/process-intelligence.types';

interface WorkflowPropertiesProps {
  workflow: ProcessWorkflow | null;
  onClose: () => void;
}

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
      style={{ height: value === index ? 'auto' : 0, overflow: 'hidden' }}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export const WorkflowProperties: React.FC<WorkflowPropertiesProps> = ({
  workflow,
  onClose
}) => {
  const dispatch = useDispatch();
  const selectedNode = useSelector(selectSelectedNode);
  const selectedConnection = useSelector(selectSelectedConnection);
  const selectedNodeId = useSelector(selectSelectedNodeId);
  const selectedConnectionId = useSelector(selectSelectedConnectionId);
  
  const [tabValue, setTabValue] = useState(0);

  const getTabContent = () => {
    if (selectedNode) {
      return renderNodeProperties(selectedNode);
    } else if (selectedConnection) {
      return renderConnectionProperties(selectedConnection);
    } else {
      return renderWorkflowProperties();
    }
  };

  const renderWorkflowProperties = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Workflow Properties
      </Typography>
      
      {workflow && (
        <Box>
          <TextField
            fullWidth
            label="Name"
            value={workflow.name}
            margin="normal"
            size="small"
          />
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={workflow.description}
            margin="normal"
            size="small"
          />
          
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel>Category</InputLabel>
            <Select value={workflow.category} label="Category">
              {Object.entries(WORKFLOW_CATEGORIES).map(([key, label]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel>Status</InputLabel>
            <Select value={workflow.status} label="Status">
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="testing">Testing</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="paused">Paused</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Statistics
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Nodes" secondary={workflow.nodes.length} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Connections" secondary={workflow.connections.length} />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Risk Level" 
                  secondary={
                    <Chip 
                      label={RISK_LEVELS[workflow.analytics.riskAssessment.overallRisk]} 
                      size="small"
                      color={
                        workflow.analytics.riskAssessment.overallRisk === 'high' || 
                        workflow.analytics.riskAssessment.overallRisk === 'very_high' 
                          ? 'error' : 'default'
                      }
                    />
                  } 
                />
              </ListItem>
            </List>
          </Box>
          
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Settings</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TextField
                fullWidth
                type="number"
                label="Timeout (minutes)"
                value={workflow.settings.timeoutMinutes}
                margin="normal"
                size="small"
              />
              
              <TextField
                fullWidth
                type="number"
                label="Max Retries"
                value={workflow.settings.maxRetries}
                margin="normal"
                size="small"
              />
              
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Error Handling</InputLabel>
                <Select value={workflow.settings.errorHandling} label="Error Handling">
                  <MenuItem value="stop">Stop</MenuItem>
                  <MenuItem value="continue">Continue</MenuItem>
                  <MenuItem value="retry">Retry</MenuItem>
                  <MenuItem value="escalate">Escalate</MenuItem>
                </Select>
              </FormControl>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}
    </Box>
  );

  const renderNodeProperties = (node: ProcessNode) => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Node Properties
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Chip 
          label={PROCESS_NODE_TYPES[node.type]} 
          size="small" 
          color="primary" 
          sx={{ mr: 1 }}
        />
        <Chip 
          label={node.data.priority} 
          size="small" 
          color={node.data.priority === 'high' || node.data.priority === 'critical' ? 'error' : 'default'}
        />
      </Box>
      
      <TextField
        fullWidth
        label="Label"
        value={node.label}
        margin="normal"
        size="small"
      />
      
      <TextField
        fullWidth
        multiline
        rows={2}
        label="Description"
        value={node.description || ''}
        margin="normal"
        size="small"
      />
      
      <FormControl fullWidth margin="normal" size="small">
        <InputLabel>Priority</InputLabel>
        <Select value={node.data.priority} label="Priority">
          <MenuItem value="low">Low</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="high">High</MenuItem>
          <MenuItem value="critical">Critical</MenuItem>
        </Select>
      </FormControl>
      
      {node.data.executionTime && (
        <TextField
          fullWidth
          type="number"
          label="Execution Time (seconds)"
          value={node.data.executionTime}
          margin="normal"
          size="small"
        />
      )}
      
      {node.data.assignee && (
        <TextField
          fullWidth
          label="Assignee"
          value={node.data.assignee}
          margin="normal"
          size="small"
        />
      )}
      
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Risk Assessment</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel>Risk Level</InputLabel>
            <Select value={node.metadata.riskLevel} label="Risk Level">
              {Object.entries(RISK_LEVELS).map(([key, label]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {node.metadata.complianceFlags.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Compliance Flags:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {node.metadata.complianceFlags.map((flag, index) => (
                  <Chip 
                    key={index}
                    label={flag.type}
                    size="small"
                    color={flag.severity === 'critical' ? 'error' : 'warning'}
                  />
                ))}
              </Box>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
      
      {node.type === 'task' && node.data.taskConfig && (
        <Accordion sx={{ mt: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Task Configuration</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel>Task Type</InputLabel>
              <Select value={node.data.taskConfig.taskType} label="Task Type">
                <MenuItem value="manual">Manual</MenuItem>
                <MenuItem value="system">System</MenuItem>
                <MenuItem value="user_input">User Input</MenuItem>
                <MenuItem value="review">Review</MenuItem>
                <MenuItem value="approval">Approval</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel>Automation Level</InputLabel>
              <Select value={node.data.taskConfig.automationLevel} label="Automation Level">
                <MenuItem value="manual">Manual</MenuItem>
                <MenuItem value="semi_automated">Semi-automated</MenuItem>
                <MenuItem value="fully_automated">Fully Automated</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              type="number"
              label="Estimated Duration (minutes)"
              value={node.data.taskConfig.estimatedDuration}
              margin="normal"
              size="small"
            />
          </AccordionDetails>
        </Accordion>
      )}
      
      {node.type === 'integration' && node.data.integrationConfig && (
        <Accordion sx={{ mt: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Integration Configuration</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel>System Type</InputLabel>
              <Select value={node.data.integrationConfig.systemType} label="System Type">
                <MenuItem value="database">Database</MenuItem>
                <MenuItem value="api">API</MenuItem>
                <MenuItem value="file_system">File System</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="cloud_service">Cloud Service</MenuItem>
                <MenuItem value="legacy_system">Legacy System</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Endpoint"
              value={node.data.integrationConfig.endpoint}
              margin="normal"
              size="small"
            />
            
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel>Method</InputLabel>
              <Select value={node.data.integrationConfig.method} label="Method">
                <MenuItem value="GET">GET</MenuItem>
                <MenuItem value="POST">POST</MenuItem>
                <MenuItem value="PUT">PUT</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
                <MenuItem value="PATCH">PATCH</MenuItem>
              </Select>
            </FormControl>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );

  const renderConnectionProperties = (connection: ProcessConnection) => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Connection Properties
      </Typography>
      
      <Chip 
        label={connection.type.replace('_', ' ')} 
        size="small" 
        color="primary" 
        sx={{ mb: 2 }}
      />
      
      <TextField
        fullWidth
        label="Label"
        value={connection.label || ''}
        margin="normal"
        size="small"
      />
      
      <FormControl fullWidth margin="normal" size="small">
        <InputLabel>Connection Type</InputLabel>
        <Select value={connection.type} label="Connection Type">
          <MenuItem value="sequence">Sequence</MenuItem>
          <MenuItem value="conditional">Conditional</MenuItem>
          <MenuItem value="data_flow">Data Flow</MenuItem>
          <MenuItem value="message_flow">Message Flow</MenuItem>
          <MenuItem value="association">Association</MenuItem>
        </Select>
      </FormControl>
      
      {connection.type === 'conditional' && (
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Conditions</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary">
              Configure the conditions that determine when this connection is taken.
            </Typography>
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              size="small"
              sx={{ mt: 1 }}
            >
              Add Condition
            </Button>
          </AccordionDetails>
        </Accordion>
      )}
      
      {connection.type === 'data_flow' && connection.dataFlow && (
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Data Flow</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel>Data Volume</InputLabel>
              <Select value={connection.dataFlow.volume} label="Data Volume">
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="very_high">Very High</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel>Data Sensitivity</InputLabel>
              <Select value={connection.dataFlow.sensitivity} label="Data Sensitivity">
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="internal">Internal</MenuItem>
                <MenuItem value="confidential">Confidential</MenuItem>
                <MenuItem value="restricted">Restricted</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Data Types:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {connection.dataFlow.dataTypes.map((type, index) => (
                  <Chip key={index} label={type} size="small" />
                ))}
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6">
          Properties
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {getTabContent()}
      </Box>
      
      {(selectedNodeId || selectedConnectionId) && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button
            variant="contained"
            size="small"
            fullWidth
            sx={{ mb: 1 }}
          >
            Apply Changes
          </Button>
          <Button
            variant="outlined"
            size="small"
            fullWidth
            color="error"
          >
            Delete
          </Button>
        </Box>
      )}
    </Paper>
  );
};