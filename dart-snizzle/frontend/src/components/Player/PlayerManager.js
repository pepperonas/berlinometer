import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const PlayerManager = () => {
  const [players, setPlayers] = useState([]);
  const [newPlayer, setNewPlayer] = useState({ name: '', color: '#688db1' });
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Color palette with 20 distinct colors
  const colorPalette = [
    '#688db1', // Accent Blue (default)
    '#9cb68f', // Accent Green  
    '#e16162', // Accent Red
    '#f4a261', // Orange
    '#2a9d8f', // Teal
    '#e76f51', // Coral
    '#264653', // Dark Green
    '#e9c46a', // Yellow
    '#e63946', // Bright Red
    '#f77f00', // Bright Orange
    '#fcbf49', // Golden
    '#003049', // Navy
    '#d62828', // Crimson
    '#8e44ad', // Purple
    '#3498db', // Light Blue
    '#1abc9c', // Turquoise
    '#6f1d1b', // Burgundy
    '#99582a', // Brown
    '#432818', // Dark Brown
    '#bb9457'  // Light Brown
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

  const handleCreatePlayer = async (e) => {
    e.preventDefault();
    if (!newPlayer.name.trim()) return;

    try {
      const response = await api.post('/players', newPlayer);
      setPlayers([...players, response.data.player]);
      setNewPlayer({ name: '', color: '#688db1' });
      setError('');
    } catch (error) {
      setError('Failed to create player');
      console.error('Error creating player:', error);
    }
  };

  const handleUpdatePlayer = async (playerId) => {
    if (!editingPlayer.name.trim()) return;

    try {
      const response = await api.put(`/players/${playerId}`, editingPlayer);
      setPlayers(players.map(p => p._id === playerId ? response.data.player : p));
      setEditingPlayer(null);
      setError('');
    } catch (error) {
      setError('Failed to update player');
      console.error('Error updating player:', error);
    }
  };

  const handleDeletePlayer = async (playerId) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;

    try {
      await api.delete(`/players/${playerId}`);
      setPlayers(players.filter(p => p._id !== playerId));
      setError('');
    } catch (error) {
      setError('Failed to delete player');
      console.error('Error deleting player:', error);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="card">
        <h1>👥 Player Management</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Create and manage players for your dart games
        </p>
      </div>

      {error && (
        <div className="card" style={{ backgroundColor: 'var(--accent-red)', color: 'white' }}>
          {error}
        </div>
      )}

      {/* Create New Player */}
      <div className="card">
        <h3>Add New Player</h3>
        <form onSubmit={handleCreatePlayer} className="space-y-4">
          <div className="grid grid-2" style={{ gap: 'var(--spacing-4)' }}>
            <div>
              <label className="form-label">Player Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter player name"
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                maxLength={30}
              />
            </div>
            <div>
              <label className="form-label">Spieler Farbe</label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(10, 1fr)', 
                gap: 'var(--spacing-2)',
                padding: 'var(--spacing-3)',
                backgroundColor: 'var(--background-darker)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}>
                {colorPalette.map((color, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setNewPlayer({ ...newPlayer, color })}
                    style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: color,
                      border: newPlayer.color === color ? '3px solid var(--text-primary)' : '2px solid transparent',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: newPlayer.color === color 
                        ? '0 0 0 2px var(--accent-blue)' 
                        : '0 2px 4px rgba(0, 0, 0, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      if (newPlayer.color !== color) {
                        e.target.style.transform = 'scale(1.1)';
                        e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (newPlayer.color !== color) {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
                      }
                    }}
                    title={color}
                  />
                ))}
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-2)', 
                marginTop: 'var(--spacing-2)',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
              }}>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: newPlayer.color,
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)'
                  }}
                />
                Gewählte Farbe: {newPlayer.color}
              </div>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            ➕ Add Player
          </button>
        </form>
      </div>

      {/* Players List */}
      <div className="card">
        <h3>Your Players ({players.length})</h3>
        
        {loading ? (
          <div className="text-center">
            <div className="spinner"></div>
          </div>
        ) : players.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            No players created yet. Add your first player above!
          </p>
        ) : (
          <div className="grid grid-2" style={{ gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
            {players.map((player) => (
              <div key={player._id} className="card player-card" style={{ backgroundColor: 'var(--background-darker)' }}>
                {editingPlayer && editingPlayer._id === player._id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <input
                      type="text"
                      className="form-input"
                      value={editingPlayer.name}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                      maxLength={30}
                    />
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(10, 1fr)', 
                      gap: 'var(--spacing-1)',
                      padding: 'var(--spacing-2)',
                      backgroundColor: 'var(--background-darker)',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)'
                    }}>
                      {colorPalette.map((color, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setEditingPlayer({ ...editingPlayer, color })}
                          style={{
                            width: '24px',
                            height: '24px',
                            backgroundColor: color,
                            border: editingPlayer.color === color ? '2px solid var(--text-primary)' : '1px solid transparent',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: editingPlayer.color === color 
                              ? '0 0 0 1px var(--accent-blue)' 
                              : '0 1px 2px rgba(0, 0, 0, 0.2)'
                          }}
                          onMouseEnter={(e) => {
                            if (editingPlayer.color !== color) {
                              e.target.style.transform = 'scale(1.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (editingPlayer.color !== color) {
                              e.target.style.transform = 'scale(1)';
                            }
                          }}
                          title={color}
                        />
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleUpdatePlayer(player._id)}
                      >
                        ✅ Save
                      </button>
                      <button 
                        className="btn btn-outline"
                        onClick={() => setEditingPlayer(null)}
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="player-avatar" style={{ backgroundColor: player.color || 'var(--accent-blue)' }}>
                      {getInitials(player.name)}
                    </div>
                    <h4 style={{ textAlign: 'center' }}>{player.name}</h4>
                    
                    <div className="stat-grid" style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: 'var(--spacing-2)',
                      margin: 'var(--spacing-4) 0',
                      fontSize: '0.875rem'
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Games:</span>
                        <strong style={{ marginLeft: '0.5rem' }}>{player.stats?.gamesPlayed || 0}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Wins:</span>
                        <strong style={{ marginLeft: '0.5rem' }}>{player.stats?.gamesWon || 0}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Average:</span>
                        <strong style={{ marginLeft: '0.5rem' }}>{player.stats?.averageScore?.toFixed(1) || '0.0'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Best:</span>
                        <strong style={{ marginLeft: '0.5rem' }}>{player.stats?.highestCheckout || 0}</strong>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                      <button 
                        className="btn btn-outline"
                        onClick={() => setEditingPlayer(player)}
                        style={{ flex: 1 }}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleDeletePlayer(player._id)}
                        style={{ flex: 1 }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerManager;