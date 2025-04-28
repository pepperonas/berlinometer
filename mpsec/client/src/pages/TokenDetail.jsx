import React, {useEffect, useRef, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import styled from 'styled-components';
import api from '../services/api';
import {
    Alert,
    Badge,
    Button,
    ButtonGroup,
    Card,
    Loader,
    LoaderContainer,
    PageHeader,
    PageTitle,
    ProgressBar,
    TimeRemaining,
    TokenCode
} from '../components/styled';

const TokenDetailCard = styled(Card)`
    margin-bottom: ${({theme}) => theme.spacing.xl};
`;

const TokenHeader = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: ${({theme}) => theme.spacing.lg};
`;

const TokenInfo = styled.div`
    flex: 1;
`;

const TokenName = styled.h2`
    margin-bottom: ${({theme}) => theme.spacing.xs};
`;

const TokenIssuer = styled.div`
    color: ${({theme}) => theme.colors.textSecondary};
`;

const TokenMetadata = styled.div`
    display: flex;
    gap: ${({theme}) => theme.spacing.md};
    margin-bottom: ${({theme}) => theme.spacing.lg};
    flex-wrap: wrap;
`;

const TokenMetaItem = styled.div`
    background-color: ${({theme}) => theme.colors.backgroundDarker};
    padding: ${({theme}) => theme.spacing.sm} ${({theme}) => theme.spacing.md};
    border-radius: ${({theme}) => theme.borderRadius.md};
    font-size: ${({theme}) => theme.typography.fontSize.sm};
`;

const QRCodeContainer = styled.div`
    max-width: 300px;
    margin: ${({theme}) => theme.spacing.xl} auto;
    text-align: center;
`;

const QRCodeLink = styled.a`
    color: ${({theme}) => theme.colors.accentBlue};
    text-decoration: underline;
    cursor: pointer;
`;

const DeleteConfirmation = styled.div`
    margin-top: ${({theme}) => theme.spacing.xl};
    padding: ${({theme}) => theme.spacing.lg};
    background-color: rgba(225, 97, 98, 0.1);
    border-radius: ${({theme}) => theme.borderRadius.md};
    border-left: 4px solid ${({theme}) => theme.colors.accentRed};
`;

const ActionsContainer = styled.div`
    display: flex;
    justify-content: space-between;
    margin-top: ${({theme}) => theme.spacing.xl};
`;

const TokenDetail = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [token, setToken] = useState(null);
    const [code, setCode] = useState('');
    const [remainingTime, setRemainingTime] = useState(0);
    const [progress, setProgress] = useState(100);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showQRCode, setShowQRCode] = useState(false);
    const [qrCodeUrl, setQRCodeUrl] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [errorCount, setErrorCount] = useState(0);
    const [codeGenerationAttempts, setCodeGenerationAttempts] = useState(0);
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);
    const intervalRef = useRef(null);

    // Zeitkorrigierte Codes Zustände
    const [timeAdjustedCodes, setTimeAdjustedCodes] = useState(null);
    const [showTimeAdjusted, setShowTimeAdjusted] = useState(false);
    const [timeOffset, setTimeOffset] = useState(-3480); // -58 Minuten als Standard
    const [isLoadingAdjusted, setIsLoadingAdjusted] = useState(false);
    const [timeAdjustedError, setTimeAdjustedError] = useState('');

    // Funktion zum Laden der zeitkorrigierten Codes
    const fetchTimeAdjustedCodes = async () => {
        setIsLoadingAdjusted(true);
        setTimeAdjustedError('');

        try {
            const response = await api.get(`/tokens/${id}/adjusted-code?offset=${timeOffset}`);
            if (response.data.success) {
                setTimeAdjustedCodes(response.data.data);
            } else {
                throw new Error(response.data.message || 'Fehler beim Laden der zeitkorrigierten Codes');
            }
        } catch (err) {
            console.error('Fehler beim Laden der zeitkorrigierten Codes:', err);
            setTimeAdjustedError(
                err.response?.data?.message ||
                err.message ||
                'Zeitkorrigierte Codes konnten nicht geladen werden'
            );
        } finally {
            setIsLoadingAdjusted(false);
        }
    };

    // Regelmäßige Aktualisierung der zeitkorrigierten Codes
    useEffect(() => {
        if (showTimeAdjusted && !timeAdjustedCodes) {
            fetchTimeAdjustedCodes();
        }

        let intervalId;
        if (showTimeAdjusted) {
            intervalId = setInterval(fetchTimeAdjustedCodes, 15000); // Alle 15 Sekunden aktualisieren
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [showTimeAdjusted, timeOffset, id]);

    // Funktion zum Ändern des Zeitoffsets
    const handleOffsetChange = (e) => {
        const newOffset = parseInt(e.target.value, 10);
        setTimeOffset(newOffset);

        // Codes neu laden, wenn der Offset geändert wird
        if (showTimeAdjusted) {
            fetchTimeAdjustedCodes();
        }
    };

    // Token-Daten laden
    useEffect(() => {
        const fetchToken = async () => {
            try {
                const response = await api.get(`/tokens/${id}`);
                setToken(response.data.data);
            } catch (err) {
                console.error('Fehler beim Laden des Tokens:', err);
                setError('Token konnte nicht geladen werden');
            } finally {
                setLoading(false);
            }
        };

        fetchToken();

        // Beim Verlassen der Seite den Timer bereinigen
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [id]);

    // Code generieren
    const generateCode = async () => {
        // Verhindern, dass mehrere Anfragen gleichzeitig laufen
        if (isGeneratingCode) return;

        setIsGeneratingCode(true);
        setError('');

        try {
            const response = await api.get(`/tokens/${id}/code`);

            if (response.data.success) {
                setCode(response.data.data.code);
                setRemainingTime(response.data.data.remainingTime);
                if (token) {
                    setProgress((response.data.data.remainingTime / token.period) * 100);
                }
                setErrorCount(0); // Fehler zurücksetzen, wenn erfolgreich
                setCodeGenerationAttempts(0);
            } else {
                throw new Error(response.data.message || 'Fehler bei der Code-Generierung');
            }
        } catch (err) {
            console.error('Fehler beim Generieren des Codes:', err);

            // Fehlerversuche zählen
            setCodeGenerationAttempts(prev => prev + 1);

            // Bei zu vielen fehlgeschlagenen Versuchen einen dauerhaften Fehler anzeigen
            if (codeGenerationAttempts >= 4) {
                setError('Code konnte nicht generiert werden. Das Token-Secret könnte ungültig sein.');
            } else {
                setError('Code konnte nicht generiert werden. Versuche es erneut...');
            }
        } finally {
            setIsGeneratingCode(false);
        }
    };

    // Code generieren und Timer aktualisieren
    useEffect(() => {
        if (!token) return;

        // Initial Code generieren
        generateCode();

        // Timer für regelmäßige Aktualisierungen
        intervalRef.current = setInterval(() => {
            // Prüfen, ob Zeit abgelaufen ist
            if (remainingTime <= 1) {
                generateCode();
            } else {
                setRemainingTime(prevTime => prevTime - 1);
                setProgress(prevProgress => prevProgress - (100 / token.period));
            }
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [token]);

    // QR-Code generieren
    const generateQRCode = async () => {
        try {
            const response = await api.get(`/tokens/${id}/qrcode`);
            setQRCodeUrl(response.data.data.otpauthUrl);
            setShowQRCode(true);
        } catch (err) {
            console.error('Fehler beim Generieren des QR-Codes:', err);
            setError('QR-Code konnte nicht generiert werden');
        }
    };

    // Token löschen
    const handleDelete = async () => {
        try {
            await api.delete(`/tokens/${id}`);
            navigate('/dashboard');
        } catch (err) {
            console.error('Fehler beim Löschen des Tokens:', err);
            setError('Token konnte nicht gelöscht werden');
        }
    };

    // Manuell Code neu generieren
    const handleRegenerateCode = () => {
        generateCode();
    };

    if (loading) {
        return (
            <LoaderContainer>
                <Loader size="40px"/>
            </LoaderContainer>
        );
    }

    if (!token) {
        return <Alert type="error">Token nicht gefunden</Alert>;
    }

    return (
        <>
            <PageHeader>
                <PageTitle>Token Details</PageTitle>
                <ButtonGroup>
                    <Button
                        as={Link}
                        to={`/tokens/${id}/edit`}
                        variant="primary"
                    >
                        Bearbeiten
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/dashboard')}
                    >
                        Zurück
                    </Button>
                </ButtonGroup>
            </PageHeader>

            {error && <Alert type="error">{error}</Alert>}

            <TokenDetailCard>
                <TokenHeader>
                    <TokenInfo>
                        <TokenName>{token.name}</TokenName>
                        {token.issuer && <TokenIssuer>{token.issuer}</TokenIssuer>}
                    </TokenInfo>
                    <Badge type="primary">{token.type.toUpperCase()}</Badge>
                </TokenHeader>

                <TokenMetadata>
                    <TokenMetaItem>Algorithmus: {token.algorithm}</TokenMetaItem>
                    <TokenMetaItem>Stellen: {token.digits}</TokenMetaItem>
                    <TokenMetaItem>Periode: {token.period}s</TokenMetaItem>
                </TokenMetadata>

                <TimeRemaining>
                    <ProgressBar progress={progress}/>
                </TimeRemaining>

                <TokenCode>{code || '------'}</TokenCode>

                {!showQRCode ? (
                    <QRCodeContainer>
                        <QRCodeLink onClick={generateQRCode}>
                            QR-Code anzeigen
                        </QRCodeLink>
                    </QRCodeContainer>
                ) : (
                    <QRCodeContainer>
                        <p>Scanne diesen QR-Code mit deiner Authenticator-App:</p>
                        <p style={{wordBreak: 'break-all', marginTop: '10px'}}>
                            {qrCodeUrl}
                        </p>
                    </QRCodeContainer>
                )}

                {showDeleteConfirm ? (
                    <DeleteConfirmation>
                        <h4>Token wirklich löschen?</h4>
                        <p>Dies kann nicht rückgängig gemacht werden.</p>
                        <ButtonGroup style={{marginTop: '1rem'}}>
                            <Button
                                variant="danger"
                                onClick={handleDelete}
                            >
                                Ja, löschen
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Abbrechen
                            </Button>
                        </ButtonGroup>
                    </DeleteConfirmation>
                ) : (
                    <ActionsContainer>
                        <Button
                            variant="danger"
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            Token löschen
                        </Button>
                    </ActionsContainer>
                )}
            </TokenDetailCard>
        </>
    );
};

export default TokenDetail;