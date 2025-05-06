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
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend,
  Tooltip as RechartsTooltip
} from 'recharts';

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const ExpensesPieChart = ({ data }) => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('month');
  
  // Farben für die Pie-Chart-Segmente
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.success.main,
    theme.palette.info.main,
    theme.palette.warning.main,
    '#9c27b0',  // Lila
    '#607d8b',  // Blaugrau
  ];

  // Filterdaten nach Zeitraum und stell sicher, dass sie im erwarteten Format sind
  const getFilteredData = () => {
    if (!data) {
      console.log('Keine Daten verfügbar für ExpensesPieChart');
      return []; // Return empty array if data is null or undefined
    }
    
    // Wenn data direkt ein Array ist, haben wir möglicherweise nur ein Zeitraumsegment
    if (Array.isArray(data)) {
      console.log('Expensesdata ist direkt ein Array, verwende es als monatliche Daten');
      return timeRange === 'month' ? data : [];
    }
    
    let filteredData;
    switch (timeRange) {
      case 'month':
        filteredData = data.monthly;
        break;
      case 'quarter':
        filteredData = data.quarterly;
        break;
      case 'year':
        filteredData = data.yearly;
        break;
      default:
        filteredData = data.monthly;
    }
    
    // Wenn keine spezifischen Daten für diesen Zeitraum verfügbar sind
    // und wir haben monatliche Daten, zeige diese als Fallback an
    if (!filteredData && data.monthly) {
      console.log(`Keine Daten für Zeitraum ${timeRange} verfügbar, verwende monatliche Daten`);
      filteredData = data.monthly;
    }
    
    // Stelle sicher, dass wir ein Array zurückgeben und dass jeder Eintrag ein "percent" Feld hat
    let result = Array.isArray(filteredData) ? filteredData : [];
    
    // Berechne Prozentangaben falls nötig
    if (result.length > 0 && result.some(item => typeof item.percent === 'undefined')) {
      console.log('Berechne fehlende Prozentanteile für Ausgabendaten');
      const total = result.reduce((sum, item) => sum + item.value, 0);
      if (total > 0) {
        result = result.map(item => ({
          ...item,
          percent: item.value / total
        }));
      }
    }
    
    return result;
  };

  // Formatierung für Tooltip
  const CustomTooltip = ({ active, payload }) => {
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
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', marginBottom: 0.5 }}>
            {payload[0].name}
          </Typography>
          <Typography variant="body2">
            <Box component="span" sx={{ fontWeight: 'bold' }}>
              {new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR'
              }).format(payload[0].value)}
            </Box>
            <Box component="span" sx={{ marginLeft: 1, color: 'text.secondary' }}>
              ({(payload[0].payload.percent * 100).toFixed(1)}%)
            </Box>
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // Benutzerdefinierte Legende
  const CustomLegend = ({ payload }) => {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', mt: 2 }}>
        {payload.map((entry, index) => (
          <Box 
            key={`legend-${index}`}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mx: 1,
              my: 0.5,
            }}
          >
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                backgroundColor: entry.color, 
                mr: 1 
              }} 
            />
            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
              {entry.value}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };

  const chartData = getFilteredData();
  
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
            Ausgabenverteilung
          </Typography>
          <ButtonGroup size="small" aria-label="Zeitraum wählen">
            <Button 
              onClick={() => setTimeRange('month')}
              variant={timeRange === 'month' ? 'contained' : 'outlined'}
            >
              Monat
            </Button>
            <Button 
              onClick={() => setTimeRange('quarter')}
              variant={timeRange === 'quarter' ? 'contained' : 'outlined'}
            >
              Quartal
            </Button>
            <Button 
              onClick={() => setTimeRange('year')}
              variant={timeRange === 'year' ? 'contained' : 'outlined'}
            >
              Jahr
            </Button>
          </ButtonGroup>
        </Box>

        <Box sx={{ width: '100%', height: 240 }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend content={<CustomLegend />} />
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column',
              p: 2,
              textAlign: 'center',
              color: 'text.secondary'
            }}>
              <Typography variant="body1" gutterBottom>
                Keine Ausgabendaten für diesen Zeitraum verfügbar
              </Typography>
              <Typography variant="body2">
                Versuchen Sie, einen anderen Zeitraum auszuwählen
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ExpensesPieChart;