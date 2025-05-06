import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  ButtonGroup, 
  Button,
  useTheme 
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const SalesChart = ({ data }) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('today');
  
  // Filterdaten nach Zeitraum
  const getFilteredData = () => {
    switch (timeRange) {
      case 'today':
        return data.today;
      case 'week':
        return data.weekly;
      case 'month':
        return data.monthly;
      case 'year':
        return data.yearly;
      default:
        return data.weekly;
    }
  };

  // Formatierung für X-Achse
  const formatXAxis = (value) => {
    if (timeRange === 'today') {
      // Stunden für Tagesansicht
      return value;
    } else if (timeRange === 'week') {
      // Wochentage z.B. "Mo" für Montag
      return value.substring(0, 2);
    } else if (timeRange === 'month') {
      // Tage im Monat
      return value;
    } else {
      // Monate für Jahr-Ansicht
      return value.substring(0, 3);
    }
  };

  // Formatierung für Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: theme.palette.background.paper,
            boxShadow: theme.shadows[3],
            p: 1.5,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {label}
          </Typography>
          {payload.map((entry) => (
            <Box key={entry.name} sx={{ color: entry.color, mt: 0.5 }}>
              <Typography variant="body2" component="span" sx={{ display: 'inline-block', minWidth: '100px' }}>
                {entry.name}:
              </Typography>
              <Typography variant="body2" component="span" sx={{ fontWeight: 'bold' }}>
                {new Intl.NumberFormat('de-DE', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(entry.value)}
              </Typography>
            </Box>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="div">
            Umsätze
          </Typography>
          <ButtonGroup size="small" aria-label="Zeitraum wählen">
            <Button 
              onClick={() => setTimeRange('today')}
              variant={timeRange === 'today' ? 'contained' : 'outlined'}
            >
              Heute
            </Button>
            <Button 
              onClick={() => setTimeRange('week')}
              variant={timeRange === 'week' ? 'contained' : 'outlined'}
            >
              Woche
            </Button>
            <Button 
              onClick={() => setTimeRange('month')}
              variant={timeRange === 'month' ? 'contained' : 'outlined'}
            >
              Monat
            </Button>
            <Button 
              onClick={() => setTimeRange('year')}
              variant={timeRange === 'year' ? 'contained' : 'outlined'}
            >
              Jahr
            </Button>
          </ButtonGroup>
        </Box>

        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={getFilteredData()}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="name" 
                tickFormatter={formatXAxis}
                tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                stroke={theme.palette.divider}
              />
              <YAxis 
                tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                stroke={theme.palette.divider}
                tickFormatter={(value) => `${value}€`}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="bar" 
                name="Bar" 
                fill={theme.palette.primary.main} 
                radius={[4, 4, 0, 0]} 
              />
              <Bar 
                dataKey="food" 
                name="Essen" 
                fill={theme.palette.secondary.main} 
                radius={[4, 4, 0, 0]} 
              />
              <Bar 
                dataKey="events" 
                name="Events" 
                fill={theme.palette.info.main} 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SalesChart;