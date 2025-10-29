"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Preview-only dynamic imports (kept minimal to avoid touching live code)
const UniversalLanguageToggle = dynamic(() => import("../../../../components/UniversalLanguageToggle"), { ssr: true });

// Lightweight preview-only UI primitives. Everything here is self-contained
// and uses mocked data to avoid touching live dashboard logic.

type KpiTileProps = {
  label: string;
  value: string;
  deltaPct: number; // positive or negative
  sparkline: number[]; // 0..100 values
};

function KpiTile({ label, value, deltaPct, sparkline }: KpiTileProps) {
  const deltaColor = deltaPct >= 0 ? "text-green-400" : "text-rose-400";
  const strokeColor = deltaPct >= 0 ? "#34d399" : "#fb7185";

  const pathD = useMemo(() => {
    if (sparkline.length === 0) return "";
    const points = sparkline.map((v, i) => {
      const x = (i / (sparkline.length - 1)) * 100;
      const y = 30 - (v / 100) * 30; // 30px height
      return `${x},${y}`;
    });
    return `M${points[0]} L${points.slice(1).join(" ")}`;
  }, [sparkline]);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-sm">
      <div className="text-zinc-400 text-xs tracking-wide flex items-center gap-1">
        <span>{label}</span>
        {label.toLowerCase().includes('confidence') && (
          <span
            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-zinc-700 text-[10px] text-zinc-300"
            title={
              'Range: 0–100 (higher = stronger signal)\nFactors: model confidence, urgency, message clarity/length, historical reply rate, recent activity\nNote: heuristic blend; not a guarantee.'
            }
          >
            i
          </span>
        )}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <div className="text-2xl font-semibold text-zinc-50">{value}</div>
        <div className={`${deltaColor} text-xs font-medium`}>{deltaPct >= 0 ? `+${deltaPct}%` : `${deltaPct}%`}</div>
      </div>
      <svg width="100%" height="30" viewBox="0 0 100 30" className="mt-2">
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function StickyFilters() {
  return (
    <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur">
      {/* Preset chips */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {['Today', 'High urgency', 'Meetings', 'Converted'].map((p) => (
          <button key={p} className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs text-zinc-200 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">{p}</button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200">
          <span className="text-zinc-400">Tab:</span>
          <button className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white">Active Leads</button>
          <button className="rounded-md px-2 py-1 text-xs text-zinc-300 hover:text-white">Contacted</button>
          <button className="rounded-md px-2 py-1 text-xs text-zinc-300 hover:text-white">Meetings</button>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200">
          <span className="text-zinc-400">Filters:</span>
          <select className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-100">
            <option>All Urgency</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <select className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-100">
            <option>All Language</option>
            <option>EN</option>
            <option>FR</option>
          </select>
          <select className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-100">
            <option>All Priorities</option>
            <option>High</option>
            <option>Normal</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function ConfidenceBar() {
  return (
    <div className="mt-2">
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full w-[91%] rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-purple-600" />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 rounded bg-zinc-900/80 px-1.5 py-0.5 text-[10px] font-medium text-white shadow">
          91%
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
        <span>0</span>
        <span title={'Range: 0–100 (higher = stronger signal). Factors include model confidence, urgency, clarity/length, historical reply rate, and recent activity.'}>0–100</span>
        <span>100</span>
      </div>
    </div>
  );
}

function LeadCardPreview() {
  const [notesOpen, setNotesOpen] = React.useState(false);
  const copy = (text: string) => navigator.clipboard?.writeText(text).catch(() => {});
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-center justify-between">
        <div className="text-zinc-100 font-medium">David Thompson <span className="ml-2 rounded-md bg-rose-900/40 px-2 py-0.5 text-xs text-rose-300">High Priority</span></div>
        <div className="text-xs text-zinc-400">EN</div>
      </div>

      <div className="mt-2 text-sm text-zinc-300">
        <span>"We’re a growing startup and need help with our cloud infrastructure..."</span>
        <button onClick={() => copy('david.t@startupventures.io')} className="ml-2 rounded border border-zinc-800 bg-zinc-950/40 px-1.5 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-800">Copy email</button>
      </div>
      <div className="mt-2 text-sm text-zinc-400">
        Startup looking for cloud infrastructure optimization. Emphasis on AWS scaling and cost management.
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-zinc-400">Intent</div>
          <div className="flex items-center gap-2 text-indigo-300">
            <span>Cloud Consulting</span>
            <button onClick={() => copy('Cloud Consulting')} className="rounded border border-zinc-800 bg-zinc-950/40 px-1.5 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-800">Copy</button>
          </div>
        </div>
        <div>
          <div className="text-zinc-400">Urgency</div>
          <div className="text-rose-300">High</div>
        </div>
        <div className="col-span-2">
          <div className="text-zinc-400 flex items-center gap-1">Confidence
            <span
              className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-zinc-700 text-[10px] text-zinc-300"
              title={
                'Range: 0–100 (higher = stronger signal)\nFactors: model confidence, urgency, message clarity/length, historical reply rate, recent activity\nNote: heuristic blend; not a guarantee.'
              }
            >
              i
            </span>
          </div>
          <ConfidenceBar />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">Mark as Contacted</button>
        <button className="inline-flex items-center gap-1 rounded-md bg-emerald-700 px-3 py-1.5 text-sm text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500">Meeting Booked</button>
        <button className="inline-flex items-center gap-1 rounded-md bg-violet-700 px-3 py-1.5 text-sm text-white hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500">Client Closed</button>
        <button className="inline-flex items-center gap-1 rounded-md border border-rose-900 bg-rose-900/30 px-3 py-1.5 text-sm text-rose-200 hover:bg-rose-900/50 focus:outline-none focus:ring-2 focus:ring-rose-500">No Sale</button>
      </div>

      <button onClick={() => setNotesOpen(v => !v)} className="mt-4 w-full rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-left hover:bg-zinc-900/60">
        <div className="flex items-center justify-between text-sm">
          <div className="text-zinc-300">Notes</div>
          <div className="text-xs text-zinc-400">2 notes • updated 3h ago</div>
        </div>
        {notesOpen && (
          <div className="mt-3 text-sm text-zinc-300">• Followed up on email.<br/>• Scheduling a call next week.</div>
        )}
      </button>
    </div>
  );
}

export default function ClientDashboardPreview() {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_UI_PREVIEW !== "1") {
    return (
      <div className="px-4 py-8 text-zinc-200">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-xl font-semibold">UI Preview Disabled</h1>
          <p className="mt-2 text-zinc-400">Set <code className="rounded bg-zinc-800 px-1 py-0.5">NEXT_PUBLIC_UI_PREVIEW=1</code> to view the dashboard preview.</p>
          <p className="mt-4 text-sm text-zinc-400">
            Return to <Link href="/en/client/dashboard" className="text-indigo-400 hover:underline">Client Dashboard</Link>.
          </p>
        </div>
      </div>
    );
  }

  const kpis: KpiTileProps[] = [
    { label: "Total Leads", value: "2", deltaPct: 25, sparkline: [10, 20, 25, 18, 24, 30, 32] },
    { label: "Avg Confidence", value: "88%", deltaPct: 6, sparkline: [70, 72, 75, 78, 80, 85, 88] },
    { label: "Top Intent", value: "Cloud Consulting", deltaPct: 0, sparkline: [40, 40, 40, 40, 40, 40, 40] },
    { label: "High Urgency", value: "2", deltaPct: -17, sparkline: [70, 65, 62, 60, 58, 55, 53] },
  ];

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-50">Client Dashboard — Preview</h1>
            <p className="mt-1 text-sm text-zinc-400">Visual polish demo (safe, mocked). Does not affect live dashboard.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block"><UniversalLanguageToggle /></div>
            <button className="rounded-full border border-fuchsia-700 bg-fuchsia-900/30 px-3 py-1.5 text-sm font-medium text-fuchsia-200 hover:bg-fuchsia-900/50">
              Growth Copilot
            </button>
            <Link href="/en/client/dashboard" className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800">Back to dashboard</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <KpiTile key={k.label} {...k} />
          ))}
        </div>

        <StickyFilters />

        <section className="mt-4">
          <h2 className="mb-3 text-lg font-semibold text-zinc-100">Predictive Growth Engine</h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-400">Engagement Score</div>
              <div className="text-2xl font-semibold text-zinc-50">100/100</div>
            </div>
            <div className="mt-2 h-3 w-full rounded-full bg-zinc-800">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-purple-600" />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 text-sm text-zinc-300">
                <div className="text-zinc-400">Urgency Trend</div>
                Urgency levels are stable week‑over‑week.
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 text-sm text-zinc-300">
                <div className="text-zinc-400">Confidence Insight</div>
                Strong confidence average (88%) — leads are highly qualified.
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-zinc-100">Leads</h2>
          <LeadCardPreview />
        </section>

        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold text-zinc-100">Relationship Insights</h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-center">
            <div className="text-zinc-400">No insights available</div>
            <div className="mt-2 text-sm text-zinc-500">Insights appear once you have more lead interactions.</div>
            <Link href="/en/client/settings" className="mt-3 inline-block rounded-md border border-indigo-800 bg-indigo-900/30 px-3 py-1.5 text-sm text-indigo-200 hover:bg-indigo-900/50">Learn how to activate</Link>
          </div>
        </section>
      </div>
    </div>
  );
}


