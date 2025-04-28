import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { 
  Card, 
  PageHeader, 
  PageTitle, 
  Form, 
  FormGroup, 
  Label, 
  Input, 
  Button, 
  ButtonGroup, 
  Alert, 
  ErrorMessage 
} from '../components/styled';

const ProfileCard = styled(Card)`
  max-width: 600px;
  margin: 0 auto;
`;

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Bitte gib dein aktuelles Passwort ein';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'Bitte gib dein neues Passwort ein';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Das Passwort muss mindestens 8 Zeichen lang sein';
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Die Passwörter stimmen nicht überein';
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
    setMessage({ type: '', text: '' });
    
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: 'Dein Passwort wurde erfolgreich geändert' 
        });
        
        // Passwortfelder zurücksetzen
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      console.error('Fehler beim Ändern des Passworts:', err);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Passwort konnte nicht geändert werden' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader>
        <PageTitle>Mein Profil</PageTitle>
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
        >
          Zurück zum Dashboard
        </Button>
      </PageHeader>

      <ProfileCard>
        {message.text && (
          <Alert type={message.type}>{message.text}</Alert>
        )}
        
        <h2>Benutzerdaten</h2>
        <p>Benutzername: <strong>{user.username}</strong></p>
        
        <h3 style={{ marginTop: '2rem' }}>Passwort ändern</h3>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
            <Input 
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              error={errors.currentPassword}
              disabled={isLoading}
            />
            {errors.currentPassword && (
              <ErrorMessage>{errors.currentPassword}</ErrorMessage>
            )}
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="newPassword">Neues Passwort</Label>
            <Input 
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              error={errors.newPassword}
              disabled={isLoading}
            />
            {errors.newPassword && (
              <ErrorMessage>{errors.newPassword}</ErrorMessage>
            )}
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="confirmPassword">Neues Passwort bestätigen</Label>
            <Input 
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <ErrorMessage>{errors.confirmPassword}</ErrorMessage>
            )}
          </FormGroup>
          
          <ButtonGroup>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={isLoading}
            >
              {isLoading ? 'Wird gespeichert...' : 'Passwort ändern'}
            </Button>
          </ButtonGroup>
        </Form>
      </ProfileCard>
    </>
  );
};

export default Profile;