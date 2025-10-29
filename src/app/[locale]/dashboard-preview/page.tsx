"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const UniversalLanguageToggle = dynamic(() => import("../../../components/UniversalLanguageToggle"), { ssr: true });

function Kpi({ label, value }: { label: string; value: string }) {
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
      <div className="mt-1 text-2xl font-semibold text-zinc-50">{value}</div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs text-zinc-500">Δ —</span>
        <svg width="80" height="20" viewBox="0 0 80 20" className="opacity-60">
          <path d="M0,12 L20,8 L40,11 L60,7 L80,9" stroke="#8b5cf6" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    </div>
  );
}

export default function AdminDashboardPreview() {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_UI_PREVIEW !== "1") {
    return (
      <div className="px-4 py-8 text-zinc-200">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-xl font-semibold">UI Preview Disabled</h1>
          <p className="mt-2 text-zinc-400">Set <code className="rounded bg-zinc-800 px-1 py-0.5">NEXT_PUBLIC_UI_PREVIEW=1</code> to view the admin dashboard preview.</p>
          <p className="mt-4 text-sm text-zinc-400">
            Go to <Link href="/en/dashboard" className="text-indigo-400 hover:underline">Admin Dashboard</Link>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-50">Admin Dashboard — Preview</h1>
            <p className="mt-1 text-sm text-zinc-400">Polish-only demo (safe, mocked). Live admin dashboard not modified.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block"><UniversalLanguageToggle /></div>
            <button className="rounded-full border border-fuchsia-700 bg-fuchsia-900/30 px-3 py-1.5 text-sm font-medium text-fuchsia-200 hover:bg-fuchsia-900/50">Growth Copilot</button>
            <Link href="/en/dashboard" className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800">Back to admin</Link>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Total Leads" value="248" />
          <Kpi label="Avg Confidence" value="86%" />
          <Kpi label="High Urgency" value="34" />
          <Kpi label="Active Clients" value="12" />
        </div>

        {/* Preset chips + Sticky Filters Mock */}
        <div className="sticky top-0 z-20 -mx-4 mb-4 mt-4 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {['Today', 'High urgency', 'Converted', 'Meetings'].map(p => (
              <button key={p} className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs text-zinc-200 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">{p}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200">
              <span className="text-zinc-400">Client:</span>
              <select className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-100"><option>All</option><option>TechFlow</option></select>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200">
              <span className="text-zinc-400">Status:</span>
              <select className="rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-100"><option>All</option><option>Active</option><option>Paused</option></select>
            </div>
          </div>
        </div>

        {/* Example Section */}
        <section className="mt-4">
          <h2 className="mb-3 text-lg font-semibold text-zinc-100">Global Insights</h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-400">Engagement Index</div>
              <div className="text-2xl font-semibold text-zinc-50">92/100</div>
            </div>
            <div className="mt-2 h-3 w-full rounded-full bg-zinc-800">
              <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-purple-600" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


