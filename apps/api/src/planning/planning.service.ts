import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Experiment } from '../entities/experiment.entity';
import { Hypothesis } from '../entities/hypothesis.entity';
import { Incident } from '../entities/incident.entity';
import { StateGraph } from '../entities/state-graph.entity';

type ChangeCategory = 'runtime' | 'dependency' | 'config' | 'docker';
type GraphChange = { category?: string; path?: string; before?: unknown; after?: unknown; severity?: string; impact?: string };

@Injectable()
export class PlanningService {
  constructor(@InjectRepository(Incident) private readonly incidents: Repository<Incident>, @InjectRepository(Hypothesis) private readonly hypotheses: Repository<Hypothesis>, @InjectRepository(Experiment) private readonly experiments: Repository<Experiment>, @InjectRepository(StateGraph) private readonly graphs: Repository<StateGraph>) {}

  async generate(projectId: string, incidentId: string) {
    const incident = await this.requireIncident(projectId, incidentId);
    const existing = await this.hypotheses.find({ where: { incidentId }, order: { rank: 'ASC', createdAt: 'ASC' } });
    if (existing.length) return existing;
    const graphs = await this.graphs.find({ where: { projectId }, order: { createdAt: 'DESC' }, take: 8 });
    const candidates = this.collectCandidates(graphs);
    const created = candidates.slice(0, 8).map((candidate) => this.hypotheses.create({ incidentId, description: `The ${candidate.path} ${this.changeVerb(candidate)} caused ${incident.title.toLowerCase()}.`, score: this.score(incident.failureType || '', candidate), rank: 0, estimatedCost: this.cost(candidate.category), suspectedChanges: [candidate.category], evidence: { change: candidate, scoring: this.scoreBreakdown(incident.failureType || '', candidate), source: 'semantic-diff' } }));
    if (!created.length) created.push(this.hypotheses.create({ incidentId, description: 'The failure is caused by an unclassified environment change; run the configured test in a clean baseline sandbox.', score: 35, rank: 1, estimatedCost: 2, suspectedChanges: ['runtime'], evidence: { source: 'fallback', reason: 'No semantic changes were available' } }));
    created.sort((a, b) => Number(b.score) - Number(a.score) || Number(a.estimatedCost) - Number(b.estimatedCost));
    created.forEach((hypothesis, index) => hypothesis.rank = index + 1);
    return this.hypotheses.save(created);
  }

  async list(projectId: string, incidentId: string) { await this.requireIncident(projectId, incidentId); return this.hypotheses.find({ where: { incidentId }, order: { rank: 'ASC', createdAt: 'ASC' } }); }

  async plan(projectId: string, incidentId: string, budget: number, maxExperiments = 5) {
    const incident = await this.requireIncident(projectId, incidentId);
    if (!Number.isFinite(budget) || budget <= 0) throw new BadRequestException('Budget must be greater than zero');
    const hypotheses = await this.hypotheses.find({ where: { incidentId, status: 'pending' }, order: { rank: 'ASC' } });
    const chosen: Hypothesis[] = []; let remaining = budget;
    for (const hypothesis of hypotheses) { const cost = Number(hypothesis.estimatedCost); if (chosen.length < maxExperiments && cost <= remaining) { chosen.push(hypothesis); remaining -= cost; } }
    const queued = await this.experiments.save(chosen.map((hypothesis) => this.experiments.create({ hypothesisId: hypothesis.id, intervention: { type: 'revert', changes: hypothesis.suspectedChanges.map((category) => ({ category, target: (hypothesis.evidence as any)?.change?.path || 'candidate-state', fromValue: 'current', toValue: 'baseline' })), planning: { incidentId, priority: hypothesis.rank, expectedInformationGain: Number(hypothesis.score) } }, estimatedCost: Number(hypothesis.estimatedCost), status: 'pending' })));
    await this.hypotheses.save(chosen.map((hypothesis) => ({ ...hypothesis, status: 'testing' as const })));
    incident.metadata = { ...(incident.metadata || {}), experimentBudget: budget, remainingExperimentBudget: remaining, plannedAt: new Date().toISOString() }; await this.incidents.save(incident);
    return { experiments: queued, selectedHypotheses: chosen, budget, remainingBudget: remaining, estimatedTotalCost: budget - remaining };
  }

  async updateStatus(projectId: string, incidentId: string, hypothesisId: string, status: Hypothesis['status']) { await this.requireIncident(projectId, incidentId); if (!['pending', 'testing', 'confirmed', 'rejected'].includes(status)) throw new BadRequestException('Invalid hypothesis status'); const hypothesis = await this.hypotheses.findOne({ where: { id: hypothesisId, incidentId } }); if (!hypothesis) throw new NotFoundException('Hypothesis not found'); hypothesis.status = status; return this.hypotheses.save(hypothesis); }
  private async requireIncident(projectId: string, incidentId: string) { const incident = await this.incidents.findOne({ where: { id: incidentId, projectId } }); if (!incident) throw new NotFoundException('Incident not found'); return incident; }
  private collectCandidates(graphs: StateGraph[]) { const seen = new Set<string>(); const candidates: Array<GraphChange & { category: ChangeCategory; recency: number }> = []; graphs.forEach((graph, index) => ((graph.diffResult as any)?.changes || []).forEach((change: GraphChange) => { const category = this.category(change); const key = `${category}:${change.path}`; if (seen.has(key)) return; seen.add(key); candidates.push({ ...change, category, recency: Math.max(0, 1 - index / Math.max(graphs.length, 1)) }); })); return candidates; }
  private category(change: GraphChange): ChangeCategory { if (change.category?.includes('runtime') || change.category === 'os') return 'runtime'; if (change.category?.includes('package') || change.path?.includes('packages')) return 'dependency'; if (change.category?.includes('docker') || change.category?.includes('container') || change.category === 'services') return 'docker'; return 'config'; }
  private score(failureType: string, candidate: GraphChange & { category: ChangeCategory; recency: number }) { const parts = this.scoreBreakdown(failureType, candidate); return Math.round(Math.min(100, Math.max(1, (parts.errorMatch * .35 + parts.temporalProximity * .25 + parts.relevance * .25 + parts.severity * .15) * 100))); }
  private scoreBreakdown(failureType: string, candidate: GraphChange & { category: ChangeCategory; recency: number }) { const matches = { dependency: ['dependency', 'module'], runtime: ['syntax', 'runtime'], config: ['connection', 'timeout'], docker: ['connection', 'timeout'] }; const errorMatch = (matches[candidate.category] || []).some((term) => failureType.includes(term)) ? 1 : .35; return { errorMatch, temporalProximity: candidate.recency, relevance: candidate.impact === 'breaking' ? 1 : .55, severity: candidate.severity === 'critical' ? 1 : candidate.severity === 'major' ? .75 : .4 }; }
  private cost(category: ChangeCategory) { return { config: 1, dependency: 2, runtime: 2.5, docker: 3 }[category]; }
  private changeVerb(change: GraphChange) { return change.before == null ? 'was introduced' : change.after == null ? 'was removed' : 'changed'; }
}
