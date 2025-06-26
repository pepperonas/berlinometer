function ProgressBar({ progress, currentLocation }) {
  // Debug log
  console.log('ProgressBar: progress =', progress, 'currentLocation =', currentLocation)
  
  // Validierung von progress
  const validProgress = isNaN(progress) ? 0 : Math.max(0, Math.min(100, progress))
  
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #333',
      margin: '16px 0'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ 
          color: '#fff', 
          fontSize: '18px', 
          fontWeight: '600', 
          margin: '0 0 8px 0' 
        }}>
          Scraping Progress
        </h3>
        <p style={{ 
          color: '#888', 
          fontSize: '14px', 
          margin: '0' 
        }}>
          Fortschritt der Datenextraktion
        </p>
      </div>

      {/* Progress Container */}
      <div style={{
        width: '100%',
        height: '20px',
        backgroundColor: '#333',
        borderRadius: '10px',
        overflow: 'hidden',
        position: 'relative',
        marginBottom: '16px',
        border: '2px solid #444'
      }}>
        {/* Progress Bar */}
        <div style={{
          width: `${validProgress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #3b82f6, #10b981)',
          borderRadius: '8px',
          transition: 'width 0.5s ease',
          position: 'relative',
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
        }}>
          {/* Shine Effect */}
          {validProgress > 0 && (
            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              animation: 'shine 2s infinite'
            }}></div>
          )}
        </div>
      </div>
      
      {/* Progress Text */}
      <div style={{
        textAlign: 'center',
        color: '#fff',
        fontSize: '16px',
        fontWeight: '500',
        marginBottom: '16px'
      }}>
        {validProgress}% abgeschlossen
      </div>

      {/* Current Location */}
      {currentLocation && (
        <div style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid #444',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {/* Loading Spinner */}
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid #666',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            flexShrink: '0'
          }}></div>
          
          <div>
            <div style={{
              color: '#fff',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px'
            }}>
              Aktuell verarbeitet:
            </div>
            <div style={{
              color: '#10b981',
              fontSize: '14px'
            }}>
              {currentLocation}
            </div>
          </div>
        </div>
      )}

      {/* Add CSS animations */}
      <style>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default ProgressBar