import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ user, onLogout }) => {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            ApplyAI
          </Link>
          
          <nav className="nav-links">
            <Link to="/">Dashboard</Link>
            {user.is_admin && (
              <Link to="/admin">Admin Panel</Link>
            )}
            <div className="user-info">
              <span className="user-email">{user.email}</span>
              <button onClick={onLogout} className="form-button" style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                Logout
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;