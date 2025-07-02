import React, { useEffect } from 'react';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
} from '@mui/material';
import {
  Description,
  Assignment,
  School,
  People,
  TrendingUp,
  Warning,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import { DashboardWidget } from './DashboardWidget';
import { NotificationCenter } from './NotificationCenter';
import { DashboardWidget as WidgetType, UpcomingDeadline, ComplianceMetric } from '../../types/dashboard.types';

// Mock data - in real app this would come from API/store
const mockWidgets: WidgetType[] = [
  {
    id: 'processing-activities',
    title: 'Verarbeitungstätigkeiten',
    value: 24,
    type: 'number',
    color: 'primary',
    icon: 'Description',
    trend: { value: 12, direction: 'up' },
    description: 'Aktive Tätigkeiten im VVT',
  },
  {
    id: 'open-tasks',
    title: 'Offene Aufgaben',
    value: 8,
    type: 'number',
    color: 'warning',
    icon: 'Assignment',
    trend: { value: -5, direction: 'down' },
    description: 'Zu bearbeitende Tasks',
  },
  {
    id: 'training-completion',
    title: 'Schulungsfortschritt',
    value: 85,
    type: 'percentage',
    color: 'success',
    icon: 'School',
    trend: { value: 8, direction: 'up' },
    description: 'Mitarbeiter geschult',
  },
  {
    id: 'compliance-score',
    title: 'Compliance Score',
    value: 92,
    type: 'percentage',
    color: 'info',
    icon: 'TrendingUp',
    trend: { value: 3, direction: 'up' },
    description: 'Gesamtbewertung',
  },
];

const mockDeadlines: UpcomingDeadline[] = [
  {
    id: 1,
    type: 'contract',
    title: 'Cloud-Hosting Vertrag',
    description: 'Verlängerung erforderlich',
    dueDate: '2024-02-15',
    priority: 'high',
    entityId: 1,
  },
  {
    id: 2,
    type: 'task',
    title: 'Datenschutz-Folgenabschätzung',
    description: 'Für neue Marketing-Kampagne',
    dueDate: '2024-02-10',
    priority: 'urgent',
    assignedTo: 'Max Mustermann',
    entityId: 2,
  },
];

const mockComplianceMetrics: ComplianceMetric[] = [
  {
    category: 'Dokumentation',
    score: 85,
    maxScore: 100,
    status: 'compliant',
    issues: [],
    recommendations: ['VVT regelmäßig aktualisieren'],
  },
  {
    category: 'Technische Maßnahmen',
    score: 70,
    maxScore: 100,
    status: 'partially_compliant',
    issues: ['Fehlende Verschlüsselung bei Datenübertragung'],
    recommendations: ['SSL/TLS Zertifikate implementieren'],
  },
];

export const Dashboard: React.FC = () => {
  useEffect(() => {
    // Load dashboard data
    // This would typically dispatch actions to fetch data from API
  }, []);

  const getDeadlineColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'default';
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle color="success" />;
      case 'partially_compliant': return <Warning color="warning" />;
      default: return <Warning color="error" />;
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Übersicht über Ihren aktuellen Datenschutzstatus
      </Typography>

      {/* Widgets */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {mockWidgets.map((widget) => (
          <Grid item xs={12} sm={6} md={3} key={widget.id}>
            <DashboardWidget
              widget={widget}
              onClick={() => console.log(`Navigate to ${widget.id}`)}
            />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Compliance Overview */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Compliance Übersicht
              </Typography>
              {mockComplianceMetrics.map((metric) => (
                <Box key={metric.category} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {getComplianceIcon(metric.status)}
                    <Typography variant="subtitle2" sx={{ ml: 1, flexGrow: 1 }}>
                      {metric.category}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {metric.score}/{metric.maxScore}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(metric.score / metric.maxScore) * 100}
                    color={metric.status === 'compliant' ? 'success' : 'warning'}
                    sx={{ mb: 1 }}
                  />
                  {metric.issues.length > 0 && (
                    <Typography variant="caption" color="error">
                      Probleme: {metric.issues.join(', ')}
                    </Typography>
                  )}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Deadlines */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Anstehende Fristen
              </Typography>
              <List disablePadding>
                {mockDeadlines.map((deadline) => (
                  <ListItem key={deadline.id} divider>
                    <ListItemIcon>
                      <Schedule />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2">
                            {deadline.title}
                          </Typography>
                          <Chip
                            label={deadline.priority}
                            color={getDeadlineColor(deadline.priority)}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {deadline.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Fällig: {new Date(deadline.dueDate).toLocaleDateString('de-DE')}
                            {deadline.assignedTo && (
                              <> • Zugewiesen an: {deadline.assignedTo}</>
                            )}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button variant="outlined" size="small">
                  Alle Fristen anzeigen
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Letzte Aktivitäten
              </Typography>
              <List disablePadding>
                <ListItem>
                  <ListItemIcon>
                    <Description color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Neue Verarbeitungstätigkeit erstellt"
                    secondary="Kundendatenverarbeitung - vor 2 Stunden"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Assignment color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Aufgabe zugewiesen"
                    secondary="DSFA für Marketing - vor 1 Tag"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <People color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Schulung abgeschlossen"
                    secondary="5 Mitarbeiter - vor 2 Tagen"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12} md={6}>
          <NotificationCenter
            notifications={[]}
            onMarkAsRead={(id) => console.log('Mark as read:', id)}
            onDismiss={(id) => console.log('Dismiss:', id)}
            onViewAll={() => console.log('View all notifications')}
          />
        </Grid>
      </Grid>
    </Box>
  );
};