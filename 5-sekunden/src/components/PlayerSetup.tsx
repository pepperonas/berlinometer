import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface PlayerSetupProps {
  onStartGame: (playerNames: string[]) => void;
}

const PlayerSetup: React.FC<PlayerSetupProps> = ({ onStartGame }) => {
  const [players, setPlayers] = useState(['', '']);
  const [focusedInputIndex, setFocusedInputIndex] = useState<number | null>(null);
  const [ctrlEnterCount, setCtrlEnterCount] = useState(0);
  const [showQuickStartHint, setShowQuickStartHint] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const ctrlEnterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updatePlayer = (index: number, name: string) => {
    const newPlayers = [...players];
    newPlayers[index] = name;
    setPlayers(newPlayers);
  };

  const addPlayer = () => {
    if (players.length < 6) {
      const newPlayers = [...players, ''];
      setPlayers(newPlayers);
      // Focus auf neues Eingabefeld setzen
      setTimeout(() => {
        const newInputIndex = newPlayers.length - 1;
        inputRefs.current[newInputIndex]?.focus();
      }, 0);
    }
  };

  const removePlayer = (index: number) => {
    if (players.length > 2) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  const canStart = players.every(p => p.trim().length > 0) && players.length >= 2;

  const startGameSafely = () => {
    if (canStart) {
      const validPlayers = players.filter(p => p.trim().length > 0);
      onStartGame(validPlayers);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    // Enter-Taste: Neues Eingabefeld oder Spiel starten
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      
      const currentPlayer = players[index].trim();
      if (currentPlayer.length > 0) {
        // Wenn alle Felder ausgefüllt sind, Spiel starten
        if (canStart) {
          startGameSafely();
        } else {
          // Sonst neues Eingabefeld hinzufügen oder zum nächsten springen
          const nextEmptyIndex = players.findIndex((p, i) => i > index && p.trim() === '');
          if (nextEmptyIndex !== -1) {
            inputRefs.current[nextEmptyIndex]?.focus();
          } else if (players.length < 6) {
            addPlayer();
          }
        }
      }
    }
    
    // Ctrl/Cmd + Enter: Schnellstart (2x für Bestätigung)
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      
      if (canStart) {
        setCtrlEnterCount(prev => prev + 1);
        setShowQuickStartHint(true);
        
        // Reset Counter nach 2 Sekunden
        if (ctrlEnterTimeoutRef.current) {
          clearTimeout(ctrlEnterTimeoutRef.current);
        }
        
        ctrlEnterTimeoutRef.current = setTimeout(() => {
          setCtrlEnterCount(0);
          setShowQuickStartHint(false);
        }, 2000);
        
        // Spiel starten nach 2x Ctrl+Enter
        if (ctrlEnterCount >= 1) {
          startGameSafely();
        }
      }
    }
  };

  // Cleanup beim Unmounten
  useEffect(() => {
    return () => {
      if (ctrlEnterTimeoutRef.current) {
        clearTimeout(ctrlEnterTimeoutRef.current);
      }
    };
  }, []);

  // InputRefs aktualisieren wenn Spieleranzahl sich ändert
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, players.length);
  }, [players.length]);

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: { xs: 2, sm: 3 }, 
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        borderRadius: 2,
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
        <Typography 
          variant="h4" 
          sx={{ 
            color: '#f8fafc', 
            fontWeight: 600,
            fontSize: { xs: '1.3rem', sm: '1.7rem' },
          }}
        >
          Spieler Setup
        </Typography>
      </Box>

      
      {players.map((player, index) => (
        <Box key={index} display="flex" alignItems="center" mb={2}>
          <TextField
            fullWidth
            inputRef={(el) => (inputRefs.current[index] = el)}
            label={`Spieler ${index + 1}`}
            value={player}
            onChange={(e) => updatePlayer(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onFocus={() => setFocusedInputIndex(index)}
            onBlur={() => setFocusedInputIndex(null)}
            variant="outlined"
            autoComplete="off"
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#f8fafc',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                '& fieldset': { 
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  borderWidth: '2px',
                },
                '&:hover fieldset': { 
                  borderColor: 'rgba(255, 255, 255, 0.6)',
                },
                '&.Mui-focused fieldset': { 
                  borderColor: '#667eea',
                  boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                },
              },
              '& .MuiInputLabel-root': { 
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: '#667eea',
                },
              },
            }}
          />
          {players.length > 2 && (
            <IconButton
              onClick={() => removePlayer(index)}
              sx={{ 
                ml: 1, 
                color: '#f87171',
                '&:hover': {
                  backgroundColor: 'rgba(248, 113, 113, 0.1)',
                },
              }}
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      ))}
      
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center"
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={{ xs: 2, sm: 0 }}
        mt={3}
      >
        <Button
          onClick={addPlayer}
          startIcon={<AddIcon />}
          disabled={players.length >= 6}
          variant="outlined"
          size="large"
          sx={{
            color: '#f8fafc',
            borderColor: 'rgba(255, 255, 255, 0.5)',
            borderWidth: '2px',
            minWidth: { xs: '100%', sm: '180px' },
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '&:hover': {
              borderColor: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              transform: 'translateY(-2px)',
            },
            '&:disabled': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: 'rgba(255, 255, 255, 0.3)',
            },
          }}
        >
          ➕ Spieler hinzufügen ({players.length}/6)
        </Button>
        
        <Button
          onClick={startGameSafely}
          disabled={!canStart}
          variant="contained"
          startIcon={<PlayArrowIcon />}
          size="large"
          sx={{
            background: canStart 
              ? 'linear-gradient(45deg, #4ade80 30%, #22c55e 90%)'
              : 'rgba(255, 255, 255, 0.12)',
            color: canStart ? 'white' : 'rgba(255, 255, 255, 0.3)',
            minWidth: { xs: '100%', sm: '180px' },
            fontWeight: 600,
            boxShadow: canStart ? '0 4px 14px rgba(74, 222, 128, 0.3)' : 'none',
            '&:hover': canStart ? {
              background: 'linear-gradient(45deg, #22c55e 30%, #16a34a 90%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 20px rgba(74, 222, 128, 0.4)',
            } : {},
            '&:disabled': { 
              background: 'rgba(255, 255, 255, 0.12)',
              color: 'rgba(255, 255, 255, 0.3)',
            },
          }}
        >
          🚀 Spiel starten
        </Button>
      </Box>

      {/* Hinweistext */}
      {!canStart && (
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.6)', 
            display: 'block', 
            textAlign: 'center',
            mt: 2,
          }}
        >
          Fülle alle Spielernamen aus um das Spiel zu starten
        </Typography>
      )}
    </Paper>
  );
};

export default PlayerSetup;
