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
          <h3>Top Endpoints</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={topEndpoints.map(endpoint => ({
                  name: `${endpoint._id.method} ${endpoint._id.url}`,
                  count: endpoint.count,
                  avgResponseTime: endpoint.avgResponseTime
                }))}
                layout="horizontal"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#343845" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={200} 
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#343845', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#d1d5db'
                  }} 
                />
                <Bar dataKey="count" fill="#688db1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;