import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Button,
    ButtonGroup,
    Card,
    PageHeader,
    PageTitle,
    Alert,
    LoaderContainer,
    Loader,
    FormGroup,
    Label
} from '../components/styled';

const ImportTokens = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [importStats, setImportStats] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
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
                    <Label htmlFor="file">JSON-Datei auswählen</Label>
                    <div style={{
                        border: '2px dashed #4a5568',
                        borderRadius: '8px',
                        padding: '2rem',
                        textAlign: 'center',
                        marginBottom: '1rem',
                        backgroundColor: '#2C2E3B'
                    }}>
                        <input
                            type="file"
                            id="file"
                            accept=".json"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        <label htmlFor="file" style={{
                            cursor: 'pointer',
                            display: 'block',
                            marginBottom: '1rem'
                        }}>
                            {file ? file.name : 'JSON-Datei hier ablegen oder klicken zum Auswählen'}
                        </label>

                        {file && (
                            <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                                Ausgewählte Datei: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                            </p>
                        )}
                    </div>

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
                        {isLoading ? <Loader size="20px" /> : 'Tokens importieren'}
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