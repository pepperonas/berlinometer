import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  Gavel as GavelIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ProcessTemplate,
  CreateTemplateRequest,
  ProcessStep,
  SecurityControl,
  ComplianceRequirement,
  FieldTemplate,
  TemplateCategory,
  Industry,
  DataMapping,
  RiskAssessment,
  TEMPLATE_CATEGORIES,
  INDUSTRIES,
  SECURITY_FRAMEWORKS
} from '../../types/template.types';
import { createTemplate, updateTemplate } from '../../store/templateSlice';
import { AppDispatch } from '../../store';

interface TemplateDesignerProps {
  template?: ProcessTemplate;
  onSave?: (template: ProcessTemplate) => void;
  onCancel?: () => void;
}

const steps = [
  'Grundlagen',
  'Prozessschritte',
  'Sicherheitskontrollen',
  'Compliance',
  'Risikobewertung',
  'Vorschau'
];

export const TemplateDesigner: React.FC<TemplateDesignerProps> = ({
  template,
  onSave,
  onCancel
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: any) => state.templates);
  
  const [activeStep, setActiveStep] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  
  // Form state - use full types internally, convert to CreateTemplateRequest when saving
  interface TemplateFormData {
    name: string;
    description: string;
    category: TemplateCategory;
    industry: Industry;
    isPublic: boolean;
    processSteps: ProcessStep[];
    dataMapping: DataMapping;
    securityControls: SecurityControl[];
    complianceRequirements: ComplianceRequirement[];
    riskAssessment: RiskAssessment;
    tags: string[];
  }
  
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    category: 'data_processing',
    industry: 'generic',
    isPublic: false,
    processSteps: [],
    dataMapping: {
      dataCategories: [],
      dataFlow: [],
      retentionRules: [],
      thirdPartySharing: []
    },
    securityControls: [],
    complianceRequirements: [],
    riskAssessment: {
      id: `risk_${Date.now()}`,
      methodology: 'standard',
      aiEnabled: true,
      dataTypes: [],
      processingActivities: [],
      technicalMeasures: [],
      organizationalMeasures: [],
      overallRisk: 'medium',
      riskScore: 50,
      aiRecommendations: [],
      requiredMeasures: []
    },
    tags: []
  });
  
  const [currentTag, setCurrentTag] = useState('');
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [securityDialogOpen, setSecurityDialogOpen] = useState(false);
  const [complianceDialogOpen, setComplianceDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<ProcessStep | null>(null);
  const [editingControl, setEditingControl] = useState<SecurityControl | null>(null);
  const [editingRequirement, setEditingRequirement] = useState<ComplianceRequirement | null>(null);

  // Initialize form data from template
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        category: template.category,
        industry: template.industry,
        isPublic: template.isPublic,
        processSteps: template.processSteps,
        dataMapping: template.dataMapping,
        securityControls: template.securityControls,
        complianceRequirements: template.complianceRequirements,
        riskAssessment: template.riskAssessment,
        tags: template.tags
      });
    }
  }, [template]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSave = async () => {
    try {
      // Convert to CreateTemplateRequest by removing ids
      const requestData: CreateTemplateRequest = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        industry: formData.industry,
        isPublic: formData.isPublic,
        processSteps: formData.processSteps.map(({ id, ...step }) => step),
        dataMapping: formData.dataMapping,
        securityControls: formData.securityControls.map(({ id, ...control }) => control),
        complianceRequirements: formData.complianceRequirements.map(({ id, ...req }) => req),
        riskAssessment: (() => {
          const { id, ...assessment } = formData.riskAssessment;
          return assessment;
        })(),
        tags: formData.tags
      };
      
      if (template) {
        const result = await dispatch(updateTemplate({ 
          id: template.id, 
          template: requestData 
        })).unwrap();
        onSave?.(result);
      } else {
        const result = await dispatch(createTemplate(requestData)).unwrap();
        onSave?.(result);
      }
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags?.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addProcessStep = (step: Omit<ProcessStep, 'id'>) => {
    const newStep: ProcessStep = {
      ...step,
      id: `step_${Date.now()}`
    };
    
    setFormData(prev => ({
      ...prev,
      processSteps: [...prev.processSteps, newStep]
    }));
    setStepDialogOpen(false);
    setEditingStep(null);
  };

  const updateProcessStep = (stepId: string, updatedStep: ProcessStep) => {
    setFormData(prev => ({
      ...prev,
      processSteps: prev.processSteps.map(step => 
        step.id === stepId ? updatedStep : step
      )
    }));
    setStepDialogOpen(false);
    setEditingStep(null);
  };

  const removeProcessStep = (stepId: string) => {
    setFormData(prev => ({
      ...prev,
      processSteps: prev.processSteps.filter(step => step.id !== stepId)
    }));
  };

  const addSecurityControl = (control: Omit<SecurityControl, 'id'>) => {
    const newControl: SecurityControl = {
      ...control,
      id: `ctrl_${Date.now()}`
    };
    
    setFormData(prev => ({
      ...prev,
      securityControls: [...prev.securityControls, newControl]
    }));
    setSecurityDialogOpen(false);
    setEditingControl(null);
  };

  const renderBasicInfo = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Template Grundlagen
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Template Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Beschreibung"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Kategorie</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                label="Kategorie"
              >
                {Object.entries(TEMPLATE_CATEGORIES).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Branche</InputLabel>
              <Select
                value={formData.industry}
                onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value as any }))}
                label="Branche"
              >
                {Object.entries(INDUSTRIES).map(([key, label]) => (
                  <MenuItem key={key} value={key}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPublic}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                />
              }
              label="Öffentlich verfügbar"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  placeholder="Tag hinzufügen"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button onClick={addTag} variant="outlined" size="small">
                  Hinzufügen
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => removeTag(tag)}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderProcessSteps = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Prozessschritte
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={() => setStepDialogOpen(true)}
            variant="contained"
          >
            Schritt hinzufügen
          </Button>
        </Box>
        
        {formData.processSteps.map((step, index) => (
          <Accordion key={step.id}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography>{index + 1}. {step.name}</Typography>
                {step.isRequired && <Chip label="Erforderlich" size="small" color="primary" />}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" display="block">
                    Verarbeitungszweck: {step.processingPurpose}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" display="block">
                    Rechtsgrundlage: {step.legalBasis}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => {
                        setEditingStep(step);
                        setStepDialogOpen(true);
                      }}
                    >
                      Bearbeiten
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => removeProcessStep(step.id)}
                    >
                      Löschen
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
        
        {formData.processSteps.length === 0 && (
          <Alert severity="info">
            Noch keine Prozessschritte definiert. Fügen Sie den ersten Schritt hinzu.
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderSecurityControls = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Sicherheitskontrollen
          </Typography>
          <Button
            startIcon={<SecurityIcon />}
            onClick={() => setSecurityDialogOpen(true)}
            variant="contained"
          >
            Kontrolle hinzufügen
          </Button>
        </Box>
        
        {formData.securityControls.map((control) => (
          <Accordion key={control.id}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography>{control.name}</Typography>
                <Chip 
                  label={SECURITY_FRAMEWORKS[control.framework]} 
                  size="small" 
                  variant="outlined" 
                />
                {control.isRequired && <Chip label="Erforderlich" size="small" color="error" />}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    {control.description}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" display="block">
                    Kontroll-ID: {control.controlId}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Reifegrad: {control.implementationLevel}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" display="block">
                    Risikoreduktion: {control.riskReduction}%
                  </Typography>
                  <Typography variant="caption" display="block">
                    Automatisiert: {control.automatedCheck ? 'Ja' : 'Nein'}
                  </Typography>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </CardContent>
    </Card>
  );

  const renderPreview = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Template Vorschau
        </Typography>
        
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Übersicht" />
          <Tab label="Prozess" />
          <Tab label="Sicherheit" />
          <Tab label="Compliance" />
        </Tabs>
        
        <Box sx={{ mt: 2 }}>
          {tabValue === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Name:</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>{formData.name}</Typography>
                
                <Typography variant="subtitle2">Kategorie:</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {formData.category ? TEMPLATE_CATEGORIES[formData.category] : '-'}
                </Typography>
                
                <Typography variant="subtitle2">Branche:</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {formData.industry ? INDUSTRIES[formData.industry] : '-'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Öffentlich:</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {formData.isPublic ? 'Ja' : 'Nein'}
                </Typography>
                
                <Typography variant="subtitle2">Tags:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                  {formData.tags.map(tag => (
                    <Chip key={tag} label={tag} size="small" />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Beschreibung:</Typography>
                <Typography variant="body2">{formData.description}</Typography>
              </Grid>
            </Grid>
          )}
          
          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Prozessschritte ({formData.processSteps.length})
              </Typography>
              {formData.processSteps.map((step, index) => (
                <Card key={step.id} variant="outlined" sx={{ mb: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle2">
                      {index + 1}. {step.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
          
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Sicherheitskontrollen ({formData.securityControls.length})
              </Typography>
              {formData.securityControls.map((control) => (
                <Card key={control.id} variant="outlined" sx={{ mb: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle2">{control.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {control.description}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
          
          {tabValue === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Compliance Anforderungen ({formData.complianceRequirements.length})
              </Typography>
              {formData.complianceRequirements.map((req) => (
                <Card key={req.id} variant="outlined" sx={{ mb: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle2">{req.requirement}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {req.description}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderProcessSteps();
      case 2:
        return renderSecurityControls();
      case 3:
        return <div>Compliance Requirements (Coming Soon)</div>;
      case 4:
        return <div>Risk Assessment (Coming Soon)</div>;
      case 5:
        return renderPreview();
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mb: 3 }}>
        {getStepContent(activeStep)}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Zurück
        </Button>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onCancel && (
            <Button onClick={onCancel}>
              Abbrechen
            </Button>
          )}
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={isLoading}
              startIcon={<SaveIcon />}
            >
              {template ? 'Aktualisieren' : 'Erstellen'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
            >
              Weiter
            </Button>
          )}
        </Box>
      </Box>

      {/* Process Step Dialog would be implemented here */}
      {/* Security Control Dialog would be implemented here */}
      {/* Compliance Requirement Dialog would be implemented here */}
    </Box>
  );
};