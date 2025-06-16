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
      main: '#1976d2',
    },
    background: {
      default: '#1a1b26',
      paper: '#2C2E3B',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
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

  const startTimer = () => {
    setGameState(prev => ({ ...prev, isRunning: true }));
  };

  const onTick = () => {
    setGameState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
  };

  const onTimeUp = () => {
    setGameState(prev => ({ ...prev, isRunning: false }));
  };

  const handleAnswer = (correct: boolean) => {
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
  };

  const skipTask = () => {
    setGameState(prev => ({
      ...prev,
      currentTask: getRandomTask(),
      timeLeft: 5,
      isRunning: false,
    }));
  };

  const restartGame = () => {
    setGamePhase('setup');
    setUsedTasks(new Set());
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#1a1b26',
          backgroundImage: 'linear-gradient(135deg, #1a1b26 0%, #2C2E3B 100%)',
          py: 4,
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h2"
            align="center"
            sx={{
              color: 'white',
              mb: 4,
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            5 Sekunden Battle
          </Typography>

          {gamePhase === 'setup' && (
            <PlayerSetup onStartGame={startGame} />
          )}

          {gamePhase === 'playing' && (
            <>
              <Box sx={{ mb: 2, textAlign: 'right' }}>
                <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Runde {gameState.round + 1} von {maxRounds}
                </Typography>
              </Box>
              
              <ScoreBoard players={gameState.players} currentPlayer={gameState.currentPlayer} />
              
              <TaskDisplay task={gameState.currentTask} />
              
              <Box display="flex" justifyContent="center" mb={3}>
                <Timer
                  timeLeft={gameState.timeLeft}
                  isRunning={gameState.isRunning}
                  onTimeUp={onTimeUp}
                  onTick={onTick}
                />
              </Box>

              <Box display="flex" justifyContent="center" gap={2}>
                {!gameState.isRunning && gameState.timeLeft > 0 && (
                  <Button
                    onClick={startTimer}
                    variant="contained"
                    size="large"
                    sx={{
                      backgroundColor: '#1976d2',
                      '&:hover': { backgroundColor: '#1565c0' },
                    }}
                  >
                    Timer starten
                  </Button>
                )}
                
                {!gameState.isRunning && gameState.timeLeft === 0 && (
                  <>
                    <Button
                      onClick={() => handleAnswer(true)}
                      variant="contained"
                      startIcon={<CheckIcon />}
                      sx={{
                        backgroundColor: '#4CAF50',
                        '&:hover': { backgroundColor: '#45a049' },
                      }}
                    >
                      Geschafft
                    </Button>
                    <Button
                      onClick={() => handleAnswer(false)}
                      variant="contained"
                      startIcon={<CloseIcon />}
                      sx={{
                        backgroundColor: '#f44336',
                        '&:hover': { backgroundColor: '#da190b' },
                      }}
                    >
                      Nicht geschafft
                    </Button>
                  </>
                )}
                
                {!gameState.isRunning && (
                  <Button
                    onClick={skipTask}
                    variant="outlined"
                    startIcon={<SkipNextIcon />}
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    Überspringen
                  </Button>
                )}
              </Box>
            </>
          )}

          {gamePhase === 'gameOver' && (
            <GameOver players={gameState.players} onRestart={restartGame} />
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
