import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const GameHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'finished'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'mode', 'status'

  useEffect(() => {
    fetchGames();
  }, [filter]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }
      params.append('limit', '50');
      
      const response = await api.get(`/games?${params.toString()}`);
      setGames(response.data.games || []);
    } catch (error) {
      console.error('Error fetching games:', error);
      setError('Fehler beim Laden der Spielhistorie');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getGameStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--accent-green)';
      case 'finished': return 'var(--accent-blue)';
      case 'abandoned': return 'var(--accent-red)';
      default: return 'var(--text-secondary)';
    }
  };

  const getGameStatusText = (status) => {
    switch (status) {
      case 'active': return '🟢 Aktiv';
      case 'finished': return '✅ Beendet';
      case 'abandoned': return '❌ Abgebrochen';
      default: return status;
    }
  };

  const handleGameAction = (game) => {
    if (game.status === 'active') {
      // Spiel fortsetzen
      navigate(`/game/${game._id}`);
    } else {
      // Spieldetails anzeigen
      navigate(`/game-details/${game._id}`);
    }
  };

  const handleDeleteGame = async (gameId) => {
    try {
      setLoading(true);
      await api.delete(`/games/${gameId}`);
      
      // Remove game from local state
      setGames(prevGames => prevGames.filter(game => game._id !== gameId));
      setShowDeleteConfirm(null);
      
    } catch (error) {
      console.error('Error deleting game:', error);
      setError('Fehler beim Löschen des Spiels');
    } finally {
      setLoading(false);
    }
  };

  const sortedGames = [...games].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'mode':
        return a.gameMode.localeCompare(b.gameMode);
      case 'status':
        const statusOrder = { active: 0, finished: 1, abandoned: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center" style={{ height: '50vh' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
          <div>
            <h1>📜 Spielhistorie</h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Alle deine Spiele im Überblick
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/game-setup')}
          >
            ➕ Neues Spiel
          </button>
        </div>

        {/* Filters and Sorting */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 'var(--spacing-3)',
          marginBottom: 'var(--spacing-4)'
        }}>
          {/* Status Filter */}
          <div>
            <label className="form-label">Status Filter:</label>
            <select
              className="form-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="all">Alle Spiele</option>
              <option value="active">🟢 Aktive Spiele</option>
              <option value="finished">✅ Beendete Spiele</option>
              <option value="abandoned">❌ Abgebrochene Spiele</option>
            </select>
          </div>

          {/* Sort Options */}
          <div>
            <label className="form-label">Sortierung:</label>
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="date">📅 Datum (Neueste zuerst)</option>
              <option value="mode">🎯 Spielmodus</option>
              <option value="status">📊 Status</option>
            </select>
          </div>
        </div>

        {/* Summary */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: 'var(--spacing-3)',
          backgroundColor: 'var(--background-darker)',
          padding: 'var(--spacing-3)',
          borderRadius: '8px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>
              {games.length}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Gesamt</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>
              {games.filter(g => g.status === 'active').length}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Aktiv</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>
              {games.filter(g => g.status === 'finished').length}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Beendet</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-red)' }}>
              {games.filter(g => g.status === 'abandoned').length}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Abgebrochen</div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="card" style={{ backgroundColor: 'rgba(225, 97, 98, 0.1)', border: '1px solid var(--accent-red)' }}>
          <p style={{ color: 'var(--accent-red)', margin: 0 }}>❌ {error}</p>
        </div>
      )}

      {/* Games List */}
      {sortedGames.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-6)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-3)' }}>🎯</div>
          <h3>Keine Spiele gefunden</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-4)' }}>
            {filter === 'all' 
              ? 'Du hast noch keine Spiele gespielt.'
              : `Keine Spiele mit Status "${filter}" gefunden.`
            }
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/game-setup')}
          >
            Erstes Spiel starten
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          {sortedGames.map((game) => (
            <div
              key={game._id}
              className="card"
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: game.status === 'active' ? '2px solid var(--accent-green)' : '1px solid var(--border-color)'
              }}
              onClick={() => handleGameAction(game)}
            >
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'auto 1fr auto auto', 
                gap: 'var(--spacing-4)', 
                alignItems: 'center' 
              }}>
                {/* Game Mode & Status */}
                <div>
                  <div style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold',
                    marginBottom: '4px'
                  }}>
                    🎯 {game.gameMode.toUpperCase()}
                  </div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: getGameStatusColor(game.status),
                    fontWeight: 'bold'
                  }}>
                    {getGameStatusText(game.status)}
                  </div>
                </div>

                {/* Players */}
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Spieler ({game.players?.length || 0}):
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
                    {game.players?.slice(0, 4).map((playerGame, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-1)',
                          fontSize: '0.875rem'
                        }}
                      >
                        <div
                          className="player-avatar"
                          style={{
                            backgroundColor: playerGame.player?.color || 'var(--accent-blue)',
                            width: '20px',
                            height: '20px',
                            fontSize: '0.75rem'
                          }}
                        >
                          {getInitials(playerGame.player?.name || 'Unknown')}
                        </div>
                        <span>{playerGame.player?.name || 'Unknown'}</span>
                        {game.status === 'finished' && game.winner?._id === playerGame.player?._id && (
                          <span style={{ color: 'var(--accent-green)' }}>👑</span>
                        )}
                      </div>
                    ))}
                    {game.players?.length > 4 && (
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        +{game.players.length - 4} mehr
                      </span>
                    )}
                  </div>
                </div>

                {/* Game Info */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    {formatDate(game.createdAt)}
                  </div>
                  {game.status === 'finished' && (
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Dauer: {formatDuration(game.duration)}
                    </div>
                  )}
                  {game.status === 'active' && (
                    <div style={{ fontSize: '0.875rem', color: 'var(--accent-green)' }}>
                      Laufend...
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                  {game.status === 'active' ? (
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: '0.875rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/game/${game._id}`);
                      }}
                    >
                      ▶️ Fortsetzen
                    </button>
                  ) : (
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: '0.875rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/game-details/${game._id}`);
                      }}
                    >
                      📋 Details
                    </button>
                  )}
                  
                  <button
                    className="btn btn-danger"
                    style={{ 
                      fontSize: '0.875rem',
                      backgroundColor: 'var(--accent-red)',
                      color: 'white',
                      border: '1px solid var(--accent-red)'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(game._id);
                    }}
                  >
                    🗑️ Löschen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button (if needed) */}
      {games.length >= 50 && (
        <div style={{ textAlign: 'center' }}>
          <button
            className="btn btn-outline"
            onClick={() => {
              // Implementierung für "Mehr laden"
              alert('Weitere Spiele laden wird bald verfügbar sein!');
            }}
          >
            Mehr laden...
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ 
            maxWidth: '400px',
            margin: 'var(--spacing-4)',
            backgroundColor: 'var(--background-dark)',
            border: '2px solid var(--accent-red)'
          }}>
            <h3 style={{ color: 'var(--accent-red)', marginBottom: 'var(--spacing-3)' }}>
              ⚠️ Spiel löschen
            </h3>
            <p style={{ marginBottom: 'var(--spacing-4)' }}>
              Möchtest du dieses Spiel wirklich dauerhaft löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div style={{ 
              display: 'flex', 
              gap: 'var(--spacing-3)', 
              justifyContent: 'flex-end' 
            }}>
              <button
                className="btn btn-outline"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Abbrechen
              </button>
              <button
                className="btn"
                style={{
                  backgroundColor: 'var(--accent-red)',
                  color: 'white',
                  border: '1px solid var(--accent-red)'
                }}
                onClick={() => handleDeleteGame(showDeleteConfirm)}
              >
                🗑️ Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameHistory;