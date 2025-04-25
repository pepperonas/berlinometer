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
  Badge
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

const Dashboard = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        <Button 
          as={Link} 
          to="/tokens/add" 
          variant="primary"
        >
          Neuen Token hinzufügen
        </Button>
      </PageHeader>

      {error && <Alert type="error">{error}</Alert>}

      {tokens.length === 0 ? (
        <EmptyState>
          <h3>Keine Tokens vorhanden</h3>
          <p>Füge deinen ersten 2FA-Token hinzu, um zu beginnen</p>
          <Button 
            as={Link} 
            to="/tokens/add" 
            variant="primary"
            style={{ marginTop: '1rem' }}
          >
            Token hinzufügen
          </Button>
        </EmptyState>
      ) : (
        <Grid>
          {tokens.map((token) => (
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
    </>
  );
};

export default Dashboard;
