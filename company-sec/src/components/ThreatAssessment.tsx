import React, { useState, useMemo } from 'react';
import { AlertTriangle, Shield, Target, TrendingUp, Eye, Clock } from 'lucide-react';
import { Threat, ThreatModel } from '../types/threat.types';
import { 
  calculateThreatRiskScore, 
  getThreatRiskLevel, 
  calculateMitigationEffectiveness,
  calculateCoverageGap,
  prioritizeThreats 
} from '../utils/threat-calculations';

interface ThreatAssessmentProps {
  threats: Threat[];
  threatModel?: ThreatModel;
  onThreatSelect?: (threat: Threat) => void;
}

const ThreatAssessment: React.FC<ThreatAssessmentProps> = ({ 
  threats, 
  threatModel, 
  onThreatSelect 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'risk' | 'likelihood' | 'impact' | 'created'>('risk');
  const [filterByRisk, setFilterByRisk] = useState<string>('all');

  const assessmentData = useMemo(() => {
    const prioritizedThreats = prioritizeThreats(threats);
    
    let filteredThreats = prioritizedThreats;
    
    if (selectedCategory !== 'all') {
      filteredThreats = filteredThreats.filter(threat => threat.category === selectedCategory);
    }
    
    if (filterByRisk !== 'all') {
      filteredThreats = filteredThreats.filter(threat => 
        getThreatRiskLevel(threat.riskScore) === filterByRisk
      );
    }

    // Calculate statistics
    const stats = {
      total: threats.length,
      critical: threats.filter(t => getThreatRiskLevel(t.riskScore) === 'kritisch').length,
      high: threats.filter(t => getThreatRiskLevel(t.riskScore) === 'hoch').length,
      medium: threats.filter(t => getThreatRiskLevel(t.riskScore) === 'mittel').length,
      low: threats.filter(t => getThreatRiskLevel(t.riskScore) === 'niedrig').length,
      mitigated: threats.filter(t => t.mitigations && t.mitigations.length > 0).length,
      avgRiskScore: threats.length > 0 
        ? threats.reduce((sum, t) => sum + t.riskScore, 0) / threats.length 
        : 0
    };

    return { filteredThreats, stats };
  }, [threats, selectedCategory, sortBy, filterByRisk]);

  const getRiskLevelColor = (level: string) => {
    const colors = {
      'niedrig': '#27ae60',
      'mittel': '#f39c12',
      'hoch': '#e74c3c',
      'kritisch': '#c0392b'
    };
    return colors[level as keyof typeof colors] || '#7f8c8d';
  };

  const getKillChainPhaseLabel = (phase: string) => {
    const labels = {
      reconnaissance: 'Aufklärung',
      weaponization: 'Bewaffnung',
      delivery: 'Zustellung',
      exploitation: 'Ausnutzung',
      installation: 'Installation',
      command_control: 'Command & Control',
      actions_objectives: 'Aktionen & Ziele'
    };
    return labels[phase as keyof typeof labels] || phase;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      malware: 'Schadsoftware',
      phishing: 'Phishing',
      insider_threat: 'Insider-Bedrohung',
      supply_chain: 'Lieferkette',
      physical: 'Physisch',
      social_engineering: 'Social Engineering',
      data_breach: 'Datenschutzverletzung',
      denial_of_service: 'Denial of Service',
      privilege_escalation: 'Privilegieneskalation',
      lateral_movement: 'Laterale Bewegung',
      persistence: 'Persistenz',
      exfiltration: 'Datenexfiltration'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      identified: 'Identifiziert',
      analyzing: 'Analysiert',
      mitigating: 'Gemindert',
      monitoring: 'Überwacht',
      resolved: 'Behoben'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      identified: '#e74c3c',
      analyzing: '#f39c12',
      mitigating: '#3498db',
      monitoring: '#17a2b8',
      resolved: '#27ae60'
    };
    return colors[status as keyof typeof colors] || '#7f8c8d';
  };

  const uniqueCategories = Array.from(new Set(threats.map(t => t.category)));

  return (
    <div>
      {/* Statistics Overview */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Bedrohungsbeurteilung</h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div className="card stat-card">
            <div className="card-header">
              <AlertTriangle size={24} color="#e74c3c" />
            </div>
            <div className="stat-value">{assessmentData.stats.total}</div>
            <div className="stat-label">Gesamte Bedrohungen</div>
          </div>

          <div className="card stat-card">
            <div className="card-header">
              <Target size={24} color="#c0392b" />
            </div>
            <div className="stat-value">{assessmentData.stats.critical}</div>
            <div className="stat-label">Kritische Bedrohungen</div>
          </div>

          <div className="card stat-card">
            <div className="card-header">
              <Shield size={24} color="#27ae60" />
            </div>
            <div className="stat-value">{assessmentData.stats.mitigated}</div>
            <div className="stat-label">Mit Mitigationen</div>
          </div>

          <div className="card stat-card">
            <div className="card-header">
              <TrendingUp size={24} color="#3498db" />
            </div>
            <div className="stat-value">{assessmentData.stats.avgRiskScore.toFixed(1)}</div>
            <div className="stat-label">Ø Risikoscore</div>
          </div>
        </div>

        {/* Risk Level Distribution */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h4 className="card-title">Risikoverteilung</h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: '1rem',
            marginTop: '1rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                color: getRiskLevelColor('kritisch') 
              }}>
                {assessmentData.stats.critical}
              </div>
              <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Kritisch</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                color: getRiskLevelColor('hoch') 
              }}>
                {assessmentData.stats.high}
              </div>
              <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Hoch</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                color: getRiskLevelColor('mittel') 
              }}>
                {assessmentData.stats.medium}
              </div>
              <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Mittel</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                color: getRiskLevelColor('niedrig') 
              }}>
                {assessmentData.stats.low}
              </div>
              <div style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>Niedrig</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div className="form-group">
          <label className="form-label">Kategorie filtern</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-select"
          >
            <option value="all">Alle Kategorien</option>
            {uniqueCategories.map(category => (
              <option key={category} value={category}>
                {getCategoryLabel(category)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Risikostufe filtern</label>
          <select
            value={filterByRisk}
            onChange={(e) => setFilterByRisk(e.target.value)}
            className="form-select"
          >
            <option value="all">Alle Risikostufen</option>
            <option value="kritisch">Kritisch</option>
            <option value="hoch">Hoch</option>
            <option value="mittel">Mittel</option>
            <option value="niedrig">Niedrig</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Sortieren nach</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="form-select"
          >
            <option value="risk">Risikoscore</option>
            <option value="likelihood">Wahrscheinlichkeit</option>
            <option value="impact">Auswirkung</option>
            <option value="created">Erstellungsdatum</option>
          </select>
        </div>
      </div>

      {/* Threat List */}
      <div className="card">
        <h4 className="card-title">
          Bedrohungsliste ({assessmentData.filteredThreats.length} von {threats.length})
        </h4>
        
        <div style={{ marginTop: '1rem' }}>
          {assessmentData.filteredThreats.map(threat => {
            const riskLevel = getThreatRiskLevel(threat.riskScore);
            const riskColor = getRiskLevelColor(riskLevel);
            
            return (
              <div
                key={threat.id}
                className="risk-item"
                onClick={() => onThreatSelect && onThreatSelect(threat)}
                style={{ 
                  cursor: onThreatSelect ? 'pointer' : 'default',
                  borderLeft: `4px solid ${riskColor}`
                }}
              >
                <div className="risk-header">
                  <div>
                    <h5 style={{ margin: 0, marginBottom: '0.25rem' }}>{threat.name}</h5>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1rem', 
                      fontSize: '0.8rem', 
                      color: '#7f8c8d' 
                    }}>
                      <span>{getCategoryLabel(threat.category)}</span>
                      <span>•</span>
                      <span>{getKillChainPhaseLabel(threat.killChainPhase)}</span>
                      <span>•</span>
                      <span style={{ color: getStatusColor(threat.status) }}>
                        {getStatusLabel(threat.status)}
                      </span>
                      {threat.assignedTo && (
                        <>
                          <span>•</span>
                          <span>{threat.assignedTo}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      padding: '0.25rem 0.75rem',
                      backgroundColor: riskColor,
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      marginBottom: '0.25rem'
                    }}>
                      {threat.riskScore.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>
                      {riskLevel}
                    </div>
                  </div>
                </div>

                <p style={{ 
                  margin: '0.75rem 0', 
                  color: '#555',
                  fontSize: '0.9rem',
                  lineHeight: 1.4
                }}>
                  {threat.description}
                </p>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                  gap: '1rem',
                  fontSize: '0.8rem',
                  color: '#7f8c8d'
                }}>
                  <div>
                    <strong>Wahrscheinlichkeit:</strong> {threat.likelihood}/5
                  </div>
                  <div>
                    <strong>Angriffsvektor:</strong> {threat.attackVector}
                  </div>
                  <div>
                    <strong>Komplexität:</strong> {threat.complexity}
                  </div>
                  {threat.mitigations && threat.mitigations.length > 0 && (
                    <div style={{ color: '#27ae60' }}>
                      <Shield size={14} style={{ marginRight: '0.25rem' }} />
                      {threat.mitigations.length} Mitigationen
                    </div>
                  )}
                </div>

                {threat.strideClassification && threat.strideClassification.length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#7f8c8d', marginBottom: '0.25rem' }}>
                      <strong>STRIDE:</strong>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {threat.strideClassification.map(stride => (
                        <span
                          key={stride}
                          style={{
                            padding: '0.125rem 0.5rem',
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #dee2e6',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            color: '#495057'
                          }}
                        >
                          {stride}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(threat.cveReferences?.length > 0 || threat.mitreTechniques?.length > 0) && (
                  <div style={{ 
                    marginTop: '0.75rem', 
                    paddingTop: '0.75rem', 
                    borderTop: '1px solid #e0e0e0',
                    fontSize: '0.8rem',
                    color: '#7f8c8d'
                  }}>
                    {threat.cveReferences?.length > 0 && (
                      <div style={{ marginBottom: '0.25rem' }}>
                        <strong>CVE:</strong> {threat.cveReferences.slice(0, 3).join(', ')}
                        {threat.cveReferences.length > 3 && ` (+${threat.cveReferences.length - 3} weitere)`}
                      </div>
                    )}
                    {threat.mitreTechniques?.length > 0 && (
                      <div>
                        <strong>MITRE:</strong> {threat.mitreTechniques.slice(0, 3).join(', ')}
                        {threat.mitreTechniques.length > 3 && ` (+${threat.mitreTechniques.length - 3} weitere)`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {assessmentData.filteredThreats.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem', 
              color: '#7f8c8d',
              fontSize: '1.1rem'
            }}>
              <AlertTriangle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <div>Keine Bedrohungen gefunden</div>
              <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Versuchen Sie andere Filtereinstellungen
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreatAssessment;