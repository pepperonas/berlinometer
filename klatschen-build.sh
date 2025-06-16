#!/bin/bash

# Klatschen Kartenspiel React App Builder
echo "🎮 Erstelle Klatschen Kartenspiel..."

# Projektverzeichnis erstellen
PROJECT_NAME="klatschen-game"
rm -rf $PROJECT_NAME
mkdir -p $PROJECT_NAME
cd $PROJECT_NAME

# package.json erstellen
cat > package.json << 'EOF'
{
  "name": "klatschen-game",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": ["react-app"]
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  }
}
EOF

# Verzeichnisstruktur erstellen
mkdir -p public src/components src/utils

# public/index.html
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#2C2E3B" />
  <meta name="description" content="Klatschen Kartenspiel" />
  <title>Klatschen - Das Kartenspiel</title>
</head>
<body>
  <noscript>Du musst JavaScript aktivieren, um diese App zu nutzen.</noscript>
  <div id="root"></div>
</body>
</html>
EOF

# src/index.js
cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# src/index.css
cat > src/index.css << 'EOF'
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #1a1b23;
  color: #ffffff;
  min-height: 100vh;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
}
EOF

# src/App.js
cat > src/App.js << 'EOF'
import React, { useState, useEffect } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import ScoreBoard from './components/ScoreBoard';
import GameControls from './components/GameControls';
import { initializeDeck, dealCards, calculateHandValue, checkGameEnd } from './utils/gameLogic';

function App() {
  const [gameState, setGameState] = useState({
    deck: [],
    playerHand: [],
    aiHand: [],
    middleCards: [],
    currentPlayer: 'player',
    playerLives: 3,
    aiLives: 3,
    gamePhase: 'menu', // menu, playing, roundEnd, gameOver
    lastAction: '',
    hasKnocked: false,
    knockedBy: null,
    turnsSinceKnock: 0
  });

  const startNewGame = () => {
    const deck = initializeDeck();
    const { playerHand, aiHand, middleCards, remainingDeck } = dealCards(deck);
    
    setGameState({
      deck: remainingDeck,
      playerHand,
      aiHand,
      middleCards,
      currentPlayer: 'player',
      playerLives: 3,
      aiLives: 3,
      gamePhase: 'playing',
      lastAction: 'Neues Spiel gestartet!',
      hasKnocked: false,
      knockedBy: null,
      turnsSinceKnock: 0
    });
  };

  const startNewRound = () => {
    const deck = initializeDeck();
    const { playerHand, aiHand, middleCards, remainingDeck } = dealCards(deck);
    
    setGameState(prev => ({
      ...prev,
      deck: remainingDeck,
      playerHand,
      aiHand,
      middleCards,
      currentPlayer: 'player',
      gamePhase: 'playing',
      lastAction: 'Neue Runde gestartet!',
      hasKnocked: false,
      knockedBy: null,
      turnsSinceKnock: 0
    }));
  };

  const swapCard = (handIndex, middleIndex) => {
    if (gameState.currentPlayer !== 'player' || gameState.gamePhase !== 'playing') return;

    const newPlayerHand = [...gameState.playerHand];
    const newMiddleCards = [...gameState.middleCards];
    
    [newPlayerHand[handIndex], newMiddleCards[middleIndex]] = 
    [newMiddleCards[middleIndex], newPlayerHand[handIndex]];

    setGameState(prev => ({
      ...prev,
      playerHand: newPlayerHand,
      middleCards: newMiddleCards,
      currentPlayer: 'ai',
      lastAction: 'Du hast eine Karte getauscht'
    }));
  };

  const swapAllCards = () => {
    if (gameState.currentPlayer !== 'player' || gameState.gamePhase !== 'playing') return;

    setGameState(prev => ({
      ...prev,
      playerHand: prev.middleCards,
      middleCards: prev.playerHand,
      currentPlayer: 'ai',
      lastAction: 'Du hast alle Karten getauscht'
    }));
  };

  const knock = () => {
    if (gameState.currentPlayer !== 'player' || gameState.gamePhase !== 'playing' || gameState.hasKnocked) return;

    setGameState(prev => ({
      ...prev,
      hasKnocked: true,
      knockedBy: 'player',
      currentPlayer: 'ai',
      lastAction: 'Du hast geklopft! Letzte Runde!'
    }));
  };

  // KI-Zug
  useEffect(() => {
    if (gameState.currentPlayer === 'ai' && gameState.gamePhase === 'playing') {
      const timer = setTimeout(() => {
        const aiValue = calculateHandValue(gameState.aiHand);
        const middleValues = gameState.middleCards.map((card, index) => {
          const tempHand = [...gameState.aiHand];
          tempHand[0] = card;
          return { index, value: calculateHandValue(tempHand) };
        });

        const bestSwap = middleValues.reduce((best, current) => 
          current.value > best.value ? current : best
        );

        let newState = { ...gameState };

        if (bestSwap.value > aiValue && bestSwap.value - aiValue > 3) {
          // Tausche eine Karte
          const aiHandIndex = Math.floor(Math.random() * 3);
          const newAiHand = [...gameState.aiHand];
          const newMiddleCards = [...gameState.middleCards];
          
          [newAiHand[aiHandIndex], newMiddleCards[bestSwap.index]] = 
          [newMiddleCards[bestSwap.index], newAiHand[aiHandIndex]];

          newState = {
            ...newState,
            aiHand: newAiHand,
            middleCards: newMiddleCards,
            lastAction: 'KI hat eine Karte getauscht'
          };
        } else if (aiValue >= 28 && !gameState.hasKnocked) {
          // KI klopft
          newState = {
            ...newState,
            hasKnocked: true,
            knockedBy: 'ai',
            lastAction: 'KI hat geklopft! Letzte Runde!'
          };
        } else {
          newState = {
            ...newState,
            lastAction: 'KI hat gepasst'
          };
        }

        // Prüfe ob Runde endet
        if (gameState.hasKnocked) {
          newState.turnsSinceKnock = gameState.turnsSinceKnock + 1;
          if (newState.turnsSinceKnock >= 1) {
            // Runde beenden
            const result = checkGameEnd(newState.playerHand, newState.aiHand);
            if (result.winner === 'ai') {
              newState.playerLives = Math.max(0, newState.playerLives - 1);
            } else if (result.winner === 'player') {
              newState.aiLives = Math.max(0, newState.aiLives - 1);
            }
            
            newState.gamePhase = newState.playerLives === 0 || newState.aiLives === 0 ? 'gameOver' : 'roundEnd';
            newState.lastAction = result.message;
          }
        }

        newState.currentPlayer = newState.gamePhase === 'playing' ? 'player' : newState.currentPlayer;
        setGameState(newState);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [gameState]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Klatschen</h1>
        <p className="subtitle">Sammle 31 Punkte!</p>
      </header>

      {gameState.gamePhase === 'menu' ? (
        <div className="menu">
          <h2>Willkommen beim Klatschen!</h2>
          <p>Versuche 31 Punkte oder möglichst viele Punkte einer Farbe zu sammeln.</p>
          <button className="primary-button" onClick={startNewGame}>
            Spiel starten
          </button>
        </div>
      ) : (
        <>
          <ScoreBoard 
            playerLives={gameState.playerLives}
            aiLives={gameState.aiLives}
            currentPlayer={gameState.currentPlayer}
            lastAction={gameState.lastAction}
          />
          
          <GameBoard 
            playerHand={gameState.playerHand}
            aiHand={gameState.aiHand}
            middleCards={gameState.middleCards}
            onSwapCard={swapCard}
            currentPlayer={gameState.currentPlayer}
            gamePhase={gameState.gamePhase}
          />
          
          <GameControls 
            onSwapAll={swapAllCards}
            onKnock={knock}
            onNewRound={startNewRound}
            onNewGame={startNewGame}
            gamePhase={gameState.gamePhase}
            hasKnocked={gameState.hasKnocked}
            currentPlayer={gameState.currentPlayer}
          />
        </>
      )}
    </div>
  );
}

export default App;
EOF

# src/App.css
cat > src/App.css << 'EOF'
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1b23 0%, #2C2E3B 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.app-header {
  text-align: center;
  margin-bottom: 30px;
}

.app-header h1 {
  font-size: 3rem;
  margin-bottom: 10px;
  color: #ffffff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 1.2rem;
  color: #b0b3c1;
}

.menu {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.menu h2 {
  margin-bottom: 20px;
  color: #ffffff;
}

.menu p {
  margin-bottom: 30px;
  color: #b0b3c1;
  font-size: 1.1rem;
}

.primary-button {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 15px 40px;
  font-size: 1.2rem;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
}

.primary-button:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
}

.primary-button:active {
  transform: translateY(0);
}
EOF

# src/components/GameBoard.js
cat > src/components/GameBoard.js << 'EOF'
import React from 'react';
import Card from './Card';
import './GameBoard.css';

function GameBoard({ playerHand, aiHand, middleCards, onSwapCard, currentPlayer, gamePhase }) {
  const handleCardClick = (handIndex, middleIndex) => {
    if (currentPlayer === 'player' && gamePhase === 'playing') {
      onSwapCard(handIndex, middleIndex);
    }
  };

  return (
    <div className="game-board">
      <div className="ai-section">
        <h3>KI Spieler</h3>
        <div className="hand">
          {aiHand.map((card, index) => (
            <Card 
              key={index} 
              card={card} 
              isHidden={gamePhase === 'playing'}
              disabled={true}
            />
          ))}
        </div>
      </div>

      <div className="middle-section">
        <h3>Tisch</h3>
        <div className="middle-cards">
          {middleCards.map((card, index) => (
            <Card 
              key={index} 
              card={card}
              onClick={() => currentPlayer === 'player' && gamePhase === 'playing' && 
                handleCardClick(0, index)}
              disabled={currentPlayer !== 'player' || gamePhase !== 'playing'}
              isMiddle={true}
            />
          ))}
        </div>
      </div>

      <div className="player-section">
        <h3>Deine Karten</h3>
        <div className="hand">
          {playerHand.map((card, index) => (
            <Card 
              key={index} 
              card={card}
              isPlayer={true}
              disabled={currentPlayer !== 'player' || gamePhase !== 'playing'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default GameBoard;
EOF

# src/components/GameBoard.css
cat > src/components/GameBoard.css << 'EOF'
.game-board {
  display: flex;
  flex-direction: column;
  gap: 30px;
  align-items: center;
  width: 100%;
  max-width: 800px;
}

.ai-section, .player-section, .middle-section {
  width: 100%;
}

.ai-section h3, .player-section h3, .middle-section h3 {
  text-align: center;
  margin-bottom: 15px;
  color: #ffffff;
  font-size: 1.3rem;
}

.hand, .middle-cards {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.middle-section {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
EOF

# src/components/Card.js
cat > src/components/Card.js << 'EOF'
import React from 'react';
import './Card.css';

function Card({ card, onClick, isHidden, disabled, isPlayer, isMiddle }) {
  const getSuitSymbol = (suit) => {
    const symbols = {
      'hearts': '♥',
      'diamonds': '♦',
      'clubs': '♣',
      'spades': '♠'
    };
    return symbols[suit];
  };

  const getSuitColor = (suit) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
  };

  const getDisplayValue = (value) => {
    const displays = {
      '11': 'J',
      '12': 'Q',
      '13': 'K',
      '14': 'A'
    };
    return displays[value] || value;
  };

  if (isHidden) {
    return (
      <div className="card card-back">
        <div className="card-pattern"></div>
      </div>
    );
  }

  return (
    <div 
      className={`card ${getSuitColor(card.suit)} ${disabled ? 'disabled' : ''} ${isMiddle ? 'clickable' : ''}`}
      onClick={!disabled ? onClick : undefined}
    >
      <div className="card-corner top-left">
        <div className="card-value">{getDisplayValue(card.value)}</div>
        <div className="card-suit">{getSuitSymbol(card.suit)}</div>
      </div>
      <div className="card-center">
        <div className="card-suit-large">{getSuitSymbol(card.suit)}</div>
      </div>
      <div className="card-corner bottom-right">
        <div className="card-value">{getDisplayValue(card.value)}</div>
        <div className="card-suit">{getSuitSymbol(card.suit)}</div>
      </div>
    </div>
  );
}

export default Card;
EOF

# src/components/Card.css
cat > src/components/Card.css << 'EOF'
.card {
  width: 100px;
  height: 140px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  position: relative;
  cursor: default;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card.clickable:not(.disabled) {
  cursor: pointer;
}

.card.clickable:not(.disabled):hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
}

.card.disabled {
  opacity: 0.7;
}

.card.red {
  color: #d32f2f;
}

.card.black {
  color: #1a1b23;
}

.card-back {
  background: linear-gradient(45deg, #2C2E3B 25%, #3a3c4a 25%, #3a3c4a 50%, #2C2E3B 50%, #2C2E3B 75%, #3a3c4a 75%);
  background-size: 20px 20px;
  color: transparent;
}

.card-corner {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-weight: bold;
}

.card-corner.top-left {
  top: 8px;
  left: 8px;
}

.card-corner.bottom-right {
  bottom: 8px;
  right: 8px;
  transform: rotate(180deg);
}

.card-value {
  font-size: 1.2rem;
  line-height: 1;
  font-weight: 700;
}

.card-suit {
  font-size: 1.1rem;
  line-height: 1;
}

.card-suit-large {
  font-size: 3rem;
  opacity: 0.3;
}

.card-pattern {
  width: 100%;
  height: 100%;
  border-radius: 10px;
}
EOF

# src/components/ScoreBoard.js
cat > src/components/ScoreBoard.js << 'EOF'
import React from 'react';
import './ScoreBoard.css';

function ScoreBoard({ playerLives, aiLives, currentPlayer, lastAction }) {
  const renderLives = (lives) => {
    return '❤️'.repeat(lives) + '💔'.repeat(3 - lives);
  };

  return (
    <div className="score-board">
      <div className="score-section">
        <h3>Du</h3>
        <div className="lives">{renderLives(playerLives)}</div>
        {currentPlayer === 'player' && <div className="turn-indicator">Dein Zug</div>}
      </div>
      
      <div className="action-display">
        {lastAction && <p>{lastAction}</p>}
      </div>
      
      <div className="score-section">
        <h3>KI</h3>
        <div className="lives">{renderLives(aiLives)}</div>
        {currentPlayer === 'ai' && <div className="turn-indicator">KI denkt...</div>}
      </div>
    </div>
  );
}

export default ScoreBoard;
EOF

# src/components/ScoreBoard.css
cat > src/components/ScoreBoard.css << 'EOF'
.score-board {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 800px;
  margin-bottom: 30px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 20px 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.score-section {
  text-align: center;
}

.score-section h3 {
  color: #ffffff;
  margin-bottom: 10px;
  font-size: 1.2rem;
}

.lives {
  font-size: 1.5rem;
  margin-bottom: 10px;
}

.turn-indicator {
  background: #4CAF50;
  color: white;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 0.9rem;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}

.action-display {
  flex: 1;
  text-align: center;
  padding: 0 20px;
}

.action-display p {
  color: #b0b3c1;
  font-size: 1.1rem;
  margin: 0;
}
EOF

# src/components/GameControls.js
cat > src/components/GameControls.js << 'EOF'
import React from 'react';
import './GameControls.css';

function GameControls({ onSwapAll, onKnock, onNewRound, onNewGame, gamePhase, hasKnocked, currentPlayer }) {
  if (gamePhase === 'playing') {
    return (
      <div className="game-controls">
        <button 
          className="control-button swap-all"
          onClick={onSwapAll}
          disabled={currentPlayer !== 'player' || hasKnocked}
        >
          Alle Karten tauschen
        </button>
        <button 
          className="control-button knock"
          onClick={onKnock}
          disabled={currentPlayer !== 'player' || hasKnocked}
        >
          Klopfen
        </button>
      </div>
    );
  }

  if (gamePhase === 'roundEnd') {
    return (
      <div className="game-controls">
        <button className="control-button new-round" onClick={onNewRound}>
          Nächste Runde
        </button>
      </div>
    );
  }

  if (gamePhase === 'gameOver') {
    return (
      <div className="game-controls">
        <button className="control-button new-game" onClick={onNewGame}>
          Neues Spiel
        </button>
      </div>
    );
  }

  return null;
}

export default GameControls;
EOF

# src/components/GameControls.css
cat > src/components/GameControls.css << 'EOF'
.game-controls {
  display: flex;
  gap: 20px;
  margin-top: 30px;
  flex-wrap: wrap;
  justify-content: center;
}

.control-button {
  padding: 12px 30px;
  font-size: 1.1rem;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.control-button.swap-all {
  background: #2196F3;
}

.control-button.swap-all:hover:not(:disabled) {
  background: #1976D2;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
}

.control-button.knock {
  background: #FF9800;
}

.control-button.knock:hover:not(:disabled) {
  background: #F57C00;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 152, 0, 0.4);
}

.control-button.new-round,
.control-button.new-game {
  background: #4CAF50;
}

.control-button.new-round:hover,
.control-button.new-game:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
}
EOF

# src/utils/gameLogic.js
cat > src/utils/gameLogic.js << 'EOF'
// Karten-Definitionen
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const values = [7, 8, 9, 10, 11, 12, 13, 14]; // 11=Bube, 12=Dame, 13=König, 14=Ass

export function initializeDeck() {
  const deck = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }
  return shuffleDeck(deck);
}

function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck) {
  const playerHand = deck.slice(0, 3);
  const aiHand = deck.slice(3, 6);
  const middleCards = deck.slice(6, 9);
  const remainingDeck = deck.slice(9);
  
  return { playerHand, aiHand, middleCards, remainingDeck };
}

export function getCardPoints(card) {
  if (card.value === 14) return 11; // Ass
  if (card.value >= 11) return 10; // Bube, Dame, König
  return card.value; // 7-10
}

export function calculateHandValue(hand) {
  // Berechne Punkte pro Farbe
  const suitPoints = {};
  for (const suit of suits) {
    suitPoints[suit] = 0;
  }
  
  for (const card of hand) {
    suitPoints[card.suit] += getCardPoints(card);
  }
  
  // Finde höchste Punktzahl einer Farbe
  let maxPoints = 0;
  for (const suit of suits) {
    if (suitPoints[suit] > maxPoints) {
      maxPoints = suitPoints[suit];
    }
  }
  
  // Prüfe auf 31 (Ass + 10 + 10 gleicher Farbe)
  for (const suit of suits) {
    if (suitPoints[suit] === 31) {
      return 31;
    }
  }
  
  // Prüfe auf drei gleiche Werte (30.5 Punkte)
  const valueCounts = {};
  for (const card of hand) {
    valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
  }
  
  for (const value in valueCounts) {
    if (valueCounts[value] === 3) {
      return 30.5;
    }
  }
  
  return maxPoints;
}

export function checkGameEnd(playerHand, aiHand) {
  const playerValue = calculateHandValue(playerHand);
  const aiValue = calculateHandValue(aiHand);
  
  if (playerValue > aiValue) {
    return { 
      winner: 'player', 
      message: `Du gewinnst die Runde! ${playerValue} zu ${aiValue} Punkte` 
    };
  } else if (aiValue > playerValue) {
    return { 
      winner: 'ai', 
      message: `KI gewinnt die Runde! ${aiValue} zu ${playerValue} Punkte` 
    };
  } else {
    return { 
      winner: 'tie', 
      message: `Unentschieden! Beide haben ${playerValue} Punkte` 
    };
  }
}
EOF

# Dependencies installieren und Build erstellen
echo "📦 Installiere Dependencies..."
npm install

echo "🔨 Erstelle Production Build..."
npm run build

echo "✅ Fertig! Das Spiel wurde erfolgreich gebaut."
echo "📁 Der Build-Ordner befindet sich in: $PROJECT_NAME/build"
echo ""
echo "🚀 Upload-Anleitung:"
echo "1. Lade den kompletten 'build' Ordner auf deinen VPS hoch"
echo "2. Serviere die Dateien mit einem Webserver (nginx, Apache, etc.)"
echo "3. Die index.html ist der Einstiegspunkt"
echo ""
echo "💡 Tipp: Du kannst das Spiel lokal testen mit:"
echo "   cd $PROJECT_NAME && npm start"
EOF