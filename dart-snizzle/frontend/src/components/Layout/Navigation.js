import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: '🏠 Dashboard', icon: '🏠' },
    { path: '/players', label: '👥 Players', icon: '👥' },
    { path: '/game-setup', label: '🎯 New Game', icon: '🎯' },
    { path: '/statistics', label: '📊 Stats', icon: '📊' },
    { path: '/settings', label: '⚙️ Settings', icon: '⚙️' }
  ];

  return (
    <>
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="btn btn-primary"
          style={{ padding: 'var(--spacing-2)' }}
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      <nav className={`
        fixed top-0 left-0 h-full w-64 transform transition-transform duration-300 z-40
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:block
      `}
        style={{ backgroundColor: 'var(--card-background)' }}
      >
        <div className="p-6">
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-8)' }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: 'var(--accent-blue)',
              marginBottom: 'var(--spacing-2)'
            }}>
              🎯 Dart Snizzle
            </h2>
            <p style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-secondary)',
              margin: 0 
            }}>
              {user?.username}
            </p>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {navItems.map((item) => (
              <li key={item.path} style={{ marginBottom: 'var(--spacing-2)' }}>
                <Link
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-3)',
                    padding: 'var(--spacing-3) var(--spacing-4)',
                    borderRadius: 'var(--radius-lg)',
                    transition: 'all var(--transition)',
                    textDecoration: 'none',
                    backgroundColor: location.pathname === item.path 
                      ? 'var(--accent-blue)' 
                      : 'transparent',
                    color: location.pathname === item.path 
                      ? 'white' 
                      : 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => {
                    if (location.pathname !== item.path) {
                      e.target.style.backgroundColor = 'rgba(104, 141, 177, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (location.pathname !== item.path) {
                      e.target.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: '1.125rem' }}>{item.icon}</span>
                  <span style={{ fontSize: '1rem' }}>
                    {item.label.replace(/^.+\s/, '')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="absolute bottom-6 left-6 right-6">
            {user?.status === 'pending' && (
              <div className="mb-4 p-2 rounded text-sm text-center"
                style={{ 
                  backgroundColor: 'var(--accent-red)', 
                  color: 'white' 
                }}
              >
                Account Pending
              </div>
            )}
            
            <button
              onClick={logout}
              className="btn btn-outline w-full"
            >
              🚪 Logout
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
    </>
  );
};

export default Navigation;