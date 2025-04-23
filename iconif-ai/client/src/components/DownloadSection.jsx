// client/src/components/DownloadSection.jsx
import React from 'react';

function DownloadSection({ downloadUrl }) {
    // Stelle sicher, dass die URL vollständig ist
    const fullDownloadUrl = downloadUrl.startsWith('http')
        ? downloadUrl
        : `http://localhost:5012${downloadUrl}`;

    // Logging zum Debuggen
    console.log('Download URL:', fullDownloadUrl);

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
                href={fullDownloadUrl}
                download="icon-package.zip"
                className="btn btn-primary download-btn"
                target="_blank"
                rel="noopener noreferrer"
            >
                Icon-Paket herunterladen (.zip)
            </a>

            <p className="download-note">Alle Dateien sind optimiert und bereit für den Einsatz in deinen Projekten.</p>
        </div>
    );
}

export default DownloadSection;