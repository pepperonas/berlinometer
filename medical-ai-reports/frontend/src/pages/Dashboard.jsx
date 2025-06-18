import React from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

function Dashboard() {
  const stats = [
    {
      title: 'Total Reports',
      value: '156',
      icon: <AssignmentIcon />,
      color: '#90caf9',
    },
    {
      title: 'Active Workflows',
      value: '12',
      icon: <TrendingUpIcon />,
      color: '#a5d6a7',
    },
    {
      title: 'Completed Today',
      value: '23',
      icon: <AssessmentIcon />,
      color: '#f48fb1',
    },
    {
      title: 'Pending Review',
      value: '8',
      icon: <ScheduleIcon />,
      color: '#ffcc80',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ color: stat.color, mr: 2 }}>
                  {stat.icon}
                </Box>
                <Typography component="h2" variant="h6" color="text.secondary">
                  {stat.title}
                </Typography>
              </Box>
              <Typography component="p" variant="h4">
                {stat.value}
              </Typography>
            </Paper>
          </Grid>
        ))}

        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography component="h2" variant="h6" gutterBottom>
              Recent Reports
            </Typography>
            <Box sx={{ mt: 2 }}>
              {[1, 2, 3].map((item) => (
                <Card key={item} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6">
                      Patient Report #{item}234
                    </Typography>
                    <Typography color="text.secondary">
                      Generated on {new Date().toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small">View</Button>
                    <Button size="small">Download</Button>
                  </CardActions>
                </Card>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography component="h2" variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" fullWidth sx={{ mb: 2 }}>
                Create New Report
              </Button>
              <Button variant="outlined" fullWidth sx={{ mb: 2 }}>
                Start Workflow
              </Button>
              <Button variant="outlined" fullWidth>
                View All Reports
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;