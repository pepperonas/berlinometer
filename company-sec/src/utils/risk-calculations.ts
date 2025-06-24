import { Risk, RiskLevel, RiskMatrix } from '../types/risk.types';

export const calculateRiskScore = (probability: number, impact: number): number => {
  return probability * impact;
};

export const getRiskLevel = (score: number): RiskLevel => {
  if (score <= 5) return 'low';
  if (score <= 10) return 'medium';
  if (score <= 15) return 'high';
  return 'critical';
};

export const getRiskMatrix = (probability: number, impact: number): RiskMatrix => {
  const score = calculateRiskScore(probability, impact);
  const level = getRiskLevel(score);
  
  return {
    probability,
    impact,
    score,
    level
  };
};

export const getRiskLevelColor = (level: RiskLevel): string => {
  const colors = {
    low: '#27ae60',
    medium: '#f39c12',
    high: '#e74c3c',
    critical: '#c0392b'
  };
  
  return colors[level];
};

export const getRiskLevelClassName = (level: RiskLevel): string => {
  return `risk-${level}`;
};

export const sortRisksByScore = (risks: Risk[]): Risk[] => {
  return [...risks].sort((a, b) => {
    const scoreA = calculateRiskScore(a.probability, a.impact);
    const scoreB = calculateRiskScore(b.probability, b.impact);
    return scoreB - scoreA;
  });
};

export const filterRisksByLevel = (risks: Risk[], level: RiskLevel): Risk[] => {
  return risks.filter(risk => {
    const score = calculateRiskScore(risk.probability, risk.impact);
    return getRiskLevel(score) === level;
  });
};

export const generateRiskId = (): string => {
  return `risk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};