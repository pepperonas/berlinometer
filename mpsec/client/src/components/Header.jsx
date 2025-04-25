import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { Button, Container, Avatar } from './styled';

const HeaderContainer = styled.header`
  background-color: ${({ theme }) => theme.colors.backgroundDarker};
  padding: ${({ theme }) => theme.spacing.md} 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  text-decoration: none;
  
  span {
    color: ${({ theme }) => theme.colors.accentBlue};
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Username = styled.span`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <HeaderContainer>
      <Container>
        <HeaderContent>
          <Logo to="/dashboard">
            <span>MP</span>Sec
          </Logo>
          
          {user && (
            <UserSection>
              <UserInfo>
                <Avatar>{user.username[0]}</Avatar>
                <Username>{user.username}</Username>
              </UserInfo>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
              >
                Abmelden
              </Button>
            </UserSection>
          )}
        </HeaderContent>
      </Container>
    </HeaderContainer>
  );
};

export default Header;
