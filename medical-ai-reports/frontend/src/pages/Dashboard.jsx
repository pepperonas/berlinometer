import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  Assignment,
  Assessment,
  CheckCircle,
  Schedule,
  Warning,
  Person,
  LocalHospital,
  AutoAwesome,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Mock data for demonstration
const mockData = {
  stats: [
    {
      title: 'Gesamt Berichte',
      value: '1,247',
      change: '+12%',
      changeType: 'positive',
      icon: <Assessment />,
      color: '#1976d2',
    },
    {
      title: 'Aktive Workflows',
      value: '23',
      change: '+3',
      changeType: 'positive',
      icon: <Assignment />,
      color: '#2e7d32',
    },
    {
      title: 'Bearbeitungszeit',
      value: '2.4h',
      change: '-15min',
      changeType: 'positive',
      icon: <Schedule />,
      color: '#ed6c02',
    },
    {
      title: 'Genauigkeit',
      value: '94.2%',
      change: '+2.1%',
      changeType: 'positive',
      icon: <CheckCircle />,
      color: '#9c27b0',
    },
  ],
  recentReports: [
    {
      id: 1,
      patient: 'Max Mustermann',
      type: 'Röntgen Thorax',
      status: 'Abgeschlossen',
      date: '2024-01-15',
      ai_confidence: 95,
    },
    {
      id: 2,
      patient: 'Anna Schmidt',
      type: 'MRT Kopf',
      status: 'In Bearbeitung',
      date: '2024-01-15',
      ai_confidence: 87,
    },
    {
      id: 3,
      patient: 'Peter Weber',
      type: 'CT Abdomen',
      status: 'Validierung',
      date: '2024-01-14',
      ai_confidence: 92,
    },
    {
      id: 4,
      patient: 'Lisa Müller',
      type: 'Ultraschall',
      status: 'Abgeschlossen',
      date: '2024-01-14',
      ai_confidence: 89,
    },
  ],
  aiInsights: [
    {
      title: 'Anomalie-Erkennung',
      description: '3 potenzielle Auffälligkeiten erkannt',
      severity: 'warning',
      icon: <Warning />,
    },
    {
      title: 'Workflow-Optimierung',
      description: 'Durchschnittliche Bearbeitungszeit um 15% reduziert',
      severity: 'success',
      icon: <TrendingUp />,
    },
    {
      title: 'Qualitätssicherung',
      description: '99.2% der Berichte erfolgreich validiert',
      severity: 'info',
      icon: <CheckCircle />,
    },
  ],
};

function Dashboard() {
  const navigate = useNavigate();
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Abgeschlossen':
        return 'success';
      case 'In Bearbeitung':
        return 'primary';
      case 'Validierung':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'warning':
        return '#ed6c02';
      case 'success':
        return '#2e7d32';
      case 'info':
        return '#0288d1';
      default:
        return '#1976d2';
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {mockData.stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: stat.color,
                      mr: 2,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stat.value}
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  color={stat.changeType === 'positive' ? 'success.main' : 'error.main'}
                  variant="body2"
                >
                  {stat.change} seit letzter Woche
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Reports */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              Aktuelle Berichte
            </Typography>
            <List>
              {mockData.recentReports.map((report) => (
                <ListItem
                  key={report.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    mb: 2,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <Person />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {report.patient}
                        </Typography>
                        <Chip
                          label={report.status}
                          color={getStatusColor(report.status)}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          {report.type} • {report.date}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <Typography variant="caption" sx={{ mr: 1 }}>
                            KI-Vertrauen:
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={report.ai_confidence}
                            sx={{ flexGrow: 1, mr: 1 }}
                          />
                          <Typography variant="caption">
                            {report.ai_confidence}%
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
            <Box sx={{ mt: 2, textAlign: 'center', display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="outlined" onClick={() => navigate('/reports')}>
                Alle Berichte anzeigen
              </Button>
              <Button 
                variant="contained" 
                startIcon={<AutoAwesome />}
                onClick={() => navigate('/reports')}
                sx={{ 
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                }}
              >
                KI-Bericht erstellen
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* AI Insights */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              KI-Erkenntnisse
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {mockData.aiInsights.map((insight, index) => (
                <Card
                  key={index}
                  variant="outlined"
                  sx={{
                    borderLeft: `4px solid ${getSeverityColor(insight.severity)}`,
                  }}
                >
                  <CardContent sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Avatar
                        sx={{
                          bgcolor: getSeverityColor(insight.severity),
                          width: 32,
                          height: 32,
                          mr: 2,
                        }}
                      >
                        {insight.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {insight.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {insight.description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;