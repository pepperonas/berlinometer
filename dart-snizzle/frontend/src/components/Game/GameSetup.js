import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const GameSetup = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [gameSettings, setGameSettings] = useState({
    gameMode: '501',
    doubleOut: false,
    doubleIn: false,
    legs: 1,
    sets: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const gameModes = [
    { value: '301', label: '301', description: 'Quick game to 301 points' },
    { value: '501', label: '501', description: 'Standard game to 501 points' },
    { value: '701', label: '701', description: 'Long game to 701 points' },
    { value: 'cricket', label: 'Cricket', description: 'Hit numbers and close them out' },
    { value: 'around-the-clock', label: 'Around the Clock', description: 'Hit numbers 1-20 in order' }
  ];

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/players');
      setPlayers(response.data.players || []);
    } catch (error) {
      setError('Failed to load players');
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlayerSelection = (playerId) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    } else {
      setSelectedPlayers([...selectedPlayers, playerId]);
    }
  };

  const handleStartGame = async () => {
    if (selectedPlayers.length === 0) {
      setError('Please select at least one player');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/games', {
        playerIds: selectedPlayers,
        gameMode: gameSettings.gameMode,
        customSettings: {
          doubleOut: gameSettings.doubleOut,
          doubleIn: gameSettings.doubleIn,
          legs: gameSettings.legs,
          sets: gameSettings.sets
        }
      });
      navigate(`/game/${response.data.game._id}`);
    } catch (error) {
      setError('Failed to create game');
      console.error('Error creating game:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="card">
        <h1>🎯 New Game Setup</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Choose your game mode and players
        </p>
      </div>

      {error && (
        <div className="card" style={{ backgroundColor: 'var(--accent-red)', color: 'white' }}>
          {error}
        </div>
      )}

      {/* Game Mode Selection */}
      <div className="card">
        <h3>Select Game Mode</h3>
        <div className="game-mode-grid" style={{ marginTop: 'var(--spacing-4)' }}>
          {gameModes.map((mode) => (
            <div
              key={mode.value}
              className={`card game-mode-card ${gameSettings.gameMode === mode.value ? 'selected' : ''}`}
              onClick={() => setGameSettings({ ...gameSettings, gameMode: mode.value })}
              style={{ cursor: 'pointer', padding: 'var(--spacing-4)' }}
            >
              <h4>{mode.label}</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-2)' }}>
                {mode.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Game Options */}
      <div className="card">
        <h3>Game Options</h3>
        <div className="grid grid-2" style={{ gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
          <div>
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={gameSettings.doubleOut}
                onChange={(e) => setGameSettings({ ...gameSettings, doubleOut: e.target.checked })}
              />
              <span className="checkmark"></span>
              <span>Double Out Required</span>
            </label>
          </div>
          <div>
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={gameSettings.doubleIn}
                onChange={(e) => setGameSettings({ ...gameSettings, doubleIn: e.target.checked })}
              />
              <span className="checkmark"></span>
              <span>Double In Required</span>
            </label>
          </div>
          <div>
            <label className="form-label">Legs per Set</label>
            <select
              className="form-select"
              value={gameSettings.legs}
              onChange={(e) => setGameSettings({ ...gameSettings, legs: parseInt(e.target.value) })}
            >
              <option value="1">1 Leg</option>
              <option value="3">Best of 3</option>
              <option value="5">Best of 5</option>
            </select>
          </div>
          <div>
            <label className="form-label">Number of Sets</label>
            <select
              className="form-select"
              value={gameSettings.sets}
              onChange={(e) => setGameSettings({ ...gameSettings, sets: parseInt(e.target.value) })}
            >
              <option value="1">1 Set</option>
              <option value="3">Best of 3</option>
              <option value="5">Best of 5</option>
            </select>
          </div>
        </div>
      </div>

      {/* Player Selection */}
      <div className="card">
        <h3>Select Players ({selectedPlayers.length} selected)</h3>
        
        {players.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-4)' }}>
              No players available. Create players first!
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/players')}
            >
              👥 Go to Player Manager
            </button>
          </div>
        ) : (
          <div className="grid grid-3" style={{ gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
            {players.map((player) => (
              <div
                key={player._id}
                className={`card player-card ${selectedPlayers.includes(player._id) ? 'selected' : ''}`}
                onClick={() => togglePlayerSelection(player._id)}
                style={{
                  cursor: 'pointer',
                  backgroundColor: selectedPlayers.includes(player._id) 
                    ? 'rgba(104, 141, 177, 0.2)' 
                    : 'var(--background-darker)',
                  border: selectedPlayers.includes(player._id) 
                    ? '2px solid var(--accent-blue)' 
                    : '2px solid transparent',
                  transition: 'all 0.3s ease'
                }}
              >
                <div className="player-avatar" style={{ 
                  backgroundColor: player.color || 'var(--accent-blue)',
                  width: '50px',
                  height: '50px',
                  fontSize: '1.25rem'
                }}>
                  {getInitials(player.name)}
                </div>
                <h4 style={{ textAlign: 'center', marginTop: 'var(--spacing-2)' }}>
                  {player.name}
                </h4>
                {selectedPlayers.includes(player._id) && (
                  <div style={{ textAlign: 'center', marginTop: 'var(--spacing-2)' }}>
                    ✅ Selected
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Start Game Button */}
      <div className="card" style={{ textAlign: 'center' }}>
        <button
          className="btn btn-primary btn-large"
          onClick={handleStartGame}
          disabled={loading || selectedPlayers.length === 0}
          style={{ minWidth: '200px' }}
        >
          {loading ? (
            <span>Creating Game...</span>
          ) : (
            <span>🎯 Start Game</span>
          )}
        </button>
        {selectedPlayers.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--spacing-2)' }}>
            Select at least one player to start
          </p>
        )}
      </div>
    </div>
  );
};

export default GameSetup;