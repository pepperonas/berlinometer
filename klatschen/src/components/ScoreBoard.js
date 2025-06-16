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
