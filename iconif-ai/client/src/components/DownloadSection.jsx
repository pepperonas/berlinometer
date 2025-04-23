import React from 'react';

function DownloadSection({ downloadUrl }) {
  return (
    <div className="card download-card">
      <h2>Dein Icon-Paket</h2>
      <p>Dein Icon wurde verarbeitet und ist in allen gewünschten Formaten zum Download bereit.</p>
      
      <div className="format-info">
        <p>Paket enthält verschiedene Größen für Web- und App-Nutzung:</p>
        <ul>
          <li>16x16, 32x32, 48x48, 64x64, 128x128, 256x256 Pixel</li>
          <li>App-Icons für iOS und Android</li>
          <li>Favicon-Paket für Webseiten</li>
        </ul>
      </div>
      
      <a 
        href={downloadUrl} 
        download 
        className="btn btn-primary download-btn"
      >
        Icon-Paket herunterladen (.zip)
      </a>
      
      <p className="download-note">Alle Dateien sind optimiert und bereit für den Einsatz in deinen Projekten.</p>
    </div>
  );
}

export default DownloadSection;
