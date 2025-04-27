import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import styled from 'styled-components';
import {
    Button,
    ButtonGroup,
    Card,
    PageHeader,
    PageTitle,
    Alert,
    FormGroup,
    Label
} from '../components/styled';

const DropZone = styled.div`
  border: 2px dashed ${({ isDragActive, theme }) =>
    isDragActive ? theme.colors.accentBlue : '#4a5568'};
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  margin-bottom: 1rem;
  background-color: ${({ isDragActive, theme }) =>
    isDragActive ? 'rgba(104, 141, 177, 0.1)' : '#2C2E3B'};
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 150px;
`;

const Loader = styled.div`
  display: inline-block;
  border: 3px solid #343845;
  border-top: 3px solid #688db1;
  border-radius: 50%;
  width: ${({ size }) => size || '24px'};
  height: ${({ size }) => size || '24px'};
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const FileInfo = styled.div`
  margin-top: 1rem;
  color: #9ca3af;
  font-size: 0.9rem;
`;

const ImportTokens = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [importStats, setImportStats] = useState(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setError('');
        }
    };

    const handleImport = async () => {
        if (!file) {
            setError('Bitte wähle eine JSON-Datei aus');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Datei einlesen
            const fileReader = new FileReader();

            fileReader.onload = async (event) => {
                try {
                    const content = JSON.parse(event.target.result);

                    // Daten an Backend senden
                    const response = await api.post('/tokens/import', { tokens: content });

                    setImportStats(response.data.data);
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 2000);
                } catch (parseError) {
                    console.error('JSON Parsing-Fehler:', parseError);
                    setError('Die Datei enthält kein gültiges JSON-Format');
                    setIsLoading(false);
                }
            };

            fileReader.onerror = () => {
                setError('Fehler beim Lesen der Datei');
                setIsLoading(false);
            };

            fileReader.readAsText(file);
        } catch (err) {
            console.error('Import-Fehler:', err);
            setError(
                err.response?.data?.message ||
                'Tokens konnten nicht importiert werden'
            );
            setIsLoading(false);
        }
    };

    return (
        <>
            <PageHeader>
                <PageTitle>Tokens importieren</PageTitle>
                <Button
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                >
                    Abbrechen
                </Button>
            </PageHeader>

            {error && <Alert type="error">{error}</Alert>}

            {importStats && (
                <Alert type="success">
                    {importStats.imported} Tokens erfolgreich importiert!
                    {importStats.skipped > 0 && ` (${importStats.skipped} übersprungen)`}
                    <br />
                    Du wirst gleich zum Dashboard weitergeleitet...
                </Alert>
            )}

            <Card>
                <FormGroup>
                    <Label htmlFor="file">JSON-Datei auswählen oder hierher ziehen</Label>
                    <input
                        type="file"
                        id="file"
                        ref={fileInputRef}
                        accept=".json"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    <DropZone
                        isDragActive={isDragActive}
                        onClick={() => fileInputRef.current.click()}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        {isLoading ? (
                            <Loader size="40px" />
                        ) : (
                            <>
                                <p>{file ? file.name : 'JSON-Datei hier ablegen oder klicken zum Auswählen'}</p>

                                {file && (
                                    <FileInfo>
                                        Ausgewählte Datei: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                    </FileInfo>
                                )}
                            </>
                        )}
                    </DropZone>

                    <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                        Unterstützte Formate: OTPManager JSON-Datei mit Token-Konfigurationen
                    </p>
                </FormGroup>

                <ButtonGroup>
                    <Button
                        variant="primary"
                        onClick={handleImport}
                        disabled={!file || isLoading}
                    >
                        {isLoading ? 'Importiere...' : 'Tokens importieren'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/dashboard')}
                        disabled={isLoading}
                    >
                        Abbrechen
                    </Button>
                </ButtonGroup>
            </Card>
        </>
    );
};

export default ImportTokens;