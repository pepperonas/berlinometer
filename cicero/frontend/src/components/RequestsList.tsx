import React from 'react';
import { RequestLog } from '../types';

interface RequestsListProps {
  requests: RequestLog[];
  onRequestSelect: (request: RequestLog) => void;
  loading: boolean;
}

const RequestsList: React.FC<RequestsListProps> = ({ requests, onRequestSelect, loading }) => {
  const getStatusColor = (status: number): string => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'warning';
    if (status >= 400 && status < 500) return 'error';
    if (status >= 500) return 'critical';
    return 'default';
  };

  const getMethodColor = (method: string): string => {
    switch (method.toUpperCase()) {
      case 'GET': return 'get';
      case 'POST': return 'post';
      case 'PUT': return 'put';
      case 'DELETE': return 'delete';
      case 'PATCH': return 'patch';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString() + ' ' + date.toLocaleDateString();
  };

  const formatResponseTime = (time: number): string => {
    if (time < 1000) return `${Math.round(time)}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  if (loading) {
    return (
      <div className="requests-list loading">
        <div className="loading-spinner"></div>
        <p>Loading requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="requests-list empty">
        <div className="empty-state">
          <h3>No requests found</h3>
          <p>No requests match your current filters. Try adjusting the timeframe or removing filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="requests-list">
      <div className="requests-header">
        <h3>Recent Requests ({requests.length})</h3>
      </div>

      <div className="requests-table">
        <div className="table-header">
          <div className="col-method">Method</div>
          <div className="col-url">URL</div>
          <div className="col-status">Status</div>
          <div className="col-time">Response Time</div>
          <div className="col-ip">IP Address</div>
          <div className="col-location">Location</div>
          <div className="col-server">Server</div>
          <div className="col-timestamp">Timestamp</div>
        </div>

        <div className="table-body">
          {requests.map((request) => (
            <div
              key={request._id}
              className="table-row"
              onClick={() => onRequestSelect(request)}
            >
              <div className="col-method">
                <span className={`method-badge ${getMethodColor(request.method)}`}>
                  {request.method}
                </span>
              </div>
              
              <div className="col-url">
                <span className="url-path" title={request.url}>
                  {request.url.length > 60 ? `${request.url.substring(0, 60)}...` : request.url}
                </span>
              </div>
              
              <div className="col-status">
                <span className={`status-badge ${getStatusColor(request.status)}`}>
                  {request.status}
                </span>
              </div>
              
              <div className="col-time">
                <span className={`response-time ${request.responseTime > 1000 ? 'slow' : request.responseTime > 500 ? 'medium' : 'fast'}`}>
                  {formatResponseTime(request.responseTime)}
                </span>
              </div>
              
              <div className="col-ip">
                <span className="ip-address" title={request.ip}>
                  {request.ip || 'Unknown'}
                </span>
              </div>
              
              <div className="col-location">
                <span className="location-info">
                  {request.location ? (
                    <span title={`${request.location.city}, ${request.location.region}, ${request.location.country}\nTimezone: ${request.location.timezone}\nCoordinates: ${request.location.coordinates[0]}, ${request.location.coordinates[1]}`}>
                      🌍 {request.location.city}, {request.location.country}
                    </span>
                  ) : (
                    <span className="no-location">🏠 Local</span>
                  )}
                </span>
              </div>
              
              <div className="col-server">
                <span className="server-name">
                  {request.server || 'Unknown'}
                </span>
              </div>
              
              <div className="col-timestamp">
                <span className="timestamp">
                  {formatTimestamp(request.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RequestsList;