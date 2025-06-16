import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Player } from '../types/game';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

interface GameOverProps {
  players: Player[];
  onRestart: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ players, onRestart }) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  return (
    <Paper elevation={3} sx={{ p: 4, backgroundColor: 'rgba(44, 46, 59, 0.9)', textAlign: 'center' }}>
      <Box display="flex" justifyContent="center" mb={3}>
        <EmojiEventsIcon sx={{ fontSize: 80, color: '#FFD700' }} />
      </Box>
      
      <Typography variant="h3" sx={{ color: 'white', mb: 1 }}>
        Spiel beendet!
      </Typography>
      
      <Typography variant="h4" sx={{ color: '#4CAF50', mb: 4 }}>
        {winner.name} gewinnt mit {winner.score} Punkten!
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          Endstand:
        </Typography>
        {sortedPlayers.map((player, index) => (
          <Typography
            key={index}
            variant="body1"
            sx={{
              color: index === 0 ? '#FFD700' : 'white',
              fontSize: index === 0 ? '1.2rem' : '1rem',
              fontWeight: index === 0 ? 'bold' : 'normal',
              mb: 1,
            }}
          >
            {index + 1}. {player.name}: {player.score} Punkte
          </Typography>
        ))}
      </Box>
      
      <Button
        onClick={onRestart}
        variant="contained"
        startIcon={<RestartAltIcon />}
        size="large"
        sx={{
          backgroundColor: '#4CAF50',
          '&:hover': { backgroundColor: '#45a049' },
        }}
      >
        Neues Spiel
      </Button>
    </Paper>
  );
};

export default GameOver;
