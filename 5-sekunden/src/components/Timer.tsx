import React, { useEffect } from 'react';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

interface TimerProps {
  timeLeft: number;
  isRunning: boolean;
  onTimeUp: () => void;
  onTick: () => void;
}

const Timer: React.FC<TimerProps> = ({ timeLeft, isRunning, onTimeUp, onTick }) => {
  const theme = useTheme();
  
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      const timer = setTimeout(() => {
        onTick();
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      onTimeUp();
    }
  }, [timeLeft, isRunning, onTimeUp, onTick]);

  const progress = (timeLeft / 5) * 100;
  const getTimerColor = () => {
    if (timeLeft <= 1) return '#ef4444';
    if (timeLeft <= 2) return '#f59e0b';
    return '#10b981';
  };

  const getTimerSize = () => {
    // Return a single size value, responsive handled via CSS
    return 200;
  };

  return (
    <Box 
      position="relative" 
      display="inline-flex"
      sx={{
        transform: timeLeft <= 1 && isRunning ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.3s ease-in-out',
        width: { xs: '120px', sm: '140px' },
        height: { xs: '120px', sm: '140px' },
      }}
    >
      {/* Custom SVG Timer */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 200"
        style={{ 
          transform: 'rotate(-90deg)',
          filter: timeLeft <= 2 && isRunning ? 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.5))' : 'none',
        }}
      >
        {/* Background Circle */}
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="8"
        />
        {/* Progress Circle */}
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke={getTimerColor()}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 92}`}
          strokeDashoffset={`${2 * Math.PI * 92 * (1 - progress / 100)}`}
          style={{
            transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.3s ease',
            filter: `drop-shadow(0 0 8px ${getTimerColor()})`,
          }}
        />
      </svg>
      
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <Typography 
          variant="h1" 
          component="div" 
          sx={{ 
            color: getTimerColor(),
            fontWeight: 800,
            fontSize: { xs: '2.2rem', sm: '2.8rem' },
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            lineHeight: 1,
            mb: timeLeft === 0 ? 0.5 : 0,
          }}
        >
          {timeLeft > 0 ? timeLeft : '⏰'}
        </Typography>
        
        {timeLeft === 0 && (
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'white',
              fontWeight: 600,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              textAlign: 'center',
              opacity: 0.9,
            }}
          >
            Zeit abgelaufen!
          </Typography>
        )}
        
        {isRunning && timeLeft > 0 && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 500,
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              textAlign: 'center',
              mt: 0.25,
            }}
          >
            Läuft...
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default Timer;
