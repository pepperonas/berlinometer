// Import LegalBasis type
export type LegalBasis = 
  | 'consent' // Einwilligung
  | 'contract' // Vertragserfüllung
  | 'legal_obligation' // Rechtliche Verpflichtung
  | 'vital_interests' // Lebensinteressen
  | 'public_task' // Öffentliche Aufgabe
  | 'legitimate_interests'; // Berechtigte Interessen

export interface ProcessTemplate {
  id: number;
  organizationId: number;
  name: string;
  description: string;
  category: TemplateCategory;
  industry: Industry;
  version: string;
  isPublic: boolean;
  isVerified: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  
  // Template Content
  processSteps: ProcessStep[];
  dataMapping: DataMapping;
  securityControls: SecurityControl[];
  complianceRequirements: ComplianceRequirement[];
  riskAssessment: RiskAssessment;
  
  // Metadata
  tags: string[];
  downloadCount: number;
  rating: number;
  reviews: TemplateReview[];
  
  // Relationships
  dependencies: number[]; // Other template IDs
  parentTemplateId?: number;
}

export interface ProcessStep {
  id: string;
  name: string;
  description: string;
  order: number;
  isRequired: boolean;
  
  // Data Processing
  dataInputs: DataInput[];
  dataOutputs: DataOutput[];
  processingPurpose: string;
  legalBasis: LegalBasis;
  
  // Security Context
  securityLevel: SecurityLevel;
  accessControls: AccessControl[];
  
  // Conditions
  conditions?: ConditionalLogic[];
  
  // Templates
  fieldTemplates: FieldTemplate[];
}

export interface DataMapping {
  dataCategories: DataCategoryMapping[];
  dataFlow: DataFlowMapping[];
  retentionRules: RetentionRule[];
  thirdPartySharing: ThirdPartyRule[];
}

export interface SecurityControl {
  id: string;
  type: SecurityControlType;
  name: string;
  description: string;
  framework: SecurityFramework;
  controlId: string; // e.g., "AC-1" for NIST
  implementationLevel: MaturityLevel;
  isRequired: boolean;
  automatedCheck: boolean;
  
  // Risk Context
  mitigatedThreats: string[];
  riskReduction: number; // 0-100%
  
  // Implementation
  implementationGuidance: string;
  testProcedure?: string;
  evidence?: string[];
}

export interface RiskAssessment {
  id: string;
  methodology: RiskMethodology;
  
  // Automated Assessment
  aiEnabled: boolean;
  confidenceScore?: number; // 0-100%
  
  // Risk Factors
  dataTypes: DataTypeRisk[];
  processingActivities: ProcessingRisk[];
  technicalMeasures: TechnicalRisk[];
  organizationalMeasures: OrganizationalRisk[];
  
  // Overall Risk
  overallRisk: RiskLevel;
  riskScore: number; // 0-100
  
  // Recommendations
  aiRecommendations?: AIRecommendation[];
  requiredMeasures: RequiredMeasure[];
}

export interface FieldTemplate {
  id: string;
  type: FieldType;
  name: string;
  label: string;
  description?: string;
  isRequired: boolean;
  
  // Validation
  validation?: ValidationRule[];
  
  // Options for select/radio/checkbox
  options?: FieldOption[];
  
  // Conditional Logic
  showWhen?: ConditionalLogic;
  
  // AI Integration
  aiAssisted?: boolean;
  aiPrompt?: string;
  
  // Data Binding
  dataBinding?: string;
  defaultValue?: any;
}

// Enums and Supporting Types
export type TemplateCategory = 
  | 'data_processing'
  | 'security_assessment'
  | 'compliance_check'
  | 'incident_response'
  | 'training'
  | 'audit';

export type Industry = 
  | 'healthcare'
  | 'finance'
  | 'ecommerce'
  | 'manufacturing'
  | 'education'
  | 'government'
  | 'technology'
  | 'generic';

export type SecurityLevel = 'low' | 'medium' | 'high' | 'critical';

export type SecurityControlType = 
  | 'access_control'
  | 'encryption'
  | 'monitoring'
  | 'backup'
  | 'incident_response'
  | 'training'
  | 'audit';

export type SecurityFramework = 
  | 'iso27001'
  | 'nist'
  | 'bsi_grundschutz'
  | 'gdpr'
  | 'sox'
  | 'pci_dss';

export type MaturityLevel = 'initial' | 'managed' | 'defined' | 'measured' | 'optimized';

export type RiskMethodology = 'standard' | 'iso27005' | 'nist' | 'custom';

export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export type FieldType = 
  | 'text'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'number'
  | 'email'
  | 'url'
  | 'file'
  | 'rich_text';

// Supporting Interfaces
export interface DataInput {
  name: string;
  type: string;
  source: string;
  isPersonalData: boolean;
  dataCategories: string[];
}

export interface DataOutput {
  name: string;
  type: string;
  destination: string;
  isPersonalData: boolean;
  dataCategories: string[];
}

export interface AccessControl {
  role: string;
  permissions: string[];
  conditions?: string[];
}

export interface ConditionalLogic {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater' | 'less';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface FieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface DataCategoryMapping {
  category: string;
  fields: string[];
  sensitivity: SecurityLevel;
}

export interface DataFlowMapping {
  from: string;
  to: string;
  dataTypes: string[];
  protectionMeasures: string[];
}

export interface RetentionRule {
  dataCategory: string;
  retentionPeriod: string;
  deletionMethod: string;
  legalBasis: string;
}

export interface ThirdPartyRule {
  recipient: string;
  dataCategories: string[];
  purpose: string;
  safeguards: string[];
  country?: string;
}

export interface DataTypeRisk {
  type: string;
  sensitivity: SecurityLevel;
  volume: 'low' | 'medium' | 'high';
  riskScore: number;
}

export interface ProcessingRisk {
  activity: string;
  riskLevel: RiskLevel;
  mitigations: string[];
  riskScore: number;
}

export interface TechnicalRisk {
  technology: string;
  vulnerabilities: string[];
  controls: string[];
  riskScore: number;
}

export interface OrganizationalRisk {
  area: string;
  weaknesses: string[];
  improvements: string[];
  riskScore: number;
}

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

export interface ComplianceRequirement {
  id: string;
  framework: string;
  requirement: string;
  description: string;
  article?: string;
  isRequired: boolean;
  implementationNotes: string;
}

export interface TemplateReview {
  id: number;
  userId: number;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

// API Request/Response Types
export interface CreateTemplateRequest {
  name: string;
  description: string;
  category: TemplateCategory;
  industry: Industry;
  isPublic: boolean;
  processSteps: Omit<ProcessStep, 'id'>[];
  dataMapping: DataMapping;
  securityControls: Omit<SecurityControl, 'id'>[];
  complianceRequirements: Omit<ComplianceRequirement, 'id'>[];
  riskAssessment: Omit<RiskAssessment, 'id'>;
  tags: string[];
}

export interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> {
  version?: string;
}

export interface TemplateFilter {
  search?: string;
  category?: TemplateCategory;
  industry?: Industry;
  isPublic?: boolean;
  isVerified?: boolean;
  tags?: string[];
  minRating?: number;
}

export interface TemplateState {
  templates: ProcessTemplate[];
  currentTemplate: ProcessTemplate | null;
  isLoading: boolean;
  error: string | null;
  filters: TemplateFilter;
  totalCount: number;
  pageSize: number;
  currentPage: number;
}

// Constants
export const TEMPLATE_CATEGORIES: Record<TemplateCategory, string> = {
  data_processing: 'Datenverarbeitung',
  security_assessment: 'Sicherheitsbewertung',
  compliance_check: 'Compliance-Prüfung',
  incident_response: 'Incident Response',
  training: 'Schulungen',
  audit: 'Audits'
};

export const INDUSTRIES: Record<Industry, string> = {
  healthcare: 'Gesundheitswesen',
  finance: 'Finanzsektor',
  ecommerce: 'E-Commerce',
  manufacturing: 'Fertigung',
  education: 'Bildung',
  government: 'Öffentlicher Sektor',
  technology: 'Technologie',
  generic: 'Branchenunabhängig'
};

export const SECURITY_FRAMEWORKS: Record<SecurityFramework, string> = {
  iso27001: 'ISO 27001',
  nist: 'NIST Cybersecurity Framework',
  bsi_grundschutz: 'BSI IT-Grundschutz',
  gdpr: 'DSGVO',
  sox: 'Sarbanes-Oxley',
  pci_dss: 'PCI DSS'
};

export const RISK_LEVELS: Record<RiskLevel, string> = {
  very_low: 'Sehr niedrig',
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
  very_high: 'Sehr hoch'
};