import { z } from 'zod';

// Zod schemas for state validation

export const RuntimeInfoSchema = z.object({
  name: z.string(),
  version: z.string(),
  os: z.string(),
  architecture: z.string(),
});

export const DependencyInfoSchema = z.object({
  name: z.string(),
  version: z.string(),
  manager: z.string(),
  lockfileHash: z.string().optional(),
});

export const ConfigFileSchema = z.object({
  path: z.string(),
  hash: z.string(),
});

export const ConfigInfoSchema = z.object({
  environmentVariables: z.record(z.string()),
  configFiles: z.array(ConfigFileSchema),
});

export const DockerInfoSchema = z.object({
  imageDigest: z.string().optional(),
  composeFile: z.string().optional(),
  containerId: z.string().optional(),
});

export const StateManifestSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  incidentId: z.string().uuid().optional(),
  gitCommit: z.string().length(40),
  gitBranch: z.string(),
  runtime: RuntimeInfoSchema,
  dependencies: z.array(DependencyInfoSchema),
  config: ConfigInfoSchema,
  docker: DockerInfoSchema,
  timestamp: z.coerce.date(),
});

export const StateChangeSchema = z.object({
  category: z.enum(['runtime', 'dependency', 'config', 'docker', 'source']),
  target: z.string(),
  fromValue: z.string(),
  toValue: z.string(),
});

export const ExperimentInterventionSchema = z.object({
  type: z.enum(['revert', 'modify', 'combine']),
  changes: z.array(StateChangeSchema),
});

export const ExperimentResultSchema = z.object({
  success: z.boolean(),
  output: z.string(),
  error: z.string().optional(),
  executionTime: z.number(),
  evidence: z.array(z.object({
    type: z.enum(['log', 'metric', 'state', 'assertion']),
    value: z.string(),
    confidence: z.number().min(0).max(1),
  })),
});

// Type exports
export type RuntimeInfo = z.infer<typeof RuntimeInfoSchema>;
export type DependencyInfo = z.infer<typeof DependencyInfoSchema>;
export type ConfigFile = z.infer<typeof ConfigFileSchema>;
export type ConfigInfo = z.infer<typeof ConfigInfoSchema>;
export type DockerInfo = z.infer<typeof DockerInfoSchema>;
export type StateManifest = z.infer<typeof StateManifestSchema>;
export type StateChange = z.infer<typeof StateChangeSchema>;
export type ExperimentIntervention = z.infer<typeof ExperimentInterventionSchema>;
export type ExperimentResult = z.infer<typeof ExperimentResultSchema>;

// Validation helpers
export function validateStateManifest(data: unknown): StateManifest {
  return StateManifestSchema.parse(data);
}

export function validateExperimentIntervention(data: unknown): ExperimentIntervention {
  return ExperimentInterventionSchema.parse(data);
}

export function validateExperimentResult(data: unknown): ExperimentResult {
  return ExperimentResultSchema.parse(data);
}
