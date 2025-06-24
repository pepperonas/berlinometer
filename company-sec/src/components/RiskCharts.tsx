import React from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Risk, RiskCategory, RiskLevel } from '../types/risk.types';
import { calculateRiskScore, getRiskLevel, getRiskLevelColor } from '../utils/risk-calculations';

interface RiskChartsProps {
  risks: Risk[];
}

const RiskCharts: React.FC<RiskChartsProps> = ({ risks }) => {
  // Prepare data for category distribution
  const categoryData = React.useMemo(() => {
    const categories: Record<RiskCategory, number> = {
      financial: 0,
      operational: 0,
      strategic: 0,
      compliance: 0,
      reputational: 0,
      cybersecurity: 0,
      environmental: 0
    };
    
    risks.forEach(risk => {
      categories[risk.category]++;
    });
    
    const categoryNames: Record<string, string> = {
      financial: 'Finanziell',
      operational: 'Operativ',
      strategic: 'Strategisch',
      compliance: 'Compliance',
      reputational: 'Reputation',
      cybersecurity: 'Cybersicherheit',
      environmental: 'Umwelt'
    };
    
    return Object.entries(categories).map(([category, count]) => ({
      name: categoryNames[category] || category,
      value: count
    }));
  }, [risks]);

  // Prepare data for risk level distribution
  const levelData = React.useMemo(() => {
    const levels: Record<RiskLevel, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    
    risks.forEach(risk => {
      const score = calculateRiskScore(risk.probability, risk.impact);
      const level = getRiskLevel(score);
      levels[level]++;
    });
    
    const levelNames: Record<string, string> = {
      low: 'Niedrig',
      medium: 'Mittel',
      high: 'Hoch',
      critical: 'Kritisch'
    };
    
    return Object.entries(levels).map(([level, count]) => ({
      name: levelNames[level] || level,
      value: count,
      color: getRiskLevelColor(level as RiskLevel)
    }));
  }, [risks]);

  // Prepare timeline data (risks by month)
  const timelineData = React.useMemo(() => {
    const monthlyRisks: Record<string, number> = {};
    
    risks.forEach(risk => {
      const month = new Date(risk.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      monthlyRisks[month] = (monthlyRisks[month] || 0) + 1;
    });
    
    return Object.entries(monthlyRisks).map(([month, count]) => ({
      month,
      risks: count
    }));
  }, [risks]);

  const COLORS = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c', '#34495e'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
      <div className="card">
        <h3 className="card-title">Risikoverteilung nach Kategorie</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => value && value > 0 ? `${name}: ${value}` : ''}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Risikostufen-Übersicht</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={levelData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8">
                {levelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ gridColumn: 'span 2' }}>
        <h3 className="card-title">Risiko-Zeitverlauf</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="risks" 
                stroke="#3498db" 
                strokeWidth={2}
                name="Anzahl der Risiken"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default RiskCharts;