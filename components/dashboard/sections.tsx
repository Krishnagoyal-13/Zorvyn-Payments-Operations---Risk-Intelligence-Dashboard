'use client';

import type { ReactNode } from 'react';
import { CleaningSummary, CleanTransaction, MerchantStats, RawTransaction } from '@/types/payments';
import { formatCurrency } from '@/lib/aggregations';
import { SectionHeader } from './ui';
import { ChartContainer, StatusBadge } from './design-system';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

export function HeroSection() {
  return (
    <section className="card p-6 md:p-8 relative overflow-hidden">
      <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-brand-100/60 blur-2xl" />
      <p className="relative text-xs uppercase tracking-[0.18em] font-semibold text-brand-700">Portfolio Case Study · Fintech Analytics</p>
      <h1 className="relative text-3xl md:text-4xl font-semibold tracking-tight mt-3">Zorvyn Payments Operations & Risk Intelligence Dashboard</h1>
      <p className="relative mt-3 text-sm md:text-base text-slate-600 max-w-4xl leading-relaxed">
        A high-fidelity simulation of how a payments analyst transforms noisy operational data into trusted metrics, intelligent anomaly signals,
        and executive-ready recommendations.
      </p>
    </section>
  );
}

export function DataQualitySection({
  summary,
  rawSample,
  cleanedSample
}: {
  summary: CleaningSummary;
  rawSample: RawTransaction[];
  cleanedSample: CleanTransaction[];
}) {
  return (
    <section className="section-card">
      <SectionHeader title="Data Quality" subtitle="Data trust layer: defects detected, normalized, and validated for decision-ready reporting." />
      <div className="grid md:grid-cols-3 gap-3 mb-5">
        {[
          ['Duplicates Found', summary.duplicatesRemoved],
          ['Missing Values Handled', summary.missingValuesFilled],
          ['Labels Standardized', summary.labelsStandardized],
          ['Invalid Dates Corrected', summary.invalidDatesCorrected],
          ['Before Rows', summary.rawRows],
          ['After Rows', summary.cleanedRows]
        ].map(([l, v]) => (
          <div key={l as string} className="rounded-xl bg-slate-50 p-3 border border-slate-200">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">{l}</p>
            <p className="text-2xl font-semibold mt-1">{v as number}</p>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4 text-xs">
        <DataTable title="Raw Transaction Sample" rows={rawSample.map((r) => [r.transaction_id, r.transaction_date, r.region, r.payment_method])} />
        <DataTable title="Cleaned Transaction Sample" rows={cleanedSample.map((r) => [r.transactionId, r.transactionDate, r.region, r.paymentMethod])} />
      </div>
    </section>
  );
}

function DataTable({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div className="overflow-auto border border-slate-200 rounded-xl">
      <table className="w-full">
        <thead className="bg-slate-100 sticky top-0">
          <tr><th className="p-2.5 text-left">{title}</th><th className="p-2.5 text-left">Date</th><th className="p-2.5">Region</th><th className="p-2.5">Method</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.join('|')} className="border-t border-slate-200">
              <td className="p-2.5">{r[0]}</td>
              <td className="p-2.5">{r[1]}</td>
              <td className="p-2.5">{r[2]}</td>
              <td className="p-2.5">{r[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  rightAction,
  whyItMatters,
  children
}: {
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
  whyItMatters?: string;
  children: ReactNode;
}) {
  return (
    <ChartContainer className="h-[372px]">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="font-semibold text-sm text-slate-900">{title}</h3>
          {subtitle ? <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p> : null}
        </div>
        {rightAction}
      </div>
      <div className="h-[248px]">
        {children}
      </div>
      {whyItMatters ? (
        <p className="mt-2 text-[11px] leading-relaxed text-slate-600 border-t border-slate-100 pt-2">
          <span className="font-semibold text-slate-700">Why it matters:</span> {whyItMatters}
        </p>
      ) : null}
    </ChartContainer>
  );
}

const pretty = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
};

export function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 shadow-md px-3 py-2 text-xs min-w-[140px]">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <div className="space-y-1">
        {payload.map((p) => (
          <p key={p.name} className="flex justify-between gap-3" style={{ color: p.color }}>
            <span className="text-slate-600">{p.name}</span>
            <span className="font-medium text-slate-900">{pretty(Number(p.value ?? 0))}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

export function AlertsPanel({ alerts }: { alerts: string[] }) {
  return (
    <div className="card p-4 md:p-5">
      <h3 className="font-semibold text-slate-800 mb-3">Today&apos;s Alerts</h3>
      <ul className="space-y-2 text-sm">
        {alerts.map((a) => (
          <li key={a} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-700"><StatusBadge tone="risk">Alert</StatusBadge><span className="ml-2">{a}</span></li>
        ))}
      </ul>
    </div>
  );
}

export function DelayedMerchantsTable({ delayed }: { delayed: { merchant: string; avgDelay: number; txCount: number }[] }) {
  return (
    <div className="card p-4 md:p-5 overflow-auto">
      <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-sm text-slate-800">Delayed Merchants (Avg Delay &gt; 3 days)</h3><StatusBadge tone="warning">Settlement Watch</StatusBadge></div>
      <table className="w-full text-sm">
        <thead className="bg-slate-100">
          <tr><th className="p-2.5 text-left">Merchant</th><th className="p-2.5 text-left">Avg Delay</th><th className="p-2.5 text-left">Transactions</th></tr>
        </thead>
        <tbody>
          {delayed.map((d) => (
            <tr key={d.merchant} className="border-t border-slate-200">
              <td className="p-2.5">{d.merchant}</td>
              <td className="p-2.5">{d.avgDelay.toFixed(2)} days</td>
              <td className="p-2.5">{d.txCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MerchantTable({ merchants }: { merchants: MerchantStats[] }) {
  return (
    <div className="card p-4 md:p-5 overflow-auto">
      <h3 className="font-semibold text-sm text-slate-800 mb-3">Merchant Performance</h3>
      <table className="w-full text-sm">
        <thead className="bg-slate-100"><tr><th className="p-2.5 text-left">Merchant</th><th className="p-2.5">Volume</th><th className="p-2.5">Success</th><th className="p-2.5">Refund</th><th className="p-2.5">ATV</th><th className="p-2.5">Health</th></tr></thead>
        <tbody>
          {merchants.slice(0, 8).map((m) => (
            <tr key={m.merchantName} className="border-t border-slate-200">
              <td className="p-2.5">{m.merchantName}</td>
              <td className="p-2.5">{m.volume}</td>
              <td className="p-2.5">{m.successRate.toFixed(1)}%</td>
              <td className="p-2.5">{m.refundRate.toFixed(1)}%</td>
              <td className="p-2.5">{formatCurrency(m.averageTransactionValue)}</td>
              <td className="p-2.5">
                <span className={`px-2 py-1 rounded-full text-xs ${m.healthLabel === 'Healthy' ? 'bg-emerald-100 text-emerald-700' : m.healthLabel === 'Watchlist' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{m.healthLabel}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const chartTheme = {
  success: '#16a34a',
  failed: '#ef4444',
  flagged: '#f59e0b',
  primary: '#1f7ae0'
};

export {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Brush,
  ComposedChart
};
