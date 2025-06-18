import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  LinearProgress,
  Alert,
  Box,
  Avatar,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
} from '@mui/material';
import {
  Assignment,
  AutoAwesome,
  CloudUpload,
  CheckCircle,
  Error,
} from '@mui/icons-material';

const workflows = [
  {
    id: 1,
    name: 'Röntgen Thorax Analyse',
    description: 'Automatische Erkennung von Lungenanomalien in Thorax-Röntgenbildern',
    type: 'Bildanalyse',
    accuracy: 94.2,
  },
  {
    id: 2,
    name: 'MRT Kopf Segmentierung',
    description: 'Segmentierung von Hirnstrukturen in MRT-Aufnahmen',
    type: 'Segmentierung',
    accuracy: 92.8,
  },
  {
    id: 3,
    name: 'CT Abdomen Klassifikation',
    description: 'Klassifikation von abdominalen Pathologien in CT-Scans',
    type: 'Klassifikation',
    accuracy: 89.5,
  },
  {
    id: 4,
    name: 'Ultraschall Herzfunktion',
    description: 'Bewertung der Herzfunktion basierend auf Ultraschallbildern',
    type: 'Funktionsanalyse',
    accuracy: 87.3,
  },
];

const steps = ['Patientendaten', 'Workflow auswählen', 'KI-Analyse', 'Bericht generiert'];

function ReportGenerator({ open, onClose, onReportGenerated }) {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    patientName: '',
    patientId: '',
    age: '',
    gender: '',
    studyType: '',
    doctor: '',
    selectedWorkflow: '',
    additionalNotes: '',
    examText: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [generatedReport, setGeneratedReport] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setError('');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type (medical images)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/dicom', 'application/dicom'];
      if (allowedTypes.includes(file.type) || file.name.toLowerCase().endsWith('.dcm')) {
        setSelectedFile(file);
        setError('');
      } else {
        setError('Bitte wählen Sie eine gültige Bilddatei (JPEG, PNG, DICOM)');
      }
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate patient data
      if (!formData.patientName || !formData.patientId || !formData.age || !formData.gender || !formData.doctor) {
        setError('Bitte füllen Sie alle Pflichtfelder aus');
        return;
      }
    } else if (activeStep === 1) {
      // Validate workflow selection
      if (!formData.selectedWorkflow || (!selectedFile && !formData.examText.trim())) {
        setError('Bitte wählen Sie einen Workflow und geben Sie einen Untersuchungstext ein oder laden Sie eine Bilddatei hoch');
        return;
      }
      // Start AI analysis
      generateReport();
      return;
    }
    
    setActiveStep((prevStep) => prevStep + 1);
    setError('');
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  const generateReport = async () => {
    setIsGenerating(true);
    setActiveStep(2);
    setProgress(0);

    try {
      // Simulate AI processing with progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      // Simulate API call to backend
      const formDataToSend = new FormData();
      if (selectedFile) {
        formDataToSend.append('file', selectedFile);
      }
      formDataToSend.append('patientData', JSON.stringify(formData));
      formDataToSend.append('workflowId', formData.selectedWorkflow);
      formDataToSend.append('examText', formData.examText);

      // Mock API response after 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      clearInterval(progressInterval);
      setProgress(100);

      const selectedWorkflowData = workflows.find(w => w.id === parseInt(formData.selectedWorkflow));
      
      // Generate mock report
      const mockReport = {
        id: Date.now(),
        patient: formData.patientName,
        patientId: formData.patientId,
        age: parseInt(formData.age),
        gender: formData.gender,
        studyType: selectedWorkflowData.name,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        doctor: formData.doctor,
        status: 'Abgeschlossen',
        aiConfidence: Math.floor(selectedWorkflowData.accuracy + Math.random() * 5),
        findings: generateMockFindings(selectedWorkflowData.type),
        priority: Math.random() > 0.7 ? 'Hoch' : 'Normal',
        workflow: selectedWorkflowData.name,
      };

      setGeneratedReport(mockReport);
      setActiveStep(3);
      
    } catch (err) {
      setError('Fehler bei der KI-Analyse: ' + err.message);
      setActiveStep(1);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockFindings = (type) => {
    const findings = {
      'Bildanalyse': [
        'Keine pathologischen Befunde erkennbar. Normale Lungenstruktur.',
        'Leichte Verschattung im rechten Unterlappen, weitere Beobachtung empfohlen.',
        'Verdacht auf geringfügige Pleuraergüsse beidseits.',
      ],
      'Segmentierung': [
        'Normale Hirnstrukturen ohne Auffälligkeiten segmentiert.',
        'Geringfügige Volumenreduktion im Hippocampus-Bereich.',
        'Alle wichtigen anatomischen Strukturen korrekt identifiziert.',
      ],
      'Klassifikation': [
        'Normale abdominale Strukturen ohne pathologische Befunde.',
        'Leichte Auffälligkeiten im Bereich der Leber - Validierung erforderlich.',
        'Verdacht auf kleine Zysten in der rechten Niere.',
      ],
      'Funktionsanalyse': [
        'Normale Herzfunktion, Ejektionsfraktion 65%.',
        'Leicht reduzierte systolische Funktion, EF 45%.',
        'Normale diastolische Parameter, keine Wandbewegungsstörungen.',
      ],
    };
    
    const typeFindings = findings[type] || findings['Bildanalyse'];
    return typeFindings[Math.floor(Math.random() * typeFindings.length)];
  };

  const handleSaveReport = () => {
    if (generatedReport && onReportGenerated) {
      onReportGenerated(generatedReport);
    }
    handleClose();
  };

  const handleClose = () => {
    setActiveStep(0);
    setFormData({
      patientName: '',
      patientId: '',
      age: '',
      gender: '',
      studyType: '',
      doctor: '',
      selectedWorkflow: '',
      additionalNotes: '',
      examText: '',
    });
    setSelectedFile(null);
    setIsGenerating(false);
    setProgress(0);
    setError('');
    setGeneratedReport(null);
    onClose();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Patientenname *"
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Patienten-ID *"
                value={formData.patientId}
                onChange={(e) => handleInputChange('patientId', e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Alter *"
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Geschlecht *</InputLabel>
                <Select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  label="Geschlecht *"
                >
                  <MenuItem value="M">Männlich</MenuItem>
                  <MenuItem value="W">Weiblich</MenuItem>
                  <MenuItem value="D">Divers</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Behandelnder Arzt *"
                value={formData.doctor}
                onChange={(e) => handleInputChange('doctor', e.target.value)}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Zusätzliche Notizen"
                multiline
                rows={3}
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                variant="outlined"
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                KI-Workflow auswählen
              </Typography>
              <Grid container spacing={2}>
                {workflows.map((workflow) => (
                  <Grid item xs={12} sm={6} key={workflow.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: formData.selectedWorkflow === workflow.id.toString() ? 2 : 1,
                        borderColor: formData.selectedWorkflow === workflow.id.toString() ? 'primary.main' : 'divider',
                        '&:hover': { borderColor: 'primary.main' },
                      }}
                      onClick={() => handleInputChange('selectedWorkflow', workflow.id.toString())}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                            <Assignment />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {workflow.name}
                            </Typography>
                            <Chip label={workflow.type} size="small" />
                          </Box>
                        </Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          {workflow.description}
                        </Typography>
                        <Typography variant="caption">
                          Genauigkeit: {workflow.accuracy}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                Untersuchungstext *
              </Typography>
              <TextField
                fullWidth
                label="Beschreibung der Untersuchung"
                multiline
                rows={4}
                value={formData.examText}
                onChange={(e) => handleInputChange('examText', e.target.value)}
                variant="outlined"
                placeholder="Beschreiben Sie die durchgeführte Untersuchung, Symptome, Befunde oder andere relevante Informationen..."
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Bilddatei hochladen (optional)
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                sx={{ mb: 2 }}
              >
                Datei auswählen
                <input
                  hidden
                  accept="image/*,.dcm"
                  type="file"
                  onChange={handleFileUpload}
                />
              </Button>
              {selectedFile && (
                <Typography variant="body2" color="success.main">
                  ✓ Datei ausgewählt: {selectedFile.name}
                </Typography>
              )}
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <AutoAwesome fontSize="large" />
            </Avatar>
            <Typography variant="h5" sx={{ mb: 2 }}>
              KI-Analyse läuft...
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
              Die künstliche Intelligenz analysiert Ihre Bilddaten mit dem ausgewählten Workflow.
            </Typography>
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
            </Box>
            <Typography variant="body2">
              {progress < 30 ? 'Bild wird verarbeitet...' :
               progress < 60 ? 'KI-Modell wird angewendet...' :
               progress < 90 ? 'Ergebnisse werden analysiert...' :
               'Bericht wird generiert...'}
            </Typography>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Avatar sx={{ bgcolor: 'success.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <CheckCircle fontSize="large" />
            </Avatar>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Bericht erfolgreich generiert!
            </Typography>
            {generatedReport && (
              <Card sx={{ mt: 3, textAlign: 'left' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Bericht-Vorschau
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Patient:</Typography>
                      <Typography variant="body1">{generatedReport.patient}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Workflow:</Typography>
                      <Typography variant="body1">{generatedReport.workflow}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">KI-Vertrauen:</Typography>
                      <Typography variant="body1">{generatedReport.aiConfidence}%</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Status:</Typography>
                      <Chip label={generatedReport.status} color="success" size="small" />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>Befund:</Typography>
                      <Typography variant="body1" sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        {generatedReport.findings}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            <AutoAwesome />
          </Avatar>
          KI-Bericht generieren
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {renderStepContent()}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isGenerating}>
          Abbrechen
        </Button>
        
        {activeStep > 0 && activeStep < 3 && (
          <Button onClick={handleBack} disabled={isGenerating}>
            Zurück
          </Button>
        )}
        
        {activeStep < 2 && (
          <Button 
            onClick={handleNext} 
            variant="contained"
            disabled={isGenerating}
          >
            {activeStep === 1 ? 'KI-Analyse starten' : 'Weiter'}
          </Button>
        )}
        
        {activeStep === 3 && (
          <Button 
            onClick={handleSaveReport} 
            variant="contained"
            startIcon={<CheckCircle />}
          >
            Bericht speichern
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default ReportGenerator;