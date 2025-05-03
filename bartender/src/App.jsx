import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';

// Seiten
import Dashboard from './pages/Dashboard';
import Drinks from './pages/Drinks';
import DrinkDetail from './pages/DrinkDetail';
import Staff from './pages/Staff';
import StaffDetail from './pages/StaffDetail';
import Finances from './pages/Finances';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

// Geschützte Route Komponente
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Wird geladen...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/drinks" element={
            <ProtectedRoute>
              <Layout>
                <Drinks />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/drinks/:id" element={
            <ProtectedRoute>
              <Layout>
                <DrinkDetail />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/staff" element={
            <ProtectedRoute>
              <Layout>
                <Staff />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/staff/:id" element={
            <ProtectedRoute>
              <Layout>
                <StaffDetail />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/finances" element={
            <ProtectedRoute>
              <Layout>
                <Finances />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/inventory" element={
            <ProtectedRoute>
              <Layout>
                <Inventory />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/reports" element={
            <ProtectedRoute>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;