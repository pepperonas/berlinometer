import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Share as ShareIcon,
} from '@mui/icons-material';

function Reports() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Sample report data
  const reports = [
    {
      id: 1,
      title: 'Chest X-Ray Analysis',
      patient: 'John Doe',
      type: 'radiology',
      status: 'completed',
      date: '2024-01-15',
      doctor: 'Dr. Smith',
    },
    {
      id: 2,
      title: 'Blood Test Results',
      patient: 'Jane Smith',
      type: 'laboratory',
      status: 'pending',
      date: '2024-01-15',
      doctor: 'Dr. Johnson',
    },
    {
      id: 3,
      title: 'MRI Brain Scan',
      patient: 'Robert Brown',
      type: 'radiology',
      status: 'completed',
      date: '2024-01-14',
      doctor: 'Dr. Williams',
    },
    {
      id: 4,
      title: 'Cardiac Assessment',
      patient: 'Mary Davis',
      type: 'cardiology',
      status: 'review',
      date: '2024-01-14',
      doctor: 'Dr. Jones',
    },
    {
      id: 5,
      title: 'Pathology Report',
      patient: 'Michael Wilson',
      type: 'pathology',
      status: 'completed',
      date: '2024-01-13',
      doctor: 'Dr. Taylor',
    },
    {
      id: 6,
      title: 'Emergency Department Summary',
      patient: 'Sarah Lee',
      type: 'emergency',
      status: 'completed',
      date: '2024-01-13',
      doctor: 'Dr. Anderson',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'review':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'radiology':
        return '#90caf9';
      case 'laboratory':
        return '#a5d6a7';
      case 'cardiology':
        return '#f48fb1';
      case 'pathology':
        return '#ffcc80';
      case 'emergency':
        return '#ef5350';
      default:
        return '#bdbdbd';
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.doctor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || report.type === filterType;
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Reports
      </Typography>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search reports, patients, or doctors..."
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
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={filterType}
                label="Type"
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="radiology">Radiology</MenuItem>
                <MenuItem value="laboratory">Laboratory</MenuItem>
                <MenuItem value="cardiology">Cardiology</MenuItem>
                <MenuItem value="pathology">Pathology</MenuItem>
                <MenuItem value="emergency">Emergency</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="review">Under Review</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Reports Grid */}
      <Grid container spacing={3}>
        {filteredReports.map((report) => (
          <Grid item xs={12} sm={6} md={4} key={report.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Chip
                    label={report.type}
                    size="small"
                    sx={{
                      backgroundColor: getTypeColor(report.type),
                      color: 'white',
                    }}
                  />
                  <Chip
                    label={report.status}
                    size="small"
                    color={getStatusColor(report.status)}
                  />
                </Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  {report.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Patient: {report.patient}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Doctor: {report.doctor}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Date: {report.date}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton size="small" color="primary">
                  <VisibilityIcon />
                </IconButton>
                <IconButton size="small" color="primary">
                  <DownloadIcon />
                </IconButton>
                <IconButton size="small" color="primary">
                  <ShareIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredReports.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No reports found matching your criteria.
          </Typography>
        </Box>
      )}
    </Container>
  );
}

export default Reports;