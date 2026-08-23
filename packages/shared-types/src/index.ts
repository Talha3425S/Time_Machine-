// Core type definitions for Software Time Machine

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  repositoryUrl: string;
  defaultTestCommand: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Incident {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved';
  failureType: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StateManifest {
  id: string;
  projectId: string;
  incidentId?: string;
  gitCommit: string;
  gitBranch: string;
  runtime: RuntimeInfo;
  dependencies: DependencyInfo[];
  config: ConfigInfo;
  docker: DockerInfo;
  timestamp: Date;
}

export interface RuntimeInfo {
  name: string;
  version: string;
  os: string;
  architecture: string;
}

export interface DependencyInfo {
  name: string;
  version: string;
  manager: string;
  lockfileHash?: string;
}

export interface ConfigInfo {
  environmentVariables: Record<string, string>;
  configFiles: ConfigFile[];
}

export interface ConfigFile {
  path: string;
  hash: string;
}

export interface DockerInfo {
  imageDigest?: string;
  composeFile?: string;
  containerId?: string;
}

export interface Hypothesis {
  id: string;
  incidentId: string;
  description: string;
  score: number;
  status: 'pending' | 'testing' | 'confirmed' | 'rejected';
  suspectedChanges: string[];
  createdAt: Date;
}

export interface Experiment {
  id: string;
  hypothesisId: string;
  intervention: ExperimentIntervention;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: ExperimentResult;
  estimatedCost: number;
  actualCost?: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface ExperimentIntervention {
  type: 'revert' | 'modify' | 'combine';
  changes: StateChange[];
}

export interface StateChange {
  category: 'runtime' | 'dependency' | 'config' | 'docker' | 'source';
  target: string;
  fromValue: string;
  toValue: string;
}

export interface ExperimentResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  evidence: Evidence[];
}

export interface Evidence {
  type: 'log' | 'metric' | 'state' | 'assertion';
  value: string;
  confidence: number;
}

export interface ProofReport {
  incidentId: string;
  rootCause: string;
  confidence: number;
  supportingExperiments: string[];
  verifiedRepair?: string;
  limitations: string[];
  generatedAt: Date;
}
