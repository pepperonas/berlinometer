import { useState } from 'react'

function ProgressBar({ progress, currentLocation, batchInfo }) {
  const [debugVisible, setDebugVisible] = useState(false)
  
  // Validierung von progress
  const validProgress = isNaN(progress) ? 0 : Math.max(0, Math.min(100, progress))
  
  // Batch-basierte Anzeige berechnen
  const getBatchStatus = () => {
    if (batchInfo) {
      const { currentBatch, totalBatches, batchProgress, locationsInBatch } = batchInfo
      return {
        batchText: `Batch ${currentBatch}/${totalBatches}`,
        batchSubtext: `${locationsInBatch} Locations parallel verarbeitet`,
        batchProgress: batchProgress || 0
      }
    }
    return null
  }
  
  const batchStatus = getBatchStatus()
  
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
          Scraping Progress - Concurrent Batches
        </h3>
        <p style={{ 
          color: '#888', 
          fontSize: '14px', 
          margin: '0' 
        }}>
          Multithreading & Batch-Verarbeitung für optimale Performance
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
        {batchStatus && (
          <div style={{
            color: '#10b981',
            fontSize: '14px',
            marginTop: '4px'
          }}>
            {batchStatus.batchText}
          </div>
        )}
      </div>

      {/* Batch Status */}
      {batchStatus && (
        <div style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid #444',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px'
          }}>
            {/* Batch Spinner */}
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid #666',
              borderTop: '2px solid #10b981',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              flexShrink: '0'
            }}></div>
            
            <div>
              <div style={{
                color: '#fff',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                🔄 {batchStatus.batchText}
              </div>
              <div style={{
                color: '#888',
                fontSize: '12px'
              }}>
                {batchStatus.batchSubtext}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Location */}
      {currentLocation && (
        <div style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid #444',
          marginBottom: '16px'
        }}>
          <div style={{
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
                📍 Aktuell verarbeitet:
              </div>
              <div style={{
                color: '#10b981',
                fontSize: '14px'
              }}>
                {currentLocation}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug Section - Collapsed by Default */}
      <div style={{
        backgroundColor: '#252525',
        borderRadius: '8px',
        border: '1px solid #444'
      }}>
        <button
          onClick={() => setDebugVisible(!debugVisible)}
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            border: 'none',
            padding: '12px 16px',
            color: '#888',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '8px'
          }}
        >
          <span>🔧 Debug Information</span>
          <span style={{
            transform: debugVisible ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}>▼</span>
        </button>
        
        {debugVisible && (
          <div style={{
            padding: '16px',
            borderTop: '1px solid #444',
            fontSize: '12px',
            color: '#888',
            fontFamily: 'monospace'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#fff' }}>Progress:</strong> {progress} (validated: {validProgress})
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#fff' }}>Current Location:</strong> {currentLocation || 'None'}
            </div>
            {batchInfo && (
              <div>
                <strong style={{ color: '#fff' }}>Batch Info:</strong>
                <pre style={{ 
                  margin: '4px 0 0 16px', 
                  color: '#10b981',
                  fontSize: '11px'
                }}>
                  {JSON.stringify(batchInfo, null, 2)}
                </pre>
              </div>
            )}
            <div style={{ 
              marginTop: '12px', 
              padding: '8px', 
              backgroundColor: '#1a1a1a', 
              borderRadius: '4px'
            }}>
              <strong style={{ color: '#fff' }}>Processing Method:</strong> Concurrent Batches<br/>
              <strong style={{ color: '#fff' }}>Batch Size:</strong> 5 Locations per Batch<br/>
              <strong style={{ color: '#fff' }}>Max Concurrent:</strong> 10 Batches<br/>
              <strong style={{ color: '#fff' }}>Rate Limiting:</strong> Semaphore-based
            </div>
          </div>
        )}
      </div>

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