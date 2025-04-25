import React from 'react';
import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import Header from './Header';
import { Container } from './styled';

const LayoutContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Main = styled.main`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.lg} 0;
`;

const Layout = () => {
  return (
    <LayoutContainer>
      <Header />
      <Main>
        <Container>
          <Outlet />
        </Container>
      </Main>
    </LayoutContainer>
  );
};

export default Layout;
