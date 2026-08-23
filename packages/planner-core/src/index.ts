// Core planning algorithms for Environment Bisect

import type { Hypothesis, Experiment, StateChange, ExperimentResult } from '@software-time-machine/shared-types';

export interface HypothesisScoreParams {
  errorMatch: number;
  temporalProximity: number;
  dependencyRelevance: number;
  historicalSignal: number;
  interactionSignal: number;
  experimentCost: number;
}

export interface ExperimentPlan {
  experiments: Experiment[];
  estimatedTotalCost: number;
  expectedInformationGain: number;
}

// Weighted hypothesis scoring (deterministic baseline)
export function scoreHypothesis(params: HypothesisScoreParams): number {
  const weights = {
    errorMatch: 0.3,
    temporalProximity: 0.2,
    dependencyRelevance: 0.2,
    historicalSignal: 0.15,
    interactionSignal: 0.1,
    experimentCost: -0.05 // negative weight to penalize expensive experiments
  };

  return (
    weights.errorMatch * params.errorMatch +
    weights.temporalProximity * params.temporalProximity +
    weights.dependencyRelevance * params.dependencyRelevance +
    weights.historicalSignal * params.historicalSignal +
    weights.interactionSignal * params.interactionSignal +
    weights.experimentCost * params.experimentCost
  );
}

// Experiment selection based on expected information gain vs cost
export function selectNextExperiment(
  hypotheses: Hypothesis[],
  budget: number,
  maxDepth: number = 1
): Experiment | null {
  if (hypotheses.length === 0 || budget <= 0) {
    return null;
  }

  // Filter out already tested hypotheses
  const untested = hypotheses.filter(h => h.status === 'pending');
  if (untested.length === 0) {
    return null;
  }

  // Score each potential experiment
  const scored = untested.map(hypothesis => {
    const estimatedCost = estimateExperimentCost(hypothesis, maxDepth);
    const expectedGain = estimateInformationGain(hypothesis);
    const priority = expectedGain / estimatedCost;

    return {
      hypothesis,
      estimatedCost,
      expectedGain,
      priority
    };
  });

  // Sort by priority (highest first)
  scored.sort((a, b) => b.priority - a.priority);

  // Select the highest priority experiment within budget
  const selected = scored.find(s => s.estimatedCost <= budget);
  if (!selected) {
    return null;
  }

  return createExperiment(selected.hypothesis, selected.estimatedCost);
}

function estimateExperimentCost(hypothesis: Hypothesis, depth: number): number {
  // Base cost estimation (will be refined based on actual execution)
  const baseCost = 1.0;
  const depthMultiplier = Math.pow(1.5, depth - 1);
  const changeComplexity = hypothesis.suspectedChanges.length * 0.5;
  
  return baseCost * depthMultiplier + changeComplexity;
}

function estimateInformationGain(hypothesis: Hypothesis): number {
  // Higher score hypotheses should provide more information
  return hypothesis.score * 10;
}

function createExperiment(hypothesis: Hypothesis, estimatedCost: number): Experiment {
  return {
    id: generateId(),
    hypothesisId: hypothesis.id,
    intervention: {
      type: 'revert',
      changes: hypothesis.suspectedChanges.map(change => ({
        category: change as any,
        target: 'unknown',
        fromValue: 'current',
        toValue: 'previous'
      }))
    },
    status: 'pending',
    estimatedCost,
    createdAt: new Date()
  };
}

// Interaction detection: escalate to pairwise tests if single changes don't explain failure
export function shouldEscalateToInteractions(results: ExperimentResult[]): boolean {
  if (results.length < 3) return false;
  
  const singleChangeResults = results.filter(r => 
    r.evidence.some(e => e.type === 'state' && e.value.includes('single'))
  );

  // If most single-change tests pass, consider interactions
  const passRate = singleChangeResults.filter(r => r.success).length / singleChangeResults.length;
  return passRate > 0.7 && singleChangeResults.length >= 3;
}

// Budget-aware experiment planning
export function planExperiments(
  hypotheses: Hypothesis[],
  totalBudget: number,
  maxExperiments: number = 10
): ExperimentPlan {
  const experiments: Experiment[] = [];
  let remainingBudget = totalBudget;
  let currentDepth = 1;

  while (experiments.length < maxExperiments && remainingBudget > 0) {
    const nextExperiment = selectNextExperiment(
      hypotheses.filter(h => 
        !experiments.some(e => e.hypothesisId === h.id)
      ),
      remainingBudget,
      currentDepth
    );

    if (!nextExperiment) {
      // Try escalating to interaction depth
      if (currentDepth < 3) {
        currentDepth++;
        continue;
      }
      break;
    }

    experiments.push(nextExperiment);
    remainingBudget -= nextExperiment.estimatedCost;
  }

  const totalEstimatedCost = experiments.reduce((sum, e) => sum + e.estimatedCost, 0);
  const totalExpectedGain = experiments.reduce((sum, e) => 
    sum + estimateInformationGain(hypotheses.find(h => h.id === e.hypothesisId)!), 0
  );

  return {
    experiments,
    estimatedTotalCost: totalEstimatedCost,
    expectedInformationGain: totalExpectedGain
  };
}

// Flaky test handling
export function handleFlakyTest(results: ExperimentResult[]): {
  isFlaky: boolean;
  confidence: number;
  recommendedRetries: number;
} {
  if (results.length < 2) {
    return { isFlaky: false, confidence: 0, recommendedRetries: 0 };
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;
  
  // Calculate confidence interval using Wilson score
  const p = successCount / results.length;
  const z = 1.96; // 95% confidence
  const denominator = 1 + (z * z) / results.length;
  const center = (p + (z * z) / (2 * results.length)) / denominator;
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * results.length)) / results.length) / denominator;
  
  const confidence = margin;
  const isFlaky = margin > 0.2; // More than 20% margin suggests flakiness
  
  // Recommend retries based on confidence
  let recommendedRetries = 0;
  if (isFlaky) {
    recommendedRetries = Math.min(5, Math.ceil(results.length * 1.5));
  }

  return { isFlaky, confidence, recommendedRetries };
}

// Utility function
function generateId(): string {
  return `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Export types
export type { HypothesisScoreParams, ExperimentPlan };
