import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoaderContainer, Loader } from './styled';

const PrivateRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <LoaderContainer fullHeight>
        <Loader size="40px" />
      </LoaderContainer>
    );
  }
  
  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
