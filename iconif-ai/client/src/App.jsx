import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import IconGenerator from './components/IconGenerator';
import IconPreview from './components/IconPreview';
import DownloadSection from './components/DownloadSection';
import LoadingIndicator from './components/LoadingIndicator';

function App() {
  const [generatedIcon, setGeneratedIcon] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleIconGenerated = (iconData) => {
    setGeneratedIcon(iconData);
    setDownloadUrl(null);
    setIsGenerating(false); // Wichtig: Status zurücksetzen
  };

  const handleProcessingStart = () => {
    setIsProcessing(true);
    setDownloadUrl(null);
  };

  const handleProcessingComplete = (downloadUrl) => {
    setIsProcessing(false); // Wichtig: Status zurücksetzen
    setDownloadUrl(downloadUrl);
  };

  const handleError = (message) => {
    setErrorMessage(message);
    setIsGenerating(false);
    setIsProcessing(false);
  };

  return (
    <div className="app">
      <Header />
      <main className="app-content">
        <div className="content-container">
          <div className="generator-section">
            <IconGenerator 
              onGenerationStart={() => setIsGenerating(true)}
              onGenerationComplete={handleIconGenerated}
              onProcessingStart={handleProcessingStart}
              onProcessingComplete={handleProcessingComplete}
              onError={handleError}
            />
            
            {errorMessage && (
              <div className="error-message">
                <p>{errorMessage}</p>
                <button onClick={() => setErrorMessage(null)}>Dismiss</button>
              </div>
            )}
          </div>

          <div className="preview-section">
            {isGenerating && (
              <div className="generating-overlay">
                <LoadingIndicator message="Generiere dein Icon..." />
              </div>
            )}
            
            {isProcessing && (
              <div className="processing-overlay">
                <LoadingIndicator message="Verarbeite Icon-Formate..." />
              </div>
            )}
            
            <IconPreview icon={generatedIcon} />
            
            {downloadUrl && (
              <DownloadSection downloadUrl={downloadUrl} />
            )}
          </div>
        </div>
      </main>
      <footer className="app-footer">
        <p>iconif-ai © {new Date().getFullYear()} | KI-Powered Icon Generator</p>
      </footer>
    </div>
  );
}

export default App;
