import React, { useState } from 'react';
import PlayerSetup from './components/PlayerSetup';
import GameBoard from './components/GameBoard';
import { cards } from './data/cards';
import './App.css';

const App = () => {
    const [gameState, setGameState] = useState('setup');
    const [players, setPlayers] = useState([]);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [currentCard, setCurrentCard] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [usedCards, setUsedCards] = useState([]);
    const [kingsCupCount, setKingsCupCount] = useState(0);
    const [activeCards, setActiveCards] = useState([]);
    const [showCard, setShowCard] = useState(false);

    const getCardDescription = (card) => {
        if (card.id === 18) {
            return kingsCupCount < 3 
                ? "Fülle das Glas in der Mitte mit deinem Getränk." 
                : "Du musst das King's Cup austrinken!";
        }
        return card.description;
    };

    const drawCard = (cardIndex) => {
        if (isDrawing) return;
        
        setIsDrawing(true);
        setShowCard(false);
        setCurrentCard(null);
        
        // Get available cards that haven't been used yet
        const availableCards = cards.filter(card => !usedCards.includes(card.id));
        let selectedCard;
        
        if (availableCards.length === 0) {
            // Reset if all cards have been used
            setUsedCards([]);
            selectedCard = cards[Math.floor(Math.random() * cards.length)];
        } else {
            // Pick a random card from available ones
            selectedCard = availableCards[Math.floor(Math.random() * availableCards.length)];
            setUsedCards([...usedCards, selectedCard.id]);
        }
        
        const cardWithDescription = {
            ...selectedCard,
            description: getCardDescription(selectedCard)
        };
        
        // Show card after delay
        setTimeout(() => {
            setCurrentCard(cardWithDescription);
            
            if (selectedCard.id === 18) {
                setKingsCupCount(prev => prev + 1);
            }
            
            if (selectedCard.persistent) {
                addActiveCard(cardWithDescription);
            }
            
            setShowCard(true);
            setIsDrawing(false);
        }, 800);
    };

    const addPlayer = () => {
        if (newPlayerName.trim()) {
            setPlayers([...players, { id: Date.now(), name: newPlayerName.trim() }]);
            setNewPlayerName('');
        }
    };

    const removePlayer = (id) => {
        setPlayers(players.filter(p => p.id !== id));
    };

    const addActiveCard = (card) => {
        const isAlreadyActive = activeCards.some(activeCard => activeCard.id === card.id);
        if (!isAlreadyActive) {
            setActiveCards(prev => [...prev, card]);
        }
    };

    const removeActiveCard = (cardId) => {
        setActiveCards(prev => prev.filter(card => card.id !== cardId));
    };

    const startGame = () => {
        if (players.length >= 2) {
            setGameState('playing');
        }
    };

    const resetGame = () => {
        setGameState('setup');
        setCurrentCard(null);
        setUsedCards([]);
        setKingsCupCount(0);
        setActiveCards([]);
        setShowCard(false);
    };

    if (gameState === 'setup') {
        return (
            <PlayerSetup
                players={players}
                newPlayerName={newPlayerName}
                setNewPlayerName={setNewPlayerName}
                addPlayer={addPlayer}
                removePlayer={removePlayer}
                startGame={startGame}
            />
        );
    }

    return (
        <GameBoard
            players={players}
            currentCard={currentCard}
            isDrawing={isDrawing}
            showCard={showCard}
            drawCard={drawCard}
            resetGame={resetGame}
            activeCards={activeCards}
            removeActiveCard={removeActiveCard}
        />
    );
};

export default App;