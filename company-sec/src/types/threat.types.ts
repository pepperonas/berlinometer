export interface ThreatModel {
  id: string;
  name: string;
  description: string;
  system: SystemContext;
  threats: Threat[];
  assets: Asset[];
  attackSurface: AttackSurface;
  createdAt: Date;
  updatedAt: Date;
  owner: string;
}

export interface SystemContext {
  name: string;
  description: string;
  boundaries: TrustBoundary[];
  dataFlows: DataFlow[];
  components: SystemComponent[];
  users: Actor[];
}

export interface TrustBoundary {
  id: string;
  name: string;
  description: string;
  securityLevel: SecurityLevel;
  components: string[];
}

export interface DataFlow {
  id: string;
  source: string;
  destination: string;
  protocol: string;
  dataClassification: DataClassification;
  encryption: EncryptionLevel;
  authentication: AuthenticationMethod;
}

export interface SystemComponent {
  id: string;
  name: string;
  type: ComponentType;
  trustLevel: SecurityLevel;
  technologies: string[];
  interfaces: string[];
  dataStores: boolean;
}

export interface Actor {
  id: string;
  name: string;
  type: ActorType;
  trustLevel: SecurityLevel;
  privileges: string[];
  accessMethods: string[];
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  classification: DataClassification;
  value: AssetValue;
  location: string;
  owner: string;
  dependencies: string[];
}

export interface Threat {
  id: string;
  name: string;
  description: string;
  category: ThreatCategory;
  strideClassification: StrideCategory[];
  killChainPhase: KillChainPhase;
  attackVector: AttackVector;
  complexity: AttackComplexity;
  likelihood: number; // 1-5
  impact: ThreatImpact;
  riskScore: number;
  cveReferences: string[];
  mitreTechniques: string[];
  affectedAssets: string[];
  affectedComponents: string[];
  mitigations: ThreatMitigation[];
  detectionMethods: DetectionMethod[];
  status: ThreatStatus;
  assignedTo: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ThreatMitigation {
  id: string;
  name: string;
  description: string;
  type: MitigationType;
  effectiveness: EffectivenessLevel;
  cost: CostLevel;
  implementation: ImplementationStatus;
  controls: SecurityControl[];
}

export interface SecurityControl {
  id: string;
  name: string;
  type: ControlType;
  framework: SecurityFramework;
  description: string;
  implementation: ImplementationLevel;
  testing: TestingLevel;
  effectiveness: EffectivenessLevel;
}

export interface DetectionMethod {
  id: string;
  name: string;
  type: DetectionType;
  coverage: CoverageLevel;
  alerting: AlertingLevel;
  tools: string[];
  signatures: string[];
}

export interface AttackSurface {
  external: ExternalInterface[];
  internal: InternalInterface[];
  physical: PhysicalInterface[];
  social: SocialInterface[];
  supply_chain: SupplyChainInterface[];
}

export interface ExternalInterface {
  id: string;
  name: string;
  protocol: string;
  ports: number[];
  exposure: ExposureLevel;
  authentication: AuthenticationMethod;
  encryption: EncryptionLevel;
}

export interface InternalInterface {
  id: string;
  name: string;
  network: string;
  services: string[];
  access_controls: string[];
  monitoring: MonitoringLevel;
}

export interface PhysicalInterface {
  id: string;
  name: string;
  location: string;
  access_controls: string[];
  monitoring: MonitoringLevel;
}

export interface SocialInterface {
  id: string;
  name: string;
  target_groups: string[];
  channels: string[];
  awareness_level: AwarenessLevel;
}

export interface SupplyChainInterface {
  id: string;
  vendor: string;
  component: string;
  trust_level: SecurityLevel;
  verification: VerificationLevel;
}

export interface AttackTree {
  id: string;
  goal: string;
  root: AttackNode;
  paths: AttackPath[];
}

export interface AttackNode {
  id: string;
  name: string;
  type: 'AND' | 'OR';
  children: AttackNode[];
  leaf?: AttackLeaf;
}

export interface AttackLeaf {
  technique: string;
  cost: CostLevel;
  skill_required: SkillLevel;
  time_required: TimeRequirement;
  detection_difficulty: DetectionDifficulty;
  success_probability: number;
}

export interface AttackPath {
  id: string;
  nodes: string[];
  total_cost: CostLevel;
  total_time: TimeRequirement;
  success_probability: number;
  detection_probability: number;
}

export interface ThreatIntelligence {
  id: string;
  threat_id: string;
  source: IntelligenceSource;
  confidence: ConfidenceLevel;
  severity: SeverityLevel;
  iocs: IOC[];
  ttp: TTP[];
  campaigns: string[];
  actors: ThreatActor[];
  published_date: Date;
  expiry_date?: Date;
}

export interface IOC {
  type: IOCType;
  value: string;
  context: string;
  confidence: ConfidenceLevel;
}

export interface TTP {
  tactic: string;
  technique: string;
  mitre_id: string;
  description: string;
  detection_methods: string[];
}

export interface ThreatActor {
  name: string;
  type: ActorType;
  motivation: string[];
  capabilities: CapabilityLevel;
  targeting: string[];
}

// Enums
export type ThreatCategory = 
  | 'malware'
  | 'phishing' 
  | 'insider_threat'
  | 'supply_chain'
  | 'physical'
  | 'social_engineering'
  | 'data_breach'
  | 'denial_of_service'
  | 'privilege_escalation'
  | 'lateral_movement'
  | 'persistence'
  | 'exfiltration';

export type StrideCategory = 
  | 'spoofing'
  | 'tampering'
  | 'repudiation'
  | 'information_disclosure'
  | 'denial_of_service'
  | 'elevation_of_privilege';

export type KillChainPhase =
  | 'reconnaissance'
  | 'weaponization'
  | 'delivery'
  | 'exploitation'
  | 'installation'
  | 'command_control'
  | 'actions_objectives';

export type AttackVector =
  | 'network'
  | 'adjacent_network'
  | 'local'
  | 'physical'
  | 'social';

export type AttackComplexity = 'low' | 'medium' | 'high';

export type ThreatImpact = {
  confidentiality: ImpactLevel;
  integrity: ImpactLevel;
  availability: ImpactLevel;
  financial: number;
  reputational: ImpactLevel;
  operational: ImpactLevel;
};

export type ImpactLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export type SecurityLevel = 'public' | 'internal' | 'confidential' | 'restricted' | 'top_secret';

export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';

export type EncryptionLevel = 'none' | 'weak' | 'standard' | 'strong';

export type AuthenticationMethod = 'none' | 'basic' | 'token' | 'certificate' | 'mfa';

export type ComponentType = 
  | 'web_application'
  | 'database'
  | 'api'
  | 'service'
  | 'file_system'
  | 'network_device'
  | 'endpoint'
  | 'container'
  | 'cloud_service';

export type ActorType = 'user' | 'admin' | 'service' | 'external' | 'threat_actor';

export type AssetType = 'data' | 'system' | 'service' | 'infrastructure' | 'personnel' | 'intellectual_property';

export type AssetValue = 'low' | 'medium' | 'high' | 'critical';

export type MitigationType = 'preventive' | 'detective' | 'corrective' | 'compensating';

export type EffectivenessLevel = 'low' | 'medium' | 'high' | 'very_high';

export type CostLevel = 'low' | 'medium' | 'high' | 'very_high';

export type ImplementationStatus = 'planned' | 'in_progress' | 'implemented' | 'verified';

export type ControlType = 'technical' | 'administrative' | 'physical';

export type SecurityFramework = 'nist' | 'iso27001' | 'cis' | 'custom';

export type ImplementationLevel = 'none' | 'partial' | 'full';

export type TestingLevel = 'none' | 'basic' | 'comprehensive' | 'continuous';

export type DetectionType = 'signature' | 'anomaly' | 'behavioral' | 'heuristic';

export type CoverageLevel = 'low' | 'medium' | 'high' | 'comprehensive';

export type AlertingLevel = 'none' | 'low' | 'medium' | 'high' | 'real_time';

export type ExposureLevel = 'internal' | 'limited' | 'public' | 'internet_facing';

export type MonitoringLevel = 'none' | 'basic' | 'enhanced' | 'comprehensive';

export type AwarenessLevel = 'low' | 'medium' | 'high';

export type VerificationLevel = 'none' | 'basic' | 'enhanced' | 'comprehensive';

export type SkillLevel = 'low' | 'medium' | 'high' | 'expert';

export type TimeRequirement = 'minutes' | 'hours' | 'days' | 'weeks' | 'months';

export type DetectionDifficulty = 'easy' | 'medium' | 'hard' | 'very_hard';

export type IntelligenceSource = 'commercial' | 'open_source' | 'government' | 'internal' | 'community';

export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'very_high';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type IOCType = 'ip' | 'domain' | 'url' | 'hash' | 'email' | 'file' | 'registry' | 'process';

export type CapabilityLevel = 'low' | 'medium' | 'high' | 'nation_state';

export type ThreatStatus = 'identified' | 'analyzing' | 'mitigating' | 'monitoring' | 'resolved';

export interface ThreatModelingStatistics {
  totalThreats: number;
  byCategory: Record<ThreatCategory, number>;
  byStrideCategory: Record<StrideCategory, number>;
  byKillChainPhase: Record<KillChainPhase, number>;
  averageRiskScore: number;
  highRiskThreats: number;
  mitigatedThreats: number;
  coverageByAsset: Record<string, number>;
}