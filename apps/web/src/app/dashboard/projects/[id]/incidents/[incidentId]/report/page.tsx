'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '../../../../../../../components/DashboardLayout';
import api from '../../../../../../../lib/api';
import { EvidenceRecord, ProofReport, TrialSummary } from '../../../../../../../types';

type History = { evidence: EvidenceRecord[]; trials: TrialSummary };

export default function EvidenceReportPage() {
  const params = useParams();
  const [history, setHistory] = useState<History | null>(null);
  const [report, setReport] = useState<ProofReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const base = `/api/projects/${params.id}/incidents/${params.incidentId}`;

  const load = async () => {
    try {
      setError('');
      const [historyResponse, reportsResponse] = await Promise.all([api.get(`${base}/evidence/history`), api.get(`${base}/proof-reports`)]);
      setHistory(historyResponse.data);
      setReport(reportsResponse.data[0] || null);
    } catch {
      setError('Unable to load this incident’s evidence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [params.id, params.incidentId]);

  const collect = async () => {
    setCollecting(true);
    try {
      setError('');
      await api.post(`${base}/evidence/collect`);
      await load();
    } catch {
      setError('Evidence collection failed.');
    } finally {
      setCollecting(false);
    }
  };

  const generate = async () => {
    setGenerating(true);
    try {
      setError('');
      const response = await api.post(`${base}/proof-reports`);
      setReport(response.data);
      await load();
    } catch {
      setError('Proof-report generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const trialSummary = report?.trialSummary || history?.trials;
  return <DashboardLayout><div className="max-w-5xl space-y-6">
    <div><a href={`/dashboard/projects/${params.id}/incidents/${params.incidentId}/hypotheses`} className="text-sm font-medium text-blue-600">← Investigation plan</a><h1 className="mt-2 text-2xl font-bold text-gray-900">Evidence & proof report</h1><p className="mt-1 text-sm text-gray-500">Traceable evidence from test-oracle runs, hypotheses, and controlled experiments.</p></div>
    <div className="flex flex-wrap gap-3 rounded-lg bg-white p-5 shadow"><button onClick={collect} disabled={collecting} className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{collecting ? 'Collecting…' : 'Collect evidence'}</button><button onClick={generate} disabled={generating} className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 disabled:opacity-50">{generating ? 'Generating…' : 'Generate proof report'}</button></div>
    {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {loading ? <p className="text-gray-500">Loading evidence…</p> : <>
      {trialSummary && <div className="grid grid-cols-1 gap-4 sm:grid-cols-4"><Metric label="Oracle trials" value={String(trialSummary.sampleCount)} /><Metric label="Pass rate" value={trialSummary.successRate === null ? '—' : `${Math.round(trialSummary.successRate * 100)}%`} /><Metric label="95% interval" value={trialSummary.confidenceInterval ? `${Math.round(trialSummary.confidenceInterval.lower * 100)}–${Math.round(trialSummary.confidenceInterval.upper * 100)}%` : '—'} /><Metric label="Reliability" value={trialSummary.isFlaky ? 'Flaky' : trialSummary.sampleCount < 2 ? 'Insufficient data' : 'Consistent'} /></div>}
      {trialSummary && <p className="rounded bg-gray-50 p-4 text-sm text-gray-700">Record another trial from your repository with <code className="rounded bg-white px-1 font-mono text-xs">stm-agent test --incident-id {String(params.incidentId)}</code>. The next pass or failure will be linked to this incident automatically.</p>}
      {trialSummary?.isFlaky && <p className="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Mixed oracle outcomes detected. Run at least {trialSummary.recommendedRetries} additional trials before confirming a cause.</p>}
      {report ? <section className="rounded-lg bg-white p-6 shadow"><div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Latest proof report</p><h2 className="mt-1 text-lg font-semibold text-gray-900">{report.rootCause}</h2></div><p className="h-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">{Math.round(Number(report.confidence) * 100)}% confidence</p></div><div className="mt-5 grid gap-5 md:grid-cols-2"><div><h3 className="text-sm font-semibold text-gray-900">Citations ({report.citations.length})</h3><ul className="mt-2 space-y-2 text-sm text-gray-600">{report.citations.slice(0, 8).map((citation) => <li key={citation.evidenceId}><span className="font-medium text-gray-800">{citation.sourceType.replace('_', ' ')}</span>: {citation.claim}</li>)}</ul></div><div><h3 className="text-sm font-semibold text-gray-900">Limitations</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-gray-600">{report.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul></div></div><p className="mt-5 text-xs text-gray-500">Generated {new Date(report.createdAt).toLocaleString()} · {report.supportingEvidenceIds.length} evidence records · {report.supportingExperimentIds.length} completed experiments</p></section> : <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">Collect evidence, then generate a report. The report will label unconfirmed causes and missing trials as limitations.</div>}
      <section className="overflow-hidden rounded-lg bg-white shadow"><div className="border-b border-gray-200 px-6 py-4"><h2 className="font-semibold text-gray-900">Evidence audit trail</h2></div>{history?.evidence.length ? <ol className="divide-y divide-gray-200">{history.evidence.map((evidence) => <li key={evidence.id} className="p-5"><div className="flex flex-wrap justify-between gap-3"><p className="text-sm text-gray-800">{evidence.claim}</p><span className="h-fit rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">{Math.round(Number(evidence.confidence) * 100)}% confidence</span></div><p className="mt-2 text-xs text-gray-500">{evidence.sourceType.replace('_', ' ')} · {evidence.type} · recorded {new Date(evidence.createdAt).toLocaleString()}</p></li>)}</ol> : <p className="p-6 text-sm text-gray-500">No evidence has been collected for this incident yet.</p>}</section>
    </>}</div></DashboardLayout>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-white p-5 shadow"><p className="text-sm font-medium text-gray-500">{label}</p><p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p></div>;
}
