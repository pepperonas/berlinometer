import React, { useState, useEffect } from 'react';
import { RequestLog, Analytics, Server, FilterOptions } from './types';
import { useSocket } from './hooks/useSocket';
import { api } from './services/api';
import Dashboard from './components/Dashboard';
import RequestsList from './components/RequestsList';
import RequestDetails from './components/RequestDetails';
import FilterPanel from './components/FilterPanel';
import './App.css';

const App: React.FC = () => {
  const [requests, setRequests] = useState<RequestLog[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestLog | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    timeframe: '1h',
    limit: 50
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const SERVER_URL = process.env.NODE_ENV === 'production' 
    ? 'https://mrx3k1.de' 
    : 'http://localhost:5016';

  const { connected, newRequest } = useSocket(SERVER_URL);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [requestsData, analyticsData, serversData] = await Promise.all([
          api.getRequests(filters),
          api.getAnalytics(filters.timeframe),
          api.getServers()
        ]);
        
        setRequests(requestsData);
        setAnalytics(analyticsData);
        setServers(serversData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters]);

  // Handle new real-time requests
  useEffect(() => {
    if (newRequest) {
      setRequests(prev => [newRequest, ...prev.slice(0, filters.limit - 1)]);
      
      // Refresh analytics when new request comes in
      api.getAnalytics(filters.timeframe)
        .then(setAnalytics)
        .catch(console.error);
    }
  }, [newRequest, filters.limit, filters.timeframe]);

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleRequestSelect = (request: RequestLog) => {
    setSelectedRequest(request);
  };

  const handleCloseDetails = () => {
    setSelectedRequest(null);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading Cicero...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Cicero - Server Request Monitor</h1>
        <div className="connection-status">
          <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`}></span>
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </header>

      <main className="app-main">
        <div className="app-layout">
          <aside className="app-sidebar">
            <FilterPanel 
              filters={filters}
              servers={servers}
              onFilterChange={handleFilterChange}
            />
          </aside>

          <div className="app-content">
            {analytics && (
              <Dashboard 
                analytics={analytics}
                timeframe={filters.timeframe}
              />
            )}

            <RequestsList
              requests={requests}
              onRequestSelect={handleRequestSelect}
              loading={loading}
            />
          </div>
        </div>

        {selectedRequest && (
          <RequestDetails
            request={selectedRequest}
            onClose={handleCloseDetails}
          />
        )}
      </main>
    </div>
  );
};

export default App;
