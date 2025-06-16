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
