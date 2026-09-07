export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  role: 'admin' | 'member' | 'viewer';
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  repositoryUrl: string;
  defaultTestCommand?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Incident {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'open' | 'investigating' | 'resolved';
  failureType?: string;
  metadata?: { command?: string; exitCode?: number; timedOut?: boolean };
  createdAt: string;
  updatedAt: string;
}

export interface Hypothesis {
  id: string;
  incidentId: string;
  description: string;
  score: number;
  rank: number;
  estimatedCost: number;
  status: 'pending' | 'testing' | 'confirmed' | 'rejected';
  suspectedChanges: string[];
  evidence?: { change?: { path?: string; severity?: string; impact?: string }; scoring?: Record<string, number>; source?: string };
  createdAt: string;
}

export interface EvidenceRecord {
  id: string;
  sourceType: 'test_run' | 'experiment' | 'hypothesis';
  sourceId: string;
  type: 'log' | 'metric' | 'state' | 'assertion';
  claim: string;
  confidence: number;
  provenance: Record<string, unknown>;
  createdAt: string;
}

export interface TrialSummary {
  sampleCount: number;
  successfulRuns: number;
  failedRuns: number;
  successRate: number | null;
  confidenceInterval: { lower: number; upper: number } | null;
  isFlaky: boolean;
  recommendedRetries: number;
}

export interface ProofReport {
  id: string;
  rootCause: string;
  confidence: number;
  supportingExperimentIds: string[];
  supportingEvidenceIds: string[];
  citations: Array<{ evidenceId: string; sourceType: string; sourceId: string; claim: string }>;
  verifiedRepair: string | null;
  limitations: string[];
  trialSummary: TrialSummary;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface GitHubRepoValidation {
  valid: boolean;
  repository?: {
    name: string;
    full_name: string;
    description: string;
    default_branch: string;
    private: boolean;
    language: string;
    updated_at: string;
  };
  error?: string;
}
