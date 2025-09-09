import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showGameSelection, setShowGameSelection] = useState(false);
  const [activeGames, setActiveGames] = useState([]);

  // Handle New Game click - check for active games first
  const handleNewGameClick = async (e) => {
    e.preventDefault();
    setIsMenuOpen(false);
    
    try {
      // Check for active games (get all active games, not just one)
      const response = await api.get('/games?status=active&limit=10');
      const games = response.data.games || [];
      
      if (games.length === 0) {
        // No active games, go to game setup
        navigate('/game-setup');
      } else if (games.length === 1) {
        // Only one active game, navigate directly
        navigate(`/game/${games[0]._id}`);
      } else {
        // Multiple active games, show selection modal
        setActiveGames(games);
        setShowGameSelection(true);
      }
    } catch (error) {
      console.error('Error checking for active games:', error);
      // Fallback to game setup on error
      navigate('/game-setup');
    }
  };

  // Handle game selection from modal
  const handleGameSelect = (gameId) => {
    setShowGameSelection(false);
    navigate(`/game/${gameId}`);
  };

  // Handle create new game from modal
  const handleCreateNewGame = () => {
    setShowGameSelection(false);
    navigate('/game-setup');
  };

  // Get initials for player names
  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'UK';
  };

  // Format date for game selection
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `vor ${diffMins} Min.`;
    } else if (diffMins < 1440) {
      return `vor ${Math.floor(diffMins / 60)} Std.`;
    } else {
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    }
  };

  const navItems = [
    { path: '/', label: '🏠 Dashboard', icon: '🏠' },
    { path: '/players', label: '👥 Players', icon: '👥' },
    { path: '/game-setup', label: '🎯 New Game', icon: '🎯', isGameLink: true },
    { path: '/history', label: '📜 History', icon: '📜' },
    { path: '/statistics', label: '📊 Stats', icon: '📊' },
    { path: '/settings', label: '⚙️ Settings', icon: '⚙️' }
  ];

  return (
    <>
      {/* Simple Menu Button */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        style={{
          width: '40px',
          height: '40px',
          border: 'none',
          background: 'var(--card-background)',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ width: '18px', height: '2px', backgroundColor: 'var(--text-primary)', borderRadius: '1px', transition: 'all 0.2s', transform: isMenuOpen ? 'rotate(45deg) translateY(3px)' : 'none' }}></div>
        <div style={{ width: '18px', height: '2px', backgroundColor: 'var(--text-primary)', borderRadius: '1px', transition: 'all 0.2s', opacity: isMenuOpen ? '0' : '1' }}></div>
        <div style={{ width: '18px', height: '2px', backgroundColor: 'var(--text-primary)', borderRadius: '1px', transition: 'all 0.2s', transform: isMenuOpen ? 'rotate(-45deg) translateY(-3px)' : 'none' }}></div>
      </button>

      {/* Material Design Navigation Drawer */}
      <nav className={`
        fixed top-0 left-0 h-full w-64 transform transition-transform duration-300 z-40
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:block
      `}
        style={{ 
          background: 'var(--card-background)',
          borderRight: '1px solid var(--border-color)',
          boxShadow: '0 8px 10px rgba(0, 0, 0, 0.14), 0 3px 14px rgba(0, 0, 0, 0.12), 0 5px 5px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div className="p-6">
          {/* Material Design Header */}
          <div style={{ 
            padding: 'var(--spacing-6) var(--spacing-4)',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: 'var(--spacing-4)'
          }}>
            <div style={{
              fontSize: '1.75rem',
              marginBottom: 'var(--spacing-2)'
            }}>
              🎯
            </div>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '500', 
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-2)',
              margin: 0
            }}>
              Dart Snizzle
            </h2>
            <div style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-secondary)'
            }}>
              {user?.username}
            </div>
          </div>

          {/* Material Design Navigation Menu */}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {navItems.map((item, index) => (
              <li 
                key={item.path} 
                style={{ 
                  marginBottom: '4px'
                }}
              >
                {item.isGameLink ? (
                  <a
                    href="#"
                    onClick={handleNewGameClick}
                    className="nav-link"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-3)',
                      padding: '12px 16px',
                      borderRadius: '0 24px 24px 0',
                      transition: 'background-color 0.15s ease',
                      textDecoration: 'none',
                      margin: '0 0 0 -16px',
                      backgroundColor: (location.pathname === item.path || (item.isGameLink && location.pathname.includes('/game'))) 
                        ? 'var(--accent-blue)' 
                        : 'transparent',
                      color: (location.pathname === item.path || (item.isGameLink && location.pathname.includes('/game'))) 
                        ? 'white' 
                        : 'var(--text-primary)'
                    }}
                    onMouseEnter={(e) => {
                      if (!(location.pathname === item.path || (item.isGameLink && location.pathname.includes('/game')))) {
                        e.target.style.backgroundColor = 'rgba(104, 141, 177, 0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!(location.pathname === item.path || (item.isGameLink && location.pathname.includes('/game')))) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span 
                      style={{ 
                        fontSize: '1.25rem'
                      }}
                    >
                      {item.icon}
                    </span>
                    <span style={{ 
                      fontSize: '0.875rem',
                      fontWeight: (location.pathname === item.path || (item.isGameLink && location.pathname.includes('/game'))) ? '500' : '400'
                    }}>
                      {item.label.replace(/^.+\s/, '')}
                    </span>
                    </a>
                ) : (
                  <Link
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="nav-link"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-3)',
                      padding: '12px 16px',
                      borderRadius: '0 24px 24px 0',
                      transition: 'background-color 0.15s ease',
                      textDecoration: 'none',
                      margin: '0 0 0 -16px',
                      backgroundColor: location.pathname === item.path 
                        ? 'var(--accent-blue)' 
                        : 'transparent',
                      color: location.pathname === item.path 
                        ? 'white' 
                        : 'var(--text-primary)'
                    }}
                    onMouseEnter={(e) => {
                      if (location.pathname !== item.path) {
                        e.target.style.backgroundColor = 'rgba(104, 141, 177, 0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (location.pathname !== item.path) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span 
                      style={{ 
                        fontSize: '1.25rem'
                      }}
                    >
                      {item.icon}
                    </span>
                    <span style={{ 
                      fontSize: '0.875rem',
                      fontWeight: location.pathname === item.path ? '500' : '400'
                    }}>
                      {item.label.replace(/^.+\s/, '')}
                    </span>
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* Material Design Bottom Section */}
          <div className="absolute bottom-6 left-4 right-4">
            {user?.status === 'pending' && (
              <div 
                className="mb-4 p-3 rounded text-sm text-center"
                style={{ 
                  backgroundColor: 'var(--accent-red)',
                  color: 'white'
                }}
              >
                ⏳ Account Pending
              </div>
            )}
            
            <button
              onClick={logout}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '4px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                fontWeight: '400',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 'var(--spacing-3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(225, 97, 98, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>🚪</span>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Game Selection Modal */}
      {showGameSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div 
            className="card"
            style={{ 
              maxWidth: '500px', 
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 'var(--spacing-4)' 
            }}>
              <h3 style={{ margin: 0 }}>🎯 Aktive Spiele ({activeGames.length})</h3>
              <button
                onClick={() => setShowGameSelection(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ 
              color: 'var(--text-secondary)', 
              marginBottom: 'var(--spacing-4)',
              fontSize: '0.875rem'
            }}>
              Du hast mehrere aktive Spiele. Welches möchtest du fortsetzen?
            </p>

            <div className="space-y-3" style={{ marginBottom: 'var(--spacing-4)' }}>
              {activeGames.map((game) => (
                <div
                  key={game._id}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: '1px solid var(--border-color)',
                    padding: 'var(--spacing-3)'
                  }}
                  onClick={() => handleGameSelect(game._id)}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(104, 141, 177, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'var(--card-background)';
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: 'var(--spacing-2)'
                  }}>
                    <div>
                      <div style={{ 
                        fontSize: '1.125rem', 
                        fontWeight: 'bold',
                        marginBottom: '4px'
                      }}>
                        🎯 {game.gameMode.toUpperCase()}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-secondary)'
                      }}>
                        {formatDate(game.createdAt)}
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      color: 'var(--accent-green)',
                      fontWeight: 'bold'
                    }}>
                      🟢 Aktiv
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--spacing-1)', flexWrap: 'wrap' }}>
                    {game.players?.slice(0, 4).map((playerGame, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-1)',
                          fontSize: '0.75rem'
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: playerGame.player?.color || 'var(--accent-blue)',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.625rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {getInitials(playerGame.player?.name || 'Unknown')}
                        </div>
                        <span>{playerGame.player?.name || 'Unknown'}</span>
                      </div>
                    ))}
                    {game.players?.length > 4 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        +{game.players.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ 
              display: 'flex', 
              gap: 'var(--spacing-3)', 
              justifyContent: 'flex-end'
            }}>
              <button
                className="btn btn-outline"
                onClick={() => setShowGameSelection(false)}
              >
                Abbrechen
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateNewGame}
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-1)' }}
              >
                <span>➕</span>
                Neues Spiel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;