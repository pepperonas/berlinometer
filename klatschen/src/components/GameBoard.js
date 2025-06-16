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
