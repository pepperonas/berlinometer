import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { 
  Form, 
  FormGroup, 
  Label, 
  Input, 
  Button, 
  ErrorMessage, 
  Alert,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  LoaderContainer,
  Loader
} from '../components/styled';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md};
`;

const LoginCard = styled(Card)`
  width: 100%;
  max-width: 450px;
`;

const LoginFooter = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const StatusLink = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.8rem;
  margin-top: ${({ theme }) => theme.spacing.md};
  
  &:hover {
    color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

// Diese Konstante wird nicht mehr verwendet, aber für zukünftige Referenz belassen

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Einfache Validierung
    if (!username.trim() || !password.trim()) {
      setError('Bitte gib Benutzername und Passwort ein');
      return;
    }
    
    setIsLoading(true);
    try {
      // Statusmeldung für den Benutzer
      setError('Verbinde mit Server... (Dies kann bis zu 30 Sekunden dauern)');
      
      await login(username, password);
      setError(''); // Fehlermeldung zurücksetzen
      navigate('/dashboard');
    } catch (err) {
      console.error('Login-Fehler:', err);
      // Fehlermeldung wird bereits in der login-Funktion gesetzt
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      setError('Verbinde mit Demo-Account...');
      
      await login('demo', 'demo123');
      setError('');
      navigate('/dashboard');
    } catch (err) {
      console.error('Demo-Login-Fehler:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <CardHeader>
          <CardTitle>Bei MPSec anmelden</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <Alert type="error">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="username">Benutzername</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </FormGroup>
            
            <Button 
              type="submit" 
              variant="primary" 
              disabled={isLoading}
              style={{ width: '100%', marginBottom: '12px' }}
            >
              {isLoading ? <Loader size="20px" /> : 'Anmelden'}
            </Button>

            <Button 
              type="button" 
              variant="secondary" 
              disabled={isLoading}
              style={{ width: '100%' }}
              onClick={handleDemoLogin}
            >
              Demo-Account testen
            </Button>
          </Form>
          
          <LoginFooter>
            Noch kein Konto? <Link to="/register">Registrieren</Link>
          </LoginFooter>
        </CardContent>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
