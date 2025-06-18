import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import Timer from './components/Timer';
import TaskDisplay from './components/TaskDisplay';
import PlayerSetup from './components/PlayerSetup';
import ScoreBoard from './components/ScoreBoard';
import GameOver from './components/GameOver';
import { GameState, Task } from './types/game';
import { tasks } from './data/tasks';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SkipNextIcon from '@mui/icons-material/SkipNext';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2563eb',
      dark: '#1e40af',
    },
    secondary: {
      main: '#64748b',
      dark: '#475569',
    },
    success: {
      main: '#10b981',
      dark: '#059669',
    },
    error: {
      main: '#ef4444',
      dark: '#dc2626',
    },
    warning: {
      main: '#f59e0b',
      dark: '#d97706',
    },
    background: {
      default: '#0f172a',
      paper: 'rgba(15, 23, 42, 0.8)',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
    },
  },
  typography: {
    fontFamily: '"Inter", "system-ui", "-apple-system", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: '0.9rem',
          fontWeight: 500,
          minHeight: 42,
          boxShadow: 'none',
          border: '1px solid transparent',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: 'none',
            transform: 'none',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: '1rem',
          minHeight: 48,
        },
        contained: {
          '&:hover': {
            opacity: 0.9,
          },
        },
        outlined: {
          borderColor: 'rgba(148, 163, 184, 0.3)',
          color: '#f8fafc',
          '&:hover': {
            borderColor: 'rgba(148, 163, 184, 0.6)',
            backgroundColor: 'rgba(148, 163, 184, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '16px',
          paddingRight: '16px',
          '@media (max-width: 600px)': {
            paddingLeft: '12px',
            paddingRight: '12px',
          },
        },
      },
    },
  },
});

function App() {
  const [gameState, setGameState] = useState<GameState>({
    currentPlayer: 0,
    players: [],
    currentTask: null,
    timeLeft: 5,
    isRunning: false,
    round: 0,
  });

  const [gamePhase, setGamePhase] = useState<'setup' | 'playing' | 'gameOver'>('setup');
  const [usedTasks, setUsedTasks] = useState<Set<string>>(new Set());
  const maxRounds = 5; // Anzahl der Runden pro Spieler

  const startGame = (playerNames: string[]) => {
    setGameState({
      currentPlayer: 0,
      players: playerNames.map(name => ({ name, score: 0 })),
      currentTask: getRandomTask(),
      timeLeft: 5,
      isRunning: false,
      round: 0,
    });
    setGamePhase('playing');
    setUsedTasks(new Set());
  };

  const getRandomTask = (): Task => {
    const availableTasks = tasks.filter(task => !usedTasks.has(task.id));
    if (availableTasks.length === 0) {
      setUsedTasks(new Set());
      return tasks[Math.floor(Math.random() * tasks.length)];
    }
    const task = availableTasks[Math.floor(Math.random() * availableTasks.length)];
    setUsedTasks(prev => new Set(prev).add(task.id));
    return task;
  };

  const startTimer = React.useCallback(() => {
    setGameState(prev => ({ ...prev, isRunning: true }));
  }, []);

  const onTick = React.useCallback(() => {
    setGameState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
  }, []);

  const onTimeUp = React.useCallback(() => {
    setGameState(prev => ({ ...prev, isRunning: false }));
  }, []);

  const handleAnswer = React.useCallback((correct: boolean) => {
    const points = correct ? (gameState.currentTask?.difficulty === 'easy' ? 1 : 
                            gameState.currentTask?.difficulty === 'medium' ? 2 : 3) : 0;
    
    setGameState(prev => {
      const newPlayers = [...prev.players];
      newPlayers[prev.currentPlayer].score += points;
      
      const nextPlayer = (prev.currentPlayer + 1) % prev.players.length;
      const nextRound = nextPlayer === 0 ? prev.round + 1 : prev.round;
      
      // Prüfe ob Spiel zu Ende
      if (nextRound >= maxRounds) {
        setGamePhase('gameOver');
        return { ...prev, players: newPlayers };
      }
      
      return {
        ...prev,
        players: newPlayers,
        currentPlayer: nextPlayer,
        currentTask: getRandomTask(),
        timeLeft: 5,
        isRunning: false,
        round: nextRound,
      };
    });
  }, [gameState.currentTask, maxRounds, getRandomTask, setGamePhase]);

  const skipTask = React.useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentTask: getRandomTask(),
      timeLeft: 5,
      isRunning: false,
    }));
  }, [getRandomTask]);

  const restartGame = React.useCallback(() => {
    setGamePhase('setup');
    setUsedTasks(new Set());
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          position: 'relative',
        }}
      >
        <Container 
          maxWidth="sm" 
          sx={{ 
            py: { xs: 1, sm: 2 },
            position: 'relative',
            zIndex: 1,
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingTop: { xs: '2rem', sm: '3rem' },
            paddingBottom: { xs: '2rem', sm: '2rem' },
          }}
        >
          <Typography
            variant="h2"
            align="center"
            sx={{
              color: '#f8fafc',
              mb: { xs: 2, sm: 3 },
              fontWeight: 700,
              fontSize: { xs: '1.8rem', sm: '2.2rem' },
              letterSpacing: '-0.02em',
            }}
          >
            5 Sekunden Battle
          </Typography>

          {gamePhase === 'setup' && (
            <Box sx={{ width: '100%', maxWidth: '500px' }}>
              <PlayerSetup onStartGame={startGame} />
            </Box>
          )}

          {gamePhase === 'playing' && (
            <Box sx={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Kompakter Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }}>
                  Runde {gameState.round + 1}/{maxRounds}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }}>
                  {gameState.players[gameState.currentPlayer]?.name} ist dran
                </Typography>
              </Box>
              
              {/* Kompakte ScoreBoard */}
              <Box sx={{ mb: 1 }}>
                <ScoreBoard players={gameState.players} currentPlayer={gameState.currentPlayer} />
              </Box>
              
              {/* Kompakte TaskDisplay */}
              <Box sx={{ mb: 1, flex: '0 0 auto' }}>
                <TaskDisplay task={gameState.currentTask} />
              </Box>
              
              {/* Kleinerer Timer */}
              <Box display="flex" justifyContent="center" mb={1}>
                <Timer
                  timeLeft={gameState.timeLeft}
                  isRunning={gameState.isRunning}
                  onTimeUp={onTimeUp}
                  onTick={onTick}
                />
              </Box>

              {/* Kompakte Buttons */}
              <Box 
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: { xs: 1, sm: 2 },
                  px: { xs: 1, sm: 0 },
                  flex: '0 0 auto',
                }}
              >
                {!gameState.isRunning && gameState.timeLeft > 0 && (
                  <Button
                    onClick={startTimer}
                    variant="contained"
                    size="large"
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                      color: 'white',
                      minWidth: { xs: '100%', sm: '180px' },
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                      padding: '10px 20px',
                      '&:hover': {
                        background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
                      },
                    }}
                  >
                    ⏰ Timer starten
                  </Button>
                )}
                
                {!gameState.isRunning && gameState.timeLeft === 0 && (
                  <>
                    <Button
                      onClick={() => handleAnswer(true)}
                      variant="contained"
                      startIcon={<CheckIcon />}
                      size="large"
                      sx={{
                        backgroundColor: theme.palette.success.main,
                        color: 'white',
                        minWidth: { xs: '100%', sm: '140px' },
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        padding: '8px 16px',
                        '&:hover': { backgroundColor: '#22c55e' },
                      }}
                    >
                      ✅ Geschafft
                    </Button>
                    <Button
                      onClick={() => handleAnswer(false)}
                      variant="contained"
                      startIcon={<CloseIcon />}
                      size="large"
                      sx={{
                        backgroundColor: theme.palette.error.main,
                        color: 'white',
                        minWidth: { xs: '100%', sm: '140px' },
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        padding: '8px 16px',
                        '&:hover': { backgroundColor: '#ef4444' },
                      }}
                    >
                      ❌ Nicht geschafft
                    </Button>
                  </>
                )}
                
                {!gameState.isRunning && (
                  <Button
                    onClick={skipTask}
                    variant="outlined"
                    startIcon={<SkipNextIcon />}
                    size="large"
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      minWidth: { xs: '100%', sm: '140px' },
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      padding: '8px 16px',
                      backdropFilter: 'blur(10px)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      },
                    }}
                  >
                    ⏭️ Überspringen
                  </Button>
                )}
              </Box>
            </Box>
          )}

          {gamePhase === 'gameOver' && (
            <Box sx={{ width: '100%', maxWidth: '500px' }}>
              <GameOver players={gameState.players} onRestart={restartGame} />
            </Box>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
