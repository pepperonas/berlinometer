import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  MoreVert,
} from '@mui/icons-material';
import { DashboardWidget as WidgetType } from '../../types/dashboard.types';

interface DashboardWidgetProps {
  widget: WidgetType;
  onClick?: () => void;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  widget,
  onClick,
}) => {
  const getTrendIcon = () => {
    if (!widget.trend) return null;
    
    switch (widget.trend.direction) {
      case 'up':
        return <TrendingUp fontSize="small" color="success" />;
      case 'down':
        return <TrendingDown fontSize="small" color="error" />;
      default:
        return <TrendingFlat fontSize="small" color="disabled" />;
    }
  };

  const getTrendColor = () => {
    if (!widget.trend) return 'text.secondary';
    
    switch (widget.trend.direction) {
      case 'up':
        return 'success.main';
      case 'down':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  const formatValue = (value: number | string) => {
    if (widget.type === 'percentage') {
      return `${value}%`;
    }
    if (typeof value === 'number' && value >= 1000) {
      return value.toLocaleString('de-DE');
    }
    return value;
  };

  return (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: `${widget.color}.main`,
                color: `${widget.color}.contrastText`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {React.createElement(
                require('@mui/icons-material')[widget.icon] || 
                require('@mui/icons-material').Help,
                { fontSize: 'small' }
              )}
            </Box>
          </Box>
          
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <MoreVert fontSize="small" />
          </IconButton>
        </Box>

        <Typography variant="h4" component="div" fontWeight="bold" color="text.primary">
          {formatValue(widget.value)}
        </Typography>

        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
          {widget.title}
        </Typography>

        {widget.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {widget.description}
          </Typography>
        )}

        {widget.trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getTrendIcon()}
            <Typography
              variant="body2"
              sx={{ color: getTrendColor(), fontWeight: 500 }}
            >
              {widget.trend.value > 0 ? '+' : ''}{widget.trend.value}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              vs. letzte Woche
            </Typography>
          </Box>
        )}

        {widget.type === 'status' && (
          <Box sx={{ mt: 1 }}>
            <Chip
              label={widget.value}
              color={widget.color}
              size="small"
              variant="outlined"
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};