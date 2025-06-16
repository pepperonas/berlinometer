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
