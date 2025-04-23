import React from 'react';

function LoadingIndicator({ message }) {
  return (
    <div className="loading-indicator">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
}

export default LoadingIndicator;
