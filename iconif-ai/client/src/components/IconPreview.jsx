import React, { useState, useEffect } from 'react';

function IconPreview({ icon }) {
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        // Reset error when a new icon is loaded
        setImageError(false);
    }, [icon]);

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

    // Ensure we have a complete URL
    const fullImageUrl = icon.previewUrl.startsWith('http')
        ? icon.previewUrl
        : `http://localhost:5012${icon.previewUrl}`;

    // Model display names
    const modelDisplayNames = {
        'dall-e-2': 'DALL-E 2',
        'dall-e-3': 'DALL-E 3',
        'dall-e-3.5': 'DALL-E 3.5'
    };

    // Aspect ratio display names
    const aspectRatioDisplayNames = {
        'square': 'Quadratisch (1:1)',
        'landscape': 'Querformat (16:9)',
        'portrait': 'Hochformat (9:16)'
    };

    return (
        <div className="card preview-card">
            <h2>Icon-Vorschau</h2>
            <div className="preview-container">
                {imageError ? (
                    <div className="image-error">
                        <p>Bild konnte nicht geladen werden</p>
                        <p className="error-url">URL: {fullImageUrl}</p>
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setImageError(false);
                                // Force reload by adding a timestamp
                                window.location.href = fullImageUrl + '?t=' + new Date().getTime();
                            }}
                        >
                            Neu laden
                        </button>
                    </div>
                ) : (
                    <img
                        src={fullImageUrl}
                        alt="Generiertes Icon"
                        className="icon-preview"
                        onError={() => setImageError(true)}
                    />
                )}
            </div>

            <div className="preview-info">
                <div className="preview-meta">
                    <span>Stil: {icon.style}</span>
                    {icon.color && <span>Farbe: {icon.color}</span>}
                </div>

                <div className="preview-details">
                    {icon.model && (
                        <div className="preview-detail-item">
                            <span className="detail-label">Modell:</span>
                            <span className="detail-value">{modelDisplayNames[icon.model] || icon.model}</span>
                        </div>
                    )}

                    {icon.aspectRatio && (
                        <div className="preview-detail-item">
                            <span className="detail-label">Format:</span>
                            <span className="detail-value">{aspectRatioDisplayNames[icon.aspectRatio] || icon.aspectRatio}</span>
                        </div>
                    )}
                </div>

                <p className="preview-prompt">"{icon.prompt}"</p>
            </div>
        </div>
    );
}

export default IconPreview;