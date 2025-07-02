// Custom slider component with enhanced styling

import React from 'react';
import {
  Box,
  Slider,
  Typography,
  Tooltip,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

interface CustomSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
  icon?: React.ReactNode;
  tooltip?: string;
  sx?: SxProps<Theme>;
}

export const CustomSlider: React.FC<CustomSliderProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  showValue = false,
  icon,
  tooltip,
  sx,
}) => {
  const theme = useTheme();

  const handleChange = (_: Event, newValue: number | number[]) => {
    onChange(newValue as number);
  };

  const getValueLabel = (val: number) => {
    if (showValue) {
      return val.toString();
    }
    
    // Convert percentage to descriptive labels
    if (val <= 20) return 'Niedrig';
    if (val <= 40) return 'Gering';
    if (val <= 60) return 'Mittel';
    if (val <= 80) return 'Hoch';
    return 'Sehr hoch';
  };

  const sliderComponent = (
    <Box sx={{ width: '100%', ...sx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {icon && (
          <Box sx={{ mr: 1, color: theme.palette.primary.main }}>
            {icon}
          </Box>
        )}
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          {label}
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            minWidth: 60,
            textAlign: 'right',
            fontWeight: 'medium',
            color: theme.palette.primary.main,
          }}
        >
          {getValueLabel(value)}
        </Typography>
      </Box>
      
      <Slider
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        valueLabelDisplay="auto"
        valueLabelFormat={getValueLabel}
        sx={{
          height: 8,
          '& .MuiSlider-track': {
            border: 'none',
            background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.3)} 0%, ${theme.palette.primary.main} 100%)`,
          },
          '& .MuiSlider-thumb': {
            height: 20,
            width: 20,
            backgroundColor: theme.palette.primary.main,
            border: `2px solid ${theme.palette.background.paper}`,
            boxShadow: theme.shadows[2],
            '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
              boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.16)}`,
            },
            '&:before': {
              display: 'none',
            },
          },
          '& .MuiSlider-valueLabel': {
            lineHeight: 1.2,
            fontSize: 12,
            background: 'unset',
            padding: 0,
            width: 32,
            height: 32,
            borderRadius: '50% 50% 50% 0',
            backgroundColor: theme.palette.primary.main,
            transformOrigin: 'bottom left',
            transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
            '&:before': { display: 'none' },
            '&.MuiSlider-valueLabelOpen': {
              transform: 'translate(50%, -100%) rotate(-45deg) scale(1)',
            },
            '& > *': {
              transform: 'rotate(45deg)',
            },
          },
          '& .MuiSlider-rail': {
            color: alpha(theme.palette.text.secondary, 0.2),
            opacity: 1,
            height: 8,
          },
          '& .MuiSlider-mark': {
            backgroundColor: alpha(theme.palette.text.secondary, 0.3),
            height: 4,
            width: 1,
            '&.MuiSlider-markActive': {
              opacity: 1,
              backgroundColor: 'currentColor',
            },
          },
        }}
      />
    </Box>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow placement="top">
        {sliderComponent}
      </Tooltip>
    );
  }

  return sliderComponent;
};

export default CustomSlider;