export interface Risk {
  id: string;
  name: string;
  category: RiskCategory;
  probability: number; // 1-5
  impact: number; // 1-5
  description: string;
  mitigation: string;
  owner: string;
  status: RiskStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type RiskCategory = 
  | 'financial'
  | 'operational'
  | 'strategic'
  | 'compliance'
  | 'reputational'
  | 'cybersecurity'
  | 'environmental';

export type RiskStatus = 'identified' | 'assessed' | 'mitigated' | 'monitoring' | 'closed';

export interface RiskMatrix {
  probability: number;
  impact: number;
  score: number;
  level: RiskLevel;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskStatistics {
  totalRisks: number;
  byCategory: Record<RiskCategory, number>;
  byLevel: Record<RiskLevel, number>;
  averageScore: number;
}