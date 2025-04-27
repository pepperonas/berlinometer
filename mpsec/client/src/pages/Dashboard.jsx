import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import api from '../services/api';
import {
  Button,
  Card,
  CardContent,
  Grid,
  PageHeader,
  PageTitle,
  Alert,
  LoaderContainer,
  Loader,
  Badge,
  ButtonGroup,
  Input,
  FormGroup
} from '../components/styled';

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxl} 0;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const TokenCard = styled(Card)`
  transition: ${({ theme }) => theme.transitions.default};
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const TokenName = styled.h3`
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  word-break: break-word;
`;

const TokenIssuer = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  word-break: break-word;
`;

const TokenInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const TokenActions = styled.div``;

const TokenType = styled(Badge)`
  margin-right: ${({ theme }) => theme.spacing.xs};
`;

const SearchContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ActionContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const DeleteConfirmation = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: rgba(225, 97, 98, 0.1);
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border-left: 4px solid ${({ theme }) => theme.colors.accentRed};
`;

const Dashboard = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await api.get('/tokens');
        setTokens(response.data.data);
      } catch (err) {
        console.error('Fehler beim Laden der Tokens:', err);
        setError('Tokens konnten nicht geladen werden');
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredTokens = tokens.filter(token => {
    const searchLower = searchTerm.toLowerCase();
    return (
        token.name.toLowerCase().includes(searchLower) ||
        (token.issuer && token.issuer.toLowerCase().includes(searchLower))
    );
  });

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      const response = await api.delete('/tokens');
      setDeleteMessage(response.data.message || `${response.data.count} Tokens wurden gelöscht`);
      setTokens([]);
      setShowDeleteConfirm(false);
      // Erfolgsmeldung anzeigen
      setTimeout(() => {
        setDeleteMessage('');
      }, 3000);
    } catch (err) {
      console.error('Fehler beim Löschen aller Tokens:', err);
      setError('Tokens konnten nicht gelöscht werden');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
        <LoaderContainer>
          <Loader size="40px" />
        </LoaderContainer>
    );
  }

  return (
      <>
        <PageHeader>
          <PageTitle>Deine 2FA-Tokens</PageTitle>
          <ButtonGroup>
            <Button
                as={Link}
                to="/tokens/add"
                variant="primary"
            >
              Neuen Token hinzufügen
            </Button>
            <Button
                as={Link}
                to="/tokens/import"
                variant="outline"
            >
              Tokens importieren
            </Button>
          </ButtonGroup>
        </PageHeader>

        {error && <Alert type="error">{error}</Alert>}
        {deleteMessage && <Alert type="success">{deleteMessage}</Alert>}

        {tokens.length > 0 && (
            <>
              <ActionContainer>
                <SearchContainer>
                  <FormGroup>
                    <Input
                        type="text"
                        placeholder="Tokens durchsuchen..."
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                  </FormGroup>
                </SearchContainer>

                {!showDeleteConfirm ? (
                    <Button
                        variant="danger"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={tokens.length === 0}
                    >
                      Alle Tokens löschen
                    </Button>
                ) : null}
              </ActionContainer>

              {showDeleteConfirm && (
                  <DeleteConfirmation>
                    <h4>Wirklich alle Tokens löschen?</h4>
                    <p>Diese Aktion kann nicht rückgängig gemacht werden.</p>
                    <ButtonGroup style={{ marginTop: '1rem' }}>
                      <Button
                          variant="danger"
                          onClick={handleDeleteAll}
                          disabled={isDeleting}
                      >
                        {isDeleting ? <Loader size="20px" /> : 'Ja, alle löschen'}
                      </Button>
                      <Button
                          variant="outline"
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={isDeleting}
                      >
                        Abbrechen
                      </Button>
                    </ButtonGroup>
                  </DeleteConfirmation>
              )}
            </>
        )}

        {tokens.length === 0 ? (
            <EmptyState>
              <h3>Keine Tokens vorhanden</h3>
              <p>Füge deinen ersten 2FA-Token hinzu, um zu beginnen</p>
              <ButtonGroup style={{ marginTop: '1rem', justifyContent: 'center' }}>
                <Button
                    as={Link}
                    to="/tokens/add"
                    variant="primary"
                >
                  Token hinzufügen
                </Button>
                <Button
                    as={Link}
                    to="/tokens/import"
                    variant="outline"
                >
                  Tokens importieren
                </Button>
              </ButtonGroup>
            </EmptyState>
        ) : (
            <Grid>
              {filteredTokens.map((token) => (
                  <TokenCard
                      key={token._id}
                      as={Link}
                      to={`/tokens/${token._id}`}
                      style={{ textDecoration: 'none' }}
                  >
                    <CardContent>
                      <TokenName>{token.name}</TokenName>
                      {token.issuer && <TokenIssuer>{token.issuer}</TokenIssuer>}

                      <TokenInfo>
                        <TokenActions>
                          <TokenType type="primary">{token.type}</TokenType>
                          <TokenType>{token.digits} Ziffern</TokenType>
                        </TokenActions>
                      </TokenInfo>
                    </CardContent>
                  </TokenCard>
              ))}
            </Grid>
        )}

        {filteredTokens.length === 0 && tokens.length > 0 && (
            <EmptyState>
              <h3>Keine Tokens gefunden</h3>
              <p>Keine Ergebnisse für "{searchTerm}"</p>
            </EmptyState>
        )}
      </>
  );
};

export default Dashboard;