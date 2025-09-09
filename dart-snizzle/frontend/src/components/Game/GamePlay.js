import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const GamePlay = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [currentThrow, setCurrentThrow] = useState({
    dart1: { value: 0, multiplier: 1 },
    dart2: { value: 0, multiplier: 1 },
    dart3: { value: 0, multiplier: 1 }
  });
  const [currentDart, setCurrentDart] = useState(1);
  const [directInput, setDirectInput] = useState('');
  const [inputMode, setInputMode] = useState('buttons'); // 'buttons' or 'direct'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [liveStats, setLiveStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [showThrowHistory, setShowThrowHistory] = useState(false);

  useEffect(() => {
    fetchGame();
  }, [gameId]);

  // Add keyboard event listener for Enter key support
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Enter' && game?.status === 'active') {
        event.preventDefault();
        
        // If in direct input mode and input has value
        if (inputMode === 'direct' && directInput.trim()) {
          handleDirectInput();
        }
        // If in button mode and total > 0
        else if (inputMode === 'buttons' && calculateTotal() > 0) {
          submitThrow();
        }
      }
      // Ctrl+Z for undo
      else if (event.ctrlKey && event.key === 'z' && game?.status === 'active') {
        event.preventDefault();
        undoLastThrow();
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    document.addEventListener('keydown', handleKeyPress); // For Ctrl+Z
    return () => {
      document.removeEventListener('keypress', handleKeyPress);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [game?.status, inputMode, directInput, currentThrow, loading]);

  const fetchGame = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/games/${gameId}`);
      setGame(response.data.game);
    } catch (error) {
      setError('Spiel nicht gefunden');
      console.error('Error fetching game:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveStats = async () => {
    try {
      const response = await api.get(`/games/${gameId}/stats`);
      setLiveStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching live stats:', error);
    }
  };

  const startGame = async () => {
    try {
      const response = await api.put(`/games/${gameId}/start`);
      setGame(response.data.game);
    } catch (error) {
      setError('Fehler beim Starten des Spiels');
      console.error('Error starting game:', error);
    }
  };

  const submitThrow = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/games/${gameId}/throw`, currentThrow);
      setGame(response.data.game);
      
      // Reset throw input
      setCurrentThrow({
        dart1: { value: 0, multiplier: 1 },
        dart2: { value: 0, multiplier: 1 },
        dart3: { value: 0, multiplier: 1 }
      });
      setCurrentDart(1);
      
    } catch (error) {
      setError('Fehler beim Speichern des Wurfs');
      console.error('Error submitting throw:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreInput = (score) => {
    const dartKey = `dart${currentDart}`;
    setCurrentThrow({
      ...currentThrow,
      [dartKey]: { ...currentThrow[dartKey], value: score }
    });
    
    if (currentDart < 3) {
      setCurrentDart(currentDart + 1);
    }
  };

  const handleMultiplierChange = (multiplier) => {
    const dartKey = `dart${currentDart}`;
    setCurrentThrow({
      ...currentThrow,
      [dartKey]: { ...currentThrow[dartKey], multiplier }
    });
  };

  const calculateTotal = () => {
    return Object.values(currentThrow).reduce((sum, dart) => sum + (dart.value * dart.multiplier), 0);
  };

  const handleDirectInput = () => {
    const score = parseInt(directInput) || 0;
    if (score < 0 || score > 180) {
      setError('Wurfpunkte müssen zwischen 0 und 180 liegen');
      return;
    }

    // Set the total score as dart1 and clear others
    setCurrentThrow({
      dart1: { value: score, multiplier: 1 },
      dart2: { value: 0, multiplier: 1 },
      dart3: { value: 0, multiplier: 1 }
    });
    setCurrentDart(1);
    setDirectInput('');
    setError('');
  };

  const resetThrow = () => {
    setCurrentThrow({
      dart1: { value: 0, multiplier: 1 },
      dart2: { value: 0, multiplier: 1 },
      dart3: { value: 0, multiplier: 1 }
    });
    setCurrentDart(1);
    setDirectInput('');
    setError('');
  };

  const undoLastThrow = async () => {
    if (!window.confirm('Letzten Wurf rückgängig machen?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.put(`/games/${gameId}/undo-throw`);
      setGame(response.data.game);
      setError('');
    } catch (error) {
      if (error.response?.status === 400) {
        setError(error.response.data.message || 'Keine Würfe zum Rückgängigmachen');
      } else {
        setError('Fehler beim Rückgängigmachen des Wurfs');
      }
      console.error('Error undoing throw:', error);
    } finally {
      setLoading(false);
    }
  };

  const pauseGame = async () => {
    try {
      setLoading(true);
      const response = await api.put(`/games/${gameId}/pause`);
      setGame(response.data.game);
      setError('');
    } catch (error) {
      setError('Fehler beim Pausieren des Spiels');
      console.error('Error pausing game:', error);
    } finally {
      setLoading(false);
    }
  };

  const resumeGame = async () => {
    try {
      setLoading(true);
      const response = await api.put(`/games/${gameId}/resume`);
      setGame(response.data.game);
      setError('');
    } catch (error) {
      setError('Fehler beim Fortsetzen des Spiels');
      console.error('Error resuming game:', error);
    } finally {
      setLoading(false);
    }
  };

  const abandonGame = async () => {
    if (!window.confirm('Spiel wirklich abbrechen? Alle Fortschritte gehen verloren!')) {
      return;
    }

    try {
      setLoading(true);
      await api.put(`/games/${gameId}/abandon`);
      navigate('/');
    } catch (error) {
      setError('Fehler beim Abbrechen des Spiels');
      console.error('Error abandoning game:', error);
      setLoading(false);
    }
  };

  const getCurrentPlayer = () => {
    if (!game || !game.players) return null;
    return game.players[game.currentPlayerIndex || 0];
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading && !game) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center" style={{ height: '50vh' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="p-6">
        <div className="card">
          <h1>❌ Spiel nicht gefunden</h1>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentPlayer = getCurrentPlayer();

  return (
    <div className="p-6 space-y-6">
      {/* Game Header */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>🎯 {game.gameMode.toUpperCase()}</h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Status: <span style={{ 
                color: game.status === 'active' ? 'var(--accent-green)' : 
                       game.status === 'finished' ? 'var(--accent-blue)' : 
                       game.status === 'paused' ? 'var(--accent-yellow)' : 
                       'var(--accent-red)' 
              }}>
                {game.status === 'active' ? 'Aktiv' : 
                 game.status === 'finished' ? 'Beendet' : 
                 game.status === 'paused' ? 'Pausiert' :
                 game.status === 'waiting' ? 'Wartend' : 
                 game.status === 'abandoned' ? 'Abgebrochen' : game.status}
              </span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
            {game.status === 'waiting' && (
              <button className="btn btn-primary" onClick={startGame}>
                ▶️ Spiel starten
              </button>
            )}
            {game.status === 'active' && (
              <button className="btn btn-secondary" onClick={pauseGame} disabled={loading}>
                ⏸️ Pausieren
              </button>
            )}
            {game.status === 'paused' && (
              <>
                <button className="btn btn-primary" onClick={resumeGame} disabled={loading}>
                  ▶️ Fortsetzen
                </button>
                <button className="btn btn-danger" onClick={abandonGame} disabled={loading}>
                  ❌ Abbrechen
                </button>
              </>
            )}
            {(game.status === 'active' || game.status === 'paused') && (
              <button 
                className="btn btn-outline" 
                onClick={abandonGame} 
                disabled={loading}
                style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}
              >
                🗑️ Abbrechen
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="card" style={{ backgroundColor: 'var(--accent-red)', color: 'white' }}>
          ❌ {error}
        </div>
      )}

      {/* Player Scores */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
          <h3 style={{ margin: 0 }}>Spieler Scores {game.status === 'active' && currentPlayer && (
            <span style={{ fontSize: '0.875rem', color: 'var(--accent-blue)', fontWeight: 'normal' }}>
              - {currentPlayer.player?.name} ist dran
            </span>
          )}</h3>
          {(game.status === 'active' || game.status === 'paused') && (
            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
              <button
                className={`btn ${showStats ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => {
                  setShowStats(!showStats);
                  if (!showStats) {
                    fetchLiveStats();
                  }
                }}
                style={{ fontSize: '0.875rem' }}
              >
                📊 Live Stats
              </button>
              <button
                className={`btn ${showThrowHistory ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setShowThrowHistory(!showThrowHistory)}
                style={{ fontSize: '0.875rem' }}
              >
                📋 Wurfverlauf
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-2" style={{ gap: 'var(--spacing-4)', marginTop: 'var(--spacing-4)' }}>
          {game.players?.map((player, index) => (
            <div
              key={player._id}
              className="card"
              style={{
                backgroundColor: index === (game.currentPlayerIndex || 0) && game.status === 'active'
                  ? 'rgba(104, 141, 177, 0.2)'
                  : 'var(--background-darker)',
                border: index === (game.currentPlayerIndex || 0) && game.status === 'active'
                  ? '3px solid var(--accent-blue)'
                  : '2px solid transparent',
                transform: index === (game.currentPlayerIndex || 0) && game.status === 'active'
                  ? 'scale(1.02)'
                  : 'scale(1)',
                transition: 'all 0.3s ease',
                position: 'relative',
                boxShadow: index === (game.currentPlayerIndex || 0) && game.status === 'active'
                  ? 'var(--shadow-lg)'
                  : 'var(--shadow)'
              }}
            >
              {/* Current Player Indicator */}
              {index === (game.currentPlayerIndex || 0) && game.status === 'active' && (
                <div 
                  className="pulse"
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: 'var(--accent-blue)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    boxShadow: 'var(--shadow)',
                    zIndex: 10
                  }}>
                  🎯
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                <div
                  className="player-avatar"
                  style={{
                    backgroundColor: player.player?.color || 'var(--accent-blue)',
                    width: '50px',
                    height: '50px'
                  }}
                >
                  {getInitials(player.player?.name || 'Unknown')}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0 }}>
                    {player.player?.name || 'Unknown'}
                    {index === (game.currentPlayerIndex || 0) && game.status === 'active' && (
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--accent-blue)', 
                        marginLeft: 'var(--spacing-2)',
                        fontWeight: 'normal'
                      }}>
                        • Am Wurf
                      </span>
                    )}
                  </h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-2)' }}>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>
                        {player.currentScore || player.startingScore || 501}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Verbleibend
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                        {player.throws?.filter(t => t.status !== 'undone')?.length || 0}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Würfe
                      </div>
                      {player.throws?.some(t => t.status === 'undone') && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-red)', marginTop: '2px' }}>
                          ({player.throws?.filter(t => t.status === 'undone')?.length} rückgängig)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Live Statistics */}
        {showStats && liveStats && (
          <div style={{ marginTop: 'var(--spacing-4)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-4)' }}>
            <h4>📊 Live Statistiken</h4>
            
            {/* Charts Section */}
            <div className="grid grid-2" style={{ gap: 'var(--spacing-4)', marginTop: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}>
              {/* Durchschnittswerte Vergleich */}
              <div className="card" style={{ padding: 'var(--spacing-3)' }}>
                <h5 style={{ marginBottom: 'var(--spacing-3)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Durchschnittswerte</h5>
                <div style={{ height: '200px' }}>
                  <Bar
                    data={{
                      labels: liveStats.players.map(p => p.name),
                      datasets: [{
                        label: 'Durchschnitt',
                        data: liveStats.players.map(p => parseFloat(p.averageScore) || 0),
                        backgroundColor: ['#688db1', '#9cb68f', '#e16162', '#f59e0b', '#8b5cf6'].slice(0, liveStats.players.length),
                        borderColor: '#2B2E3B',
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: '#343845',
                          titleColor: '#d1d5db',
                          bodyColor: '#d1d5db'
                        }
                      },
                      scales: {
                        x: { 
                          ticks: { color: '#9ca3af' },
                          grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        y: { 
                          ticks: { color: '#9ca3af' },
                          grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Höchste Würfe Vergleich */}
              <div className="card" style={{ padding: 'var(--spacing-3)' }}>
                <h5 style={{ marginBottom: 'var(--spacing-3)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Höchste Würfe</h5>
                <div style={{ height: '200px' }}>
                  <Bar
                    data={{
                      labels: liveStats.players.map(p => p.name),
                      datasets: [{
                        label: 'Höchster Wurf',
                        data: liveStats.players.map(p => p.highestThrow || 0),
                        backgroundColor: ['#9cb68f', '#688db1', '#e16162', '#f59e0b', '#8b5cf6'].slice(0, liveStats.players.length),
                        borderColor: '#2B2E3B',
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: '#343845',
                          titleColor: '#d1d5db',
                          bodyColor: '#d1d5db'
                        }
                      },
                      scales: {
                        x: { 
                          ticks: { color: '#9ca3af' },
                          grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        y: { 
                          ticks: { color: '#9ca3af' },
                          grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Score Distribution */}
            {liveStats.players.some(p => p.recentThrows?.length > 0) && (
              <div className="card" style={{ padding: 'var(--spacing-3)', marginBottom: 'var(--spacing-3)' }}>
                <h5 style={{ marginBottom: 'var(--spacing-3)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Wurfverlauf (letzte 10 Würfe)</h5>
                <div style={{ height: '250px' }}>
                  <Line
                    data={{
                      labels: Array.from({length: Math.max(...liveStats.players.map(p => p.recentThrows?.length || 0))}, (_, i) => `Wurf ${i + 1}`),
                      datasets: liveStats.players.map((player, index) => ({
                        label: player.name,
                        data: (player.recentThrows || []).slice(-10).map(t => t.total),
                        borderColor: ['#688db1', '#9cb68f', '#e16162', '#f59e0b', '#8b5cf6'][index % 5],
                        backgroundColor: ['#688db1', '#9cb68f', '#e16162', '#f59e0b', '#8b5cf6'][index % 5] + '20',
                        borderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        fill: false
                      }))
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          labels: { color: '#d1d5db' }
                        },
                        tooltip: {
                          backgroundColor: '#343845',
                          titleColor: '#d1d5db',
                          bodyColor: '#d1d5db'
                        }
                      },
                      scales: {
                        x: { 
                          ticks: { color: '#9ca3af' },
                          grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        y: { 
                          ticks: { color: '#9ca3af' },
                          grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Player Stats Cards */}
            <div className="grid grid-2" style={{ gap: 'var(--spacing-3)', marginTop: 'var(--spacing-3)' }}>
              {liveStats.players.map((playerStat, index) => (
                <div key={index} className="card" style={{ backgroundColor: 'var(--background-darker)', padding: 'var(--spacing-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
                    <div
                      className="player-avatar"
                      style={{
                        backgroundColor: playerStat.color || 'var(--accent-blue)',
                        width: '30px',
                        height: '30px',
                        fontSize: '0.875rem'
                      }}
                    >
                      {getInitials(playerStat.name)}
                    </div>
                    <strong>{playerStat.name}</strong>
                  </div>
                  <div className="grid grid-2" style={{ gap: 'var(--spacing-2)', fontSize: '0.875rem' }}>
                    <div>
                      <div style={{ color: 'var(--text-secondary)' }}>Durchschnitt</div>
                      <div style={{ fontWeight: 'bold', color: 'var(--accent-blue)' }}>{playerStat.averageScore}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)' }}>Höchster Wurf</div>
                      <div style={{ fontWeight: 'bold', color: 'var(--accent-green)' }}>{playerStat.highestThrow}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)' }}>Darts geworfen</div>
                      <div style={{ fontWeight: 'bold' }}>{playerStat.dartsThrown}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-secondary)' }}>Würfe</div>
                      <div style={{ fontWeight: 'bold' }}>{playerStat.throwsCount}</div>
                    </div>
                  </div>
                  {playerStat.recentThrows?.length > 0 && (
                    <div style={{ marginTop: 'var(--spacing-2)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-1)' }}>Letzte Würfe:</div>
                      <div style={{ display: 'flex', gap: 'var(--spacing-1)', flexWrap: 'wrap' }}>
                        {playerStat.recentThrows.slice(-3).map((throw_, throwIndex) => (
                          <span
                            key={throwIndex}
                            style={{
                              fontSize: '0.75rem',
                              padding: '2px 6px',
                              backgroundColor: 'var(--card-background)',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            {throw_.total}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 'var(--spacing-3)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Gesamt Würfe im Spiel: {liveStats.totalThrows}
            </div>
          </div>
        )}
        
        {/* Throw History */}
        {showThrowHistory && (
          <div style={{ marginTop: 'var(--spacing-4)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-4)' }}>
            <h4>📋 Wurfverlauf</h4>
            <div style={{ marginTop: 'var(--spacing-3)' }}>
              {game.players?.map((player, playerIndex) => (
                <div key={playerIndex} style={{ marginBottom: 'var(--spacing-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-2)' }}>
                    <div
                      className="player-avatar"
                      style={{
                        backgroundColor: player.player?.color || 'var(--accent-blue)',
                        width: '24px',
                        height: '24px',
                        fontSize: '0.75rem'
                      }}
                    >
                      {getInitials(player.player?.name || 'Unknown')}
                    </div>
                    <strong>{player.player?.name || 'Unknown'}</strong>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      ({(player.throws?.filter(t => t.status !== 'undone') || []).length} Würfe)
                    </span>
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', 
                    gap: 'var(--spacing-1)',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    padding: 'var(--spacing-2)',
                    backgroundColor: 'var(--background-darker)',
                    borderRadius: 'var(--radius)'
                  }}>
                    {player.throws?.filter(t => t.status !== 'undone').map((throw_, throwIndex) => (
                      <div
                        key={throwIndex}
                        style={{
                          padding: 'var(--spacing-1)',
                          textAlign: 'center',
                          backgroundColor: throw_.total >= 100 ? 'rgba(156, 182, 143, 0.3)' : 
                                          throw_.total >= 60 ? 'rgba(104, 141, 177, 0.3)' : 
                                          'var(--card-background)',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.875rem',
                          fontWeight: throw_.total >= 100 ? 'bold' : 'normal'
                        }}
                      >
                        {throw_.total}
                      </div>
                    )) || []}
                    
                    {/* Show message if no throws */}
                    {(!player.throws || player.throws.filter(t => t.status !== 'undone').length === 0) && (
                      <div style={{ 
                        gridColumn: '1 / -1',
                        textAlign: 'center', 
                        color: 'var(--text-secondary)', 
                        fontStyle: 'italic',
                        padding: 'var(--spacing-2)'
                      }}>
                        Noch keine Würfe
                      </div>
                    )}
                  </div>
                  
                  {/* Undone throws indicator */}
                  {player.throws?.some(t => t.status === 'undone') && (
                    <div style={{ 
                      marginTop: 'var(--spacing-1)', 
                      fontSize: '0.75rem', 
                      color: 'var(--accent-red)',
                      fontStyle: 'italic'
                    }}>
                      {player.throws.filter(t => t.status === 'undone').length} rückgängig gemachte Würfe
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Game Paused Message */}
      {game.status === 'paused' && (
        <div className="card" style={{ textAlign: 'center', backgroundColor: 'rgba(255, 193, 7, 0.2)' }}>
          <h3>⏸️ Spiel pausiert</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--spacing-2)' }}>
            Das Spiel ist momentan pausiert. Drücke "Fortsetzen" um weiterzuspielen.
          </p>
        </div>
      )}

      {/* Throw Input - Only show if game is active */}
      {game.status === 'active' && currentPlayer && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
            <h3 style={{ margin: 0 }}>Wurf eingeben - {currentPlayer.player?.name}</h3>
            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
              <button
                className={`btn ${inputMode === 'buttons' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setInputMode('buttons')}
              >
                📊 Einzeldarts
              </button>
              <button
                className={`btn ${inputMode === 'direct' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setInputMode('direct')}
              >
                ⚡ Direkteingabe
              </button>
            </div>
          </div>

          {/* Smart Direct Input Mode */}
          {inputMode === 'direct' && (
            <div style={{ marginTop: 'var(--spacing-4)' }}>
              <h4>🎯 Schnelle Punkteingabe</h4>
              
              {/* Quick Score Buttons */}
              <div style={{ marginTop: 'var(--spacing-3)', marginBottom: 'var(--spacing-3)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-2)' }}>Häufige Würfe:</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-3)' }}>
                  {[180, 140, 100, 85, 81, 60, 57, 50, 45, 41, 26, 25, 20, 19, 18, 0].map(score => (
                    <button
                      key={score}
                      className="btn btn-outline"
                      onClick={() => {
                        setDirectInput(score.toString());
                        setTimeout(() => handleDirectInput(), 100);
                      }}
                      style={{ 
                        padding: 'var(--spacing-2)', 
                        fontSize: '0.875rem',
                        backgroundColor: score >= 100 ? 'rgba(156, 182, 143, 0.2)' : score === 0 ? 'rgba(225, 97, 98, 0.2)' : 'transparent'
                      }}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)', alignItems: 'center', justifyContent: 'center' }}>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Punkte eingeben..."
                  value={directInput}
                  onChange={(e) => setDirectInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && directInput.trim()) {
                      e.preventDefault();
                      handleDirectInput();
                    }
                  }}
                  min="0"
                  max="180"
                  autoFocus
                  style={{ 
                    width: '200px', 
                    textAlign: 'center', 
                    fontSize: '1.4rem',
                    padding: 'var(--spacing-3)',
                    borderRadius: '12px',
                    border: '2px solid var(--accent-blue)',
                    backgroundColor: 'var(--card-background)',
                    color: 'var(--text-primary)'
                  }}
                />
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-1)'
                }}>
                  <span>⌨️</span>
                  <span>Drücke Enter zum Bestätigen</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Compact Dart Input */}
          {inputMode === 'buttons' && (
            <>
            <div style={{ marginTop: 'var(--spacing-4)' }}>
              <h4>🎯 Einzeldart-Eingabe</h4>
              
              {/* Compact Dart Display */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr auto', 
                gap: 'var(--spacing-3)', 
                alignItems: 'center',
                backgroundColor: 'var(--background-darker)',
                padding: 'var(--spacing-3)',
                borderRadius: '8px',
                marginTop: 'var(--spacing-3)',
                marginBottom: 'var(--spacing-3)'
              }}>
                {[1, 2, 3].map(dartNum => (
                  <div
                    key={dartNum}
                    onClick={() => setCurrentDart(dartNum)}
                    style={{
                      backgroundColor: currentDart === dartNum ? 'var(--accent-blue)' : 'var(--card-background)',
                      color: currentDart === dartNum ? 'white' : 'var(--text-primary)',
                      textAlign: 'center',
                      padding: 'var(--spacing-2)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: currentDart === dartNum ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: currentDart === dartNum ? 'white' : 'var(--text-secondary)' }}>Dart {dartNum}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: '2px' }}>
                      {currentThrow[`dart${dartNum}`].multiplier > 1 && 
                        <span style={{ fontSize: '0.875rem' }}>{currentThrow[`dart${dartNum}`].multiplier}×</span>}
                      {currentThrow[`dart${dartNum}`].value || '-'}
                    </div>
                    <div style={{ fontSize: '0.75rem', marginTop: '2px', color: currentDart === dartNum ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' }}>
                      = {currentThrow[`dart${dartNum}`].value * currentThrow[`dart${dartNum}`].multiplier}
                    </div>
                  </div>
                ))}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Gesamt</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>
                    {calculateTotal()}
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div style={{ marginBottom: 'var(--spacing-3)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-2)' }}>Schnelle Aktionen:</div>
                <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      const dartKey = `dart${currentDart}`;
                      setCurrentThrow(prev => ({
                        ...prev,
                        [dartKey]: { value: 20, multiplier: 3 }
                      }));
                      if (currentDart < 3) setCurrentDart(currentDart + 1);
                    }}
                    style={{ fontSize: '0.875rem', backgroundColor: 'rgba(156, 182, 143, 0.2)' }}
                  >
                    T20 (60)
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      const dartKey = `dart${currentDart}`;
                      setCurrentThrow(prev => ({
                        ...prev,
                        [dartKey]: { value: 25, multiplier: 2 }
                      }));
                      if (currentDart < 3) setCurrentDart(currentDart + 1);
                    }}
                    style={{ fontSize: '0.875rem', backgroundColor: 'rgba(225, 97, 98, 0.2)' }}
                  >
                    Bull (50)
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      const dartKey = `dart${currentDart}`;
                      setCurrentThrow(prev => ({
                        ...prev,
                        [dartKey]: { value: 20, multiplier: 1 }
                      }));
                      if (currentDart < 3) setCurrentDart(currentDart + 1);
                    }}
                    style={{ fontSize: '0.875rem' }}
                  >
                    20er
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      const dartKey = `dart${currentDart}`;
                      setCurrentThrow(prev => ({
                        ...prev,
                        [dartKey]: { value: 0, multiplier: 1 }
                      }));
                      if (currentDart < 3) setCurrentDart(currentDart + 1);
                    }}
                    style={{ fontSize: '0.875rem', backgroundColor: 'rgba(156, 163, 175, 0.2)' }}
                  >
                    Miss
                  </button>
                  {currentDart > 1 && (
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        const prevDart = currentDart - 1;
                        const prevKey = `dart${prevDart}`;
                        setCurrentThrow(prev => ({
                          ...prev,
                          [prevKey]: { value: 0, multiplier: 1 }
                        }));
                        setCurrentDart(prevDart);
                      }}
                      style={{ fontSize: '0.875rem', color: 'var(--accent-red)' }}
                    >
                      ↶ Undo
                    </button>
                  )}
                </div>
              </div>

              {/* Compact Multiplier & Number Input */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--spacing-3)' }}>
                {/* Multiplier */}
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-2)' }}>
                    Dart {currentDart} Multiplikator:
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--spacing-1)' }}>
                    {[1, 2, 3].map(mult => (
                      <button
                        key={mult}
                        className={`btn ${currentThrow[`dart${currentDart}`].multiplier === mult ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => handleMultiplierChange(mult)}
                        style={{ flex: 1, fontSize: '0.875rem', padding: 'var(--spacing-2)' }}
                      >
                        {mult}×
                      </button>
                    ))}
                  </div>
                </div>

                {/* Number Input */}
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-2)' }}>
                    Zahlen:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                    {[...Array(21)].map((_, i) => (
                      <button
                        key={i}
                        className="btn btn-outline"
                        onClick={() => handleScoreInput(i)}
                        disabled={loading}
                        style={{ 
                          fontSize: '0.75rem', 
                          padding: '8px 4px',
                          backgroundColor: i === 20 ? 'rgba(156, 182, 143, 0.2)' : 'transparent'
                        }}
                      >
                        {i}
                      </button>
                    ))}
                    <button
                      className="btn btn-outline"
                      onClick={() => handleScoreInput(25)}
                      disabled={loading}
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '8px 4px',
                        backgroundColor: 'rgba(225, 97, 98, 0.2)',
                        color: 'var(--accent-red)',
                        gridColumn: 'span 1'
                      }}
                    >
                      25
                    </button>
                  </div>
                </div>
              </div>
            </div>
            </>
          )}

          {/* Throw Actions */}
          <div style={{ 
            display: 'flex', 
            gap: 'var(--spacing-4)', 
            marginTop: 'var(--spacing-6)',
            justifyContent: 'center'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>
                Gesamt: {calculateTotal()}
              </div>
              <button
                className="btn btn-primary btn-large"
                onClick={submitThrow}
                disabled={loading || calculateTotal() === 0}
                style={{ marginTop: 'var(--spacing-2)', minWidth: '200px' }}
                title={calculateTotal() > 0 ? 'Enter-Taste zum Bestätigen' : 'Mindestens 1 Punkt erforderlich'}
              >
                {loading ? 'Speichere...' : '✅ Wurf bestätigen (Enter)'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-4)', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              onClick={resetThrow}
            >
              🔄 Zurücksetzen
            </button>
            
            <button
              className="btn btn-outline"
              onClick={undoLastThrow}
              disabled={loading}
              title="Letzten Wurf rückgängig machen (Strg+Z)"
              style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}
            >
              ↶ Wurf rückgängig
            </button>
          </div>
        </div>
      )}

      {/* Game Finished */}
      {game.status === 'finished' && (
        <div className="card" style={{ textAlign: 'center', backgroundColor: 'rgba(156, 182, 143, 0.2)' }}>
          <h2>🏆 Spiel beendet!</h2>
          {game.winner && (
            <p style={{ fontSize: '1.25rem', marginTop: 'var(--spacing-4)' }}>
              Gewinner: <strong>{game.winner.name}</strong>
            </p>
          )}
          <button
            className="btn btn-primary"
            onClick={() => navigate('/game-setup')}
            style={{ marginTop: 'var(--spacing-4)' }}
          >
            🎯 Neues Spiel
          </button>
        </div>
      )}
    </div>
  );
};

export default GamePlay;