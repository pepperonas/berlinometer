import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Autocomplete,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CreateProcessingActivityRequest,
  LegalBasis,
  LEGAL_BASIS_LABELS,
  DATA_CATEGORIES,
  DATA_SUBJECTS,
  RECIPIENTS,
} from '@/types/processing-activity.types';

const steps = [
  'Grunddaten',
  'Datenkategorien',
  'Rechtsgrundlage',
  'Empfänger & Transfer',
  'Löschfristen & TOM',
];

interface FormData extends CreateProcessingActivityRequest {}

export const ProcessingActivityForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [activeStep, setActiveStep] = useState(0);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      purpose: '',
      legalBasis: 'contract',
      dataCategories: [],
      dataSubjects: [],
      recipients: [],
      thirdCountryTransfers: false,
      thirdCountryDetails: '',
      retentionPeriod: '',
      retentionCriteria: '',
      isJointProcessing: false,
      jointControllers: '',
      tomIds: [],
    },
  });

  const watchThirdCountryTransfers = watch('thirdCountryTransfers');
  const watchIsJointProcessing = watch('isJointProcessing');

  const onSubmit = async (data: FormData) => {
    try {
      console.log('Submitting:', data);
      // In real app: dispatch create/update action
      navigate('/processing-activities');
    } catch (error) {
      console.error('Error saving processing activity:', error);
    }
  };

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleCancel = () => {
    navigate('/processing-activities');
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Grunddaten
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Name ist erforderlich' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Bezeichnung der Verarbeitungstätigkeit"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    placeholder="z.B. Kundendatenverarbeitung"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="purpose"
                control={control}
                rules={{ required: 'Zweck ist erforderlich' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={4}
                    label="Zweck der Verarbeitung"
                    error={!!errors.purpose}
                    helperText={errors.purpose?.message}
                    placeholder="Beschreiben Sie detailliert, wofür die Daten verarbeitet werden..."
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="isJointProcessing"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    }
                    label="Gemeinsame Verantwortlichkeit (Art. 26 DSGVO)"
                  />
                )}
              />
            </Grid>

            {watchIsJointProcessing && (
              <Grid item xs={12}>
                <Controller
                  name="jointControllers"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Weitere gemeinsam Verantwortliche"
                      placeholder="Namen und Kontaktdaten der weiteren Verantwortlichen"
                    />
                  )}
                />
              </Grid>
            )}
          </Grid>
        );

      case 1: // Datenkategorien
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="dataCategories"
                control={control}
                rules={{ required: 'Mindestens eine Datenkategorie ist erforderlich' }}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    freeSolo
                    options={DATA_CATEGORIES}
                    value={field.value}
                    onChange={(_, newValue) => field.onChange(newValue)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={option}
                          {...getTagProps({ index })}
                          key={index}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        label="Kategorien personenbezogener Daten"
                        error={!!errors.dataCategories}
                        helperText={errors.dataCategories?.message || 'Wählen Sie aus oder geben Sie eigene ein'}
                      />
                    )}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="dataSubjects"
                control={control}
                rules={{ required: 'Mindestens eine Kategorie betroffener Personen ist erforderlich' }}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    freeSolo
                    options={DATA_SUBJECTS}
                    value={field.value}
                    onChange={(_, newValue) => field.onChange(newValue)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={option}
                          color="primary"
                          {...getTagProps({ index })}
                          key={index}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        label="Kategorien betroffener Personen"
                        error={!!errors.dataSubjects}
                        helperText={errors.dataSubjects?.message || 'Wählen Sie aus oder geben Sie eigene ein'}
                      />
                    )}
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 2: // Rechtsgrundlage
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="legalBasis"
                control={control}
                rules={{ required: 'Rechtsgrundlage ist erforderlich' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.legalBasis}>
                    <InputLabel>Rechtsgrundlage</InputLabel>
                    <Select
                      {...field}
                      label="Rechtsgrundlage"
                    >
                      {Object.entries(LEGAL_BASIS_LABELS).map(([key, label]) => (
                        <MenuItem key={key} value={key}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.legalBasis && (
                      <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                        {errors.legalBasis.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <InfoIcon fontSize="small" />
                  <Box>
                    <Typography variant="subtitle2">
                      Hinweis zur Rechtsgrundlage
                    </Typography>
                    <Typography variant="body2">
                      Die Rechtsgrundlage bestimmt, unter welchen Bedingungen Sie personenbezogene Daten 
                      verarbeiten dürfen. Wählen Sie sorgfältig aus und dokumentieren Sie bei berechtigten 
                      Interessen eine Interessenabwägung.
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        );

      case 3: // Empfänger & Transfer
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="recipients"
                control={control}
                rules={{ required: 'Mindestens ein Empfänger ist erforderlich' }}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    freeSolo
                    options={RECIPIENTS}
                    value={field.value}
                    onChange={(_, newValue) => field.onChange(newValue)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={option}
                          color="secondary"
                          {...getTagProps({ index })}
                          key={index}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        label="Empfänger oder Kategorien von Empfängern"
                        error={!!errors.recipients}
                        helperText={errors.recipients?.message || 'Wählen Sie aus oder geben Sie eigene ein'}
                      />
                    )}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="thirdCountryTransfers"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    }
                    label="Übermittlung in Drittländer oder an internationale Organisationen"
                  />
                )}
              />
            </Grid>

            {watchThirdCountryTransfers && (
              <Grid item xs={12}>
                <Controller
                  name="thirdCountryDetails"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      multiline
                      rows={3}
                      label="Details zur Drittlandübermittlung"
                      placeholder="Länder, Empfänger, Garantien (z.B. Angemessenheitsbeschluss, Standardvertragsklauseln)..."
                    />
                  )}
                />
              </Grid>
            )}
          </Grid>
        );

      case 4: // Löschfristen & TOM
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="retentionPeriod"
                control={control}
                rules={{ required: 'Löschfrist ist erforderlich' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Löschfristen"
                    error={!!errors.retentionPeriod}
                    helperText={errors.retentionPeriod?.message}
                    placeholder="z.B. 10 Jahre nach Vertragsende"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="retentionCriteria"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={3}
                    label="Kriterien für die Löschung (optional)"
                    placeholder="Beschreiben Sie die Kriterien, nach denen entschieden wird, wann Daten gelöscht werden..."
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Technische und organisatorische Maßnahmen (TOM)
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2" color="text.secondary">
                  Verknüpfen Sie diese Verarbeitungstätigkeit mit den entsprechenden TOMs. 
                  Sie können TOMs nach dem Speichern verknüpfen oder neue TOMs erstellen.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={() => {/* Open TOM selection dialog */}}
                >
                  TOMs verknüpfen
                </Button>
              </Paper>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {isEdit ? 'Verarbeitungstätigkeit bearbeiten' : 'Neue Verarbeitungstätigkeit'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Dokumentieren Sie alle erforderlichen Informationen gemäß Art. 30 DSGVO
          </Typography>
        </Box>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {renderStepContent()}

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                onClick={handleCancel}
                startIcon={<CancelIcon />}
                disabled={isSubmitting}
              >
                Abbrechen
              </Button>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  onClick={handleBack}
                  disabled={activeStep === 0 || isSubmitting}
                >
                  Zurück
                </Button>

                {activeStep < steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={isSubmitting}
                  >
                    Weiter
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Speichern...' : (isEdit ? 'Aktualisieren' : 'Erstellen')}
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </form>
    </Box>
  );
};