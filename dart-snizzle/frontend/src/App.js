import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/theme.css';
import './App.css';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import GameSetup from './components/Game/GameSetup';
import GamePlay from './components/Game/GamePlay';
import GameHistory from './components/GameHistory/GameHistory';
import GameDetails from './components/GameDetails/GameDetails';
import PlayerManager from './components/Player/PlayerManager';
import Statistics from './components/Stats/Statistics';
import Settings from './components/Settings/Settings';
import Navigation from './components/Layout/Navigation';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router basename="/dart-snizzle">
        <div className="App">
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
};

const AppContent = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background-dark)' }}>
      {user && <Navigation />}
      
      <main className={user ? 'content-with-nav' : ''}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/players" element={
            <ProtectedRoute>
              <PlayerManager />
            </ProtectedRoute>
          } />
          
          <Route path="/game-setup" element={
            <ProtectedRoute>
              <GameSetup />
            </ProtectedRoute>
          } />
          
          <Route path="/game/:gameId" element={
            <ProtectedRoute>
              <GamePlay />
            </ProtectedRoute>
          } />
          
          <Route path="/history" element={
            <ProtectedRoute>
              <GameHistory />
            </ProtectedRoute>
          } />
          
          <Route path="/game-details/:gameId" element={
            <ProtectedRoute>
              <GameDetails />
            </ProtectedRoute>
          } />
          
          <Route path="/statistics" element={
            <ProtectedRoute>
              <Statistics />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
};

export default App;