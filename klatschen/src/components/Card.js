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
