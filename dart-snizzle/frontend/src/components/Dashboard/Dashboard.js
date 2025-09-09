import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalGames: 0,
    totalPlaytime: 0,
    totalPlayers: 0,
    activeGames: 0,
    finishedGames: 0,
    averageScore: 0
  });
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch games and players data in parallel
      const [gamesResponse, playersResponse] = await Promise.all([
        api.get('/games?limit=50'),
        api.get('/players')
      ]);

      const games = gamesResponse.data.games || [];
      const players = playersResponse.data.players || [];

      // Calculate statistics
      const totalGames = games.length;
      const activeGames = games.filter(g => g.status === 'active').length;
      const finishedGames = games.filter(g => g.status === 'finished').length;
      
      // Calculate total playtime (sum of all finished game durations)
      const totalPlaytime = games
        .filter(g => g.duration)
        .reduce((sum, g) => sum + (g.duration || 0), 0);

      // Get recent games (last 5)
      const recentGamesList = games
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      // Calculate comprehensive statistics
      let totalScore = 0;
      let totalThrows = 0;
      let dartDistribution = {};
      let playerStats = {};
      let gameStats = {};
      let allThrowValues = [];
      
      games.forEach(game => {
        // Game mode statistics
        gameStats[game.gameMode] = (gameStats[game.gameMode] || 0) + 1;
        
        game.players?.forEach(player => {
          const playerId = player.player?._id;
          const playerName = player.player?.name || 'Unknown';
          
          if (!playerStats[playerId]) {
            playerStats[playerId] = {
              name: playerName,
              color: player.player?.color,
              gamesPlayed: 0,
              gamesWon: 0,
              totalThrows: 0,
              totalScore: 0,
              highestThrow: 0,
              totalPlaytime: 0,
              throwDistribution: {}
            };
          }

          playerStats[playerId].gamesPlayed++;
          
          // Check if player won this game
          if (game.winner && (game.winner === playerId || game.winner._id === playerId)) {
            playerStats[playerId].gamesWon++;
          }

          // Add playtime if game is finished
          if (game.duration) {
            playerStats[playerId].totalPlaytime += game.duration;
          }

          const activeThrows = player.throws?.filter(t => t.status === 'active') || [];
          activeThrows.forEach(throw_ => {
            totalScore += throw_.total;
            totalThrows++;
            allThrowValues.push(throw_.total);

            playerStats[playerId].totalThrows++;
            playerStats[playerId].totalScore += throw_.total;

            if (throw_.total > playerStats[playerId].highestThrow) {
              playerStats[playerId].highestThrow = throw_.total;
            }

            // Track dart distribution (individual dart values)
            if (throw_.dart1) {
              const dart1Key = `${throw_.dart1.value}${throw_.dart1.multiplier > 1 ? `x${throw_.dart1.multiplier}` : ''}`;
              dartDistribution[dart1Key] = (dartDistribution[dart1Key] || 0) + 1;
              playerStats[playerId].throwDistribution[dart1Key] = (playerStats[playerId].throwDistribution[dart1Key] || 0) + 1;
            }
            if (throw_.dart2) {
              const dart2Key = `${throw_.dart2.value}${throw_.dart2.multiplier > 1 ? `x${throw_.dart2.multiplier}` : ''}`;
              dartDistribution[dart2Key] = (dartDistribution[dart2Key] || 0) + 1;
              playerStats[playerId].throwDistribution[dart2Key] = (playerStats[playerId].throwDistribution[dart2Key] || 0) + 1;
            }
            if (throw_.dart3) {
              const dart3Key = `${throw_.dart3.value}${throw_.dart3.multiplier > 1 ? `x${throw_.dart3.multiplier}` : ''}`;
              dartDistribution[dart3Key] = (dartDistribution[dart3Key] || 0) + 1;
              playerStats[playerId].throwDistribution[dart3Key] = (playerStats[playerId].throwDistribution[dart3Key] || 0) + 1;
            }
          });
        });
      });

      // Calculate averages for players
      Object.values(playerStats).forEach(player => {
        player.averageScore = player.totalThrows > 0 ? Math.round((player.totalScore / player.totalThrows) * 10) / 10 : 0;
        player.winRate = player.gamesPlayed > 0 ? Math.round((player.gamesWon / player.gamesPlayed) * 100) : 0;
      });

      // Sort and get top statistics
      const sortedDarts = Object.entries(dartDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

      const topPlayers = Object.values(playerStats)
        .sort((a, b) => b.gamesWon - a.gamesWon)
        .slice(0, 5);

      const mostActivePlayer = Object.values(playerStats)
        .sort((a, b) => b.gamesPlayed - a.gamesPlayed)[0];

      const bestAveragePlayer = Object.values(playerStats)
        .filter(p => p.totalThrows >= 10) // Minimum 10 throws for valid average
        .sort((a, b) => b.averageScore - a.averageScore)[0];

      const highestThrowPlayer = Object.values(playerStats)
        .sort((a, b) => b.highestThrow - a.highestThrow)[0];

      const averageScore = totalThrows > 0 ? Math.round((totalScore / totalThrows) * 10) / 10 : 0;

      // Calculate some fun statistics
      const perfectThrows = allThrowValues.filter(v => v === 180).length;
      const highFinishes = allThrowValues.filter(v => v >= 140).length;
      const bullseyes = Object.entries(dartDistribution).filter(([key]) => key.includes('25')).reduce((sum, [,count]) => sum + count, 0);

      setStats({
        totalGames,
        totalPlaytime,
        totalPlayers: players.length,
        activeGames,
        finishedGames,
        averageScore,
        totalThrows,
        perfectThrows,
        highFinishes,
        bullseyes,
        mostActivePlayer,
        bestAveragePlayer,
        highestThrowPlayer,
        topPlayers,
        sortedDarts,
        gameStats,
        playerStats: Object.values(playerStats)
      });

      setRecentGames(recentGamesList);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Fehler beim Laden der Dashboard-Daten');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatPlaytime = (seconds) => {
    if (!seconds || seconds === 0) return '0 Min';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} Min`;
  };

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

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'UK';
  };

  const handleNewGameClick = async () => {
    try {
      // Check for active games first
      const response = await api.get('/games?status=active&limit=1');
      const activeGames = response.data.games || [];
      
      if (activeGames.length > 0) {
        // Navigate to the active game
        navigate(`/game/${activeGames[0]._id}`);
      } else {
        // No active games, go to game setup
        navigate('/game-setup');
      }
    } catch (error) {
      console.error('Error checking for active games:', error);
      // Fallback to game setup
      navigate('/game-setup');
    }
  };

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
      {/* Welcome Header */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
          <div>
            <h1 style={{ marginBottom: 'var(--spacing-2)' }}>
              Willkommen zurück, {user?.username}! 🎯
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              {stats.activeGames > 0 
                ? `Du hast ${stats.activeGames} aktive${stats.activeGames === 1 ? 's' : ''} Spiel${stats.activeGames === 1 ? '' : 'e'} laufen.`
                : 'Bereit für ein neues Spiel?'
              }
            </p>
          </div>
          <button
            className="btn btn-primary"
            style={{ 
              fontSize: '1.125rem',
              padding: 'var(--spacing-3) var(--spacing-6)',
              whiteSpace: 'nowrap'
            }}
            onClick={handleNewGameClick}
          >
            {stats.activeGames > 0 ? '▶️ Spiel fortsetzen' : '🎯 Neues Spiel'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="card" style={{ backgroundColor: 'rgba(225, 97, 98, 0.1)', border: '1px solid var(--accent-red)' }}>
          <p style={{ color: 'var(--accent-red)', margin: 0 }}>❌ {error}</p>
        </div>
      )}

      {/* Statistics Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 'var(--spacing-4)' 
      }}>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-4)' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-blue)', marginBottom: 'var(--spacing-2)' }}>
            {stats.totalGames}
          </div>
          <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Gesamt Spiele</div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-4)' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-green)', marginBottom: 'var(--spacing-2)' }}>
            {formatPlaytime(stats.totalPlaytime)}
          </div>
          <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Gespielte Zeit</div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-4)' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-blue)', marginBottom: 'var(--spacing-2)' }}>
            {stats.totalPlayers}
          </div>
          <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Spieler</div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: 'var(--spacing-3)' 
      }}>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-3)' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>
            {stats.activeGames}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>🟢 Aktiv</div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-3)' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>
            {stats.finishedGames}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>✅ Beendet</div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-3)' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {stats.averageScore}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Ø Punkte</div>
        </div>
      </div>

      {/* Recent Games */}
      {recentGames.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
            <h3 style={{ margin: 0 }}>📋 Letzte Spiele</h3>
            <Link to="/history" className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
              Alle anzeigen
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            {recentGames.map((game) => (
              <div
                key={game._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--spacing-3)',
                  backgroundColor: 'var(--background-darker)',
                  borderRadius: '8px',
                  border: game.status === 'active' ? '2px solid var(--accent-green)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => game.status === 'active' ? navigate(`/game/${game._id}`) : navigate(`/game-details/${game._id}`)}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(104, 141, 177, 0.1)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'var(--background-darker)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                  <div style={{ fontSize: '1.25rem' }}>🎯</div>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                      {game.gameMode.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {game.players?.length || 0} Spieler • {formatDate(game.createdAt)}
                    </div>
                  </div>
                </div>

                <div style={{ 
                  fontSize: '0.875rem', 
                  color: game.status === 'active' ? 'var(--accent-green)' : 'var(--accent-blue)',
                  fontWeight: 'bold'
                }}>
                  {game.status === 'active' ? '🟢 Aktiv' : '✅ Beendet'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Statistics */}
      {stats.totalThrows > 0 && (
        <>
          {/* Most Thrown Fields */}
          <div className="card">
            <h3 style={{ marginBottom: 'var(--spacing-4)' }}>🎯 Meist geworfene Felder</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
              gap: 'var(--spacing-3)' 
            }}>
              {stats.sortedDarts.slice(0, 8).map(([dart, count]) => (
                <div 
                  key={dart}
                  className="card"
                  style={{ 
                    textAlign: 'center', 
                    padding: 'var(--spacing-3)',
                    backgroundColor: 'var(--background-darker)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold', 
                    color: 'var(--accent-blue)',
                    marginBottom: 'var(--spacing-1)'
                  }}>
                    {dart}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {count}x ({Math.round((count / stats.totalThrows) * 100)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Player Rankings */}
          <div className="card">
            <h3 style={{ marginBottom: 'var(--spacing-4)' }}>🏆 Spieler-Ranglisten</h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: 'var(--spacing-4)' 
            }}>
              {/* Most Wins */}
              {stats.topPlayers.length > 0 && (
                <div style={{ 
                  backgroundColor: 'var(--background-darker)', 
                  padding: 'var(--spacing-4)', 
                  borderRadius: '8px' 
                }}>
                  <h4 style={{ 
                    marginBottom: 'var(--spacing-3)', 
                    color: 'var(--accent-green)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-2)'
                  }}>
                    👑 Meiste Siege
                  </h4>
                  {stats.topPlayers.slice(0, 3).map((player, index) => (
                    <div 
                      key={player.name}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: index < 2 ? 'var(--spacing-2)' : 0,
                        padding: 'var(--spacing-2)',
                        backgroundColor: index === 0 ? 'rgba(156, 182, 143, 0.1)' : 'transparent',
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                        <div style={{ fontSize: '1.2rem' }}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </div>
                        <div
                          className="player-avatar"
                          style={{
                            backgroundColor: player.color || 'var(--accent-blue)',
                            width: '24px',
                            height: '24px',
                            fontSize: '0.75rem'
                          }}
                        >
                          {getInitials(player.name)}
                        </div>
                        <span style={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>
                          {player.name}
                        </span>
                      </div>
                      <div style={{ 
                        fontWeight: 'bold',
                        color: 'var(--accent-green)'
                      }}>
                        {player.gamesWon} Siege ({player.winRate}%)
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Best Average */}
              {stats.bestAveragePlayer && (
                <div style={{ 
                  backgroundColor: 'var(--background-darker)', 
                  padding: 'var(--spacing-4)', 
                  borderRadius: '8px' 
                }}>
                  <h4 style={{ 
                    marginBottom: 'var(--spacing-3)', 
                    color: 'var(--accent-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-2)'
                  }}>
                    🎯 Bester Durchschnitt
                  </h4>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'var(--spacing-3)',
                    padding: 'var(--spacing-3)',
                    backgroundColor: 'rgba(104, 141, 177, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <div
                      className="player-avatar"
                      style={{
                        backgroundColor: stats.bestAveragePlayer.color || 'var(--accent-blue)',
                        width: '32px',
                        height: '32px',
                        fontSize: '1rem'
                      }}
                    >
                      {getInitials(stats.bestAveragePlayer.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {stats.bestAveragePlayer.name}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {stats.bestAveragePlayer.totalThrows} Würfe
                      </div>
                    </div>
                    <div style={{ 
                      marginLeft: 'auto',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: 'var(--accent-blue)'
                    }}>
                      {stats.bestAveragePlayer.averageScore}
                    </div>
                  </div>
                </div>
              )}

              {/* Most Active Player */}
              {stats.mostActivePlayer && (
                <div style={{ 
                  backgroundColor: 'var(--background-darker)', 
                  padding: 'var(--spacing-4)', 
                  borderRadius: '8px' 
                }}>
                  <h4 style={{ 
                    marginBottom: 'var(--spacing-3)', 
                    color: 'var(--accent-green)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-2)'
                  }}>
                    🔥 Aktivster Spieler
                  </h4>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'var(--spacing-3)',
                    padding: 'var(--spacing-3)',
                    backgroundColor: 'rgba(156, 182, 143, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <div
                      className="player-avatar"
                      style={{
                        backgroundColor: stats.mostActivePlayer.color || 'var(--accent-blue)',
                        width: '32px',
                        height: '32px',
                        fontSize: '1rem'
                      }}
                    >
                      {getInitials(stats.mostActivePlayer.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {stats.mostActivePlayer.name}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {formatPlaytime(stats.mostActivePlayer.totalPlaytime)} gespielt
                      </div>
                    </div>
                    <div style={{ 
                      marginLeft: 'auto',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: 'var(--accent-green)'
                    }}>
                      {stats.mostActivePlayer.gamesPlayed}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fun Statistics */}
          <div className="card">
            <h3 style={{ marginBottom: 'var(--spacing-4)' }}>🎲 Interessante Statistiken</h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 'var(--spacing-4)' 
            }}>
              <div style={{ 
                textAlign: 'center',
                padding: 'var(--spacing-4)',
                backgroundColor: 'var(--background-darker)',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-2)' }}>🎯</div>
                <div style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold', 
                  color: 'var(--accent-blue)',
                  marginBottom: 'var(--spacing-1)'
                }}>
                  {stats.perfectThrows}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Perfekte 180er
                </div>
                {stats.perfectThrows > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-1)' }}>
                    ({((stats.perfectThrows / stats.totalThrows) * 100).toFixed(2)}% aller Würfe)
                  </div>
                )}
              </div>

              <div style={{ 
                textAlign: 'center',
                padding: 'var(--spacing-4)',
                backgroundColor: 'var(--background-darker)',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-2)' }}>🚀</div>
                <div style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold', 
                  color: 'var(--accent-green)',
                  marginBottom: 'var(--spacing-1)'
                }}>
                  {stats.highFinishes}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  High Finishes (140+)
                </div>
                {stats.highFinishes > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-1)' }}>
                    ({((stats.highFinishes / stats.totalThrows) * 100).toFixed(2)}% aller Würfe)
                  </div>
                )}
              </div>

              <div style={{ 
                textAlign: 'center',
                padding: 'var(--spacing-4)',
                backgroundColor: 'var(--background-darker)',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-2)' }}>🎖️</div>
                <div style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold', 
                  color: 'var(--accent-blue)',
                  marginBottom: 'var(--spacing-1)'
                }}>
                  {stats.bullseyes}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Bulls Eye Treffer
                </div>
                {stats.bullseyes > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-1)' }}>
                    ({((stats.bullseyes / stats.totalThrows) * 100).toFixed(2)}% aller Würfe)
                  </div>
                )}
              </div>

              {stats.highestThrowPlayer && (
                <div style={{ 
                  textAlign: 'center',
                  padding: 'var(--spacing-4)',
                  backgroundColor: 'var(--background-darker)',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-2)' }}>⚡</div>
                  <div style={{ 
                    fontSize: '2rem', 
                    fontWeight: 'bold', 
                    color: 'var(--accent-red)',
                    marginBottom: 'var(--spacing-1)'
                  }}>
                    {stats.highestThrowPlayer.highestThrow}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Höchster Wurf
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-secondary)', 
                    marginTop: 'var(--spacing-1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--spacing-1)'
                  }}>
                    <div
                      className="player-avatar"
                      style={{
                        backgroundColor: stats.highestThrowPlayer.color || 'var(--accent-blue)',
                        width: '16px',
                        height: '16px',
                        fontSize: '0.6rem'
                      }}
                    >
                      {getInitials(stats.highestThrowPlayer.name)}
                    </div>
                    {stats.highestThrowPlayer.name}
                  </div>
                </div>
              )}

              {Object.keys(stats.gameStats || {}).length > 0 && (
                <div style={{ 
                  textAlign: 'center',
                  padding: 'var(--spacing-4)',
                  backgroundColor: 'var(--background-darker)',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-2)' }}>🎮</div>
                  <div style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 'bold', 
                    color: 'var(--accent-blue)',
                    marginBottom: 'var(--spacing-1)'
                  }}>
                    {Object.keys(stats.gameStats).length}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Verschiedene Spielmodi
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-secondary)', 
                    marginTop: 'var(--spacing-1)' 
                  }}>
                    Beliebtester: {Object.entries(stats.gameStats).sort(([,a], [,b]) => b - a)[0]?.[0]?.toUpperCase()}
                  </div>
                </div>
              )}

              <div style={{ 
                textAlign: 'center',
                padding: 'var(--spacing-4)',
                backgroundColor: 'var(--background-darker)',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-2)' }}>📊</div>
                <div style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold', 
                  color: 'var(--accent-green)',
                  marginBottom: 'var(--spacing-1)'
                }}>
                  {stats.totalThrows}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Geworfene Darts gesamt
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-1)' }}>
                  Ø {Math.round(stats.totalThrows / (stats.totalGames || 1))} pro Spiel
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--spacing-4)' }}>⚡ Schnellaktionen</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 'var(--spacing-3)' 
        }}>
          <Link 
            to="/players" 
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', justifyContent: 'center' }}
          >
            <span>👥</span>
            Spieler verwalten
          </Link>
          <Link 
            to="/statistics" 
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', justifyContent: 'center' }}
          >
            <span>📊</span>
            Statistiken
          </Link>
          <Link 
            to="/history" 
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', justifyContent: 'center' }}
          >
            <span>📜</span>
            Spielhistorie
          </Link>
          <Link 
            to="/settings" 
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', justifyContent: 'center' }}
          >
            <span>⚙️</span>
            Einstellungen
          </Link>
        </div>
      </div>

      {/* Account Status Warning */}
      {user?.status === 'pending' && (
        <div className="card" style={{ 
          backgroundColor: 'rgba(225, 97, 98, 0.1)', 
          border: '2px solid var(--accent-red)'
        }}>
          <h4 style={{ color: 'var(--accent-red)', marginBottom: 'var(--spacing-2)' }}>
            ⚠️ Account wartet auf Freischaltung
          </h4>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Dein Account wartet auf die Freischaltung durch einen Administrator. Einige Funktionen könnten eingeschränkt sein.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;