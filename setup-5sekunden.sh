#!/bin/bash

# 5 Sekunden Battle - React App Setup Script
echo "🎮 Erstelle 5 Sekunden Battle React App..."

# Projekt erstellen
PROJECT_NAME="5-sekunden-battle"
npx create-react-app $PROJECT_NAME --template typescript
cd $PROJECT_NAME

# Abhängigkeiten installieren
echo "📦 Installiere Abhängigkeiten..."
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material

# Verzeichnisstruktur erstellen
mkdir -p src/components
mkdir -p src/data
mkdir -p src/types
mkdir -p src/styles

# Types erstellen
cat > src/types/game.ts << 'EOF'
export interface Task {
  id: string;
  category: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Player {
  name: string;
  score: number;
}

export interface GameState {
  currentPlayer: number;
  players: Player[];
  currentTask: Task | null;
  timeLeft: number;
  isRunning: boolean;
  round: number;
}
EOF

# Aufgaben-Daten
cat > src/data/tasks.ts << 'EOF'
import { Task } from '../types/game';

export const tasks: Task[] = [
  // Nenne 3...
  { id: '1', category: 'Nenne 3', question: 'Nenne 3 Obstsorten', difficulty: 'easy' },
  { id: '2', category: 'Nenne 3', question: 'Nenne 3 Hauptstädte', difficulty: 'medium' },
  { id: '3', category: 'Nenne 3', question: 'Nenne 3 Superhelden', difficulty: 'easy' },
  { id: '4', category: 'Nenne 3', question: 'Nenne 3 Automarken', difficulty: 'easy' },
  { id: '5', category: 'Nenne 3', question: 'Nenne 3 Planeten', difficulty: 'medium' },
  { id: '6', category: 'Nenne 3', question: 'Nenne 3 Musikinstrumente', difficulty: 'easy' },
  { id: '7', category: 'Nenne 3', question: 'Nenne 3 Sportarten', difficulty: 'easy' },
  { id: '8', category: 'Nenne 3', question: 'Nenne 3 Programmiersprachen', difficulty: 'hard' },
  
  // Buchstabiere rückwärts
  { id: '9', category: 'Rückwärts', question: 'Buchstabiere "HAUS" rückwärts', difficulty: 'easy' },
  { id: '10', category: 'Rückwärts', question: 'Buchstabiere "SCHULE" rückwärts', difficulty: 'medium' },
  { id: '11', category: 'Rückwärts', question: 'Buchstabiere "COMPUTER" rückwärts', difficulty: 'hard' },
  
  // Mathe
  { id: '12', category: 'Mathe', question: 'Was ist 7 x 8?', difficulty: 'easy' },
  { id: '13', category: 'Mathe', question: 'Was ist 13 x 7?', difficulty: 'medium' },
  { id: '14', category: 'Mathe', question: 'Was ist 23 x 17?', difficulty: 'hard' },
  
  // Zungenbrecher
  { id: '15', category: 'Zungenbrecher', question: 'Sage 3x schnell: "Fischers Fritz fischt frische Fische"', difficulty: 'medium' },
  { id: '16', category: 'Zungenbrecher', question: 'Sage 3x schnell: "Blaukraut bleibt Blaukraut"', difficulty: 'easy' },
  
  // Weitere Kategorien
  { id: '17', category: 'Nenne 3', question: 'Nenne 3 Filme mit Tom Hanks', difficulty: 'hard' },
  { id: '18', category: 'Nenne 3', question: 'Nenne 3 Pizza-Beläge', difficulty: 'easy' },
  { id: '19', category: 'Nenne 3', question: 'Nenne 3 Social Media Plattformen', difficulty: 'easy' },
  { id: '20', category: 'Nenne 3', question: 'Nenne 3 Dinosaurier-Arten', difficulty: 'hard' },
];
EOF

# Timer Component
cat > src/components/Timer.tsx << 'EOF'
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
EOF

# Task Display Component
cat > src/components/TaskDisplay.tsx << 'EOF'
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
EOF

# Player Setup Component
cat > src/components/PlayerSetup.tsx << 'EOF'
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
EOF

# Score Board Component
cat > src/components/ScoreBoard.tsx << 'EOF'
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
EOF

# Game Over Component
cat > src/components/GameOver.tsx << 'EOF'
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
EOF

# Main App Component
cat > src/App.tsx << 'EOF'
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
EOF

# CSS Styles
cat > src/App.css << 'EOF'
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}
EOF

# Index anpassen
cat > src/index.tsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# Public index.html anpassen
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#2C2E3B" />
    <meta name="description" content="5 Sekunden Battle - Das ultimative Partyspiel" />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <title>5 Sekunden Battle</title>
  </head>
  <body>
    <noscript>Du musst JavaScript aktivieren um diese App zu nutzen.</noscript>
    <div id="root"></div>
  </body>
</html>
EOF

# Build erstellen
echo "🔨 Erstelle Production Build..."
npm run build

# Deployment-Info
echo ""
echo "✅ 5 Sekunden Battle App wurde erfolgreich erstellt!"
echo ""
echo "📁 Der Build-Ordner befindet sich hier: $PROJECT_NAME/build"
echo ""
echo "🚀 Deployment auf deinen VPS:"
echo "   1. Lade den 'build' Ordner auf deinen VPS hoch"
echo "   2. Konfiguriere deinen Webserver (nginx/Apache) um auf den build Ordner zu zeigen"
echo "   3. Für nginx kannst du diese Config verwenden:"
echo ""
echo "   server {"
echo "       listen 80;"
echo "       server_name deine-domain.de;"
echo "       root /pfad/zum/build;"
echo "       index index.html;"
echo "       location / {"
echo "           try_files \$uri /index.html;"
echo "       }"
echo "   }"
echo ""
echo "🎮 Viel Spaß beim Spielen!"
EOF
