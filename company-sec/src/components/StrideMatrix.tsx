import React from 'react';
import { Threat, StrideCategory } from '../types/threat.types';
import { calculateStrideScore } from '../utils/threat-calculations';

interface StrideMatrixProps {
  threats: Threat[];
  onCellClick?: (category: StrideCategory) => void;
}

const StrideMatrix: React.FC<StrideMatrixProps> = ({ threats, onCellClick }) => {
  const strideCategories: StrideCategory[] = [
    'spoofing',
    'tampering', 
    'repudiation',
    'information_disclosure',
    'denial_of_service',
    'elevation_of_privilege'
  ];

  const categoryLabels = {
    spoofing: 'Spoofing',
    tampering: 'Manipulation',
    repudiation: 'Abstreitbarkeit',
    information_disclosure: 'Informationsoffenlegung',
    denial_of_service: 'Denial of Service',
    elevation_of_privilege: 'Privilegieneskalation'
  };

  const categoryDescriptions = {
    spoofing: 'Vortäuschen einer falschen Identität',
    tampering: 'Böswillige Veränderung von Daten oder Code',
    repudiation: 'Abstreiten der Durchführung einer Aktion',
    information_disclosure: 'Preisgabe von Informationen an nicht autorisierte Benutzer',
    denial_of_service: 'Verweigerung oder Verschlechterung des Dienstes',
    elevation_of_privilege: 'Erlangen höherer Berechtigungen als vorgesehen'
  };

  const getThreatsForCategory = (category: StrideCategory) => {
    return threats.filter(threat => 
      threat.strideClassification.includes(category)
    );
  };

  const getCategoryRiskLevel = (threats: Threat[]) => {
    if (threats.length === 0) return 'none';
    
    const avgRisk = threats.reduce((sum, threat) => sum + threat.riskScore, 0) / threats.length;
    
    if (avgRisk <= 2) return 'low';
    if (avgRisk <= 4) return 'medium';
    if (avgRisk <= 6) return 'high';
    return 'critical';
  };

  const getRiskLevelClass = (level: string) => {
    const classes = {
      none: 'stride-none',
      low: 'risk-low',
      medium: 'risk-medium', 
      high: 'risk-high',
      critical: 'risk-critical'
    };
    return classes[level as keyof typeof classes] || '';
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>STRIDE Bedrohungsmodell</h3>
        <p style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
          STRIDE ist ein Bedrohungsmodellierungsframework, das sechs Hauptkategorien von Sicherheitsbedrohungen identifiziert.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {strideCategories.map(category => {
          const categoryThreats = getThreatsForCategory(category);
          const riskLevel = getCategoryRiskLevel(categoryThreats);
          const riskClass = getRiskLevelClass(riskLevel);

          return (
            <div
              key={category}
              className={`card stride-card ${riskClass}`}
              onClick={() => onCellClick && onCellClick(category)}
              style={{ 
                cursor: onCellClick ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                border: `2px solid ${riskLevel === 'none' ? '#e0e0e0' : 'transparent'}`
              }}
            >
              <div className="card-header" style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>
                  {categoryLabels[category]}
                </h4>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold',
                  color: riskLevel === 'none' ? '#7f8c8d' : 'inherit'
                }}>
                  {categoryThreats.length}
                </div>
              </div>
              
              <p style={{ 
                fontSize: '0.9rem', 
                color: '#7f8c8d', 
                marginBottom: '1rem',
                lineHeight: 1.4
              }}>
                {categoryDescriptions[category]}
              </p>

              {categoryThreats.length > 0 && (
                <div>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#7f8c8d', 
                    marginBottom: '0.5rem' 
                  }}>
                    Bedrohungen:
                  </div>
                  <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                    {categoryThreats.slice(0, 3).map(threat => (
                      <div key={threat.id} style={{ 
                        fontSize: '0.8rem', 
                        marginBottom: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        borderRadius: '4px'
                      }}>
                        <strong>{threat.name}</strong>
                        <span style={{ color: '#7f8c8d', marginLeft: '0.5rem' }}>
                          Risk: {threat.riskScore.toFixed(1)}
                        </span>
                      </div>
                    ))}
                    {categoryThreats.length > 3 && (
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: '#7f8c8d',
                        fontStyle: 'italic'
                      }}>
                        +{categoryThreats.length - 3} weitere...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {categoryThreats.length === 0 && (
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: '#7f8c8d',
                  fontStyle: 'italic'
                }}>
                  Keine Bedrohungen identifiziert
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h4 style={{ marginBottom: '1rem' }}>STRIDE Zusammenfassung</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem' 
        }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3498db' }}>
              {threats.length}
            </div>
            <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
              Gesamte Bedrohungen
            </div>
          </div>
          
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e74c3c' }}>
              {threats.filter(t => t.riskScore >= 6).length}
            </div>
            <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
              Hohe Risiken
            </div>
          </div>
          
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f39c12' }}>
              {strideCategories.filter(cat => getThreatsForCategory(cat).length > 0).length}
            </div>
            <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
              Betroffene STRIDE Kategorien
            </div>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#27ae60' }}>
              {threats.filter(t => t.mitigations && t.mitigations.length > 0).length}
            </div>
            <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
              Mit Mitigationen
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          .stride-card:hover {
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
            transform: translateY(-3px);
          }
          
          .stride-none {
            background-color: #f8f9fa;
            color: #6c757d;
          }
          
          .stride-card.risk-low {
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
            border-color: #b8dacc;
          }
          
          .stride-card.risk-medium {
            background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%);
            border-color: #f0e68c;
          }
          
          .stride-card.risk-high {
            background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
            border-color: #f1b0b7;
          }
          
          .stride-card.risk-critical {
            background: linear-gradient(135deg, #f5c6cb 0%, #f1aeb5 100%);
            border-color: #ed969e;
          }
        `}
      </style>
    </div>
  );
};

export default StrideMatrix;