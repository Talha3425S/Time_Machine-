import { scoreHypothesis, selectNextExperiment, planExperiments, handleFlakyTest } from './index';

// Mock Hypothesis type for testing
interface Hypothesis {
  id: string;
  incidentId: string;
  description: string;
  score: number;
  status: 'pending' | 'testing' | 'confirmed' | 'rejected';
  suspectedChanges: string[];
  createdAt: Date;
}

describe('Planner Core', () => {
  describe('scoreHypothesis', () => {
    it('should calculate a weighted score', () => {
      const params = {
        errorMatch: 0.8,
        temporalProximity: 0.7,
        dependencyRelevance: 0.6,
        historicalSignal: 0.5,
        interactionSignal: 0.4,
        experimentCost: 1.0
      };

      const score = scoreHypothesis(params);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });

    it('should penalize expensive experiments', () => {
      const lowCost = scoreHypothesis({
        errorMatch: 0.5,
        temporalProximity: 0.5,
        dependencyRelevance: 0.5,
        historicalSignal: 0.5,
        interactionSignal: 0.5,
        experimentCost: 0.5
      });

      const highCost = scoreHypothesis({
        errorMatch: 0.5,
        temporalProximity: 0.5,
        dependencyRelevance: 0.5,
        historicalSignal: 0.5,
        interactionSignal: 0.5,
        experimentCost: 2.0
      });

      expect(lowCost).toBeGreaterThan(highCost);
    });
  });

  describe('selectNextExperiment', () => {
    it('should return null when no hypotheses available', () => {
      const experiment = selectNextExperiment([], 100);
      expect(experiment).toBeNull();
    });

    it('should return null when budget is exhausted', () => {
      const hypotheses: Hypothesis[] = [
        {
          id: '1',
          incidentId: 'incident-1',
          description: 'Test hypothesis',
          score: 0.8,
          status: 'pending',
          suspectedChanges: ['dependency'],
          createdAt: new Date()
        }
      ];

      const experiment = selectNextExperiment(hypotheses, 0);
      expect(experiment).toBeNull();
    });

    it('should select highest priority hypothesis within budget', () => {
      const hypotheses: Hypothesis[] = [
        {
          id: '1',
          incidentId: 'incident-1',
          description: 'Low priority',
          score: 0.3,
          status: 'pending',
          suspectedChanges: ['config'],
          createdAt: new Date()
        },
        {
          id: '2',
          incidentId: 'incident-1',
          description: 'High priority',
          score: 0.9,
          status: 'pending',
          suspectedChanges: ['dependency'],
          createdAt: new Date()
        }
      ];

      const experiment = selectNextExperiment(hypotheses, 10);
      expect(experiment).not.toBeNull();
      expect(experiment?.hypothesisId).toBe('2');
    });
  });

  describe('planExperiments', () => {
    it('should create experiment plan within budget', () => {
      const hypotheses: Hypothesis[] = [
        {
          id: '1',
          incidentId: 'incident-1',
          description: 'Hypothesis 1',
          score: 0.7,
          status: 'pending',
          suspectedChanges: ['runtime'],
          createdAt: new Date()
        },
        {
          id: '2',
          incidentId: 'incident-1',
          description: 'Hypothesis 2',
          score: 0.5,
          status: 'pending',
          suspectedChanges: ['config'],
          createdAt: new Date()
        }
      ];

      const plan = planExperiments(hypotheses, 20, 5);
      
      expect(plan.experiments.length).toBeGreaterThan(0);
      expect(plan.estimatedTotalCost).toBeLessThanOrEqual(20);
      expect(plan.experiments.length).toBeLessThanOrEqual(5);
    });
  });

  describe('handleFlakyTest', () => {
    it('should detect non-flaky consistent results', () => {
      const results = [
        { success: true, output: '', executionTime: 100, evidence: [] },
        { success: true, output: '', executionTime: 100, evidence: [] },
        { success: true, output: '', executionTime: 100, evidence: [] }
      ];

      const analysis = handleFlakyTest(results);
      expect(analysis.isFlaky).toBe(false);
      expect(analysis.confidence).toBeLessThan(0.2);
    });

    it('should detect flaky inconsistent results', () => {
      const results = [
        { success: true, output: '', executionTime: 100, evidence: [] },
        { success: false, output: '', executionTime: 100, evidence: [] },
        { success: true, output: '', executionTime: 100, evidence: [] },
        { success: false, output: '', executionTime: 100, evidence: [] }
      ];

      const analysis = handleFlakyTest(results);
      expect(analysis.isFlaky).toBe(true);
      expect(analysis.recommendedRetries).toBeGreaterThan(0);
    });

    it('should return no analysis for insufficient data', () => {
      const results = [
        { success: true, output: '', executionTime: 100, evidence: [] }
      ];

      const analysis = handleFlakyTest(results);
      expect(analysis.isFlaky).toBe(false);
      expect(analysis.confidence).toBe(0);
      expect(analysis.recommendedRetries).toBe(0);
    });
  });
});
