import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Statistics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [players, setPlayers] = useState([]);
  const [games, setGames] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStatistics();
  }, [selectedPlayer, selectedPeriod]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching statistics...');
      
      // Fetch players
      const playersResponse = await api.get('/players');
      console.log('Players response:', playersResponse.data);
      setPlayers(playersResponse.data.players || []);
      
      // Fetch games with stats
      const gamesResponse = await api.get('/games', {
        params: {
          player: selectedPlayer !== 'all' ? selectedPlayer : undefined,
          period: selectedPeriod !== 'all' ? selectedPeriod : undefined
        }
      });
      console.log('Games response:', gamesResponse.data);
      console.log('Number of games:', (gamesResponse.data.games || []).length);
      setGames(gamesResponse.data.games || []);
      
      // Calculate overall statistics
      const overallStats = calculateOverallStats(gamesResponse.data.games || [], playersResponse.data.players || []);
      console.log('Calculated stats:', overallStats);
      setStats(overallStats);
      
    } catch (error) {
      setError(`Failed to load statistics: ${error.message}`);
      console.error('Error fetching statistics:', error);
      console.error('Error response:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallStats = (games, players) => {
    const totalGames = games.length;
    const totalPlayers = players.length;
    
    console.log('Calculating stats for', totalGames, 'games and', totalPlayers, 'players');
    
    // Calculate averages and totals
    let totalThrows = 0;
    let totalScore = 0;
    let gamesByMode = {};
    let playerStats = {};
    
    games.forEach((game, gameIndex) => {
      console.log(`Processing game ${gameIndex + 1}:`, game);
      
      // Count games by mode
      gamesByMode[game.gameMode] = (gamesByMode[game.gameMode] || 0) + 1;
      
      // Process each player in the game
      game.players.forEach((playerGame, playerIndex) => {
        const playerId = playerGame.player?._id || playerGame.player;
        const playerName = playerGame.player?.name || 'Unknown';
        
        console.log(`Processing player ${playerIndex + 1} in game ${gameIndex + 1}:`, {
          playerId,
          playerName,
          throws: playerGame.throws?.length || 0,
          winner: game.winner
        });
        
        if (!playerStats[playerId]) {
          playerStats[playerId] = {
            gamesPlayed: 0,
            gamesWon: 0,
            totalThrows: 0,
            totalScore: 0,
            highestThrow: 0,
            name: playerName
          };
        }
        
        playerStats[playerId].gamesPlayed++;
        
        // Check if player won - compare with winner field
        const winnerId = game.winner?._id || game.winner;
        const isWinner = winnerId && (winnerId === playerId || winnerId.toString() === playerId.toString());
        
        console.log(`Winner comparison for ${playerName}:`, {
          winnerId,
          playerId,
          winnerIdString: winnerId ? winnerId.toString() : null,
          playerIdString: playerId ? playerId.toString() : null,
          isWinner
        });
           
        if (isWinner) {
          playerStats[playerId].gamesWon++;
          console.log(`✅ Player ${playerName} won game ${gameIndex + 1}`);
        } else {
          console.log(`❌ Player ${playerName} did NOT win game ${gameIndex + 1}`);
        }
        
        // Add throws and scores - only count active throws
        if (playerGame.throws && playerGame.throws.length > 0) {
          const activeThrows = playerGame.throws.filter(t => !t.status || t.status !== 'undone');
          console.log(`Player ${playerName} has ${activeThrows.length} active throws out of ${playerGame.throws.length} total`);
          
          playerStats[playerId].totalThrows += activeThrows.length;
          totalThrows += activeThrows.length;
          
          activeThrows.forEach(throwData => {
            const throwScore = throwData.total || 0;
            playerStats[playerId].totalScore += throwScore;
            totalScore += throwScore;
            
            if (throwScore > playerStats[playerId].highestThrow) {
              playerStats[playerId].highestThrow = throwScore;
            }
          });
        }
      });
    });

    console.log('Final player stats:', playerStats);

    return {
      totalGames,
      totalPlayers,
      totalThrows,
      averageScore: totalThrows > 0 ? (totalScore / totalThrows).toFixed(1) : '0.0',
      gamesByMode,
      playerStats
    };
  };

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#d1d5db'
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#9ca3af'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      y: {
        ticks: {
          color: '#9ca3af'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#d1d5db',
          padding: 20
        }
      }
    }
  };

  // Games by mode chart data
  const gamesModeData = {
    labels: Object.keys(stats?.gamesByMode || {}),
    datasets: [
      {
        label: 'Spiele',
        data: Object.values(stats?.gamesByMode || {}),
        backgroundColor: [
          '#688db1',
          '#9cb68f',
          '#e16162',
          '#f59e0b',
          '#8b5cf6'
        ],
        borderColor: '#2B2E3B',
        borderWidth: 2
      }
    ]
  };

  // Player performance chart data
  const playerPerformanceData = {
    labels: Object.values(stats?.playerStats || {}).map(p => p.name).slice(0, 6),
    datasets: [
      {
        label: 'Spiele gespielt',
        data: Object.values(stats?.playerStats || {}).map(p => p.gamesPlayed).slice(0, 6),
        backgroundColor: 'rgba(104, 141, 177, 0.8)',
        borderColor: '#688db1',
        borderWidth: 1
      },
      {
        label: 'Spiele gewonnen',
        data: Object.values(stats?.playerStats || {}).map(p => p.gamesWon).slice(0, 6),
        backgroundColor: 'rgba(156, 182, 143, 0.8)',
        borderColor: '#9cb68f',
        borderWidth: 1
      }
    ]
  };

  // Recent games trend (last 10 games) - show sample data if no games exist
  const recentGamesData = {
    labels: games.length > 0 ? games.slice(-10).map((_, index) => `Spiel ${index + 1}`) : ['Spiel 1', 'Spiel 2', 'Spiel 3'],
    datasets: [
      {
        label: 'Durchschnittlicher Wurf',
        data: games.length > 0 ? games.slice(-10).map(game => {
          const totalScore = game.players.reduce((sum, p) => {
            const activeThrows = (p.throws || []).filter(t => t.status !== 'undone');
            return sum + activeThrows.reduce((throwSum, t) => throwSum + (t.total || 0), 0);
          }, 0);
          const totalThrows = game.players.reduce((sum, p) => {
            const activeThrows = (p.throws || []).filter(t => t.status !== 'undone');
            return sum + activeThrows.length;
          }, 0);
          return totalThrows > 0 ? (totalScore / totalThrows).toFixed(1) : 0;
        }) : [0, 0, 0],
        fill: false,
        borderColor: '#688db1',
        backgroundColor: '#688db1',
        tension: 0.3
      }
    ]
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
      <div className="card">
        <h1>📊 Statistiken</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Umfassende Dart-Statistiken mit Diagrammen und Analysen
        </p>
      </div>

      {error && (
        <div className="card" style={{ backgroundColor: 'var(--accent-red)', color: 'white' }}>
          ❌ {error}
        </div>
      )}

      {/* Filter Controls */}
      <div className="card">
        <h3>Filter</h3>
        <div className="grid grid-2" style={{ gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
          <div>
            <label className="form-label">Spieler</label>
            <select
              className="form-select"
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
            >
              <option value="all">Alle Spieler</option>
              {players.map(player => (
                <option key={player._id} value={player._id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Zeitraum</label>
            <select
              className="form-select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="all">Alle Zeiten</option>
              <option value="week">Letzte Woche</option>
              <option value="month">Letzter Monat</option>
              <option value="year">Letztes Jahr</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-4" style={{ gap: 'var(--spacing-4)' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--accent-blue)', marginBottom: 'var(--spacing-2)' }}>
            {stats?.totalGames || 0}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Gespielte Spiele</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--accent-green)', marginBottom: 'var(--spacing-2)' }}>
            {stats?.totalPlayers || 0}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Aktive Spieler</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--accent-red)', marginBottom: 'var(--spacing-2)' }}>
            {stats?.totalThrows || 0}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Geworfene Darts</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#f59e0b', marginBottom: 'var(--spacing-2)' }}>
            {stats?.averageScore || '0.0'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Ø Punkte/Wurf</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-2" style={{ gap: 'var(--spacing-4)' }}>
        {/* Games by Mode */}
        <div className="card chart-wrapper">
          <div className="chart-header">
            <h3 className="chart-title">Spiele nach Modus</h3>
          </div>
          <div className="chart-container">
            {stats?.gamesByMode && Object.keys(stats.gamesByMode).length > 0 ? (
              <Doughnut data={gamesModeData} options={doughnutOptions} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Keine Daten verfügbar</p>
              </div>
            )}
          </div>
        </div>

        {/* Player Performance */}
        <div className="card chart-wrapper">
          <div className="chart-header">
            <h3 className="chart-title">Spieler Performance</h3>
          </div>
          <div className="chart-container">
            {stats?.playerStats && Object.keys(stats.playerStats).length > 0 ? (
              <Bar data={playerPerformanceData} options={chartOptions} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Keine Daten verfügbar</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Games Trend */}
      <div className="card chart-wrapper">
        <div className="chart-header">
          <h3 className="chart-title">Verlauf der letzten Spiele</h3>
        </div>
        <div className="chart-container">
          {games.length > 0 ? (
            <Line data={recentGamesData} options={chartOptions} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Keine Spiele gefunden</p>
            </div>
          )}
        </div>
      </div>

      {/* Player Leaderboard */}
      <div className="card">
        <h3>Spieler Bestenliste</h3>
        {stats?.playerStats && Object.keys(stats.playerStats).length > 0 ? (
          <div className="space-y-2" style={{ marginTop: 'var(--spacing-4)' }}>
            {Object.values(stats.playerStats)
              .sort((a, b) => {
                const winRateA = a.gamesPlayed > 0 ? (a.gamesWon / a.gamesPlayed) : 0;
                const winRateB = b.gamesPlayed > 0 ? (b.gamesWon / b.gamesPlayed) : 0;
                return winRateB - winRateA;
              })
              .slice(0, 10)
              .map((player, index) => {
                const winRate = player.gamesPlayed > 0 ? ((player.gamesWon / player.gamesPlayed) * 100).toFixed(1) : '0.0';
                const avgScore = player.totalThrows > 0 ? (player.totalScore / player.totalThrows).toFixed(1) : '0.0';
                
                return (
                  <div
                    key={index}
                    className="card"
                    style={{ 
                      backgroundColor: 'var(--background-darker)',
                      padding: 'var(--spacing-3)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: index < 3 ? (index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32') : 'var(--accent-blue)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.875rem',
                          fontWeight: 'bold',
                          color: 'white'
                        }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <h4>{player.name}</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                          {player.gamesPlayed} Spiele • {player.gamesWon} Siege
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>
                        {winRate}% Siegrate
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Ø {avgScore} Pkt • Best: {player.highestThrow}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              Keine Spielerdaten verfügbar. Spiele ein paar Spiele um Statistiken zu sehen!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics;