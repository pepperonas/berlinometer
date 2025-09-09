import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const PlayerManager = () => {
  const [players, setPlayers] = useState([]);
  const [newPlayer, setNewPlayer] = useState({ name: '', color: '#688db1' });
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
              <label className="form-label">Player Color</label>
              <div style={{ display: 'flex', gap: 'var(--spacing-2)', alignItems: 'center' }}>
                <input
                  type="color"
                  value={newPlayer.color}
                  onChange={(e) => setNewPlayer({ ...newPlayer, color: e.target.value })}
                  style={{ width: '60px', height: '44px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  className="form-input"
                  value={newPlayer.color}
                  onChange={(e) => setNewPlayer({ ...newPlayer, color: e.target.value })}
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
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
                    <input
                      type="color"
                      value={editingPlayer.color}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, color: e.target.value })}
                      style={{ width: '100%', height: '40px', cursor: 'pointer' }}
                    />
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