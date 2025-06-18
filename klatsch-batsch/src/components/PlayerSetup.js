import React from 'react';
import {BookOpen, ChevronRight, Dices, Plus, Users, X} from './Icons';
import './PlayerSetup.css';

const PlayerSetup = ({
                         players,
                         newPlayerName,
                         setNewPlayerName,
                         addPlayer,
                         removePlayer,
                         startGame,
                         showInstructions
                     }) => {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="game-card">
                    <h1 className="game-title">
                        <Dices/>
                        Klatsch-Batsch
                    </h1>

                    <div className="player-setup-container">
                        <h2 className="section-title">
                            <Users/>
                            Spieler hinzufügen
                        </h2>

                        <div className="input-group">
                            <input
                                type="text"
                                value={newPlayerName}
                                onChange={(e) => setNewPlayerName(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        if (newPlayerName.trim()) {
                                            addPlayer();
                                        } else if (players.length >= 2) {
                                            startGame();
                                        }
                                    }
                                }}
                                placeholder="Spielername eingeben..."
                                className="player-input"
                                maxLength={20}
                            />
                            <button
                                onClick={addPlayer}
                                className="add-button"
                                aria-label="Spieler hinzufügen"
                            >
                                <Plus/>
                            </button>
                        </div>

                        <div className="player-list">
                            {players.map((player) => (
                                <div key={player.id} className="player-item">
                                    <span className="player-name">{player.name}</span>
                                    <button
                                        onClick={() => removePlayer(player.id)}
                                        className="remove-button"
                                        aria-label={`${player.name} entfernen`}
                                    >
                                        <X/>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {players.length < 2 && (
                            <p className="min-players-text">
                                Mindestens 2 Spieler benötigt
                            </p>
                        )}
                    </div>

                    <div className="button-group">
                        <button
                            onClick={startGame}
                            disabled={players.length < 2}
                            className={`start-button ${players.length >= 2 ? 'enabled' : 'disabled'}`}
                        >
                            Spiel starten
                            <ChevronRight/>
                        </button>
                        <button
                            onClick={showInstructions}
                            className="instructions-button"
                        >
                            <BookOpen/>
                            Anleitung
                        </button>
                    </div>

                    <div className="footer">
                        Made with ❤️ by Martin Pfeffer
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerSetup;