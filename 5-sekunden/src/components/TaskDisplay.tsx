import React from 'react';
import { Box, Typography, Chip, Paper } from '@mui/material';
import { Task } from '../types/game';

interface TaskDisplayProps {
  task: Task | null;
}

const TaskDisplay: React.FC<TaskDisplayProps> = ({ task }) => {
  if (!task) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4ade80';
      case 'medium': return '#fbbf24';
      case 'hard': return '#f87171';
      default: return '#6b7280';
    }
  };

  const getDifficultyEmoji = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '';
      case 'medium': return '';
      case 'hard': return '';
      default: return '';
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'Nenne 3': return '';
      case 'Rückwärts': return '';
      case 'Mathe': return '';
      case 'Zungenbrecher': return '';
      case 'Wortspiele': return '';
      case 'Schätzfragen': return '';
      case 'Pantomime': return '';
      case 'Geräusche': return '';
      default: return '';
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        mb: 1.5,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${getDifficultyColor(task.difficulty)} 0%, rgba(148, 163, 184, 0.2) 100%)`,
        },
      }}
    >
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={1.5}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={{ xs: 2, sm: 0 }}
      >
        <Chip
          label={task.category}
          sx={{
            backgroundColor: '#2563eb',
            color: '#f8fafc',
            fontWeight: 600,
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            px: 1,
            '& .MuiChip-label': {
              px: 2,
            },
          }}
        />
        <Chip
          label={task.difficulty.toUpperCase()}
          sx={{
            backgroundColor: getDifficultyColor(task.difficulty),
            color: '#f8fafc',
            fontWeight: 600,
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            px: 1,
            '& .MuiChip-label': {
              px: 2,
            },
          }}
        />
      </Box>
      <Typography 
        variant="h3" 
        align="center" 
        sx={{ 
          color: '#f8fafc', 
          fontWeight: 600,
          fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' },
          lineHeight: 1.3,
          letterSpacing: '0.02em',
        }}
      >
        {task.question}
      </Typography>
    </Paper>
  );
};

export default TaskDisplay;
