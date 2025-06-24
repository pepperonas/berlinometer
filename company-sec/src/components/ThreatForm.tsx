import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Threat, ThreatCategory, StrideCategory, KillChainPhase, AttackVector, AttackComplexity, ImpactLevel, ThreatStatus } from '../types/threat.types';
import { generateThreatId, calculateThreatRiskScore } from '../utils/threat-calculations';

interface ThreatFormProps {
  onSubmit: (threat: Threat) => void;
  onClose: () => void;
  editThreat?: Threat | null;
  availableAssets: string[];
  availableComponents: string[];
}

const ThreatForm: React.FC<ThreatFormProps> = ({ 
  onSubmit, 
  onClose, 
  editThreat, 
  availableAssets, 
  availableComponents 
}) => {
  const [formData, setFormData] = useState({
    name: editThreat?.name || '',
    description: editThreat?.description || '',
    category: editThreat?.category || 'malware' as ThreatCategory,
    strideClassification: editThreat?.strideClassification || [] as StrideCategory[],
    killChainPhase: editThreat?.killChainPhase || 'reconnaissance' as KillChainPhase,
    attackVector: editThreat?.attackVector || 'network' as AttackVector,
    complexity: editThreat?.complexity || 'medium' as AttackComplexity,
    likelihood: editThreat?.likelihood || 3,
    impact: editThreat?.impact || {
      confidentiality: 'medium' as ImpactLevel,
      integrity: 'medium' as ImpactLevel,
      availability: 'medium' as ImpactLevel,
      financial: 0,
      reputational: 'medium' as ImpactLevel,
      operational: 'medium' as ImpactLevel
    },
    cveReferences: editThreat?.cveReferences?.join(', ') || '',
    mitreTechniques: editThreat?.mitreTechniques?.join(', ') || '',
    affectedAssets: editThreat?.affectedAssets || [] as string[],
    affectedComponents: editThreat?.affectedComponents || [] as string[],
    status: editThreat?.status || 'identified' as ThreatStatus,
    assignedTo: editThreat?.assignedTo || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const riskScore = calculateThreatRiskScore(
      formData.likelihood,
      formData.impact,
      formData.complexity
    );

    const threat: Threat = {
      id: editThreat?.id || generateThreatId(),
      name: formData.name,
      description: formData.description,
      category: formData.category,
      strideClassification: formData.strideClassification,
      killChainPhase: formData.killChainPhase,
      attackVector: formData.attackVector,
      complexity: formData.complexity,
      likelihood: formData.likelihood,
      impact: formData.impact,
      riskScore,
      cveReferences: formData.cveReferences.split(',').map(s => s.trim()).filter(Boolean),
      mitreTechniques: formData.mitreTechniques.split(',').map(s => s.trim()).filter(Boolean),
      affectedAssets: formData.affectedAssets,
      affectedComponents: formData.affectedComponents,
      mitigations: editThreat?.mitigations || [],
      detectionMethods: editThreat?.detectionMethods || [],
      status: formData.status,
      assignedTo: formData.assignedTo,
      createdAt: editThreat?.createdAt || new Date(),
      updatedAt: new Date()
    };
    
    onSubmit(threat);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'likelihood') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else if (name.startsWith('impact.')) {
      const impactField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        impact: { ...prev.impact, [impactField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleStrideChange = (category: StrideCategory, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      strideClassification: checked
        ? [...prev.strideClassification, category]
        : prev.strideClassification.filter(c => c !== category)
    }));
  };

  const handleAssetChange = (asset: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      affectedAssets: checked
        ? [...prev.affectedAssets, asset]
        : prev.affectedAssets.filter(a => a !== asset)
    }));
  };

  const handleComponentChange = (component: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      affectedComponents: checked
        ? [...prev.affectedComponents, component]
        : prev.affectedComponents.filter(c => c !== component)
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2 className="modal-title">{editThreat ? 'Bedrohung bearbeiten' : 'Neue Bedrohung hinzufügen'}</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Bedrohungsname</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Kategorie</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-select"
              >
                <option value="malware">Schadsoftware</option>
                <option value="phishing">Phishing</option>
                <option value="insider_threat">Insider-Bedrohung</option>
                <option value="supply_chain">Lieferkette</option>
                <option value="physical">Physisch</option>
                <option value="social_engineering">Social Engineering</option>
                <option value="data_breach">Datenschutzverletzung</option>
                <option value="denial_of_service">Denial of Service</option>
                <option value="privilege_escalation">Privilegieneskalation</option>
                <option value="lateral_movement">Laterale Bewegung</option>
                <option value="persistence">Persistenz</option>
                <option value="exfiltration">Datenexfiltration</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Beschreibung</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Kill Chain Phase</label>
              <select
                name="killChainPhase"
                value={formData.killChainPhase}
                onChange={handleChange}
                className="form-select"
              >
                <option value="reconnaissance">Aufklärung</option>
                <option value="weaponization">Bewaffnung</option>
                <option value="delivery">Zustellung</option>
                <option value="exploitation">Ausnutzung</option>
                <option value="installation">Installation</option>
                <option value="command_control">Command & Control</option>
                <option value="actions_objectives">Aktionen & Ziele</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Angriffsvektor</label>
              <select
                name="attackVector"
                value={formData.attackVector}
                onChange={handleChange}
                className="form-select"
              >
                <option value="network">Netzwerk</option>
                <option value="adjacent_network">Angrenzende Netzwerk</option>
                <option value="local">Lokal</option>
                <option value="physical">Physisch</option>
                <option value="social">Sozial</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Komplexität</label>
              <select
                name="complexity"
                value={formData.complexity}
                onChange={handleChange}
                className="form-select"
              >
                <option value="low">Niedrig</option>
                <option value="medium">Mittel</option>
                <option value="high">Hoch</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">STRIDE Klassifizierung</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
              {(['spoofing', 'tampering', 'repudiation', 'information_disclosure', 'denial_of_service', 'elevation_of_privilege'] as StrideCategory[]).map(category => (
                <label key={category} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.strideClassification.includes(category)}
                    onChange={(e) => handleStrideChange(category, e.target.checked)}
                  />
                  <span style={{ fontSize: '0.9rem' }}>
                    {category === 'spoofing' && 'Spoofing'}
                    {category === 'tampering' && 'Manipulation'}
                    {category === 'repudiation' && 'Abstreitbarkeit'}
                    {category === 'information_disclosure' && 'Informationsoffenlegung'}
                    {category === 'denial_of_service' && 'Denial of Service'}
                    {category === 'elevation_of_privilege' && 'Privilegieneskalation'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Wahrscheinlichkeit (1-5)</label>
              <select
                name="likelihood"
                value={formData.likelihood}
                onChange={handleChange}
                className="form-select"
              >
                <option value={1}>1 - Sehr niedrig</option>
                <option value={2}>2 - Niedrig</option>
                <option value={3}>3 - Mittel</option>
                <option value={4}>4 - Hoch</option>
                <option value={5}>5 - Sehr hoch</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-select"
              >
                <option value="identified">Identifiziert</option>
                <option value="analyzing">Analysiert</option>
                <option value="mitigating">Gemindert</option>
                <option value="monitoring">Überwacht</option>
                <option value="resolved">Behoben</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Auswirkungen</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>Vertraulichkeit</label>
                <select
                  name="impact.confidentiality"
                  value={formData.impact.confidentiality}
                  onChange={handleChange}
                  className="form-select"
                  style={{ marginTop: '0.25rem' }}
                >
                  <option value="none">Keine</option>
                  <option value="low">Niedrig</option>
                  <option value="medium">Mittel</option>
                  <option value="high">Hoch</option>
                  <option value="critical">Kritisch</option>
                </select>
              </div>
              
              <div>
                <label style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>Integrität</label>
                <select
                  name="impact.integrity"
                  value={formData.impact.integrity}
                  onChange={handleChange}
                  className="form-select"
                  style={{ marginTop: '0.25rem' }}
                >
                  <option value="none">Keine</option>
                  <option value="low">Niedrig</option>
                  <option value="medium">Mittel</option>
                  <option value="high">Hoch</option>
                  <option value="critical">Kritisch</option>
                </select>
              </div>
              
              <div>
                <label style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>Verfügbarkeit</label>
                <select
                  name="impact.availability"
                  value={formData.impact.availability}
                  onChange={handleChange}
                  className="form-select"
                  style={{ marginTop: '0.25rem' }}
                >
                  <option value="none">Keine</option>
                  <option value="low">Niedrig</option>
                  <option value="medium">Mittel</option>
                  <option value="high">Hoch</option>
                  <option value="critical">Kritisch</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">CVE Referenzen</label>
              <input
                type="text"
                name="cveReferences"
                value={formData.cveReferences}
                onChange={handleChange}
                className="form-input"
                placeholder="CVE-2023-1234, CVE-2023-5678"
              />
            </div>

            <div className="form-group">
              <label className="form-label">MITRE Techniken</label>
              <input
                type="text"
                name="mitreTechniques"
                value={formData.mitreTechniques}
                onChange={handleChange}
                className="form-input"
                placeholder="T1566, T1055, T1083"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Zugewiesener Bearbeiter</label>
            <input
              type="text"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {availableAssets.length > 0 && (
            <div className="form-group">
              <label className="form-label">Betroffene Assets</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.5rem', maxHeight: '100px', overflowY: 'auto' }}>
                {availableAssets.map(asset => (
                  <label key={asset} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.affectedAssets.includes(asset)}
                      onChange={(e) => handleAssetChange(asset, e.target.checked)}
                    />
                    <span style={{ fontSize: '0.9rem' }}>{asset}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {availableComponents.length > 0 && (
            <div className="form-group">
              <label className="form-label">Betroffene Komponenten</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.5rem', maxHeight: '100px', overflowY: 'auto' }}>
                {availableComponents.map(component => (
                  <label key={component} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.affectedComponents.includes(component)}
                      onChange={(e) => handleComponentChange(component, e.target.checked)}
                    />
                    <span style={{ fontSize: '0.9rem' }}>{component}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="button" className="button" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="button primary">
              {editThreat ? 'Bedrohung aktualisieren' : 'Bedrohung hinzufügen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ThreatForm;