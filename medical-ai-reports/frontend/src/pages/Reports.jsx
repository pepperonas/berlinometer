import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Button,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Tabs,
  Tab,
  Fab,
} from '@mui/material';
import {
  Search,
  FilterList,
  GetApp,
  Visibility,
  Share,
  Assessment,
  Person,
  LocalHospital,
  CheckCircle,
  Schedule,
  Warning,
  Error,
  Add,
  AutoAwesome,
} from '@mui/icons-material';
import ReportGenerator from '../components/ReportGenerator';

// Mock data for reports
const mockReports = [
  {
    id: 1,
    patient: 'Max Mustermann',
    patientId: 'P001',
    age: 45,
    gender: 'M',
    studyType: 'Röntgen Thorax',
    date: '2024-01-15',
    time: '14:30',
    doctor: 'Dr. Schmidt',
    status: 'Abgeschlossen',
    aiConfidence: 95,
    findings: 'Keine pathologischen Befunde erkennbar',
    priority: 'Normal',
    workflow: 'Röntgen Thorax Analyse',
  },
  {
    id: 2,
    patient: 'Anna Schmidt',
    patientId: 'P002',
    age: 32,
    gender: 'W',
    studyType: 'MRT Kopf',
    date: '2024-01-15',
    time: '10:15',
    doctor: 'Dr. Weber',
    status: 'In Bearbeitung',
    aiConfidence: 87,
    findings: 'Analyse läuft...',
    priority: 'Hoch',
    workflow: 'MRT Kopf Segmentierung',
  },
  {
    id: 3,
    patient: 'Peter Weber',
    patientId: 'P003',
    age: 58,
    gender: 'M',
    studyType: 'CT Abdomen',
    date: '2024-01-14',
    time: '16:45',
    doctor: 'Dr. Müller',
    status: 'Validierung',
    aiConfidence: 92,
    findings: 'Leichte Auffälligkeiten im Bereich der Leber - Validierung erforderlich',
    priority: 'Hoch',
    workflow: 'CT Abdomen Klassifikation',
  },
  {
    id: 4,
    patient: 'Lisa Müller',
    patientId: 'P004',
    age: 29,
    gender: 'W',
    studyType: 'Ultraschall Herz',
    date: '2024-01-14',
    time: '09:30',
    doctor: 'Dr. Klein',
    status: 'Abgeschlossen',
    aiConfidence: 89,
    findings: 'Normale Herzfunktion, keine Auffälligkeiten',
    priority: 'Normal',
    workflow: 'Ultraschall Herzfunktion',
  },
  {
    id: 5,
    patient: 'Thomas Wagner',
    patientId: 'P005',
    age: 67,
    gender: 'M',
    studyType: 'Röntgen Knie',
    date: '2024-01-13',
    time: '11:20',
    doctor: 'Dr. Fischer',
    status: 'Fehler',
    aiConfidence: 45,
    findings: 'Analyse aufgrund niedriger Bildqualität fehlgeschlagen',
    priority: 'Normal',
    workflow: 'Röntgen Gelenk Analyse',
  },
];

function Reports() {
  const [reports, setReports] = useState(mockReports);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openGenerator, setOpenGenerator] = useState(false);
  const [viewMode, setViewMode] = useState(0);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Abgeschlossen':
        return 'success';
      case 'In Bearbeitung':
        return 'primary';
      case 'Validierung':
        return 'warning';
      case 'Fehler':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Hoch':
        return '#d32f2f';
      case 'Mittel':
        return '#ed6c02';
      case 'Normal':
        return '#2e7d32';
      default:
        return '#1976d2';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Abgeschlossen':
        return <CheckCircle />;
      case 'In Bearbeitung':
        return <Schedule />;
      case 'Validierung':
        return <Warning />;
      case 'Fehler':
        return <Error />;
      default:
        return <Assessment />;
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.studyType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.doctor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || report.status === statusFilter;
    const matchesPriority = !priorityFilter || report.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedReport(null);
  };

  const handleDownloadReport = (reportId) => {
    // Simulate download
    console.log(`Downloading report ${reportId}`);
  };

  const handleShareReport = (reportId) => {
    // Simulate sharing
    console.log(`Sharing report ${reportId}`);
  };

  const handleReportGenerated = (newReport) => {
    setReports([newReport, ...reports]);
  };

  const CardView = () => (
    <Grid container spacing={3}>
      {filteredReports.map((report) => (
        <Grid item xs={12} md={6} lg={4} key={report.id}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Person />
                </Avatar>
                <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', alignItems: 'flex-end' }}>
                  <Chip
                    icon={getStatusIcon(report.status)}
                    label={report.status}
                    color={getStatusColor(report.status)}
                    size="small"
                  />
                  <Chip
                    label={report.priority}
                    sx={{ 
                      bgcolor: getPriorityColor(report.priority),
                      color: 'white',
                      fontSize: '0.75rem'
                    }}
                    size="small"
                  />
                </Box>
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                {report.patient}
              </Typography>

              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                ID: {report.patientId} • {report.age}J, {report.gender}
              </Typography>

              <Typography variant="body2" sx={{ mb: 2 }}>
                {report.studyType}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  KI-Vertrauen
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <LinearProgress
                    variant="determinate"
                    value={report.aiConfidence}
                    sx={{ flexGrow: 1, mr: 1 }}
                    color={report.aiConfidence > 90 ? 'success' : report.aiConfidence > 70 ? 'warning' : 'error'}
                  />
                  <Typography variant="caption">
                    {report.aiConfidence}%
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                {report.date} • {report.time}
              </Typography>

              <Typography variant="body2" color="textSecondary">
                Arzt: {report.doctor}
              </Typography>
            </CardContent>

            <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
              <Button
                size="small"
                startIcon={<Visibility />}
                onClick={() => handleViewReport(report)}
              >
                Anzeigen
              </Button>
              <Box>
                <IconButton
                  size="small"
                  onClick={() => handleDownloadReport(report.id)}
                  title="Herunterladen"
                >
                  <GetApp />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleShareReport(report.id)}
                  title="Teilen"
                >
                  <Share />
                </IconButton>
              </Box>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const TableView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Patient</TableCell>
            <TableCell>Studie</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Priorität</TableCell>
            <TableCell>KI-Vertrauen</TableCell>
            <TableCell>Datum</TableCell>
            <TableCell>Arzt</TableCell>
            <TableCell>Aktionen</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredReports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {report.patient}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {report.patientId} • {report.age}J, {report.gender}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>{report.studyType}</TableCell>
              <TableCell>
                <Chip
                  icon={getStatusIcon(report.status)}
                  label={report.status}
                  color={getStatusColor(report.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={report.priority}
                  sx={{ 
                    bgcolor: getPriorityColor(report.priority),
                    color: 'white',
                    fontSize: '0.75rem'
                  }}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 100 }}>
                  <LinearProgress
                    variant="determinate"
                    value={report.aiConfidence}
                    sx={{ flexGrow: 1, mr: 1 }}
                    color={report.aiConfidence > 90 ? 'success' : report.aiConfidence > 70 ? 'warning' : 'error'}
                  />
                  <Typography variant="caption">
                    {report.aiConfidence}%
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>{report.date}</TableCell>
              <TableCell>{report.doctor}</TableCell>
              <TableCell>
                <IconButton
                  size="small"
                  onClick={() => handleViewReport(report)}
                  title="Anzeigen"
                >
                  <Visibility />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDownloadReport(report.id)}
                  title="Herunterladen"
                >
                  <GetApp />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleShareReport(report.id)}
                  title="Teilen"
                >
                  <Share />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Medizinische Berichte
        </Typography>
        <Button
          variant="contained"
          startIcon={<AutoAwesome />}
          onClick={() => setOpenGenerator(true)}
          sx={{ 
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
          }}
        >
          KI-Bericht generieren
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Suchen"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="">Alle</MenuItem>
                <MenuItem value="Abgeschlossen">Abgeschlossen</MenuItem>
                <MenuItem value="In Bearbeitung">In Bearbeitung</MenuItem>
                <MenuItem value="Validierung">Validierung</MenuItem>
                <MenuItem value="Fehler">Fehler</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Priorität</InputLabel>
              <Select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                label="Priorität"
              >
                <MenuItem value="">Alle</MenuItem>
                <MenuItem value="Hoch">Hoch</MenuItem>
                <MenuItem value="Mittel">Mittel</MenuItem>
                <MenuItem value="Normal">Normal</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="textSecondary">
              {filteredReports.length} von {reports.length} Berichten
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* View Mode Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={viewMode} onChange={(e, newValue) => setViewMode(newValue)}>
          <Tab label="Kartenansicht" />
          <Tab label="Tabellenansicht" />
        </Tabs>
      </Box>

      {/* Content */}
      {viewMode === 0 ? <CardView /> : <TableView />}

      {/* Report Detail Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedReport && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Bericht Details - {selectedReport.patient}
                </Typography>
                <Chip
                  icon={getStatusIcon(selectedReport.status)}
                  label={selectedReport.status}
                  color={getStatusColor(selectedReport.status)}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Patienteninformationen
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Name:</strong> {selectedReport.patient}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>ID:</strong> {selectedReport.patientId}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Alter/Geschlecht:</strong> {selectedReport.age} Jahre, {selectedReport.gender === 'M' ? 'Männlich' : 'Weiblich'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Studieninformationen
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Typ:</strong> {selectedReport.studyType}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Datum/Zeit:</strong> {selectedReport.date} {selectedReport.time}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>Arzt:</strong> {selectedReport.doctor}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2 }}>
                    KI-Analyse
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Workflow:</strong> {selectedReport.workflow}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" sx={{ mr: 2 }}>
                        <strong>Vertrauen:</strong>
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={selectedReport.aiConfidence}
                        sx={{ flexGrow: 1, mr: 2 }}
                        color={selectedReport.aiConfidence > 90 ? 'success' : selectedReport.aiConfidence > 70 ? 'warning' : 'error'}
                      />
                      <Typography variant="body2">
                        {selectedReport.aiConfidence}%
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                    Befund
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body1">
                      {selectedReport.findings}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button
                startIcon={<GetApp />}
                onClick={() => handleDownloadReport(selectedReport.id)}
              >
                Herunterladen
              </Button>
              <Button
                startIcon={<Share />}
                onClick={() => handleShareReport(selectedReport.id)}
              >
                Teilen
              </Button>
              <Button onClick={handleCloseDialog}>Schließen</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Report Generator Dialog */}
      <ReportGenerator
        open={openGenerator}
        onClose={() => setOpenGenerator(false)}
        onReportGenerated={handleReportGenerated}
      />

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' },
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
        }}
        onClick={() => setOpenGenerator(true)}
      >
        <AutoAwesome />
      </Fab>
    </Box>
  );
}

export default Reports;