import React from 'react';

function IconPreview({ icon }) {
  if (!icon) {
    return (
      <div className="card preview-card">
        <div className="empty-preview">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill="#343845" />
            <path d="M7 12H17M12 7V17" stroke="#688db1" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <p>Deine Icon-Vorschau wird hier angezeigt</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card preview-card">
      <h2>Icon-Vorschau</h2>
      <div className="preview-container">
          <img
              src={`http://localhost:5012${icon.previewUrl}`}
              alt="Generiertes Icon"
              className="icon-preview"
          />      </div>
      
      <div className="preview-info">
        <div className="preview-meta">
          <span>Stil: {icon.style}</span>
          {icon.color && <span>Farbe: {icon.color}</span>}
        </div>
        <p className="preview-prompt">"{icon.prompt}"</p>
      </div>
    </div>
  );
}

export default IconPreview;
