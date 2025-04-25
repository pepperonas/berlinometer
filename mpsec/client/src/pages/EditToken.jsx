import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  ErrorMessage,
  LoaderContainer,
  Loader
} from '../components/styled';

const EditToken = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    issuer: '',
    type: 'totp',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await api.get(`/tokens/${id}`);
        const token = response.data.data;
        
        setFormData({
          name: token.name,
          issuer: token.issuer || '',
          type: token.type,
          algorithm: token.algorithm,
          digits: token.digits,
          period: token.period
        });
      } catch (err) {
        console.error('Fehler beim Laden des Tokens:', err);
        setError('Token konnte nicht geladen werden');
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
  }, [id]);

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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    try {
      await api.put(`/tokens/${id}`, formData);
      navigate(`/tokens/${id}`);
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Tokens:', err);
      setError(
        err.response?.data?.message || 
        'Token konnte nicht aktualisiert werden'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <LoaderContainer>
        <Loader size="40px" />
      </LoaderContainer>
    );
  }

  return (
    <>
      <PageHeader>
        <PageTitle>Token bearbeiten</PageTitle>
        <ButtonGroup>
          <Button 
            variant="outline" 
            as={Link}
            to={`/tokens/${id}`}
          >
            Abbrechen
          </Button>
        </ButtonGroup>
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
              disabled={isSaving}
            />
            {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="issuer">Aussteller</Label>
            <Input
              id="issuer"
              name="issuer"
              value={formData.issuer}
              onChange={handleChange}
              disabled={isSaving}
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
              disabled={isSaving}
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
              disabled={isSaving}
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
              disabled={isSaving}
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
                disabled={isSaving}
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
              disabled={isSaving}
            >
              {isSaving ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              as={Link}
              to={`/tokens/${id}`}
              disabled={isSaving}
            >
              Abbrechen
            </Button>
          </ButtonGroup>
        </Form>
      </Card>
    </>
  );
};

export default EditToken;
