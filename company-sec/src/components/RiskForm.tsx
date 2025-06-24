import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Risk, RiskCategory, RiskStatus } from '../types/risk.types';
import { generateRiskId } from '../utils/risk-calculations';

interface RiskFormProps {
  onSubmit: (risk: Risk) => void;
  onClose: () => void;
  editRisk?: Risk | null;
}

const RiskForm: React.FC<RiskFormProps> = ({ onSubmit, onClose, editRisk }) => {
  const [formData, setFormData] = useState({
    name: editRisk?.name || '',
    category: editRisk?.category || 'operational' as RiskCategory,
    probability: editRisk?.probability || 3,
    impact: editRisk?.impact || 3,
    description: editRisk?.description || '',
    mitigation: editRisk?.mitigation || '',
    owner: editRisk?.owner || '',
    status: editRisk?.status || 'identified' as RiskStatus
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const risk: Risk = {
      id: editRisk?.id || generateRiskId(),
      ...formData,
      createdAt: editRisk?.createdAt || new Date(),
      updatedAt: new Date()
    };
    
    onSubmit(risk);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'probability' || name === 'impact' ? Number(value) : value
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{editRisk ? 'Risiko bearbeiten' : 'Neues Risiko hinzufügen'}</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Risikoname</label>
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
              <option value="financial">Finanziell</option>
              <option value="operational">Operativ</option>
              <option value="strategic">Strategisch</option>
              <option value="compliance">Compliance</option>
              <option value="reputational">Reputation</option>
              <option value="cybersecurity">Cybersicherheit</option>
              <option value="environmental">Umwelt</option>
            </select>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Wahrscheinlichkeit (1-5)</label>
              <select
                name="probability"
                value={formData.probability}
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
              <label className="form-label">Auswirkung (1-5)</label>
              <select
                name="impact"
                value={formData.impact}
                onChange={handleChange}
                className="form-select"
              >
                <option value={1}>1 - Minimal</option>
                <option value={2}>2 - Gering</option>
                <option value={3}>3 - Moderat</option>
                <option value={4}>4 - Schwerwiegend</option>
                <option value={5}>5 - Katastrophal</option>
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
          
          <div className="form-group">
            <label className="form-label">Maßnahmen zur Risikominderung</label>
            <textarea
              name="mitigation"
              value={formData.mitigation}
              onChange={handleChange}
              className="form-textarea"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Risikoverantwortlicher</label>
            <input
              type="text"
              name="owner"
              value={formData.owner}
              onChange={handleChange}
              className="form-input"
              required
            />
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
              <option value="assessed">Bewertet</option>
              <option value="mitigated">Gemindert</option>
              <option value="monitoring">Überwachung</option>
              <option value="closed">Geschlossen</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="button" className="button" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="button primary">
              {editRisk ? 'Risiko aktualisieren' : 'Risiko hinzufügen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RiskForm;