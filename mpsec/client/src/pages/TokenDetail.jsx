import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
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
  TokenCode,
  TimeRemaining,
  ProgressBar,
  Badge
} from '../components/styled';

const TokenDetailCard = styled(Card)`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const TokenHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const TokenInfo = styled.div`
  flex: 1;
`;

const TokenName = styled.h2`
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const TokenIssuer = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const TokenMetadata = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
`;

const TokenMetaItem = styled.div`
  background-color: ${({ theme }) => theme.colors.backgroundDarker};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const QRCodeContainer = styled.div`
  max-width: 300px;
  margin: ${({ theme }) => theme.spacing.xl} auto;
  text-align: center;
`;

const QRCodeLink = styled.a`
  color: ${({ theme }) => theme.colors.accentBlue};
  text-decoration: underline;
  cursor: pointer;
`;

const DeleteConfirmation = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: rgba(225, 97, 98, 0.1);
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border-left: 4px solid ${({ theme }) => theme.colors.accentRed};
`;

const ActionsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const TokenDetail = () => {
  const { id } = useParams();
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
  const intervalRef = useRef(null);

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

  // Code generieren und Timer aktualisieren
  useEffect(() => {
    if (!token) return;

    const generateCode = async () => {
      try {
        const response = await api.get(`/tokens/${id}/code`);
        setCode(response.data.data.code);
        setRemainingTime(response.data.data.remainingTime);
        setProgress((response.data.data.remainingTime / token.period) * 100);
      } catch (err) {
        console.error('Fehler beim Generieren des Codes:', err);
        setError('Code konnte nicht generiert werden');
      }
    };

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
  }, [token, id, remainingTime]);

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

  if (loading) {
    return (
      <LoaderContainer>
        <Loader size="40px" />
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
          <ProgressBar progress={progress} />
        </TimeRemaining>

        <TokenCode>{code}</TokenCode>

        {!showQRCode ? (
          <QRCodeContainer>
            <QRCodeLink onClick={generateQRCode}>
              QR-Code anzeigen
            </QRCodeLink>
          </QRCodeContainer>
        ) : (
          <QRCodeContainer>
            <p>Scanne diesen QR-Code mit deiner Authenticator-App:</p>
            <p style={{ wordBreak: 'break-all', marginTop: '10px' }}>
              {qrCodeUrl}
            </p>
          </QRCodeContainer>
        )}

        {showDeleteConfirm ? (
          <DeleteConfirmation>
            <h4>Token wirklich löschen?</h4>
            <p>Dies kann nicht rückgängig gemacht werden.</p>
            <ButtonGroup style={{ marginTop: '1rem' }}>
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
