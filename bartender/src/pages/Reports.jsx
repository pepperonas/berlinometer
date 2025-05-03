import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider
} from '@mui/material';
import { 
  Description as ReportIcon,
  PictureAsPdf as PdfIcon,
  TableChart as TableIcon,
  Print as PrintIcon,
  Share as ShareIcon
} from '@mui/icons-material';

const Reports = () => {
  return (
    <Box sx={{ flexGrow: 1, pb: 4 }}>
      {/* Seitenkopf */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Berichte
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Erstellen und exportieren Sie Berichte über Ihre Bar-Daten
        </Typography>
      </Box>
      
      {/* Berichtskarten */}
      <Grid container spacing={3}>
        {/* Finanzberichte */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <ReportIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6">Finanzberichte</Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Monatsabschluss
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Vollständiger Bericht über Einnahmen, Ausgaben und Gewinne für den aktuellen Monat.
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<PdfIcon />}
                      >
                        PDF
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<TableIcon />}
                      >
                        Excel
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Jahresübersicht
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Finanzieller Jahresüberblick mit monatlicher Aufschlüsselung.
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<PdfIcon />}
                      >
                        PDF
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<TableIcon />}
                      >
                        Excel
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Verkaufsberichte */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <ReportIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6">Verkaufsberichte</Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Getränkeverkäufe
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Detaillierte Analyse der verkauften Getränke nach Kategorie und Einzelprodukt.
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<PdfIcon />}
                      >
                        PDF
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<TableIcon />}
                      >
                        Excel
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Stunden- und Tagesvergleich
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Verkaufsanalyse nach Tageszeit und Wochentag.
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<PdfIcon />}
                      >
                        PDF
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<TableIcon />}
                      >
                        Excel
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Inventarbeichte */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <ReportIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6">Inventarberichte</Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Bestandsübersicht
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Vollständige Inventarliste mit aktuellem Bestand und Bestellempfehlungen.
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<PdfIcon />}
                      >
                        PDF
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<TableIcon />}
                      >
                        Excel
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Bestandsbewegungen
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Bestandszugänge und -abgänge im vergangenen Monat.
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<PdfIcon />}
                      >
                        PDF
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<TableIcon />}
                      >
                        Excel
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Personalberichte */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <ReportIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="h6">Personalberichte</Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Arbeitszeitübersicht
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Arbeitsstunden und Vergütung nach Mitarbeiter.
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<PdfIcon />}
                      >
                        PDF
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<TableIcon />}
                      >
                        Excel
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Personalkosten
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Vollständige Analyse aller Personalkosten nach Rolle und Abteilung.
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<PdfIcon />}
                      >
                        PDF
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<TableIcon />}
                      >
                        Excel
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Aktionen/Funktionen */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Typography variant="h6">Berichtsaktionen</Typography>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box display="flex" flexWrap="wrap" gap={2}>
              <Button 
                variant="outlined" 
                startIcon={<PrintIcon />}
              >
                Drucken
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<TableIcon />}
              >
                Als Excel exportieren
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<PdfIcon />}
              >
                Als PDF exportieren
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<ShareIcon />}
              >
                Per E-Mail senden
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;