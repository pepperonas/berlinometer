import React from 'react';
import { Analytics } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface DashboardProps {
  analytics: Analytics;
  timeframe: '1h' | '24h' | '7d';
}

const COLORS = ['#688db1', '#9cb68f', '#e16162', '#f4d35e', '#a78bfa'];

const Dashboard: React.FC<DashboardProps> = ({ analytics, timeframe }) => {
  const { summary, statusDistribution, timeSeriesData, topEndpoints } = analytics;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Analytics Dashboard</h2>
        <span className="timeframe-badge">{timeframe}</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Requests</h3>
            <p className="stat-value">{summary.totalRequests.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <h3>Avg Response Time</h3>
            <p className="stat-value">{Math.round(summary.avgResponseTime)}ms</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Success Rate</h3>
            <p className="stat-value">
              {summary.totalRequests > 0 
                ? Math.round((summary.statusCodes.filter(code => code >= 200 && code < 400).length / summary.statusCodes.length) * 100) 
                : 0}%
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🖥️</div>
          <div className="stat-content">
            <h3>Active Servers</h3>
            <p className="stat-value">{new Set(summary.servers).size}</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Request Volume Over Time</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#343845" />
                <XAxis dataKey="_id" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#343845', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#d1d5db'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#688db1" 
                  strokeWidth={2}
                  dot={{ fill: '#688db1', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Response Time Trend</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#343845" />
                <XAxis dataKey="_id" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#343845', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#d1d5db'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="avgResponseTime" 
                  stroke="#9cb68f" 
                  strokeWidth={2}
                  dot={{ fill: '#9cb68f', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Status Code Distribution</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ _id, percent }) => `${_id} (${((percent || 0) * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#343845', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#d1d5db'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Top 10 Endpoints</h3>
          <div className="chart-container" style={{ overflowX: 'auto', overflowY: 'hidden' }}>
            <ResponsiveContainer width="100%" height={400} minHeight={400}>
              <BarChart 
                data={topEndpoints.map((endpoint, index) => ({
                  position: `#${index + 1}`,
                  name: endpoint._id.url.length > 40 
                    ? `${endpoint._id.url.substring(0, 40)}...`
                    : endpoint._id.url,
                  method: endpoint._id.method,
                  fullName: `${endpoint._id.method} ${endpoint._id.url}`,
                  count: endpoint.count,
                  avgResponseTime: endpoint.avgResponseTime
                }))}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 50, bottom: 20 }}
                barGap={5}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#343845" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis 
                  dataKey="position" 
                  type="category" 
                  width={35} 
                  stroke="#9ca3af"
                  fontSize={11}
                  tick={{ fill: '#9ca3af' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#343845', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#d1d5db'
                  }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div style={{ 
                        backgroundColor: '#343845', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#d1d5db',
                        padding: '12px',
                        minWidth: '200px'
                      }}>
                        <div style={{ marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                          {data.position}
                        </div>
                        <div style={{ marginBottom: '8px', wordBreak: 'break-all' }}>
                          <span style={{ color: '#688db1', fontWeight: 'bold' }}>{data.method}</span>
                          <span style={{ marginLeft: '8px' }}>{data.fullName.substring(data.method.length + 1)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                          <div>
                            <span style={{ color: '#9ca3af', fontSize: '12px' }}>Requests: </span>
                            <span style={{ color: '#688db1', fontWeight: 'bold' }}>{data.count}</span>
                          </div>
                          <div>
                            <span style={{ color: '#9ca3af', fontSize: '12px' }}>Avg Time: </span>
                            <span style={{ color: '#9cb68f', fontWeight: 'bold' }}>{Math.round(data.avgResponseTime)}ms</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#688db1" 
                  radius={[0, 4, 4, 0]}
                  label={(props: any) => {
                    const { x, y, width, height, payload } = props;
                    if (!payload || !payload.method || !payload.name) {
                      return <text />;
                    }
                    return (
                      <text 
                        x={x + width + 10} 
                        y={y + height / 2} 
                        fill="#9ca3af" 
                        fontSize={11}
                        textAnchor="start"
                        dominantBaseline="middle"
                      >
                        {`${payload.method} ${payload.name}`}
                      </text>
                    );
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;