'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '../../../../../components/DashboardLayout';
import api from '../../../../../lib/api';
import { Incident } from '../../../../../types';

const statuses: Incident['status'][] = ['open', 'investigating', 'resolved'];

export default function IncidentsPage() {
  const params = useParams();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/api/projects/${params.id}/incidents`).then((response) => setIncidents(response.data)).finally(() => setLoading(false));
  }, [params.id]);

  const updateStatus = async (incidentId: string, status: Incident['status']) => {
    setUpdatingId(incidentId);
    try {
      const response = await api.put(`/api/projects/${params.id}/incidents/${incidentId}`, { status });
      setIncidents((current) => current.map((incident) => incident.id === incidentId ? response.data : incident));
    } finally {
      setUpdatingId(null);
    }
  };

  return <DashboardLayout><div className="max-w-4xl space-y-6">
    <div><a href={`/dashboard/projects/${params.id}`} className="text-sm font-medium text-blue-600">← Project</a><h1 className="mt-2 text-2xl font-bold text-gray-900">Incidents</h1><p className="mt-1 text-sm text-gray-500">Failure evidence reported by the deterministic test oracle.</p></div>
    {loading ? <p className="text-gray-500">Loading incidents…</p> : incidents.length === 0 ? <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">No incidents have been captured for this project.</div> : <div className="overflow-hidden rounded-lg bg-white shadow"><ul className="divide-y divide-gray-200">{incidents.map((incident) => <li key={incident.id} className="p-6"><div className="flex flex-wrap justify-between gap-4"><div><h2 className="font-medium text-gray-900">{incident.title}</h2><p className="mt-1 text-sm text-gray-500">{incident.failureType || 'test failure'} · {new Date(incident.createdAt).toLocaleString()}</p></div><select aria-label={`Status for ${incident.title}`} disabled={updatingId === incident.id} value={incident.status} onChange={(event) => updateStatus(incident.id, event.target.value as Incident['status'])} className="h-fit rounded-md border-gray-300 text-sm">{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></div>{incident.metadata?.command && <p className="mt-4 font-mono text-xs text-gray-600">$ {incident.metadata.command}</p>}{incident.description && <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-gray-900 p-3 text-xs text-gray-100">{incident.description}</pre>}</li>)}</ul></div>}
  </div></DashboardLayout>;
}
