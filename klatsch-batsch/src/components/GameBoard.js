import React, { useState } from 'react';
import { Dices, RotateCcw } from './Icons';
import ActiveCards from './ActiveCards';
import '../components/CardDeck.css';

const GameBoard = ({ 
    players,
    currentCard,
    isDrawing,
    showCard,
    drawCard,
    resetGame,
    activeCards,
    removeActiveCard
}) => {
    const [selectedCardIndex, setSelectedCardIndex] = useState(null);
    const [revealingCardIndex, setRevealingCardIndex] = useState(null);
    const [deckShuffle, setDeckShuffle] = useState(0);
    
    const handleCardClick = (cardIndex) => {
        if (isDrawing) return;
        
        setSelectedCardIndex(cardIndex);
        
        // Show selection animation, then revealing animation
        setTimeout(() => {
            setRevealingCardIndex(cardIndex);
            
            // Start drawing after revealing animation begins
            setTimeout(() => {
                drawCard(cardIndex);
                setSelectedCardIndex(null);
                
                // Remove revealing class after animation completes
                setTimeout(() => {
                    setRevealingCardIndex(null);
                    // Slightly reorganize the deck after each draw
                    setDeckShuffle(prev => prev + 1);
                }, 1800);
            }, 100);
        }, 300);
    };
    
    // Create array for 6 cards to display
    const cardIndices = Array.from({ length: 6 }, (_, i) => i);
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="game-card">
                    <div className="game-header">
                        <h1 className="game-title">
                            <Dices />
                            Klatsch-Batsch
                        </h1>
                        <button
                            onClick={resetGame}
                            className="reset-button"
                            title="Spiel beenden"
                        >
                            <RotateCcw />
                        </button>
                    </div>
                    
                    <div className="card-deck-container">
                        <div className="deck-spread">
                            {cardIndices.map((cardIndex) => (
                                <div 
                                    key={`${cardIndex}-${deckShuffle}`}
                                    className={`deck-card deck-card-${cardIndex} ${
                                        selectedCardIndex === cardIndex ? 'selected' : ''
                                    } ${
                                        revealingCardIndex === cardIndex ? 'revealing' : ''
                                    }`}
                                    onClick={() => handleCardClick(cardIndex)}
                                    style={{
                                        // Add slight variation to positioning after shuffles (adjusted for 6 cards, shifted right)
                                        '--base-transform': `translate(${cardIndex * 60 + (deckShuffle * 2) % 10 + 40}px, ${
                                            Math.abs(cardIndex - 2.5) * 3 + (deckShuffle * 1.5) % 8 - 4
                                        }px) rotate(${
                                            (cardIndex - 2.5) * 8 + (deckShuffle * 3) % 12 - 6
                                        }deg)`,
                                        transform: `translate(${cardIndex * 60 + (deckShuffle * 2) % 10 + 40}px, ${
                                            Math.abs(cardIndex - 2.5) * 3 + (deckShuffle * 1.5) % 8 - 4
                                        }px) rotate(${
                                            (cardIndex - 2.5) * 8 + (deckShuffle * 3) % 12 - 6
                                        }deg)`
                                    }}
                                >
                                    <div className="deck-card-back">
                                        <span className="deck-card-text">Klatsch-Batsch</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {!isDrawing && !currentCard && (
                            <p style={{ 
                                textAlign: 'center', 
                                color: 'var(--text-secondary)', 
                                fontStyle: 'italic',
                                marginTop: 'var(--space-md)'
                            }}>
                                Klicke auf eine Karte um sie zu ziehen
                            </p>
                        )}
                    </div>
                    
                    {currentCard && showCard && (
                        <div className="card-display animate-fadeIn">
                            <h2 className="card-title">{currentCard.title}</h2>
                            <p className="card-description">{currentCard.description}</p>
                        </div>
                    )}
                    
                    <ActiveCards 
                        activeCards={activeCards} 
                        removeActiveCard={removeActiveCard} 
                    />
                    
                    <div className="players-display">
                        {players.map((player) => (
                            <span key={player.id} className="player-tag">
                                {player.name}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameBoard;