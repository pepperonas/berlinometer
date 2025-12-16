import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import Dialog from './ui/Dialog';
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

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      showCloseButton={true}
      fullscreenOnMobile={false}
    >
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
    </Dialog>
  );
};

export default AuthDialog;