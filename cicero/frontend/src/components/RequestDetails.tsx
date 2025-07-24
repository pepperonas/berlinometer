import React from 'react';
import { RequestLog } from '../types';

interface RequestDetailsProps {
  request: RequestLog;
  onClose: () => void;
}

const RequestDetails: React.FC<RequestDetailsProps> = ({ request, onClose }) => {
  const formatJsonPretty = (obj: any): string => {
    if (!obj || typeof obj !== 'object') return String(obj);
    return JSON.stringify(obj, null, 2);
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: number): string => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'warning';
    if (status >= 400 && status < 500) return 'error';
    if (status >= 500) return 'critical';
    return 'default';
  };

  return (
    <div className="request-details-overlay" onClick={onClose}>
      <div className="request-details" onClick={(e) => e.stopPropagation()}>
        <div className="details-header">
          <h3>Request Details</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="details-content">
          <div className="details-section">
            <h4>Request Info</h4>
            <div className="info-grid">
              <div className="info-item">
                <label>Method:</label>
                <span className={`method-badge ${request.method.toLowerCase()}`}>
                  {request.method}
                </span>
              </div>
              <div className="info-item">
                <label>Status:</label>
                <span className={`status-badge ${getStatusColor(request.status)}`}>
                  {request.status}
                </span>
              </div>
              <div className="info-item">
                <label>Response Time:</label>
                <span className="response-time">{request.responseTime}ms</span>
              </div>
              <div className="info-item">
                <label>Timestamp:</label>
                <span>{formatTimestamp(request.timestamp)}</span>
              </div>
              <div className="info-item">
                <label>Server:</label>
                <span>{request.server || 'Unknown'}</span>
              </div>
              <div className="info-item">
                <label>IP Address:</label>
                <span>{request.ip}</span>
              </div>
              {request.location && (
                <>
                  <div className="info-item">
                    <label>Location:</label>
                    <span>🌍 {request.location.city}, {request.location.region}, {request.location.country}</span>
                  </div>
                  <div className="info-item">
                    <label>Timezone:</label>
                    <span>{request.location.timezone}</span>
                  </div>
                  <div className="info-item">
                    <label>Coordinates:</label>
                    <span>{request.location.coordinates[0]}, {request.location.coordinates[1]}</span>
                  </div>
                </>
              )}
              {request.contentLength && (
                <div className="info-item">
                  <label>Content Length:</label>
                  <span>{request.contentLength} bytes</span>
                </div>
              )}
            </div>
          </div>

          <div className="details-section">
            <h4>URL</h4>
            <div className="code-block">
              <code>{request.url}</code>
            </div>
          </div>

          {request.userAgent && (
            <div className="details-section">
              <h4>User Agent</h4>
              <div className="code-block">
                <code>{request.userAgent}</code>
              </div>
            </div>
          )}

          {Object.keys(request.query).length > 0 && (
            <div className="details-section">
              <h4>Query Parameters</h4>
              <div className="code-block">
                <pre>{formatJsonPretty(request.query)}</pre>
              </div>
            </div>
          )}

          {request.body && Object.keys(request.body).length > 0 && (
            <div className="details-section">
              <h4>Request Body</h4>
              <div className="code-block">
                <pre>{formatJsonPretty(request.body)}</pre>
              </div>
            </div>
          )}

          <div className="details-section">
            <h4>Headers</h4>
            <div className="headers-grid">
              {Object.entries(request.headers).map(([key, value]) => (
                <div key={key} className="header-item">
                  <span className="header-key">{key}:</span>
                  <span className="header-value">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {request.error && (
            <div className="details-section error-section">
              <h4>Error Details</h4>
              <div className="code-block error">
                <pre>{request.error}</pre>
              </div>
            </div>
          )}
        </div>

        <div className="details-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestDetails;