import React from 'react';

function Header() {
  return (
    <header className="app-header">
      <h1>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#688db1" />
          <path d="M7 12H17M12 7V17" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        iconif<span>-ai</span>
      </h1>
      <div className="header-actions">
        <button className="btn btn-outline">Info</button>
      </div>
    </header>
  );
}

export default Header;
