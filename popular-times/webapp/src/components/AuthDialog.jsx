import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import './AuthDialog.css';

const AuthDialog = ({ isOpen, onClose, onLogin }) => {
  const [currentForm, setCurrentForm] = useState('login'); // 'login' or 'register'
  const { t } = useLanguage();

  const handleSwitchToRegister = () => {
    setCurrentForm('register');
  };

  const handleSwitchToLogin = () => {
    setCurrentForm('login');
  };

  const handleClose = () => {
    setCurrentForm('login'); // Reset to login form
    onClose();
  };

  const handleRegister = (data) => {
    // Registration was successful, user can now switch to login
    // The success message is already shown in RegisterForm
  };

  if (!isOpen) return null;

  return (
    <div className="auth-dialog-overlay" onClick={handleClose}>
      <div className="auth-dialog-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-dialog-close" onClick={handleClose} aria-label="Close">
          ×
        </button>
        
        {currentForm === 'login' ? (
          <LoginForm
            onLogin={onLogin}
            onSwitchToRegister={handleSwitchToRegister}
            onClose={handleClose}
          />
        ) : (
          <RegisterForm
            onRegister={handleRegister}
            onSwitchToLogin={handleSwitchToLogin}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
};

export default AuthDialog;