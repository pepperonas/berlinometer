import React from 'react';
import { Box, Typography, Paper, Chip, Avatar } from '@mui/material';
import { Player } from '../types/game';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

interface ScoreBoardProps {
  players: Player[];
  currentPlayer: number;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ players, currentPlayer }) => {
  const getPlayerEmoji = (index: number) => {
    const emojis = ['🎮', '🎯', '⭐', '🚀', '💎', '🎪'];
    return emojis[index % emojis.length];
  };

  const getPlayerColor = (index: number) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return colors[index % colors.length];
  };

  return (
    <Box sx={{ mb: { xs: 1, sm: 1.5 } }}>
      <Typography 
        variant="h6" 
        sx={{ 
          color: '#f8fafc', 
          mb: 1, 
          fontWeight: 600,
          fontSize: { xs: '0.95rem', sm: '1.1rem' },
          textAlign: 'center',
        }}
      >
        Punktestand
      </Typography>
      <Box 
        display="flex" 
        gap={{ xs: 1, sm: 2 }} 
        flexWrap="wrap"
        justifyContent="center"
        sx={{
          flexDirection: { xs: players.length > 2 ? 'column' : 'row', sm: 'row' },
        }}
      >
        {players.map((player, index) => (
          <Paper
            key={index}
            elevation={0}
            sx={{
              p: { xs: 1.5, sm: 2 },
              backgroundColor: index === currentPlayer 
                ? `rgba(37, 99, 235, 0.2)`
                : 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(12px)',
              border: index === currentPlayer 
                ? `1px solid #2563eb` 
                : '1px solid rgba(148, 163, 184, 0.1)',
              borderRadius: 3,
              minWidth: { xs: '100%', sm: 120 },
              flex: { xs: 'none', sm: '1 1 0' },
              transform: index === currentPlayer ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': index === currentPlayer ? {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: `linear-gradient(90deg, #2563eb 0%, rgba(37, 99, 235, 0.3) 100%)`,
              } : {},
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar 
                  sx={{ 
                    width: 28, 
                    height: 28, 
                    backgroundColor: '#2563eb',
                    fontSize: '1rem',
                  }}
                >
                  {getPlayerEmoji(index)}
                </Avatar>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: '#f8fafc',
                    fontWeight: index === currentPlayer ? 700 : 500,
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                  }}
                >
                  {player.name}
                </Typography>
              </Box>
              
              {index === currentPlayer && (
                <Chip 
                  label="🎯 Dran" 
                  size="small" 
                  sx={{ 
                    backgroundColor: '#2563eb',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    '& .MuiChip-label': {
                      px: 1.5,
                    },
                  }}
                />
              )}
            </Box>
            
            <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
              <EmojiEventsIcon sx={{ color: '#fbbf24', fontSize: 24 }} />
              <Typography 
                variant="h4" 
                sx={{ 
                  color: '#f8fafc', 
                  fontWeight: 800,
                  fontSize: { xs: '1.3rem', sm: '1.6rem' },
                }}
              >
                {player.score}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default ScoreBoard;
