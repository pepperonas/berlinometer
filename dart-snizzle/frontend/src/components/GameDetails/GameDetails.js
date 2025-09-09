import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
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
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement
);

const GameDetails = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGameDetails();
  }, [gameId]);

  const fetchGameDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get(`/games/${gameId}`);
      setGame(response.data.game);
    } catch (error) {
      console.error('Error fetching game details:', error);
      setError('Fehler beim Laden der Spieldetails');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'UK';
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
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
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

  // Chart data generation functions
  const generatePlayerThrowChart = (player) => {
    const activeThrows = player.throws?.filter(t => t.status === 'active') || [];
    
    if (activeThrows.length === 0) return null;

    const data = {
      labels: activeThrows.map((_, index) => `Wurf ${index + 1}`),
      datasets: [
        {
          label: player.player?.name || 'Spieler',
          data: activeThrows.map(throw_ => throw_.total),
          borderColor: player.player?.color || '#688db1',
          backgroundColor: `${player.player?.color || '#688db1'}20`,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: player.player?.color || '#688db1',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.parsed.y} Punkte`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 180,
          grid: {
            color: '#4a5568'
          },
          ticks: {
            color: '#9ca3af'
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#9ca3af'
          }
        }
      }
    };

    return { data, options };
  };

  const generateGameOverviewChart = () => {
    if (!game?.players) return null;

    const data = {
      labels: game.players.map(p => p.player?.name || 'Unknown'),
      datasets: [
        {
          label: 'Durchschnittspunkte',
          data: game.players.map(player => {
            const activeThrows = player.throws?.filter(t => t.status === 'active') || [];
            const totalScore = activeThrows.reduce((sum, t) => sum + t.total, 0);
            return activeThrows.length > 0 ? Math.round((totalScore / activeThrows.length) * 10) / 10 : 0;
          }),
          backgroundColor: game.players.map(p => p.player?.color || '#688db1'),
          borderColor: game.players.map(p => p.player?.color || '#688db1'),
          borderWidth: 2
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.parsed.y} Punkte Durchschnitt`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: '#4a5568'
          },
          ticks: {
            color: '#9ca3af'
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#9ca3af'
          }
        }
      }
    };

    return { data, options };
  };

  const generateScoreDistributionChart = () => {
    if (!game?.players) return null;

    let scores = [];
    game.players.forEach(player => {
      const activeThrows = player.throws?.filter(t => t.status === 'active') || [];
      scores = [...scores, ...activeThrows.map(t => t.total)];
    });

    if (scores.length === 0) return null;

    // Group scores into ranges
    const ranges = {
      '0-20': scores.filter(s => s >= 0 && s <= 20).length,
      '21-40': scores.filter(s => s >= 21 && s <= 40).length,
      '41-60': scores.filter(s => s >= 41 && s <= 60).length,
      '61-80': scores.filter(s => s >= 61 && s <= 80).length,
      '81-100': scores.filter(s => s >= 81 && s <= 100).length,
      '101-140': scores.filter(s => s >= 101 && s <= 140).length,
      '140+': scores.filter(s => s >= 140).length
    };

    const data = {
      labels: Object.keys(ranges),
      datasets: [
        {
          data: Object.values(ranges),
          backgroundColor: [
            '#e16162',
            '#ffc107', 
            '#688db1',
            '#9cb68f',
            '#688db1',
            '#9cb68f',
            '#e16162'
          ],
          borderColor: '#343845',
          borderWidth: 2
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#9ca3af'
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.label}: ${context.parsed} Würfe`
          }
        }
      }
    };

    return { data, options };
  };

  const calculatePlayerStats = (player) => {
    const activeThrows = player.throws?.filter(t => t.status === 'active') || [];
    const totalScore = activeThrows.reduce((sum, t) => sum + t.total, 0);
    const averageScore = activeThrows.length > 0 ? (totalScore / activeThrows.length).toFixed(1) : '0.0';
    const highestThrow = activeThrows.length > 0 ? Math.max(...activeThrows.map(t => t.total)) : 0;
    
    return {
      throwsCount: activeThrows.length,
      totalScore,
      averageScore: parseFloat(averageScore),
      highestThrow,
      dartsThrown: activeThrows.length * 3
    };
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

  if (error || !game) {
    return (
      <div className="p-6">
        <div className="card" style={{ textAlign: 'center', backgroundColor: 'rgba(225, 97, 98, 0.1)' }}>
          <h3>❌ Fehler</h3>
          <p style={{ color: 'var(--accent-red)', marginTop: 'var(--spacing-2)' }}>
            {error || 'Spiel nicht gefunden'}
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 'var(--spacing-4)' }}
            onClick={() => navigate('/history')}
          >
            Zurück zur Historie
          </button>
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
            <h1>📋 Spieldetails</h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Detaillierte Übersicht des Spiels
            </p>
          </div>
          <button
            className="btn btn-outline"
            onClick={() => navigate('/history')}
          >
            ← Zurück zur Historie
          </button>
        </div>

        {/* Game Info Card */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 'var(--spacing-4)',
          backgroundColor: 'var(--background-darker)',
          padding: 'var(--spacing-4)',
          borderRadius: '12px',
          marginBottom: 'var(--spacing-4)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-1)' }}>🎯</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>
              {game.gameMode.toUpperCase()}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Spielmodus</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-1)' }}>📊</div>
            <div style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              color: getGameStatusColor(game.status)
            }}>
              {getGameStatusText(game.status)}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Status</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-1)' }}>📅</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {formatDate(game.createdAt)}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Erstellt</div>
          </div>

          {game.status === 'finished' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-1)' }}>⏱️</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {formatDuration(game.duration)}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Spieldauer</div>
            </div>
          )}
        </div>
      </div>

      {/* Winner Announcement */}
      {game.status === 'finished' && game.winner && (
        <div className="card" style={{ 
          backgroundColor: 'rgba(156, 182, 143, 0.2)', 
          border: '2px solid var(--accent-green)',
          textAlign: 'center'
        }}>
          <h2 style={{ color: 'var(--accent-green)', margin: 0, marginBottom: 'var(--spacing-2)' }}>
            🏆 Gewinner
          </h2>
          {game.players?.find(p => p.player?._id === game.winner?._id || p.player?._id === game.winner) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-3)' }}>
              <div
                className="player-avatar"
                style={{
                  backgroundColor: game.players.find(p => p.player?._id === game.winner?._id || p.player?._id === game.winner)?.player?.color || 'var(--accent-green)',
                  width: '60px',
                  height: '60px',
                  fontSize: '1.5rem'
                }}
              >
                {getInitials(game.players.find(p => p.player?._id === game.winner?._id || p.player?._id === game.winner)?.player?.name || 'Winner')}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>
                  {game.players.find(p => p.player?._id === game.winner?._id || p.player?._id === game.winner)?.player?.name || 'Winner'}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Glückwunsch zum Sieg! 🎉
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Players Details */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--spacing-4)' }}>👥 Spieler-Statistiken</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          {game.players?.map((player, index) => {
            const stats = calculatePlayerStats(player);
            const isWinner = game.winner && (player.player?._id === game.winner?._id || player.player?._id === game.winner);
            
            return (
              <div
                key={index}
                className="card"
                style={{
                  backgroundColor: isWinner ? 'rgba(156, 182, 143, 0.1)' : 'var(--background-darker)',
                  border: isWinner ? '2px solid var(--accent-green)' : '1px solid var(--border-color)'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: 'var(--spacing-3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                    <div
                      className="player-avatar"
                      style={{
                        backgroundColor: player.player?.color || 'var(--accent-blue)',
                        width: '40px',
                        height: '40px',
                        fontSize: '1rem'
                      }}
                    >
                      {getInitials(player.player?.name || 'Unknown')}
                    </div>
                    <div>
                      <strong style={{ fontSize: '1.25rem' }}>{player.player?.name || 'Unknown'}</strong>
                      {isWinner && <span style={{ marginLeft: 'var(--spacing-2)', color: 'var(--accent-green)' }}>👑</span>}
                    </div>
                  </div>
                  
                  <div style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold',
                    color: player.currentScore === 0 ? 'var(--accent-green)' : 'var(--text-primary)'
                  }}>
                    {player.currentScore}
                  </div>
                </div>

                {/* Player Stats Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                  gap: 'var(--spacing-3)',
                  marginBottom: 'var(--spacing-3)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>
                      {stats.throwsCount}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Würfe</div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>
                      {stats.averageScore}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Ø Punkte</div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>
                      {stats.highestThrow}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Höchstwurf</div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                      {stats.dartsThrown}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Darts</div>
                  </div>
                </div>

                {/* Throws History */}
                <div>
                  <h4 style={{ marginBottom: 'var(--spacing-2)' }}>🎯 Wurf-Verlauf</h4>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))', 
                    gap: 'var(--spacing-1)',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    padding: 'var(--spacing-2)',
                    backgroundColor: 'var(--card-background)',
                    borderRadius: 'var(--radius)'
                  }}>
                    {player.throws?.filter(t => t.status === 'active').map((throw_, throwIndex) => (
                      <div
                        key={throwIndex}
                        style={{
                          padding: 'var(--spacing-1)',
                          textAlign: 'center',
                          backgroundColor: throw_.total >= 140 ? 'rgba(156, 182, 143, 0.4)' : 
                                          throw_.total >= 100 ? 'rgba(104, 141, 177, 0.4)' : 
                                          throw_.total >= 60 ? 'rgba(104, 141, 177, 0.2)' :
                                          'var(--background-darker)',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.875rem',
                          fontWeight: throw_.total >= 100 ? 'bold' : 'normal',
                          color: throw_.total >= 140 ? 'var(--accent-green)' : 'var(--text-primary)'
                        }}
                      >
                        {throw_.total}
                      </div>
                    ))}
                    
                    {(!player.throws || player.throws.filter(t => t.status === 'active').length === 0) && (
                      <div style={{ 
                        gridColumn: '1 / -1',
                        textAlign: 'center', 
                        color: 'var(--text-secondary)', 
                        fontStyle: 'italic',
                        padding: 'var(--spacing-2)'
                      }}>
                        Keine Würfe vorhanden
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Section */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--spacing-4)' }}>📊 Analyse & Verlauf</h3>
        
        {/* Game Overview Charts */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: 'var(--spacing-4)',
          marginBottom: 'var(--spacing-6)'
        }}>
          {/* Average Scores Comparison */}
          {generateGameOverviewChart() && (
            <div style={{ 
              backgroundColor: 'var(--background-darker)',
              padding: 'var(--spacing-4)',
              borderRadius: '12px'
            }}>
              <h4 style={{ marginBottom: 'var(--spacing-3)', textAlign: 'center' }}>
                🎯 Durchschnittspunkte Vergleich
              </h4>
              <div style={{ height: '250px' }}>
                <Bar {...generateGameOverviewChart()} />
              </div>
            </div>
          )}

          {/* Score Distribution */}
          {generateScoreDistributionChart() && (
            <div style={{ 
              backgroundColor: 'var(--background-darker)',
              padding: 'var(--spacing-4)',
              borderRadius: '12px'
            }}>
              <h4 style={{ marginBottom: 'var(--spacing-3)', textAlign: 'center' }}>
                📈 Punkteverteilung (alle Würfe)
              </h4>
              <div style={{ height: '250px' }}>
                <Doughnut {...generateScoreDistributionChart()} />
              </div>
            </div>
          )}
        </div>

        {/* Individual Player Charts */}
        <div>
          <h4 style={{ marginBottom: 'var(--spacing-4)' }}>📈 Individueller Wurf-Verlauf</h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: 'var(--spacing-4)' 
          }}>
            {game.players?.map((player, index) => {
              const chartData = generatePlayerThrowChart(player);
              if (!chartData) return null;

              return (
                <div 
                  key={index}
                  style={{ 
                    backgroundColor: 'var(--background-darker)',
                    padding: 'var(--spacing-4)',
                    borderRadius: '12px',
                    border: `2px solid ${player.player?.color || 'var(--border-color)'}`
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'var(--spacing-2)',
                    marginBottom: 'var(--spacing-3)'
                  }}>
                    <div
                      style={{
                        backgroundColor: player.player?.color || 'var(--accent-blue)',
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {getInitials(player.player?.name || 'Unknown')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>
                        {player.player?.name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {player.throws?.filter(t => t.status === 'active').length || 0} Würfe • 
                        Ø {calculatePlayerStats(player).averageScore} Punkte
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ height: '200px' }}>
                    <Line {...chartData} />
                  </div>

                  {/* Quick Stats under chart */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: 'var(--spacing-2)',
                    marginTop: 'var(--spacing-3)',
                    fontSize: '0.875rem'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--accent-green)' }}>
                        {calculatePlayerStats(player).highestThrow}
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>Höchstwurf</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--accent-blue)' }}>
                        {calculatePlayerStats(player).averageScore}
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>Durchschnitt</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {calculatePlayerStats(player).throwsCount}
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>Würfe</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline"
            onClick={() => navigate('/history')}
          >
            📜 Zurück zur Historie
          </button>
          
          {game.status === 'active' && (
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/game/${game._id}`)}
            >
              ▶️ Spiel fortsetzen
            </button>
          )}
          
          <button
            className="btn btn-outline"
            onClick={() => navigate('/game-setup')}
          >
            ➕ Neues Spiel starten
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameDetails;