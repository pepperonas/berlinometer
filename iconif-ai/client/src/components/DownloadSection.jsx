import React, { useState, useEffect } from 'react';

function DownloadSection({ downloadUrl }) {
    const [downloadError, setDownloadError] = useState(false);
    const [downloadStarted, setDownloadStarted] = useState(false);

    // Ensure we have a complete URL (already provided in the logs)
    // Prevent any re-rendering issues by storing the URL in state
    const [fullDownloadUrl, setFullDownloadUrl] = useState('');

    useEffect(() => {
        // Setze die URL nur einmal beim ersten Rendern oder wenn sie sich ändert
        if (downloadUrl && downloadUrl !== fullDownloadUrl) {
            const completeUrl = downloadUrl.startsWith('http')
                ? downloadUrl
                : `http://localhost:5012${downloadUrl}`;

            setFullDownloadUrl(completeUrl);
            console.log('Download URL:', completeUrl);
        }
    }, [downloadUrl]);

    const handleDownloadClick = (e) => {
        // Set download started state
        setDownloadStarted(true);

        // Check if the download fails after a timeout
        setTimeout(() => {
            fetch(fullDownloadUrl, { method: 'HEAD' })
                .then(response => {
                    if (!response.ok) {
                        console.error('Download URL check failed:', response.status);
                        setDownloadError(true);
                    }
                })
                .catch(error => {
                    console.error('Error checking download URL:', error);
                    setDownloadError(true);
                });
        }, 3000);
    };

    const retryDownload = () => {
        setDownloadError(false);
        setDownloadStarted(false);
        // Force reload by adding a timestamp
        window.open(`${fullDownloadUrl}?t=${new Date().getTime()}`, '_blank');
    };

    // Wenn keine URL vorhanden ist oder noch nicht gesetzt wurde, nichts anzeigen
    if (!fullDownloadUrl) {
        return null;
    }

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

            {downloadError ? (
                <div className="download-error">
                    <p>Das Herunterladen des ZIP-Pakets ist fehlgeschlagen.</p>
                    <button
                        className="btn btn-primary download-btn"
                        onClick={retryDownload}
                    >
                        Erneut versuchen
                    </button>
                </div>
            ) : (
                <>
                    <a
                        href={fullDownloadUrl}
                        download="icon-package.zip"
                        className="btn btn-primary download-btn"
                        onClick={handleDownloadClick}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Icon-Paket herunterladen (.zip)
                    </a>

                    {downloadStarted && (
                        <div className="download-started-message">
                            <p>Der Download sollte jetzt beginnen...</p>
                            <p>Falls nicht, <button className="text-button" onClick={retryDownload}>hier klicken</button>.</p>
                        </div>
                    )}
                </>
            )}

            <p className="download-note">
                Alle Dateien sind optimiert und bereit für den Einsatz in deinen Projekten.
            </p>

            <div className="direct-download-tip">
                <p><strong>Tipp:</strong> Falls der Download nicht funktioniert, versuche diese direkte URL:</p>
                <code
                    className="download-url-code"
                    onClick={() => {navigator.clipboard.writeText(fullDownloadUrl)}}
                    title="Klicken zum Kopieren"
                >
                    {fullDownloadUrl}
                </code>
            </div>
        </div>
    );
}

export default DownloadSection;