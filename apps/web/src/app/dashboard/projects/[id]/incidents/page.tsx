'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '../../../../../components/DashboardLayout';
import api from '../../../../../lib/api';
import { Incident } from '../../../../../types';

export default function IncidentsPage() {
  const params = useParams();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get(`/api/projects/${params.id}/incidents`).then((response) => setIncidents(response.data)).finally(() => setLoading(false)); }, [params.id]);
  return <DashboardLayout><div className="max-w-4xl space-y-6"><div><a href={`/dashboard/projects/${params.id}`} className="text-sm font-medium text-blue-600">← Project</a><h1 className="mt-2 text-2xl font-bold text-gray-900">Incidents</h1><p className="mt-1 text-sm text-gray-500">Failure evidence reported by the deterministic test oracle.</p></div>{loading ? <p className="text-gray-500">Loading incidents…</p> : incidents.length === 0 ? <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">No incidents have been captured for this project.</div> : <div className="overflow-hidden rounded-lg bg-white shadow"><ul className="divide-y divide-gray-200">{incidents.map((incident) => <li key={incident.id} className="p-6"><div className="flex justify-between gap-4"><div><h2 className="font-medium text-gray-900">{incident.title}</h2><p className="mt-1 text-sm text-gray-500">{incident.failureType || 'test failure'} · {new Date(incident.createdAt).toLocaleString()}</p></div><span className="h-fit rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">{incident.status}</span></div>{incident.metadata?.command && <p className="mt-4 font-mono text-xs text-gray-600">$ {incident.metadata.command}</p>}{incident.description && <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-gray-900 p-3 text-xs text-gray-100">{incident.description}</pre>}</li>)}</ul></div>}</div></DashboardLayout>;
}
