import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Risk } from '../types/risk.types';
import { calculateRiskScore, getRiskLevel, getRiskLevelClassName } from '../utils/risk-calculations';

interface RiskListProps {
  risks: Risk[];
  onEdit: (risk: Risk) => void;
  onDelete: (id: string) => void;
}

const RiskList: React.FC<RiskListProps> = ({ risks, onEdit, onDelete }) => {
  return (
    <ul className="risk-list">
      {risks.map(risk => {
        const score = calculateRiskScore(risk.probability, risk.impact);
        const level = getRiskLevel(score);
        
        return (
          <li key={risk.id} className="risk-item">
            <div className="risk-header">
              <div>
                <h3 className="risk-name">{risk.name}</h3>
                <p style={{ color: '#7f8c8d', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  {risk.category} • {risk.owner} • {risk.status}
                </p>
              </div>
              <span className={`risk-score ${getRiskLevelClassName(level)}`}>
                Score: {score}
              </span>
            </div>
            
            <p style={{ margin: '0.75rem 0', color: '#555' }}>{risk.description}</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>
                Wahrscheinlichkeit: {risk.probability} • Auswirkung: {risk.impact}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="button"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                  onClick={() => onEdit(risk)}
                >
                  <Edit2 size={16} />
                  Bearbeiten
                </button>
                <button
                  className="button danger"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                  onClick={() => onDelete(risk.id)}
                >
                  <Trash2 size={16} />
                  Löschen
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default RiskList;