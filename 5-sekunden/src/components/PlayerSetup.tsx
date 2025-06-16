import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface PlayerSetupProps {
  onStartGame: (playerNames: string[]) => void;
}

const PlayerSetup: React.FC<PlayerSetupProps> = ({ onStartGame }) => {
  const [players, setPlayers] = useState(['', '']);

  const updatePlayer = (index: number, name: string) => {
    const newPlayers = [...players];
    newPlayers[index] = name;
    setPlayers(newPlayers);
  };

  const addPlayer = () => {
    if (players.length < 6) {
      setPlayers([...players, '']);
    }
  };

  const removePlayer = (index: number) => {
    if (players.length > 2) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  const canStart = players.every(p => p.trim().length > 0) && players.length >= 2;

  return (
    <Paper elevation={3} sx={{ p: 4, backgroundColor: 'rgba(44, 46, 59, 0.9)' }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'white', mb: 3 }}>
        Spieler hinzufügen
      </Typography>
      
      {players.map((player, index) => (
        <Box key={index} display="flex" alignItems="center" mb={2}>
          <TextField
            fullWidth
            label={`Spieler ${index + 1}`}
            value={player}
            onChange={(e) => updatePlayer(index, e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#1976d2' },
              },
              '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
            }}
          />
          {players.length > 2 && (
            <IconButton
              onClick={() => removePlayer(index)}
              sx={{ ml: 1, color: '#ff4444' }}
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      ))}
      
      <Box display="flex" justifyContent="space-between" mt={3}>
        <Button
          onClick={addPlayer}
          startIcon={<AddIcon />}
          disabled={players.length >= 6}
          variant="outlined"
          sx={{
            color: 'white',
            borderColor: 'rgba(255, 255, 255, 0.5)',
            '&:hover': {
              borderColor: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          Spieler hinzufügen
        </Button>
        
        <Button
          onClick={() => onStartGame(players)}
          disabled={!canStart}
          variant="contained"
          startIcon={<PlayArrowIcon />}
          sx={{
            backgroundColor: '#4CAF50',
            '&:hover': { backgroundColor: '#45a049' },
            '&:disabled': { 
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              color: 'rgba(255, 255, 255, 0.3)',
            },
          }}
        >
          Spiel starten
        </Button>
      </Box>
    </Paper>
  );
};

export default PlayerSetup;
