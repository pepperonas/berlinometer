import React from 'react';
import { AlertTriangle, TrendingUp, Shield, Activity } from 'lucide-react';
import { Risk, RiskStatistics } from '../types/risk.types';
import { calculateRiskScore, getRiskLevel } from '../utils/risk-calculations';

interface DashboardProps {
  risks: Risk[];
}

const Dashboard: React.FC<DashboardProps> = ({ risks }) => {
  const statistics: RiskStatistics = React.useMemo(() => {
    const stats: RiskStatistics = {
      totalRisks: risks.length,
      byCategory: {
        financial: 0,
        operational: 0,
        strategic: 0,
        compliance: 0,
        reputational: 0,
        cybersecurity: 0,
        environmental: 0
      },
      byLevel: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      averageScore: 0
    };

    let totalScore = 0;

    risks.forEach(risk => {
      stats.byCategory[risk.category]++;
      const score = calculateRiskScore(risk.probability, risk.impact);
      totalScore += score;
      const level = getRiskLevel(score);
      stats.byLevel[level]++;
    });

    stats.averageScore = risks.length > 0 ? Math.round(totalScore / risks.length * 10) / 10 : 0;

    return stats;
  }, [risks]);

  const getHighestRiskCategory = () => {
    const categories = Object.entries(statistics.byCategory);
    const highest = categories.reduce((max, [cat, count]) => 
      count > max.count ? { category: cat, count } : max,
      { category: '', count: 0 }
    );
    return highest.category || 'Keine';
  };

  const getCriticalRisks = () => {
    return risks.filter(risk => {
      const score = calculateRiskScore(risk.probability, risk.impact);
      return getRiskLevel(score) === 'critical';
    });
  };

  return (
    <div>
      <div className="dashboard-grid">
        <div className="card stat-card">
          <div className="card-header">
            <AlertTriangle size={24} color="#e74c3c" />
          </div>
          <div className="stat-value">{statistics.totalRisks}</div>
          <div className="stat-label">Gesamtrisiken</div>
        </div>

        <div className="card stat-card">
          <div className="card-header">
            <TrendingUp size={24} color="#f39c12" />
          </div>
          <div className="stat-value">{statistics.averageScore}</div>
          <div className="stat-label">Durchschnittlicher Risikoscore</div>
        </div>

        <div className="card stat-card">
          <div className="card-header">
            <Shield size={24} color="#27ae60" />
          </div>
          <div className="stat-value">{statistics.byLevel.critical}</div>
          <div className="stat-label">Kritische Risiken</div>
        </div>

        <div className="card stat-card">
          <div className="card-header">
            <Activity size={24} color="#3498db" />
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>
            {getHighestRiskCategory()}
          </div>
          <div className="stat-label">Höchste Risikokategorie</div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Risiko-Zusammenfassung</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div>
            <h4 style={{ marginBottom: '0.5rem', color: '#7f8c8d' }}>Nach Stufe</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="risk-low" style={{ padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                  Niedrig
                </span>
                <strong>{statistics.byLevel.low}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="risk-medium" style={{ padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                  Mittel
                </span>
                <strong>{statistics.byLevel.medium}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="risk-high" style={{ padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                  Hoch
                </span>
                <strong>{statistics.byLevel.high}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="risk-critical" style={{ padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                  Kritisch
                </span>
                <strong>{statistics.byLevel.critical}</strong>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ marginBottom: '0.5rem', color: '#7f8c8d' }}>Kritische Risiken mit sofortigem Handlungsbedarf</h4>
            {getCriticalRisks().length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {getCriticalRisks().slice(0, 3).map(risk => (
                  <li key={risk.id} style={{ marginBottom: '0.5rem' }}>
                    <strong>{risk.name}</strong>
                    <div style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>
                      {risk.category} • Score: {calculateRiskScore(risk.probability, risk.impact)}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#7f8c8d' }}>Keine kritischen Risiken identifiziert</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;