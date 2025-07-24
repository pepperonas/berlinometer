import { RequestLog, Analytics, Server, FilterOptions } from '../types';

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://mrx3k1.de/cicero/api'
  : 'http://localhost:5016/api';

export const api = {
  // Fetch recent requests
  async getRequests(options: Partial<FilterOptions> = {}): Promise<RequestLog[]> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.server) params.append('server', options.server);
    if (options.status) params.append('status', options.status.toString());

    const response = await fetch(`${API_BASE}/requests?${params}`);
    if (!response.ok) throw new Error('Failed to fetch requests');
    return response.json();
  },

  // Fetch analytics data
  async getAnalytics(timeframe: '1h' | '24h' | '7d' = '1h'): Promise<Analytics> {
    const response = await fetch(`${API_BASE}/analytics?timeframe=${timeframe}`);
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json();
  },

  // Fetch servers
  async getServers(): Promise<Server[]> {
    const response = await fetch(`${API_BASE}/servers`);
    if (!response.ok) throw new Error('Failed to fetch servers');
    return response.json();
  },

  // Register/update server
  async registerServer(name: string, url: string): Promise<Server> {
    const response = await fetch(`${API_BASE}/servers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url })
    });
    if (!response.ok) throw new Error('Failed to register server');
    return response.json();
  },

  // Log a request (used by middleware)
  async logRequest(requestData: Omit<RequestLog, '_id' | 'timestamp'>): Promise<{ success: boolean; id: string }> {
    const response = await fetch(`${API_BASE}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    if (!response.ok) throw new Error('Failed to log request');
    return response.json();
  },

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; uptime: number; memory: any }> {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
  }
};