import React from 'react';
import { Risk } from '../types/risk.types';
import { calculateRiskScore, getRiskLevelClassName } from '../utils/risk-calculations';

interface RiskMatrixProps {
  risks: Risk[];
  onCellClick?: (probability: number, impact: number) => void;
}

const RiskMatrix: React.FC<RiskMatrixProps> = ({ risks, onCellClick }) => {
  const getRisksInCell = (probability: number, impact: number) => {
    return risks.filter(risk => risk.probability === probability && risk.impact === impact);
  };

  const getCellClassName = (probability: number, impact: number) => {
    const score = calculateRiskScore(probability, impact);
    if (score <= 5) return 'risk-low';
    if (score <= 10) return 'risk-medium';
    if (score <= 15) return 'risk-high';
    return 'risk-critical';
  };

  const impactLabels = ['', 'Minimal', 'Gering', 'Moderat', 'Schwerwiegend', 'Katastrophal'];
  const probabilityLabels = ['Sehr hoch', 'Hoch', 'Mittel', 'Niedrig', 'Sehr niedrig'];

  return (
    <div className="risk-matrix">
      <div className="matrix-cell matrix-header"></div>
      {impactLabels.slice(1).map((label, index) => (
        <div key={`impact-${index}`} className="matrix-cell matrix-header">
          {label}
        </div>
      ))}
      
      {probabilityLabels.map((label, pIndex) => (
        <React.Fragment key={`row-${pIndex}`}>
          <div className="matrix-cell matrix-header">{label}</div>
          {[1, 2, 3, 4, 5].map(impact => {
            const probability = 5 - pIndex;
            const risksInCell = getRisksInCell(probability, impact);
            const cellClass = getCellClassName(probability, impact);
            
            return (
              <div
                key={`cell-${probability}-${impact}`}
                className={`matrix-cell ${cellClass}`}
                onClick={() => onCellClick && onCellClick(probability, impact)}
                style={{ cursor: onCellClick ? 'pointer' : 'default' }}
              >
                {risksInCell.length > 0 && (
                  <span>{risksInCell.length}</span>
                )}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};

export default RiskMatrix;