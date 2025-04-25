import styled from 'styled-components';

// Container-Komponenten
export const Container = styled.div`
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.md};
`;

export const Card = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

export const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

export const CardTitle = styled.h3`
  margin-bottom: 0;
`;

export const CardContent = styled.div``;

export const CardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

// Formular-Komponenten
export const Form = styled.form`
  width: 100%;
`;

export const FormGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

export const Label = styled.label`
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

export const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.backgroundDarker};
  border: 1px solid ${({ theme, error }) => error ? theme.colors.accentRed : 'transparent'};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  transition: ${({ theme }) => theme.transitions.default};

  &:focus {
    outline: none;
    border-color: ${({ theme, error }) => error ? theme.colors.accentRed : theme.colors.accentBlue};
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.backgroundDarker};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  transition: ${({ theme }) => theme.transitions.default};
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right ${({ theme }) => theme.spacing.md} center;
  background-size: 16px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accentBlue};
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.backgroundDarker};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  transition: ${({ theme }) => theme.transitions.default};
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accentBlue};
  }
`;

export const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.accentRed};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

// Button-Komponenten
export const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme, size }) => 
    size === 'sm' ? `${theme.spacing.xs} ${theme.spacing.md}` : 
    size === 'lg' ? `${theme.spacing.md} ${theme.spacing.xl}` : 
    `${theme.spacing.sm} ${theme.spacing.lg}`
  };
  background-color: ${({ theme, variant }) => 
    variant === 'primary' ? theme.colors.accentBlue :
    variant === 'success' ? theme.colors.accentGreen :
    variant === 'danger' ? theme.colors.accentRed :
    'transparent'
  };
  color: ${({ theme, variant }) => 
    variant === 'outline' ? theme.colors.textPrimary : '#fff'
  };
  border: ${({ theme, variant }) => 
    variant === 'outline' ? `1px solid ${theme.colors.textSecondary}` : 'none'
  };
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme, size }) => 
    size === 'sm' ? theme.typography.fontSize.sm :
    size === 'lg' ? theme.typography.fontSize.lg :
    theme.typography.fontSize.md
  };
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    background-color: ${({ theme, variant }) => 
      variant === 'primary' ? '#597ba0' :
      variant === 'success' ? '#8aa580' :
      variant === 'danger' ? '#d04e4f' :
      'rgba(156, 163, 175, 0.1)'
    };
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme, variant }) => 
      variant === 'primary' ? 'rgba(104, 141, 177, 0.5)' :
      variant === 'success' ? 'rgba(156, 182, 143, 0.5)' :
      variant === 'danger' ? 'rgba(225, 97, 98, 0.5)' :
      'rgba(156, 163, 175, 0.5)'
    };
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  & > svg {
    margin-right: ${({ theme }) => theme.spacing.xs};
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

// Token spezifische Komponenten
export const TokenCode = styled.div`
  font-family: monospace;
  font-size: ${({ theme }) => theme.typography.fontSize.xxl};
  letter-spacing: 0.25em;
  text-align: center;
  background-color: ${({ theme }) => theme.colors.backgroundDarker};
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin: ${({ theme }) => `${theme.spacing.lg} 0`};
`;

export const TimeRemaining = styled.div`
  width: 100%;
  height: 4px;
  background-color: ${({ theme }) => theme.colors.backgroundDarker};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  overflow: hidden;
`;

export const ProgressBar = styled.div`
  height: 100%;
  background-color: ${({ theme }) => theme.colors.accentBlue};
  width: ${({ progress }) => `${progress}%`};
  transition: width 1s linear;
`;

// Layout-Komponenten
export const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

export const PageTitle = styled.h1`
  margin-bottom: 0;
`;

export const PageContent = styled.div`
  padding: ${({ theme }) => theme.spacing.lg} 0;
`;

// Benachrichtigungen
export const Alert = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme, type }) => 
    type === 'success' ? 'rgba(156, 182, 143, 0.2)' :
    type === 'error' ? 'rgba(225, 97, 98, 0.2)' :
    type === 'info' ? 'rgba(104, 141, 177, 0.2)' :
    'rgba(156, 163, 175, 0.2)'
  };
  border-left: 4px solid ${({ theme, type }) => 
    type === 'success' ? theme.colors.accentGreen :
    type === 'error' ? theme.colors.accentRed :
    type === 'info' ? theme.colors.accentBlue :
    theme.colors.textSecondary
  };
  color: ${({ theme }) => theme.colors.textPrimary};
`;

// Loader
export const Loader = styled.div`
  display: inline-block;
  border: 3px solid ${({ theme }) => theme.colors.backgroundDarker};
  border-top: 3px solid ${({ theme }) => theme.colors.accentBlue};
  border-radius: 50%;
  width: ${({ size }) => size || '24px'};
  height: ${({ size }) => size || '24px'};
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: ${({ fullHeight }) => fullHeight ? '100vh' : '200px'};
`;

// Avatar
export const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.accentBlue};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  text-transform: uppercase;
`;

// Badge
export const Badge = styled.span`
  display: inline-block;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background-color: ${({ theme, type }) => 
    type === 'primary' ? 'rgba(104, 141, 177, 0.2)' :
    type === 'success' ? 'rgba(156, 182, 143, 0.2)' :
    type === 'danger' ? 'rgba(225, 97, 98, 0.2)' :
    'rgba(156, 163, 175, 0.2)'
  };
  color: ${({ theme, type }) => 
    type === 'primary' ? theme.colors.accentBlue :
    type === 'success' ? theme.colors.accentGreen :
    type === 'danger' ? theme.colors.accentRed :
    theme.colors.textSecondary
  };
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;
