function ProgressBar({ progress, currentLocation }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Scraping Progress</h3>
        <p className="card-description">
          Fortschritt der Datenextraktion
        </p>
      </div>

      <div className="progress">
        <div 
          className="progress-bar" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="progress-text">
        {progress}% abgeschlossen
      </div>

      {currentLocation && (
        <div className="mt-4 p-3" style={{ 
          backgroundColor: 'var(--background-darker)', 
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(209, 213, 219, 0.1)'
        }}>
          <div className="flex items-center gap-2">
            <div className="loading"></div>
            <div>
              <div className="text-sm font-weight-500">Aktuell verarbeitet:</div>
              <div className="text-sm text-secondary">{currentLocation}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgressBar