import { Threat, ThreatImpact, AttackComplexity, ImpactLevel, AttackLeaf, AttackPath } from '../types/threat.types';

export const calculateThreatRiskScore = (
  likelihood: number,
  impact: ThreatImpact,
  complexity: AttackComplexity
): number => {
  const impactWeight = calculateImpactWeight(impact);
  const complexityModifier = getComplexityModifier(complexity);
  
  return Math.round((likelihood * impactWeight * complexityModifier) * 10) / 10;
};

export const calculateImpactWeight = (impact: ThreatImpact): number => {
  const weights = {
    none: 0,
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
  };
  
  const confidentialityWeight = weights[impact.confidentiality] * 0.3;
  const integrityWeight = weights[impact.integrity] * 0.3;
  const availabilityWeight = weights[impact.availability] * 0.25;
  const reputationalWeight = weights[impact.reputational] * 0.1;
  const operationalWeight = weights[impact.operational] * 0.05;
  
  return confidentialityWeight + integrityWeight + availabilityWeight + 
         reputationalWeight + operationalWeight;
};

export const getComplexityModifier = (complexity: AttackComplexity): number => {
  const modifiers = {
    low: 1.2,
    medium: 1.0,
    high: 0.7
  };
  return modifiers[complexity];
};

export const getThreatRiskLevel = (riskScore: number): string => {
  if (riskScore <= 2) return 'niedrig';
  if (riskScore <= 4) return 'mittel';
  if (riskScore <= 6) return 'hoch';
  return 'kritisch';
};

export const calculateStrideScore = (strideCategories: string[]): Record<string, number> => {
  const strideImpact = {
    spoofing: 3,
    tampering: 4,
    repudiation: 2,
    information_disclosure: 4,
    denial_of_service: 3,
    elevation_of_privilege: 5
  };
  
  const scores: Record<string, number> = {};
  strideCategories.forEach(category => {
    scores[category] = strideImpact[category as keyof typeof strideImpact] || 0;
  });
  
  return scores;
};

export const calculateAttackPathRisk = (path: AttackPath): number => {
  const baseRisk = path.success_probability * (1 - path.detection_probability);
  const costModifier = getCostModifier(path.total_cost);
  const timeModifier = getTimeModifier(path.total_time);
  
  return Math.round(baseRisk * costModifier * timeModifier * 100) / 100;
};

export const getCostModifier = (cost: string): number => {
  const modifiers = {
    low: 1.5,
    medium: 1.2,
    high: 0.8,
    very_high: 0.5
  };
  return modifiers[cost as keyof typeof modifiers] || 1.0;
};

export const getTimeModifier = (time: string): number => {
  const modifiers = {
    minutes: 1.8,
    hours: 1.5,
    days: 1.2,
    weeks: 1.0,
    months: 0.7
  };
  return modifiers[time as keyof typeof modifiers] || 1.0;
};

export const calculateMitigationEffectiveness = (
  originalRisk: number,
  mitigations: any[]
): number => {
  if (mitigations.length === 0) return originalRisk;
  
  let residualRisk = originalRisk;
  
  mitigations.forEach(mitigation => {
    const effectiveness = getEffectivenessValue(mitigation.effectiveness);
    residualRisk = residualRisk * (1 - effectiveness);
  });
  
  return Math.round(residualRisk * 100) / 100;
};

export const getEffectivenessValue = (level: string): number => {
  const values = {
    low: 0.2,
    medium: 0.4,
    high: 0.7,
    very_high: 0.9
  };
  return values[level as keyof typeof values] || 0;
};

export const calculateCoverageGap = (
  threats: Threat[],
  assetId: string
): number => {
  const relevantThreats = threats.filter(threat => 
    threat.affectedAssets.includes(assetId)
  );
  
  if (relevantThreats.length === 0) return 0;
  
  const mitigatedThreats = relevantThreats.filter(threat =>
    threat.mitigations && threat.mitigations.length > 0
  );
  
  return Math.round((1 - (mitigatedThreats.length / relevantThreats.length)) * 100);
};

export const calculateThreatTrend = (
  threats: Threat[],
  timeFrame: 'week' | 'month' | 'quarter'
): number => {
  const now = new Date();
  const timeFrameDays = {
    week: 7,
    month: 30,
    quarter: 90
  };
  
  const cutoffDate = new Date(now.getTime() - timeFrameDays[timeFrame] * 24 * 60 * 60 * 1000);
  const recentThreats = threats.filter(threat => 
    new Date(threat.createdAt) >= cutoffDate
  );
  
  return recentThreats.length;
};

export const generateThreatId = (): string => {
  return `threat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const generateThreatModelId = (): string => {
  return `model-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const calculateAttackSurfaceScore = (attackSurface: any): number => {
  const externalScore = attackSurface.external?.length * 3 || 0;
  const internalScore = attackSurface.internal?.length * 2 || 0;
  const physicalScore = attackSurface.physical?.length * 1.5 || 0;
  const socialScore = attackSurface.social?.length * 2.5 || 0;
  const supplyChainScore = attackSurface.supply_chain?.length * 4 || 0;
  
  return Math.round((externalScore + internalScore + physicalScore + 
                   socialScore + supplyChainScore) * 10) / 10;
};

export const prioritizeThreats = (threats: Threat[]): Threat[] => {
  return [...threats].sort((a, b) => {
    // Prioritize by risk score first
    if (b.riskScore !== a.riskScore) {
      return b.riskScore - a.riskScore;
    }
    
    // Then by likelihood
    if (b.likelihood !== a.likelihood) {
      return b.likelihood - a.likelihood;
    }
    
    // Finally by creation date (newer first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

export const filterThreatsByRiskLevel = (
  threats: Threat[],
  riskLevel: string
): Threat[] => {
  return threats.filter(threat => 
    getThreatRiskLevel(threat.riskScore) === riskLevel
  );
};