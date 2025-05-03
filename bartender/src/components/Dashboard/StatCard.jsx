import React from 'react';
import { Card, CardContent, Typography, Box, IconButton, Tooltip } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

const StatCard = ({ title, value, icon, color, description, trend, trendDescription }) => {
  // Farbe für den Trend (positiv, negativ, neutral)
  const trendColor = () => {
    if (!trend) return 'text.secondary';
    return trend > 0 ? 'success.main' : trend < 0 ? 'error.main' : 'text.secondary';
  };

  // Icon für den Trend
  const TrendIcon = () => {
    if (!trend) return null;
    
    if (trend > 0) {
      return <Box component="span" sx={{ fontSize: '1.2rem' }}>↑</Box>;
    } else if (trend < 0) {
      return <Box component="span" sx={{ fontSize: '1.2rem' }}>↓</Box>;
    }
    
    return <Box component="span" sx={{ fontSize: '1.2rem' }}>→</Box>;
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="h6" component="div" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Box 
            sx={{ 
              borderRadius: '50%',
              bgcolor: `${color}.light`,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {React.cloneElement(icon, { sx: { color: `${color}.main` } })}
          </Box>
        </Box>

        <Typography variant="h4" component="div" fontWeight="bold">
          {value}
        </Typography>

        {trend !== undefined && (
          <Box display="flex" alignItems="center" mt={1}>
            <Typography variant="body2" component="div" sx={{ color: trendColor(), display: 'flex', alignItems: 'center' }}>
              <TrendIcon />
              <Box component="span" ml={0.5}>
                {Math.abs(trend)}% {trend > 0 ? 'mehr' : trend < 0 ? 'weniger' : ''}
              </Box>
            </Typography>
            {trendDescription && (
              <Typography variant="body2" color="text.secondary" ml={1}>
                {trendDescription}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>

      {description && (
        <Tooltip title={description} placement="top">
          <IconButton
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'text.secondary',
            }}
          >
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Card>
  );
};

export default StatCard;