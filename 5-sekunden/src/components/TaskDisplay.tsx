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
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#f44336';
      default: return '#757575';
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        mb: 3,
        backgroundColor: 'rgba(44, 46, 59, 0.8)',
        borderRadius: 2,
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Chip
          label={task.category}
          sx={{
            backgroundColor: '#1976d2',
            color: 'white',
            fontWeight: 'bold',
          }}
        />
        <Chip
          label={task.difficulty}
          sx={{
            backgroundColor: getDifficultyColor(task.difficulty),
            color: 'white',
            fontWeight: 'bold',
          }}
        />
      </Box>
      <Typography variant="h4" align="center" sx={{ color: 'white', fontWeight: 'medium' }}>
        {task.question}
      </Typography>
    </Paper>
  );
};

export default TaskDisplay;
