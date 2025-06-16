import React, { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface TimerProps {
  timeLeft: number;
  isRunning: boolean;
  onTimeUp: () => void;
  onTick: () => void;
}

const Timer: React.FC<TimerProps> = ({ timeLeft, isRunning, onTimeUp, onTick }) => {
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
  const color = timeLeft <= 2 ? '#ff4444' : '#4CAF50';

  return (
    <Box position="relative" display="inline-flex">
      <CircularProgress
        variant="determinate"
        value={progress}
        size={200}
        thickness={4}
        sx={{
          color: color,
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          },
        }}
      />
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
        }}
      >
        <Typography variant="h1" component="div" sx={{ color: color, fontWeight: 'bold' }}>
          {timeLeft}
        </Typography>
      </Box>
    </Box>
  );
};

export default Timer;
