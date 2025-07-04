export interface AIRiskAnalysisRequest {
  processDescription: string;
  dataTypes: string[];
  dataSubjects: string[];
  thirdPartySharing: boolean;
  technicalMeasures: string[];
  organizationalMeasures: string[];
  industry: string;
  organizationSize: 'small' | 'medium' | 'large' | 'enterprise';
  geographicScope: 'local' | 'national' | 'european' | 'global';
  existingControls?: string[];
}

export interface AIRiskAnalysisResponse {
  riskAssessment: {
    overallRisk: RiskLevel;
    riskScore: number; // 0-100
    confidenceScore: number; // 0-100
    
    riskFactors: {
      dataPrivacyRisk: number;
      securityRisk: number;
      complianceRisk: number;
      operationalRisk: number;
      reputationalRisk: number;
    };
    
    detailedAnalysis: {
      dataRisks: DataRiskAnalysis[];
      securityRisks: SecurityRiskAnalysis[];
      complianceGaps: ComplianceGap[];
      
      threats: ThreatAnalysis[];
      vulnerabilities: VulnerabilityAnalysis[];
      
      impactAssessment: ImpactAssessment;
      likelihoodAssessment: LikelihoodAssessment;
    };
    
    recommendations: AIRecommendation[];
    requiredMeasures: RequiredMeasure[];
    suggestedControls: SuggestedControl[];
    
    complianceMapping: ComplianceMapping[];
    benchmarking: IndustryBenchmark;
  };
  
  metadata: {
    analysisId: string;
    timestamp: string;
    processingTime: number; // in ms
    modelVersion: string;
    dataSourcesUsed: string[];
  };
}

export interface DataRiskAnalysis {
  dataType: string;
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
  volume: 'small' | 'medium' | 'large' | 'massive';
  
  risks: {
    unauthorizedAccess: number;
    dataLoss: number;
    dataCorruption: number;
    unauthorizedDisclosure: number;
    identityTheft: number;
  };
  
  mitigations: string[];
  residualRisk: number;
}

export interface SecurityRiskAnalysis {
  category: 'technical' | 'physical' | 'administrative';
  riskType: string;
  description: string;
  likelihood: number; // 0-100
  impact: number; // 0-100
  riskScore: number; // likelihood * impact / 100
  
  attackVectors: string[];
  mitigatingControls: string[];
  gaps: string[];
  recommendations: string[];
}

export interface ComplianceGap {
  framework: string;
  article: string;
  requirement: string;
  currentImplementation: 'none' | 'partial' | 'full';
  gapSeverity: 'low' | 'medium' | 'high' | 'critical';
  
  implementationEffort: 'low' | 'medium' | 'high';
  timeline: string;
  dependencies: string[];
  
  remediation: string;
  evidence: string[];
}

export interface ThreatAnalysis {
  threatId: string;
  name: string;
  category: 'malicious' | 'accidental' | 'environmental' | 'technical';
  description: string;
  
  likelihood: number; // 0-100
  sophistication: 'low' | 'medium' | 'high';
  motivation: string[];
  
  targetedAssets: string[];
  attackMethods: string[];
  indicators: string[];
  
  countermeasures: string[];
}

export interface VulnerabilityAnalysis {
  vulnerabilityId: string;
  name: string;
  type: 'technical' | 'procedural' | 'physical' | 'human';
  description: string;
  
  severity: 'low' | 'medium' | 'high' | 'critical';
  exploitability: number; // 0-100
  discoverability: number; // 0-100
  
  affectedAssets: string[];
  preconditions: string[];
  
  remediationPriority: number; // 1-10
  remediationEffort: 'low' | 'medium' | 'high';
  remediationSteps: string[];
}

export interface ImpactAssessment {
  categories: {
    financial: {
      directCosts: number;
      indirectCosts: number;
      regulatoryFines: number;
      businessLoss: number;
    };
    operational: {
      serviceDisruption: number;
      productivityLoss: number;
      customerImpact: number;
      supplierImpact: number;
    };
    reputational: {
      brandDamage: number;
      customerTrust: number;
      marketPosition: number;
      publicPerception: number;
    };
    legal: {
      regulatoryAction: number;
      litigation: number;
      contractualBreach: number;
      complianceViolation: number;
    };
  };
  
  overallImpact: number; // 0-100
  impactDistribution: Record<string, number>;
}

export interface LikelihoodAssessment {
  factors: {
    threatEnvironment: number;
    targetAttractiveness: number;
    vulnerabilityExposure: number;
    controlEffectiveness: number;
    historicalData: number;
  };
  
  overallLikelihood: number; // 0-100
  timeframe: '1month' | '3months' | '6months' | '1year' | '2years';
  
  seasonality: boolean;
  trendAnalysis: 'increasing' | 'stable' | 'decreasing';
}

export interface SuggestedControl {
  controlId: string;
  name: string;
  type: 'preventive' | 'detective' | 'corrective' | 'compensating';
  category: 'technical' | 'administrative' | 'physical';
  
  description: string;
  implementationGuidance: string;
  
  effectiveness: number; // 0-100
  cost: 'low' | 'medium' | 'high';
  complexity: 'low' | 'medium' | 'high';
  
  riskReduction: number; // 0-100
  roi: number; // Return on Investment %
  
  dependencies: string[];
  alternatives: string[];
  
  frameworks: string[]; // Which frameworks this control satisfies
}

export interface ComplianceMapping {
  framework: string;
  version: string;
  
  requirements: {
    requirementId: string;
    title: string;
    description: string;
    currentStatus: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
    
    gapAnalysis: string[];
    requiredActions: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    
    estimatedEffort: string;
    dependencies: string[];
  }[];
  
  overallCompliance: number; // 0-100
  complianceGaps: number;
  criticalGaps: number;
}

export interface IndustryBenchmark {
  industry: string;
  organizationSize: string;
  
  benchmarks: {
    averageRiskScore: number;
    topQuartileRiskScore: number;
    commonVulnerabilities: string[];
    bestPractices: string[];
    
    complianceMaturity: {
      framework: string;
      averageMaturity: number;
      yourMaturity: number;
      maturityGap: number;
    }[];
    
    securitySpending: {
      averagePercentage: number;
      recommendedPercentage: number;
      yourPercentage?: number;
    };
    
    incidentStatistics: {
      averageIncidentsPerYear: number;
      averageCostPerIncident: number;
      mostCommonIncidentTypes: string[];
    };
  };
  
  recommendations: string[];
  peerComparison: 'below_average' | 'average' | 'above_average' | 'top_quartile';
}

// Chat Interface Types
export interface AIChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  
  // Additional context for assistant messages
  context?: {
    analysisId?: string;
    riskScore?: number;
    recommendations?: string[];
    citations?: string[];
  };
}

export interface AIChatSession {
  id: string;
  title: string;
  messages: AIChatMessage[];
  createdAt: string;
  updatedAt: string;
  
  // Context
  organizationId: number;
  userId: number;
  relatedProcessId?: number;
  relatedTemplateId?: number;
}

export interface AIPromptTemplate {
  id: string;
  name: string;
  category: 'risk_analysis' | 'compliance_check' | 'security_assessment' | 'general';
  prompt: string;
  variables: string[];
  description: string;
}

// Real-time Analysis Types
export interface AIAnalysisJob {
  id: string;
  type: 'risk_analysis' | 'compliance_check' | 'security_scan' | 'full_assessment';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  
  input: AIRiskAnalysisRequest;
  output?: AIRiskAnalysisResponse;
  
  progress: number; // 0-100
  currentStep: string;
  estimatedCompletion?: string;
  
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  
  error?: string;
}

// AI Configuration
export interface AIModelConfig {
  provider: 'openai' | 'azure' | 'anthropic' | 'local';
  model: string;
  temperature: number;
  maxTokens: number;
  
  // Risk Analysis Specific
  riskThresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  
  confidenceThreshold: number;
  enableBenchmarking: boolean;
  includeIndustryData: boolean;
}

export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export interface AIRecommendation {
  id: string;
  type: 'security' | 'privacy' | 'compliance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  reasoning: string;
  implementation: string;
  estimatedEffort: string;
  riskReduction: number;
}

export interface RequiredMeasure {
  id: string;
  type: 'technical' | 'organizational';
  name: string;
  description: string;
  isImplemented: boolean;
  deadline?: string;
  responsible?: string;
}