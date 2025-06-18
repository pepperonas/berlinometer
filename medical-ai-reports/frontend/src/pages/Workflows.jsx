import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Add as AddIcon,
} from '@mui/icons-material';

function Workflows() {
  const [searchTerm, setSearchTerm] = useState('');

  // Sample workflow data
  const workflows = [
    {
      id: 1,
      name: 'Radiology Report Generation',
      status: 'active',
      lastRun: '2024-01-15 14:30',
      nextRun: '2024-01-15 18:30',
      frequency: 'Every 4 hours',
    },
    {
      id: 2,
      name: 'Lab Results Analysis',
      status: 'paused',
      lastRun: '2024-01-15 10:00',
      nextRun: 'Paused',
      frequency: 'Daily',
    },
    {
      id: 3,
      name: 'Patient Summary Reports',
      status: 'active',
      lastRun: '2024-01-14 22:00',
      nextRun: '2024-01-15 22:00',
      frequency: 'Daily',
    },
    {
      id: 4,
      name: 'Emergency Department Reports',
      status: 'inactive',
      lastRun: '2024-01-10 08:00',
      nextRun: 'Not scheduled',
      frequency: 'On demand',
    },
  ];

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

  const filteredWorkflows = workflows.filter((workflow) =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Workflows
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Create New Workflow
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search workflows..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Workflow Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Frequency</TableCell>
              <TableCell>Last Run</TableCell>
              <TableCell>Next Run</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredWorkflows.map((workflow) => (
              <TableRow key={workflow.id}>
                <TableCell component="th" scope="row">
                  <Typography variant="body1">{workflow.name}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={workflow.status}
                    color={getStatusColor(workflow.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{workflow.frequency}</TableCell>
                <TableCell>{workflow.lastRun}</TableCell>
                <TableCell>{workflow.nextRun}</TableCell>
                <TableCell align="center">
                  {workflow.status === 'active' && (
                    <IconButton color="warning" size="small">
                      <PauseIcon />
                    </IconButton>
                  )}
                  {workflow.status === 'paused' && (
                    <IconButton color="success" size="small">
                      <PlayArrowIcon />
                    </IconButton>
                  )}
                  {workflow.status === 'inactive' && (
                    <IconButton color="success" size="small">
                      <PlayArrowIcon />
                    </IconButton>
                  )}
                  <IconButton color="error" size="small">
                    <StopIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredWorkflows.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No workflows found matching your search.
          </Typography>
        </Box>
      )}
    </Container>
  );
}

export default Workflows;