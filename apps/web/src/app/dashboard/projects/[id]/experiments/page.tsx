'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '../../../../../components/DashboardLayout';
import api from '../../../../../lib/api';

type Execution = { id: string; sandboxName: string; command: string; status: string; passed: boolean; output?: string; error?: string; candidateBranch?: string; plannedExperimentId?: string | null; createdAt: string };
type PlannedExperiment = { id: string; status: string; estimatedCost: number; hypothesis: { rank: number; description: string } };

export default function ExperimentsPage() {
  const params = useParams();
  const [items, setItems] = useState<Execution[]>([]);
  const [planned, setPlanned] = useState<PlannedExperiment[]>([]);
  const [workspacePath, setWorkspacePath] = useState('');
  const [command, setCommand] = useState('');
  const [branch, setBranch] = useState('');
  const [plannedExperimentId, setPlannedExperimentId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    const [executions, plannedExperiments] = await Promise.all([
      api.get(`/api/projects/${params.id}/experiments`),
      api.get(`/api/projects/${params.id}/experiments/planned`),
    ]);
    setItems(executions.data);
    setPlanned(plannedExperiments.data);
  };

  useEffect(() => { load().catch(() => setMessage('Unable to refresh experiments.')); const timer = window.setInterval(() => load().catch(() => undefined), 3000); return () => window.clearInterval(timer); }, [params.id]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await api.post(`/api/projects/${params.id}/experiments`, { workspacePath, command: command || undefined, candidateBranch: branch || undefined, plannedExperimentId: plannedExperimentId || undefined });
      setMessage(plannedExperimentId ? 'Planned experiment started. Its result will update the hypothesis and proof report automatically.' : 'Isolated experiment started.');
      setPlannedExperimentId('');
      await load();
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Unable to start the sandbox experiment.');
    } finally {
      setSubmitting(false);
    }
  };

  const restore = async (id: string) => { await api.post(`/api/projects/${params.id}/experiments/${id}/restore`); await load(); };

  return <DashboardLayout><div className="max-w-4xl space-y-6">
    <div><a href={`/dashboard/projects/${params.id}`} className="text-sm font-medium text-blue-600">← Project</a><h1 className="mt-2 text-2xl font-bold text-gray-900">Sandbox experiments</h1><p className="mt-1 text-sm text-gray-500">Run a queued investigation plan in a clone-mode Docker Sandbox. Network access is denied by default.</p></div>
    <form onSubmit={submit} className="space-y-4 rounded-lg bg-white p-6 shadow">
      <div><label className="block text-sm font-medium text-gray-700">Queued investigation plan</label><select value={plannedExperimentId} onChange={(event) => setPlannedExperimentId(event.target.value)} className="mt-1 block w-full rounded border p-2"><option value="">Run an unlinked sandbox experiment</option>{planned.map((plan) => <option key={plan.id} value={plan.id}>Rank {plan.hypothesis.rank}: {plan.hypothesis.description} (cost {plan.estimatedCost})</option>)}</select><p className="mt-1 text-xs text-gray-500">Selecting a plan will automatically update its hypothesis, evidence, and proof report when the sandbox finishes.</p></div>
      <input required value={workspacePath} onChange={(event) => setWorkspacePath(event.target.value)} placeholder="Local repository path, e.g. C:\projects\my-app" className="block w-full rounded border p-2" />
      <input value={command} onChange={(event) => setCommand(event.target.value)} placeholder="Test command (uses project default when empty)" className="block w-full rounded border p-2" />
      <input value={branch} onChange={(event) => setBranch(event.target.value)} placeholder="Candidate Git branch (optional)" className="block w-full rounded border p-2" />
      <button disabled={submitting} className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{submitting ? 'Starting…' : 'Run isolated experiment'}</button>
    </form>
    {message && <p className="rounded bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}
    <div className="overflow-hidden rounded-lg bg-white shadow"><ul className="divide-y divide-gray-200">{items.length ? items.map((item) => <li key={item.id} className="p-5"><div className="flex justify-between gap-4"><div><p className="font-medium text-gray-900">{item.sandboxName}{item.plannedExperimentId && <span className="ml-2 text-xs font-normal text-blue-600">linked to investigation plan</span>}</p><p className="mt-1 font-mono text-xs text-gray-600">{item.command}</p></div><span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium">{item.status}{item.status === 'completed' ? item.passed ? ' · passed' : ' · failed' : ''}</span></div>{item.error && <p className="mt-3 text-sm text-red-600">{item.error}</p>}{item.output && <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-gray-900 p-3 text-xs text-gray-100">{item.output}</pre>}<button onClick={() => restore(item.id)} disabled={!['ready', 'completed', 'failed'].includes(item.status)} className="mt-3 text-sm font-medium text-blue-600 disabled:text-gray-400">Restore baseline</button></li>) : <li className="p-6 text-sm text-gray-500">No sandbox experiments have been started yet.</li>}</ul></div>
  </div></DashboardLayout>;
}
