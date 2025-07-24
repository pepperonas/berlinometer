export interface RequestLog {
  _id: string;
  method: string;
  url: string;
  status: number;
  responseTime: number;
  timestamp: string;
  headers: Record<string, string>;
  query: Record<string, any>;
  body: any;
  userAgent: string;
  ip: string;
  server: string;
  contentLength?: number;
  error?: string;
}

export interface Server {
  _id: string;
  name: string;
  url: string;
  lastSeen: string;
  active: boolean;
}

export interface Analytics {
  summary: {
    totalRequests: number;
    avgResponseTime: number;
    statusCodes: number[];
    methods: string[];
    servers: string[];
  };
  statusDistribution: { _id: number; count: number }[];
  timeSeriesData: { _id: string; count: number; avgResponseTime: number }[];
  topEndpoints: { _id: { method: string; url: string }; count: number; avgResponseTime: number }[];
}

export interface FilterOptions {
  server?: string;
  status?: number;
  timeframe: '1h' | '24h' | '7d';
  limit: number;
}