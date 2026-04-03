'use client';

import type { ReactNode } from 'react';
import { CleaningSummary, CleanTransaction, MerchantStats, RawTransaction } from '@/types/payments';
import { formatCurrency } from '@/lib/aggregations';
import { SectionHeader } from './ui';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
    <section className="card p-6">
      <p className="text-xs uppercase tracking-wide font-semibold text-brand-700">Portfolio Case Study · Fintech Analytics</p>
      <h1 className="text-3xl md:text-4xl font-bold mt-2">Zorvyn Payments Operations & Risk Intelligence Dashboard</h1>
      <p className="mt-3 text-slate-600 max-w-4xl">
        This simulation demonstrates how a data analyst intern can convert messy payment operations data into governed KPI reporting,
        risk intelligence, and action-ready recommendations for leadership.
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
    <section className="card p-5">
      <SectionHeader title="Data Quality" subtitle="Raw ingestion defects, cleanup interventions, and trusted output sample." />
      <div className="grid md:grid-cols-3 gap-3 mb-4">
        {[
          ['Duplicates Found', summary.duplicatesRemoved],
          ['Missing Values Handled', summary.missingValuesFilled],
          ['Labels Standardized', summary.labelsStandardized],
          ['Invalid Dates Corrected', summary.invalidDatesCorrected],
          ['Before Rows', summary.rawRows],
          ['After Rows', summary.cleanedRows]
        ].map(([l, v]) => (
          <div key={l as string} className="rounded-xl bg-slate-50 p-3 border border-slate-200">
            <p className="text-xs text-slate-500">{l}</p>
            <p className="text-xl font-semibold">{v as number}</p>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4 text-xs">
        <div className="overflow-auto border rounded-xl">
          <table className="w-full">
            <thead className="bg-slate-100 sticky top-0">
              <tr><th className="p-2 text-left">Raw Transaction Sample</th><th className="p-2 text-left">Date</th><th className="p-2">Region</th><th className="p-2">Method</th></tr>
            </thead>
            <tbody>
              {rawSample.map((r) => (
                <tr key={r.transaction_id} className="border-t">
                  <td className="p-2">{r.transaction_id}</td>
                  <td className="p-2">{r.transaction_date}</td>
                  <td className="p-2">{r.region}</td>
                  <td className="p-2">{r.payment_method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="overflow-auto border rounded-xl">
          <table className="w-full">
            <thead className="bg-slate-100 sticky top-0">
              <tr><th className="p-2 text-left">Cleaned Sample</th><th className="p-2 text-left">Date</th><th className="p-2">Region</th><th className="p-2">Method</th></tr>
            </thead>
            <tbody>
              {cleanedSample.map((r) => (
                <tr key={r.transactionId} className="border-t">
                  <td className="p-2">{r.transactionId}</td>
                  <td className="p-2">{r.transactionDate}</td>
                  <td className="p-2">{r.region}</td>
                  <td className="p-2">{r.paymentMethod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="card p-4 h-[320px]">
      <h3 className="font-semibold text-sm mb-3">{title}</h3>
      <div className="h-[260px]">{children}</div>
    </div>
  );
}

export function AlertsPanel({ alerts }: { alerts: string[] }) {
  return (
    <div className="card p-4">
      <h3 className="font-semibold mb-3">Today&apos;s Alerts</h3>
      <ul className="space-y-2 text-sm">
        {alerts.map((a) => (
          <li key={a} className="rounded-lg border border-rose-100 bg-rose-50 p-2 text-rose-800">⚠ {a}</li>
        ))}
      </ul>
    </div>
  );
}

export function DelayedMerchantsTable({ delayed }: { delayed: { merchant: string; avgDelay: number; txCount: number }[] }) {
  return (
    <div className="card p-4 overflow-auto">
      <h3 className="font-semibold text-sm mb-2">Delayed Merchants (Avg Delay &gt; 3 days)</h3>
      <table className="w-full text-sm">
        <thead className="bg-slate-100">
          <tr><th className="p-2 text-left">Merchant</th><th className="p-2 text-left">Avg Delay</th><th className="p-2 text-left">Transactions</th></tr>
        </thead>
        <tbody>
          {delayed.map((d) => (
            <tr key={d.merchant} className="border-t">
              <td className="p-2">{d.merchant}</td>
              <td className="p-2">{d.avgDelay.toFixed(2)} days</td>
              <td className="p-2">{d.txCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MerchantTable({ merchants }: { merchants: MerchantStats[] }) {
  return (
    <div className="card p-4 overflow-auto">
      <h3 className="font-semibold text-sm mb-2">Merchant Performance</h3>
      <table className="w-full text-sm">
        <thead className="bg-slate-100"><tr><th className="p-2 text-left">Merchant</th><th className="p-2">Volume</th><th className="p-2">Success</th><th className="p-2">Refund</th><th className="p-2">ATV</th><th className="p-2">Health</th></tr></thead>
        <tbody>
          {merchants.slice(0, 8).map((m) => (
            <tr key={m.merchantName} className="border-t">
              <td className="p-2">{m.merchantName}</td>
              <td className="p-2">{m.volume}</td>
              <td className="p-2">{m.successRate.toFixed(1)}%</td>
              <td className="p-2">{m.refundRate.toFixed(1)}%</td>
              <td className="p-2">{formatCurrency(m.averageTransactionValue)}</td>
              <td className="p-2">
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
  Cell
};
