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
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--accent-blue)' }}>
              🎯 Dart Snizzle
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {user?.username}
            </p>
          </div>

          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                    ${location.pathname === item.path
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-opacity-20'
                    }
                  `}
                  style={{
                    backgroundColor: location.pathname === item.path 
                      ? 'var(--accent-blue)' 
                      : 'transparent',
                    color: location.pathname === item.path 
                      ? 'white' 
                      : 'var(--text-primary)'
                  }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label.replace(/^[\\w\\s]+ /, '')}</span>
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