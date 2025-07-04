// Process Intelligence Types
export interface ProcessNode {
  id: string;
  type: ProcessNodeType;
  label: string;
  description?: string;
  position: Position;
  data: ProcessNodeData;
  connections: ProcessConnection[];
  metadata: ProcessNodeMetadata;
}

export interface ProcessConnection {
  id: string;
  sourceId: string;
  targetId: string;
  type: ConnectionType;
  label?: string;
  conditions?: ProcessCondition[];
  dataFlow?: DataFlowInfo;
}

export interface ProcessNodeData {
  // Common fields
  executionTime?: number; // in seconds
  priority: ProcessPriority;
  assignee?: string;
  
  // Node-specific data
  taskConfig?: TaskConfig;
  decisionConfig?: DecisionConfig;
  dataConfig?: DataConfig;
  integrationConfig?: IntegrationConfig;
  complianceConfig?: ComplianceConfig;
}

export interface ProcessNodeMetadata {
  createdAt: string;
  updatedAt: string;
  version: number;
  tags: string[];
  riskLevel: RiskLevel;
  complianceFlags: ComplianceFlag[];
}

export interface Position {
  x: number;
  y: number;
}

export interface ProcessCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
  logicalOperator?: LogicalOperator;
}

export interface DataFlowInfo {
  dataTypes: string[];
  volume: DataVolume;
  sensitivity: DataSensitivity;
  retention: RetentionInfo;
}

export interface TaskConfig {
  taskType: TaskType;
  automationLevel: AutomationLevel;
  requiredSkills: string[];
  estimatedDuration: number;
  dependencies: string[];
}

export interface DecisionConfig {
  decisionType: DecisionType;
  criteria: DecisionCriteria[];
  defaultPath: string;
  escalationRules: EscalationRule[];
}

export interface DataConfig {
  dataOperation: DataOperation;
  dataSource: string;
  dataTarget: string;
  transformations: DataTransformation[];
  validation: DataValidation[];
}

export interface IntegrationConfig {
  systemType: SystemType;
  endpoint: string;
  method: HttpMethod;
  authentication: AuthConfig;
  retryPolicy: RetryPolicy;
}

export interface ComplianceConfig {
  frameworks: ComplianceFramework[];
  requirements: ComplianceRequirement[];
  documentationRequired: boolean;
  approvalRequired: boolean;
}

export interface ProcessWorkflow {
  id: string;
  name: string;
  description: string;
  version: string;
  status: WorkflowStatus;
  organizationId: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  
  nodes: ProcessNode[];
  connections: ProcessConnection[];
  
  // Metadata
  category: WorkflowCategory;
  industry: Industry;
  tags: string[];
  
  // Configuration
  settings: WorkflowSettings;
  variables: WorkflowVariable[];
  
  // Analytics
  analytics: WorkflowAnalytics;
  
  // Deployment
  deployment: WorkflowDeployment;
}

export interface WorkflowSettings {
  timeoutMinutes: number;
  maxRetries: number;
  errorHandling: ErrorHandlingStrategy;
  logging: LoggingConfig;
  notifications: NotificationConfig;
}

export interface WorkflowVariable {
  name: string;
  type: VariableType;
  defaultValue?: any;
  required: boolean;
  description?: string;
}

export interface WorkflowAnalytics {
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  bottlenecks: ProcessBottleneck[];
  riskAssessment: ProcessRiskAssessment;
}

export interface WorkflowDeployment {
  environment: DeploymentEnvironment;
  deployedAt?: string;
  version: string;
  status: DeploymentStatus;
  healthChecks: HealthCheck[];
}

// Supporting Types
export type ProcessNodeType = 
  | 'start'
  | 'end'
  | 'task'
  | 'decision'
  | 'parallel'
  | 'merge'
  | 'data'
  | 'integration'
  | 'approval'
  | 'notification'
  | 'delay'
  | 'loop'
  | 'subprocess'
  | 'compliance_check';

export type ConnectionType = 
  | 'sequence'
  | 'conditional'
  | 'data_flow'
  | 'message_flow'
  | 'association';

export type ProcessPriority = 'low' | 'medium' | 'high' | 'critical';

export type ConditionOperator = 
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'contains'
  | 'not_contains'
  | 'is_empty'
  | 'is_not_empty'
  | 'matches_regex';

export type LogicalOperator = 'AND' | 'OR';

export type DataVolume = 'low' | 'medium' | 'high' | 'very_high';

export type DataSensitivity = 'public' | 'internal' | 'confidential' | 'restricted';

export type TaskType = 
  | 'manual'
  | 'system'
  | 'user_input'
  | 'review'
  | 'approval'
  | 'notification'
  | 'calculation'
  | 'validation';

export type AutomationLevel = 'manual' | 'semi_automated' | 'fully_automated';

export type DecisionType = 
  | 'human'
  | 'rule_based'
  | 'ml_based'
  | 'hybrid';

export type DataOperation = 
  | 'read'
  | 'write'
  | 'update'
  | 'delete'
  | 'transform'
  | 'validate'
  | 'aggregate'
  | 'archive';

export type SystemType = 
  | 'database'
  | 'api'
  | 'file_system'
  | 'email'
  | 'cloud_service'
  | 'legacy_system'
  | 'third_party';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type WorkflowStatus = 
  | 'draft'
  | 'testing'
  | 'active'
  | 'paused'
  | 'archived'
  | 'deprecated';

export type WorkflowCategory = 
  | 'data_processing'
  | 'approval_workflow'
  | 'compliance_check'
  | 'incident_response'
  | 'audit_process'
  | 'reporting'
  | 'integration'
  | 'notification';

export type Industry = 
  | 'healthcare'
  | 'finance'
  | 'manufacturing'
  | 'retail'
  | 'education'
  | 'government'
  | 'technology'
  | 'generic';

export type ErrorHandlingStrategy = 
  | 'stop'
  | 'continue'
  | 'retry'
  | 'escalate'
  | 'compensate';

export type VariableType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'object'
  | 'array';

export type DeploymentEnvironment = 
  | 'development'
  | 'staging'
  | 'production';

export type DeploymentStatus = 
  | 'deployed'
  | 'failed'
  | 'pending'
  | 'rolled_back';

export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

// Supporting Interfaces
export interface RetentionInfo {
  period: string;
  policy: string;
  autoDelete: boolean;
}

export interface DecisionCriteria {
  name: string;
  weight: number;
  condition: ProcessCondition;
}

export interface EscalationRule {
  trigger: EscalationTrigger;
  timeoutMinutes: number;
  escalateTo: string;
  action: EscalationAction;
}

export interface DataTransformation {
  type: TransformationType;
  sourceField: string;
  targetField: string;
  formula?: string;
  mapping?: Record<string, any>;
}

export interface DataValidation {
  field: string;
  rules: ValidationRule[];
  errorMessage: string;
}

export interface AuthConfig {
  type: AuthType;
  credentials: Record<string, any>;
  tokenRefresh?: boolean;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: BackoffStrategy;
  retryableErrors: string[];
}

export interface ComplianceFramework {
  name: string;
  version: string;
  applicableRules: string[];
}

export interface ComplianceRequirement {
  id: string;
  framework: string;
  requirement: string;
  mandatory: boolean;
  evidence: string[];
}

export interface ComplianceFlag {
  type: ComplianceFlagType;
  severity: ComplianceSeverity;
  description: string;
  remediation: string;
}

export interface LoggingConfig {
  level: LogLevel;
  includeData: boolean;
  retention: number;
  destinations: LogDestination[];
}

export interface NotificationConfig {
  channels: NotificationChannel[];
  events: NotificationEvent[];
  templates: NotificationTemplate[];
}

export interface ProcessBottleneck {
  nodeId: string;
  averageWaitTime: number;
  queueLength: number;
  suggestions: string[];
}

export interface ProcessRiskAssessment {
  overallRisk: RiskLevel;
  riskFactors: RiskFactor[];
  mitigations: RiskMitigation[];
}

export interface HealthCheck {
  name: string;
  status: HealthStatus;
  lastChecked: string;
  details: string;
}

// Additional enums
export type EscalationTrigger = 'timeout' | 'error' | 'manual';
export type EscalationAction = 'notify' | 'reassign' | 'escalate' | 'abort';
export type TransformationType = 'mapping' | 'formula' | 'lookup' | 'aggregation';
export type ValidationRule = 'required' | 'format' | 'range' | 'custom';
export type AuthType = 'none' | 'basic' | 'bearer' | 'oauth' | 'api_key';
export type BackoffStrategy = 'fixed' | 'exponential' | 'linear';
export type ComplianceFlagType = 'warning' | 'violation' | 'recommendation';
export type ComplianceSeverity = 'low' | 'medium' | 'high' | 'critical';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogDestination = 'console' | 'file' | 'database' | 'external';
export type NotificationChannel = 'email' | 'sms' | 'slack' | 'webhook' | 'in_app';
export type NotificationEvent = 'start' | 'complete' | 'error' | 'delay' | 'approval_needed';
export type NotificationTemplate = 'default' | 'error' | 'success' | 'approval';
export type RiskFactor = 'data_sensitivity' | 'system_complexity' | 'integration_risk' | 'compliance_risk';
export type RiskMitigation = 'monitoring' | 'backup' | 'validation' | 'approval' | 'encryption';
export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

// API Types
export interface CreateProcessWorkflowRequest {
  name: string;
  description: string;
  category: WorkflowCategory;
  industry: Industry;
  tags: string[];
  settings: WorkflowSettings;
}

export interface UpdateProcessWorkflowRequest extends Partial<CreateProcessWorkflowRequest> {
  version?: string;
  status?: WorkflowStatus;
  nodes?: ProcessNode[];
  connections?: ProcessConnection[];
}

export interface ProcessWorkflowFilter {
  search?: string;
  category?: WorkflowCategory;
  industry?: Industry;
  status?: WorkflowStatus;
  tags?: string[];
  createdBy?: number;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ProcessExecutionRequest {
  workflowId: string;
  inputs: Record<string, any>;
  priority?: ProcessPriority;
  callback?: string;
}

export interface ProcessExecutionResponse {
  executionId: string;
  status: ExecutionStatus;
  outputs: Record<string, any>;
  logs: ExecutionLog[];
  metrics: ExecutionMetrics;
}

export type ExecutionStatus = 
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ExecutionLog {
  timestamp: string;
  level: LogLevel;
  nodeId: string;
  message: string;
  data?: any;
}

export interface ExecutionMetrics {
  startTime: string;
  endTime?: string;
  duration?: number;
  nodesExecuted: number;
  dataProcessed: number;
  errors: number;
}

// Visual Editor Types
export interface EditorState {
  selectedNodeId?: string;
  selectedConnectionId?: string;
  mode: EditorMode;
  zoom: number;
  pan: Position;
  clipboard: ClipboardItem[];
  history: HistoryItem[];
  historyIndex: number;
}

export type EditorMode = 'select' | 'connect' | 'pan' | 'zoom';

export interface ClipboardItem {
  type: 'node' | 'connection' | 'group';
  data: any;
}

export interface HistoryItem {
  action: HistoryAction;
  timestamp: string;
  data: any;
  description: string;
}

export type HistoryAction = 
  | 'add_node'
  | 'delete_node'
  | 'move_node'
  | 'update_node'
  | 'add_connection'
  | 'delete_connection'
  | 'update_connection'
  | 'group_nodes'
  | 'ungroup_nodes';

// Constants
export const PROCESS_NODE_TYPES: Record<ProcessNodeType, string> = {
  start: 'Start',
  end: 'End',
  task: 'Task',
  decision: 'Decision',
  parallel: 'Parallel Gateway',
  merge: 'Merge Gateway',
  data: 'Data Object',
  integration: 'System Integration',
  approval: 'Approval',
  notification: 'Notification',
  delay: 'Delay',
  loop: 'Loop',
  subprocess: 'Subprocess',
  compliance_check: 'Compliance Check'
};

export const WORKFLOW_CATEGORIES: Record<WorkflowCategory, string> = {
  data_processing: 'Datenverarbeitung',
  approval_workflow: 'Genehmigungsworkflow',
  compliance_check: 'Compliance-Prüfung',
  incident_response: 'Incident Response',
  audit_process: 'Audit-Prozess',
  reporting: 'Berichterstattung',
  integration: 'Integration',
  notification: 'Benachrichtigungen'
};

export const RISK_LEVELS: Record<RiskLevel, string> = {
  very_low: 'Sehr niedrig',
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
  very_high: 'Sehr hoch'
};