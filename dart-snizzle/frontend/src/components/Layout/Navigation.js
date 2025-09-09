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
      {/* Modern Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="modern-menu-btn"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, var(--accent-blue), #5a7aa1)',
            color: 'white',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(104, 141, 177, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px) scale(1.05)';
            e.target.style.boxShadow = '0 6px 20px rgba(104, 141, 177, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0) scale(1)';
            e.target.style.boxShadow = '0 4px 12px rgba(104, 141, 177, 0.3)';
          }}
        >
          <div
            className="menu-icon"
            style={{
              transition: 'transform 0.3s ease',
              transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          >
            {isMenuOpen ? '✕' : '☰'}
          </div>
        </button>
      </div>

      {/* Enhanced Navigation Sidebar */}
      <nav className={`
        fixed top-0 left-0 h-full w-64 transform transition-all duration-300 z-40
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:block
      `}
        style={{ 
          background: 'linear-gradient(180deg, var(--card-background) 0%, rgba(52, 56, 69, 0.95) 100%)',
          borderRight: '1px solid rgba(104, 141, 177, 0.1)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="p-6">
          {/* Enhanced Header */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: 'var(--spacing-8)',
            padding: 'var(--spacing-4)',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(104, 141, 177, 0.1), rgba(156, 182, 143, 0.05))',
            border: '1px solid rgba(104, 141, 177, 0.1)'
          }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: 'var(--spacing-2)',
              filter: 'drop-shadow(0 2px 4px rgba(104, 141, 177, 0.3))'
            }}>
              🎯
            </div>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-green))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 'var(--spacing-2)',
              letterSpacing: '0.5px'
            }}>
              Dart Snizzle
            </h2>
            <div style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-secondary)',
              padding: 'var(--spacing-1) var(--spacing-3)',
              backgroundColor: 'rgba(104, 141, 177, 0.1)',
              borderRadius: '20px',
              display: 'inline-block',
              border: '1px solid rgba(104, 141, 177, 0.2)'
            }}>
              👤 {user?.username}
            </div>
          </div>

          {/* Enhanced Navigation Menu */}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {navItems.map((item, index) => (
              <li 
                key={item.path} 
                style={{ 
                  marginBottom: 'var(--spacing-2)',
                  animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
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
                      padding: 'var(--spacing-3) var(--spacing-4)',
                      borderRadius: '12px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      textDecoration: 'none',
                      position: 'relative',
                      overflow: 'hidden',
                      backgroundColor: (location.pathname === item.path || (item.isGameLink && location.pathname.includes('/game'))) 
                        ? 'var(--accent-blue)' 
                        : 'transparent',
                      color: (location.pathname === item.path || (item.isGameLink && location.pathname.includes('/game'))) 
                        ? 'white' 
                        : 'var(--text-primary)',
                      border: (location.pathname === item.path || (item.isGameLink && location.pathname.includes('/game'))) 
                        ? '1px solid rgba(255, 255, 255, 0.2)' 
                        : '1px solid transparent',
                      boxShadow: (location.pathname === item.path || (item.isGameLink && location.pathname.includes('/game'))) 
                        ? '0 4px 12px rgba(104, 141, 177, 0.3)' 
                        : 'none',
                      transform: (location.pathname === item.path || (item.isGameLink && location.pathname.includes('/game'))) ? 'translateX(4px)' : 'translateX(0)'
                    }}
                    onMouseEnter={(e) => {
                      if (!(location.pathname === item.path || (item.isGameLink && location.pathname.includes('/game')))) {
                        e.target.style.backgroundColor = 'rgba(104, 141, 177, 0.15)';
                        e.target.style.transform = 'translateX(8px) scale(1.02)';
                        e.target.style.border = '1px solid rgba(104, 141, 177, 0.3)';
                        e.target.style.boxShadow = '0 4px 12px rgba(104, 141, 177, 0.2)';
                        
                        // Icon bounce effect
                        const icon = e.target.querySelector('.nav-icon');
                        if (icon) {
                          icon.style.transform = 'scale(1.2) rotate(5deg)';
                        }
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!(location.pathname === item.path || (item.isGameLink && location.pathname.includes('/game')))) {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.transform = 'translateX(0) scale(1)';
                        e.target.style.border = '1px solid transparent';
                        e.target.style.boxShadow = 'none';
                        
                        // Reset icon
                        const icon = e.target.querySelector('.nav-icon');
                        if (icon) {
                          icon.style.transform = 'scale(1) rotate(0deg)';
                        }
                      }
                    }}
                  >
                    {/* Background gradient effect for active item */}
                    {(location.pathname === item.path || (item.isGameLink && location.pathname.includes('/game'))) && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                        borderRadius: '12px',
                        pointerEvents: 'none'
                      }} />
                    )}
                    
                    <span 
                      className="nav-icon"
                      style={{ 
                        fontSize: '1.25rem',
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        zIndex: 1
                      }}
                    >
                      {item.icon}
                    </span>
                    <span style={{ 
                      fontSize: '1rem',
                      fontWeight: (location.pathname === item.path || (item.isGameLink && location.pathname.includes('/game'))) ? '600' : '500',
                      position: 'relative',
                      zIndex: 1,
                      letterSpacing: '0.3px'
                    }}>
                      {item.label.replace(/^.+\s/, '')}
                    </span>
                  
                      {/* Active indicator */}
                      {(location.pathname === item.path || (item.isGameLink && location.pathname.includes('/game'))) && (
                        <div style={{
                          position: 'absolute',
                          right: 'var(--spacing-3)',
                          width: '6px',
                          height: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          borderRadius: '50%',
                          animation: 'pulse 2s infinite'
                        }} />
                      )}
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
                      padding: 'var(--spacing-3) var(--spacing-4)',
                      borderRadius: '12px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      textDecoration: 'none',
                      position: 'relative',
                      overflow: 'hidden',
                      backgroundColor: location.pathname === item.path 
                        ? 'var(--accent-blue)' 
                        : 'transparent',
                      color: location.pathname === item.path 
                        ? 'white' 
                        : 'var(--text-primary)',
                      border: location.pathname === item.path 
                        ? '1px solid rgba(255, 255, 255, 0.2)' 
                        : '1px solid transparent',
                      boxShadow: location.pathname === item.path 
                        ? '0 4px 12px rgba(104, 141, 177, 0.3)' 
                        : 'none',
                      transform: location.pathname === item.path ? 'translateX(4px)' : 'translateX(0)'
                    }}
                    onMouseEnter={(e) => {
                      if (location.pathname !== item.path) {
                        e.target.style.backgroundColor = 'rgba(104, 141, 177, 0.15)';
                        e.target.style.transform = 'translateX(8px) scale(1.02)';
                        e.target.style.border = '1px solid rgba(104, 141, 177, 0.3)';
                        e.target.style.boxShadow = '0 4px 12px rgba(104, 141, 177, 0.2)';
                        
                        // Icon bounce effect
                        const icon = e.target.querySelector('.nav-icon');
                        if (icon) {
                          icon.style.transform = 'scale(1.2) rotate(5deg)';
                        }
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (location.pathname !== item.path) {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.transform = 'translateX(0) scale(1)';
                        e.target.style.border = '1px solid transparent';
                        e.target.style.boxShadow = 'none';
                        
                        // Reset icon
                        const icon = e.target.querySelector('.nav-icon');
                        if (icon) {
                          icon.style.transform = 'scale(1) rotate(0deg)';
                        }
                      }
                    }}
                  >
                    {/* Background gradient effect for active item */}
                    {location.pathname === item.path && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                        borderRadius: '12px',
                        pointerEvents: 'none'
                      }} />
                    )}
                    
                    <span 
                      className="nav-icon"
                      style={{ 
                        fontSize: '1.25rem',
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        zIndex: 1
                      }}
                    >
                      {item.icon}
                    </span>
                    <span style={{ 
                      fontSize: '1rem',
                      fontWeight: location.pathname === item.path ? '600' : '500',
                      position: 'relative',
                      zIndex: 1,
                      letterSpacing: '0.3px'
                    }}>
                      {item.label.replace(/^.+\s/, '')}
                    </span>
                    
                    {/* Active indicator */}
                    {location.pathname === item.path && (
                      <div style={{
                        position: 'absolute',
                        right: 'var(--spacing-3)',
                        width: '6px',
                        height: '6px',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '50%',
                        animation: 'pulse 2s infinite'
                      }} />
                    )}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* Enhanced Bottom Section */}
          <div className="absolute bottom-6 left-6 right-6">
            {user?.status === 'pending' && (
              <div 
                className="mb-4 p-3 rounded-lg text-sm text-center"
                style={{ 
                  background: 'linear-gradient(135deg, var(--accent-red), #c54c4d)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 4px 12px rgba(225, 97, 98, 0.3)'
                }}
              >
                ⏳ Account Pending
              </div>
            )}
            
            <button
              onClick={logout}
              className="modern-logout-btn"
              style={{
                width: '100%',
                padding: 'var(--spacing-3) var(--spacing-4)',
                borderRadius: '12px',
                border: '2px solid rgba(104, 141, 177, 0.3)',
                background: 'rgba(104, 141, 177, 0.1)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--spacing-2)',
                letterSpacing: '0.3px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, rgba(225, 97, 98, 0.15), rgba(225, 97, 98, 0.1))';
                e.target.style.borderColor = 'rgba(225, 97, 98, 0.5)';
                e.target.style.color = 'var(--accent-red)';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(225, 97, 98, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(104, 141, 177, 0.1)';
                e.target.style.borderColor = 'rgba(104, 141, 177, 0.3)';
                e.target.style.color = 'var(--text-primary)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '1.125rem' }}>🚪</span>
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
                    e.target.style.backgroundColor = 'rgba(104, 141, 177, 0.1)';
                    e.target.style.borderColor = 'var(--accent-blue)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'var(--card-background)';
                    e.target.style.borderColor = 'var(--border-color)';
                    e.target.style.transform = 'translateY(0)';
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