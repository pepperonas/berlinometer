import React from 'react';
import { FilterOptions, Server } from '../types';

interface FilterPanelProps {
  filters: FilterOptions;
  servers: Server[];
  onFilterChange: (filters: Partial<FilterOptions>) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, servers, onFilterChange }) => {
  return (
    <div className="filter-panel">
      <h3>Filters</h3>

      <div className="filter-group">
        <label htmlFor="timeframe">Timeframe</label>
        <select
          id="timeframe"
          value={filters.timeframe}
          onChange={(e) => onFilterChange({ timeframe: e.target.value as '1h' | '24h' | '7d' })}
          className="filter-select"
        >
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="server">Server</label>
        <select
          id="server"
          value={filters.server || ''}
          onChange={(e) => onFilterChange({ server: e.target.value || undefined })}
          className="filter-select"
        >
          <option value="">All Servers</option>
          {servers.map((server) => (
            <option key={server._id} value={server.name}>
              {server.name}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="status">Status Code</label>
        <select
          id="status"
          value={filters.status || ''}
          onChange={(e) => onFilterChange({ status: e.target.value ? parseInt(e.target.value) : undefined })}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="200">200 - OK</option>
          <option value="201">201 - Created</option>
          <option value="400">400 - Bad Request</option>
          <option value="401">401 - Unauthorized</option>
          <option value="403">403 - Forbidden</option>
          <option value="404">404 - Not Found</option>
          <option value="500">500 - Internal Error</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="limit">Limit</label>
        <select
          id="limit"
          value={filters.limit}
          onChange={(e) => onFilterChange({ limit: parseInt(e.target.value) })}
          className="filter-select"
        >
          <option value="25">25 requests</option>
          <option value="50">50 requests</option>
          <option value="100">100 requests</option>
          <option value="200">200 requests</option>
        </select>
      </div>

      {servers.length > 0 && (
        <div className="servers-list">
          <h4>Active Servers</h4>
          <div className="servers-grid">
            {servers.slice(0, 5).map((server) => (
              <div key={server._id} className="server-item">
                <div className="server-status active"></div>
                <div className="server-info">
                  <span className="server-name">{server.name}</span>
                  <span className="server-url">{server.url}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;