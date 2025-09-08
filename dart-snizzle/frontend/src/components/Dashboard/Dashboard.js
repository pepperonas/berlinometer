import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setStats({ totalGames: 0, gamesWon: 0, totalPlayers: 0 });
      setRecentGames([]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h1>Welcome back, {user?.username}! 🎯</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Ready for another game?
            </p>
          </div>
          <Link to="/game-setup" className="btn btn-primary btn-large">
            Start New Game
          </Link>
        </div>
      </div>

      <div className="grid grid-3">
        <div className="card stat-card">
          <span className="stat-number">{stats?.totalGames || 0}</span>
          <span className="stat-label">Total Games</span>
        </div>
        <div className="card stat-card">
          <span className="stat-number">{stats?.gamesWon || 0}</span>
          <span className="stat-label">Games Won</span>
        </div>
        <div className="card stat-card">
          <span className="stat-number">{stats?.totalPlayers || 0}</span>
          <span className="stat-label">Players</span>
        </div>
      </div>

      <div className="card">
        <h3>Quick Actions</h3>
        <div className="grid grid-2">
          <Link to="/players" className="btn btn-outline">
            👥 Manage Players
          </Link>
          <Link to="/statistics" className="btn btn-outline">
            📊 View Statistics
          </Link>
          <Link to="/game-setup" className="btn btn-secondary">
            🎯 Quick Game
          </Link>
          <Link to="/settings" className="btn btn-outline">
            ⚙️ Settings
          </Link>
        </div>
      </div>

      {user?.status === 'pending' && (
        <div className="card" style={{ 
          backgroundColor: 'var(--accent-red)', 
          color: 'white' 
        }}>
          <h4>⚠️ Account Pending Approval</h4>
          <p>
            Your account is waiting for admin approval. Some features may be limited until your account is activated.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;