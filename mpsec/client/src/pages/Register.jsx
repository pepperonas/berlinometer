import React, { useState } from 'react';
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

const RegisterContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md};
`;

const RegisterCard = styled(Card)`
  width: 100%;
  max-width: 450px;
`;

const RegisterFooter = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { register, error, setError } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};
    
    if (!username.trim()) {
      errors.username = 'Benutzername ist erforderlich';
    } else if (username.length < 3) {
      errors.username = 'Benutzername muss mindestens 3 Zeichen lang sein';
    }
    
    if (!password) {
      errors.password = 'Passwort ist erforderlich';
    } else if (password.length < 8) {
      errors.password = 'Passwort muss mindestens 8 Zeichen lang sein';
    }
    
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwörter stimmen nicht überein';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validieren
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    try {
      await register(username, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registrierungsfehler:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RegisterContainer>
      <RegisterCard>
        <CardHeader>
          <CardTitle>Bei MPSec registrieren</CardTitle>
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
                error={validationErrors.username}
              />
              {validationErrors.username && (
                <ErrorMessage>{validationErrors.username}</ErrorMessage>
              )}
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                error={validationErrors.password}
              />
              {validationErrors.password && (
                <ErrorMessage>{validationErrors.password}</ErrorMessage>
              )}
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                error={validationErrors.confirmPassword}
              />
              {validationErrors.confirmPassword && (
                <ErrorMessage>{validationErrors.confirmPassword}</ErrorMessage>
              )}
            </FormGroup>
            
            <Button 
              type="submit" 
              variant="primary" 
              disabled={isLoading}
              style={{ width: '100%' }}
            >
              {isLoading ? <Loader size="20px" /> : 'Registrieren'}
            </Button>
          </Form>
          
          <RegisterFooter>
            Bereits ein Konto? <Link to="/login">Anmelden</Link>
          </RegisterFooter>
        </CardContent>
      </RegisterCard>
    </RegisterContainer>
  );
};

export default Register;
