'use client';

import { useState } from 'react';

const hypotheses = [
  { title: 'PHP 8.3 runtime changed payment serialization', score: 86, state: 'High confidence' },
  { title: 'Composer lockfile introduced an incompatible SDK release', score: 72, state: 'Worth testing' },
  { title: 'Checkout environment variable is missing in the candidate state', score: 41, state: 'Low confidence' },
];

export default function PortfolioDemoPage() {
  const [selectedHypothesis, setSelectedHypothesis] = useState(0);
  const selected = hypotheses[selectedHypothesis];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-slate-800 pb-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500 text-xl font-black">↺</span>
              <div>
                <h1 className="text-xl font-bold">Software Time Machine</h1>
                <p className="text-sm text-slate-400">Causal debugging through environment bisect</p>
              </div>
            </div>
          </div>
          <span className="w-fit rounded-full border border-indigo-400/40 bg-indigo-400/10 px-3 py-1 text-sm font-medium text-indigo-200">Interactive portfolio demo · sample data</span>
        </header>

        <section className="grid gap-6 py-8 lg:grid-cols-[1.45fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-300">Investigation workspace</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Find what changed.<br />Prove what fixed it.</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">This demo follows a Laravel checkout failure from an oracle-detected incident through semantic comparison, ranked hypotheses, isolated experiments, and an evidence-backed proof report.</p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm">
              <span className="rounded-lg bg-slate-800 px-3 py-2">Laravel 11</span>
              <span className="rounded-lg bg-slate-800 px-3 py-2">PHP 8.3</span>
              <span className="rounded-lg bg-slate-800 px-3 py-2">3 isolated experiments</span>
            </div>
          </div>
          <div className="rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/20 to-slate-900 p-6 shadow-2xl shadow-indigo-950/30">
            <p className="text-sm font-medium text-indigo-200">Incident STM-204</p>
            <h3 className="mt-2 text-2xl font-bold">Checkout request fails after dependency update</h3>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Metric label="Oracle" value="Failed" accent="text-rose-300" />
              <Metric label="Confidence" value="94%" accent="text-emerald-300" />
              <Metric label="Baseline" value="Passing" accent="text-sky-300" />
              <Metric label="Time saved" value="2h 18m" accent="text-amber-200" />
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <Step number="01" title="Capture" text="A passing test run stores a baseline state. The failure oracle records the error signature and environment metadata." />
          <Step number="02" title="Rank" text="Semantic diff converts configuration and dependency changes into deterministic, testable hypotheses." />
          <Step number="03" title="Prove" text="Sandbox trials produce evidence with provenance, confidence, and explicit limitations." />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between"><h3 className="text-lg font-bold">Semantic changes</h3><span className="text-sm text-slate-400">Baseline → failure</span></div>
            <div className="mt-5 space-y-3">
              <Change label="Runtime" from="PHP 8.2.17" to="PHP 8.3.4" risk="high" />
              <Change label="Dependency" from="stripe/stripe-php 13.6" to="14.2" risk="high" />
              <Change label="Configuration" from="PAYMENT_RETRIES=2" to="PAYMENT_RETRIES=2" risk="none" />
              <Change label="Git state" from="a34de91" to="d80c2aa" risk="medium" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between"><h3 className="text-lg font-bold">Hypothesis ranking</h3><span className="text-sm text-emerald-300">Budget: 3 experiments</span></div>
            <div className="mt-5 space-y-3">
              {hypotheses.map((hypothesis, index) => (
                <button key={hypothesis.title} onClick={() => setSelectedHypothesis(index)} className={`w-full rounded-xl border p-4 text-left transition ${selectedHypothesis === index ? 'border-indigo-400 bg-indigo-500/15' : 'border-slate-800 bg-slate-950/50 hover:border-slate-600'}`}>
                  <div className="flex items-start justify-between gap-4"><span className="font-medium">{hypothesis.title}</span><span className="rounded-md bg-slate-800 px-2 py-1 text-sm font-bold text-indigo-200">{hypothesis.score}</span></div>
                  <p className="mt-2 text-sm text-slate-400">{hypothesis.state} · Expected information gain calculated from semantic evidence</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">Selected experiment</p><h3 className="mt-2 text-xl font-bold">Restore PHP 8.2 runtime, keep all other failure-state changes</h3><p className="mt-2 text-slate-300">Testing: {selected.title}</p></div>
            <div className="rounded-xl bg-emerald-400/15 px-5 py-4 text-center"><p className="text-2xl font-bold text-emerald-300">PASS</p><p className="text-sm text-emerald-100">1m 42s isolated trial</p></div>
          </div>
          <div className="mt-5 grid gap-3 border-t border-emerald-300/20 pt-5 text-sm text-slate-300 sm:grid-cols-3"><p><strong className="block text-white">Evidence</strong>Test oracle passed</p><p><strong className="block text-white">Provenance</strong>Sandbox #SBX-018</p><p><strong className="block text-white">Limitation</strong>One repeated trial pending</p></div>
        </section>

        <footer className="mt-10 border-t border-slate-800 py-8 text-sm text-slate-400">Portfolio demonstration of the Software Time Machine architecture. Local-agent capture and Docker sandbox execution require a developer machine and are intentionally simulated here.</footer>
      </div>
    </main>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent: string }) { return <div className="rounded-xl bg-slate-950/40 p-3"><p className="text-xs text-slate-400">{label}</p><p className={`mt-1 text-xl font-bold ${accent}`}>{value}</p></div>; }
function Step({ number, title, text }: { number: string; title: string; text: string }) { return <div className="rounded-xl border border-slate-800 bg-slate-900 p-5"><span className="text-sm font-bold text-indigo-300">{number}</span><h3 className="mt-3 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p></div>; }
function Change({ label, from, to, risk }: { label: string; from: string; to: string; risk: 'high' | 'medium' | 'none' }) { const color = risk === 'high' ? 'text-rose-300 bg-rose-400/10' : risk === 'medium' ? 'text-amber-200 bg-amber-400/10' : 'text-slate-300 bg-slate-800'; return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-950/60 p-4"><div><p className="font-medium">{label}</p><p className="mt-1 font-mono text-sm text-slate-400">{from} <span className="text-slate-600">→</span> {to}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>{risk === 'none' ? 'unchanged' : `${risk} impact`}</span></div>; }
