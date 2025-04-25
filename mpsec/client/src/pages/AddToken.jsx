import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Form, 
  FormGroup, 
  Label, 
  Input, 
  Select,
  Button, 
  ButtonGroup,
  Card, 
  PageHeader, 
  PageTitle, 
  Alert,
  ErrorMessage
} from '../components/styled';

const AddToken = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    secret: '',
    issuer: '',
    type: 'totp',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Für numerische Felder Werte als Zahlen umwandeln
    const convertedValue = name === 'digits' || name === 'period' 
      ? parseInt(value, 10) 
      : value;
      
    setFormData((prev) => ({
      ...prev,
      [name]: convertedValue
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }
    
    if (!formData.secret.trim()) {
      newErrors.secret = 'Secret ist erforderlich';
    } else if (!/^[A-Z2-7]+=*$/i.test(formData.secret)) {
      newErrors.secret = 'Secret muss ein gültiger Base32-String sein';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    try {
      await api.post('/tokens', formData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Fehler beim Erstellen des Tokens:', err);
      setError(
        err.response?.data?.message || 
        'Token konnte nicht erstellt werden'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader>
        <PageTitle>Token hinzufügen</PageTitle>
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
        >
          Abbrechen
        </Button>
      </PageHeader>

      {error && <Alert type="error">{error}</Alert>}

      <Card>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="name">Name (erforderlich)</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              disabled={isLoading}
            />
            {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="secret">Secret (erforderlich)</Label>
            <Input
              id="secret"
              name="secret"
              value={formData.secret}
              onChange={handleChange}
              error={errors.secret}
              disabled={isLoading}
              placeholder="z.B. JBSWY3DPEHPK3PXP"
            />
            {errors.secret && <ErrorMessage>{errors.secret}</ErrorMessage>}
            <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>
              Das Token-Secret ist der Schlüssel, der von der Website oder App bereitgestellt wird.
            </p>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="issuer">Aussteller</Label>
            <Input
              id="issuer"
              name="issuer"
              value={formData.issuer}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="z.B. Google, GitHub, Amazon"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="type">Token-Typ</Label>
            <Select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="totp">TOTP (zeitbasiert)</option>
              <option value="hotp">HOTP (zählerbasiert)</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="algorithm">Algorithmus</Label>
            <Select
              id="algorithm"
              name="algorithm"
              value={formData.algorithm}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="SHA1">SHA1</option>
              <option value="SHA256">SHA256</option>
              <option value="SHA512">SHA512</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="digits">Anzahl der Ziffern</Label>
            <Select
              id="digits"
              name="digits"
              value={formData.digits}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value={6}>6 Ziffern</option>
              <option value={8}>8 Ziffern</option>
            </Select>
          </FormGroup>

          {formData.type === 'totp' && (
            <FormGroup>
              <Label htmlFor="period">Gültigkeitsdauer (Sekunden)</Label>
              <Select
                id="period"
                name="period"
                value={formData.period}
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value={30}>30 Sekunden</option>
                <option value={60}>60 Sekunden</option>
                <option value={90}>90 Sekunden</option>
              </Select>
            </FormGroup>
          )}

          <ButtonGroup>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={isLoading}
            >
              {isLoading ? 'Wird erstellt...' : 'Token erstellen'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
          </ButtonGroup>
        </Form>
      </Card>
    </>
  );
};

export default AddToken;
