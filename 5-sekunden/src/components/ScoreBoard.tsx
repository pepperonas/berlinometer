import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { Player } from '../types/game';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

interface ScoreBoardProps {
  players: Player[];
  currentPlayer: number;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ players, currentPlayer }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
        Punktestand
      </Typography>
      <Box display="flex" gap={2} flexWrap="wrap">
        {players.map((player, index) => (
          <Paper
            key={index}
            elevation={index === currentPlayer ? 6 : 2}
            sx={{
              p: 2,
              backgroundColor: index === currentPlayer 
                ? 'rgba(25, 118, 210, 0.3)' 
                : 'rgba(44, 46, 59, 0.6)',
              border: index === currentPlayer ? '2px solid #1976d2' : 'none',
              minWidth: 150,
            }}
          >
            <Typography 
              variant="subtitle1" 
              sx={{ 
                color: 'white',
                fontWeight: index === currentPlayer ? 'bold' : 'normal',
              }}
            >
              {player.name}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <EmojiEventsIcon sx={{ color: '#FFD700', fontSize: 20 }} />
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                {player.score}
              </Typography>
            </Box>
            {index === currentPlayer && (
              <Chip 
                label="Am Zug" 
                size="small" 
                sx={{ 
                  mt: 1,
                  backgroundColor: '#1976d2',
                  color: 'white',
                }}
              />
            )}
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default ScoreBoard;
