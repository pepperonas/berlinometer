import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Target, 
  Eye, 
  TrendingUp, 
  Network,
  Lock,
  Activity,
  Clock,
  Users
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Threat, ThreatModel, StrideCategory, KillChainPhase } from '../types/threat.types';
import { getThreatRiskLevel, calculateThreatTrend } from '../utils/threat-calculations';

interface ThreatModelingDashboardProps {
  threats: Threat[];
  threatModel?: ThreatModel;
}

const ThreatModelingDashboard: React.FC<ThreatModelingDashboardProps> = ({ 
  threats, 
  threatModel 
}) => {
  const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'quarter'>('month');

  const dashboardData = useMemo(() => {
    // STRIDE category distribution
    const strideData = ([
      'spoofing',
      'tampering', 
      'repudiation',
      'information_disclosure',
      'denial_of_service',
      'elevation_of_privilege'
    ] as StrideCategory[]).map(category => {
      const categoryThreats = threats.filter(threat => 
        threat.strideClassification.includes(category)
      );
      return {
        name: category === 'spoofing' ? 'Spoofing' :
              category === 'tampering' ? 'Manipulation' :
              category === 'repudiation' ? 'Abstreitbarkeit' :
              category === 'information_disclosure' ? 'Info-Offenlegung' :
              category === 'denial_of_service' ? 'DoS' :
              'Priv-Eskalation',
        value: categoryThreats.length,
        avgRisk: categoryThreats.length > 0 
          ? categoryThreats.reduce((sum, t) => sum + t.riskScore, 0) / categoryThreats.length 
          : 0
      };
    });

    // Kill Chain phase distribution
    const killChainData = ([
      'reconnaissance',
      'weaponization',
      'delivery',
      'exploitation',
      'installation',
      'command_control',
      'actions_objectives'
    ] as KillChainPhase[]).map(phase => {
      const phaseThreats = threats.filter(threat => threat.killChainPhase === phase);
      return {
        name: phase === 'reconnaissance' ? 'Aufklärung' :
              phase === 'weaponization' ? 'Bewaffnung' :
              phase === 'delivery' ? 'Zustellung' :
              phase === 'exploitation' ? 'Ausnutzung' :
              phase === 'installation' ? 'Installation' :
              phase === 'command_control' ? 'C&C' :
              'Aktionen',
        value: phaseThreats.length,
        threats: phaseThreats
      };
    });

    // Risk level distribution
    const riskLevelData = ['niedrig', 'mittel', 'hoch', 'kritisch'].map(level => {
      const levelThreats = threats.filter(threat => 
        getThreatRiskLevel(threat.riskScore) === level
      );
      return {
        name: level.charAt(0).toUpperCase() + level.slice(1),
        value: levelThreats.length,
        color: level === 'niedrig' ? '#27ae60' :
               level === 'mittel' ? '#f39c12' :
               level === 'hoch' ? '#e74c3c' : '#c0392b'
      };
    });

    // Threat trend data
    const trendData = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      const monthThreats = threats.filter(threat => {
        const threatDate = new Date(threat.createdAt);
        return threatDate.getMonth() === date.getMonth() && 
               threatDate.getFullYear() === date.getFullYear();
      });
      
      return {
        month: date.toLocaleDateString('de-DE', { month: 'short' }),
        threats: monthThreats.length,
        avgRisk: monthThreats.length > 0 
          ? monthThreats.reduce((sum, t) => sum + t.riskScore, 0) / monthThreats.length 
          : 0
      };
    });

    // Attack vector distribution
    const attackVectorData = ['network', 'local', 'physical', 'social'].map(vector => {
      const vectorThreats = threats.filter(threat => threat.attackVector === vector);
      return {
        name: vector === 'network' ? 'Netzwerk' :
              vector === 'local' ? 'Lokal' :
              vector === 'physical' ? 'Physisch' : 'Sozial',
        value: vectorThreats.length
      };
    });

    // Mitigation coverage
    const mitigationCoverage = {
      total: threats.length,
      covered: threats.filter(t => t.mitigations && t.mitigations.length > 0).length,
      percentage: threats.length > 0 
        ? Math.round((threats.filter(t => t.mitigations && t.mitigations.length > 0).length / threats.length) * 100)
        : 0
    };

    // Statistics
    const stats = {
      totalThreats: threats.length,
      criticalThreats: threats.filter(t => getThreatRiskLevel(t.riskScore) === 'kritisch').length,
      avgRiskScore: threats.length > 0 
        ? threats.reduce((sum, t) => sum + t.riskScore, 0) / threats.length 
        : 0,
      mitigatedThreats: threats.filter(t => t.mitigations && t.mitigations.length > 0).length,
      newThreatsThisMonth: calculateThreatTrend(threats, 'month'),
      topCategory: strideData.reduce((max, current) => 
        current.value > max.value ? current : max, 
        { name: 'Keine', value: 0 }
      ).name
    };

    return {
      strideData,
      killChainData,
      riskLevelData,
      trendData,
      attackVectorData,
      mitigationCoverage,
      stats
    };
  }, [threats, timeFrame]);

  const COLORS = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c'];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Threat Modeling Dashboard</h3>
        {threatModel && (
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '6px',
            marginBottom: '1rem'
          }}>
            <h4 style={{ margin: 0, marginBottom: '0.5rem' }}>{threatModel.name}</h4>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9rem' }}>
              {threatModel.description}
            </p>
            <div style={{ 
              display: 'flex', 
              gap: '2rem', 
              marginTop: '0.5rem',
              fontSize: '0.8rem',
              color: '#7f8c8d'
            }}>
              <span>System: {threatModel.system.name}</span>
              <span>Owner: {threatModel.owner}</span>
              <span>Erstellt: {new Date(threatModel.createdAt).toLocaleDateString('de-DE')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Key Statistics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div className="card stat-card">
          <div className="card-header">
            <AlertTriangle size={24} color="#e74c3c" />
          </div>
          <div className="stat-value">{dashboardData.stats.totalThreats}</div>
          <div className="stat-label">Gesamte Bedrohungen</div>
        </div>

        <div className="card stat-card">
          <div className="card-header">
            <Target size={24} color="#c0392b" />
          </div>
          <div className="stat-value">{dashboardData.stats.criticalThreats}</div>
          <div className="stat-label">Kritische Bedrohungen</div>
        </div>

        <div className="card stat-card">
          <div className="card-header">
            <TrendingUp size={24} color="#3498db" />
          </div>
          <div className="stat-value">{dashboardData.stats.avgRiskScore.toFixed(1)}</div>
          <div className="stat-label">Ø Risikoscore</div>
        </div>

        <div className="card stat-card">
          <div className="card-header">
            <Shield size={24} color="#27ae60" />
          </div>
          <div className="stat-value">{dashboardData.mitigationCoverage.percentage}%</div>
          <div className="stat-label">Mitigation Coverage</div>
        </div>

        <div className="card stat-card">
          <div className="card-header">
            <Clock size={24} color="#f39c12" />
          </div>
          <div className="stat-value">{dashboardData.stats.newThreatsThisMonth}</div>
          <div className="stat-label">Neue (30 Tage)</div>
        </div>

        <div className="card stat-card">
          <div className="card-header">
            <Activity size={24} color="#9b59b6" />
          </div>
          <div className="stat-value" style={{ fontSize: '1.2rem' }}>
            {dashboardData.stats.topCategory}
          </div>
          <div className="stat-label">Top STRIDE Kategorie</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {/* STRIDE Distribution */}
        <div className="card">
          <h4 className="card-title">STRIDE Kategorien Verteilung</h4>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.strideData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    value, 
                    name === 'value' ? 'Anzahl Bedrohungen' : 'Ø Risikoscore'
                  ]}
                />
                <Bar dataKey="value" fill="#3498db" name="Bedrohungen" />
                <Bar dataKey="avgRisk" fill="#e74c3c" name="Ø Risikoscore" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Level Distribution */}
        <div className="card">
          <h4 className="card-title">Risikostufen Verteilung</h4>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.riskLevelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => value && value > 0 ? `${name}: ${value}` : ''}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardData.riskLevelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Kill Chain Phase Distribution */}
        <div className="card">
          <h4 className="card-title">Cyber Kill Chain Phasen</h4>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.killChainData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#f39c12" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attack Vector Distribution */}
        <div className="card">
          <h4 className="card-title">Angriffsvektoren</h4>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.attackVectorData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => value && value > 0 ? `${name}: ${value}` : ''}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardData.attackVectorData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Threat Trend Analysis */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h4 className="card-title">Bedrohungsentwicklung (12 Monate)</h4>
        <div className="chart-container" style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dashboardData.trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="count" orientation="left" />
              <YAxis yAxisId="risk" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar 
                yAxisId="count"
                dataKey="threats" 
                fill="#3498db" 
                name="Anzahl Bedrohungen" 
              />
              <Line 
                yAxisId="risk"
                type="monotone" 
                dataKey="avgRisk" 
                stroke="#e74c3c" 
                strokeWidth={3}
                name="Ø Risikoscore"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Coverage and Gaps Analysis */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '2rem'
      }}>
        <div className="card">
          <h4 className="card-title">Mitigation Coverage</h4>
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ 
              width: '120px', 
              height: '120px', 
              borderRadius: '50%',
              background: `conic-gradient(#27ae60 ${dashboardData.mitigationCoverage.percentage * 3.6}deg, #e0e0e0 0)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              position: 'relative'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#2c3e50'
              }}>
                {dashboardData.mitigationCoverage.percentage}%
              </div>
            </div>
            <div style={{ color: '#7f8c8d' }}>
              {dashboardData.mitigationCoverage.covered} von {dashboardData.mitigationCoverage.total} Bedrohungen haben Mitigationen
            </div>
          </div>
        </div>

        <div className="card">
          <h4 className="card-title">Top Risiko Kategorien</h4>
          <div style={{ marginTop: '1rem' }}>
            {dashboardData.strideData
              .filter(item => item.value > 0)
              .sort((a, b) => b.avgRisk - a.avgRisk)
              .slice(0, 5)
              .map((item, index) => (
                <div 
                  key={item.name}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 0',
                    borderBottom: index < 4 ? '1px solid #e0e0e0' : 'none'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500' }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>
                      {item.value} Bedrohungen
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 'bold',
                    color: item.avgRisk >= 6 ? '#e74c3c' : 
                           item.avgRisk >= 4 ? '#f39c12' : '#27ae60'
                  }}>
                    {item.avgRisk.toFixed(1)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreatModelingDashboard;