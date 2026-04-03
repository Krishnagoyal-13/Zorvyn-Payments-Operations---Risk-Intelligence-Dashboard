'use client';

import type { ReactNode } from 'react';

import { FilterState, KPISet } from '@/types/payments';
import { formatCurrency } from '@/lib/aggregations';
import { StatusBadge, StatusTone } from './design-system';

type OptionMap = {
  regions: string[];
  methods: string[];
  segments: string[];
  statuses: string[];
};

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-1">
      <h2 className="section-title">{title}</h2>
      {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 min-w-[160px]">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function filterSelectClass(active: boolean) {
  return `h-10 rounded-lg border px-3 text-sm ${active ? 'border-brand-500 bg-slate-900 text-slate-100' : 'border-slate-700 bg-slate-900/70 text-slate-300'} focus:outline-none focus:ring-2 focus:ring-brand-700/50`;
}

export function FilterBar({
  filters,
  options,
  onChange,
  minDate,
  maxDate,
  totalCount,
  filteredCount
}: {
  filters: FilterState;
  options: OptionMap;
  onChange: (next: FilterState) => void;
  minDate: string;
  maxDate: string;
  totalCount: number;
  filteredCount: number;
}) {
  const set = (key: keyof FilterState, value: string) => onChange({ ...filters, [key]: value });

  const reset = () =>
    onChange({
      startDate: minDate,
      endDate: maxDate,
      region: 'All Regions',
      paymentMethod: 'All Methods',
      merchantSegment: 'All Segments',
      transactionStatus: 'All Statuses'
    });

  const activeFilters = [
    filters.region !== 'All Regions' ? `Region: ${filters.region}` : null,
    filters.paymentMethod !== 'All Methods' ? `Method: ${filters.paymentMethod}` : null,
    filters.merchantSegment !== 'All Segments' ? `Segment: ${filters.merchantSegment}` : null,
    filters.transactionStatus !== 'All Statuses' ? `Status: ${filters.transactionStatus}` : null,
    filters.startDate !== minDate || filters.endDate !== maxDate ? `Date: ${filters.startDate} → ${filters.endDate}` : null
  ].filter(Boolean) as string[];

  const quickRanges = [
    { label: 'Full Range', start: minDate, end: maxDate },
    { label: 'Last 30d', start: shiftDate(maxDate, -30), end: maxDate },
    { label: 'Last 14d', start: shiftDate(maxDate, -14), end: maxDate }
  ];

  return (
    <section className="card p-4 md:p-5 space-y-3 sticky top-3 z-20">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-slate-100">Filter Toolbar</p>
          <p className="text-xs text-slate-400">Controls analytical scope for all KPIs, charts, and insights.</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge tone={filteredCount === 0 ? 'risk' : 'info'}>{filteredCount.toLocaleString()} of {totalCount.toLocaleString()} records</StatusBadge>
          <button className="h-9 rounded-lg border border-slate-700 px-3 text-sm text-slate-200 hover:bg-slate-800" onClick={reset}>Reset Filters</button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap" role="group" aria-label="Quick date ranges">
        {quickRanges.map((range) => (
          <button
            key={range.label}
            className={`rounded-md px-2.5 py-1 text-xs border ${filters.startDate === range.start && filters.endDate === range.end ? 'border-brand-500 text-brand-300 bg-brand-900/20' : 'border-slate-700 text-slate-400'}`}
            onClick={() => onChange({ ...filters, startDate: range.start, endDate: range.end })}
          >
            {range.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <FilterField label="Start Date">
          <input className={filterSelectClass(filters.startDate !== minDate)} type="date" value={filters.startDate} min={minDate} max={filters.endDate} onChange={(e) => set('startDate', e.target.value)} />
        </FilterField>
        <FilterField label="End Date">
          <input className={filterSelectClass(filters.endDate !== maxDate)} type="date" value={filters.endDate} min={filters.startDate} max={maxDate} onChange={(e) => set('endDate', e.target.value)} />
        </FilterField>
        <FilterField label="Region">
          <select className={filterSelectClass(filters.region !== 'All Regions')} value={filters.region} onChange={(e) => set('region', e.target.value)}>
            {['All Regions', ...options.regions].map((o) => (<option key={o}>{o}</option>))}
          </select>
        </FilterField>
        <FilterField label="Payment Method">
          <select className={filterSelectClass(filters.paymentMethod !== 'All Methods')} value={filters.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)}>
            {['All Methods', ...options.methods].map((o) => (<option key={o}>{o}</option>))}
          </select>
        </FilterField>
        <FilterField label="Merchant Segment">
          <select className={filterSelectClass(filters.merchantSegment !== 'All Segments')} value={filters.merchantSegment} onChange={(e) => set('merchantSegment', e.target.value)}>
            {['All Segments', ...options.segments].map((o) => (<option key={o}>{o}</option>))}
          </select>
        </FilterField>
        <FilterField label="Transaction Status">
          <select className={filterSelectClass(filters.transactionStatus !== 'All Statuses')} value={filters.transactionStatus} onChange={(e) => set('transactionStatus', e.target.value)}>
            {['All Statuses', ...options.statuses].map((o) => (<option key={o}>{o}</option>))}
          </select>
        </FilterField>
      </div>

      <div className="border-t border-slate-800 pt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400">Active Scope:</span>
        {activeFilters.length ? (
          activeFilters.map((item) => <StatusBadge key={item} tone="neutral">{item}</StatusBadge>)
        ) : (
          <StatusBadge tone="info">No additional filters applied</StatusBadge>
        )}
      </div>
    </section>
  );
}

function shiftDate(date: string, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function Sparkline({ tone, seed }: { tone: StatusTone; seed: number }) {
  const bars = Array.from({ length: 8 }).map((_, idx) => {
    const base = ((seed + idx * 13) % 65) + 25;
    return Math.max(18, Math.min(100, base));
  });

  const barClass = tone === 'success' ? 'bg-emerald-400/70' : tone === 'warning' ? 'bg-amber-400/75' : tone === 'risk' ? 'bg-rose-400/75' : tone === 'info' ? 'bg-sky-400/75' : 'bg-slate-400/70';

  return (
    <div className="flex items-end gap-1 h-8">
      {bars.map((height, idx) => (
        <div key={`${seed}-${idx}`} className={`w-1.5 rounded-sm ${barClass}`} style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

export function KPIGrid({ kpis }: { kpis: KPISet }) {
  const items = [
    {
      label: 'Total Transactions',
      icon: '📈',
      value: kpis.totalTransactions.toLocaleString(),
      helper: 'Processed in selected period',
      trend: `${kpis.weekOverWeekChange >= 0 ? '▲' : '▼'} ${Math.abs(kpis.weekOverWeekChange).toFixed(1)}% vs prior week`,
      tone: (kpis.weekOverWeekChange >= 0 ? 'success' : 'warning') as StatusTone
    },
    {
      label: 'Successful Transactions',
      icon: '✅',
      value: kpis.successfulTransactions.toLocaleString(),
      helper: 'Approved by gateway/acquirer',
      trend: kpis.paymentSuccessRate > 92 ? 'Strong quality band' : 'Needs reliability improvement',
      tone: (kpis.paymentSuccessRate > 92 ? 'success' : 'warning') as StatusTone
    },
    {
      label: 'Failed Transactions',
      icon: '⛔',
      value: kpis.failedTransactions.toLocaleString(),
      helper: 'Declined, timeout, or processing errors',
      trend: kpis.failedTransactions < kpis.successfulTransactions * 0.1 ? 'Contained failure volume' : 'Failure escalation watch',
      tone: (kpis.failedTransactions < kpis.successfulTransactions * 0.1 ? 'warning' : 'risk') as StatusTone
    },
    {
      label: 'Payment Success Rate',
      icon: '🎯',
      value: `${kpis.paymentSuccessRate.toFixed(1)}%`,
      helper: 'Success / total transactions',
      trend: kpis.paymentSuccessRate >= 95 ? 'Excellent conversion stability' : 'Opportunity in checkout routing',
      tone: (kpis.paymentSuccessRate >= 95 ? 'success' : 'warning') as StatusTone
    },
    {
      label: 'Refund Rate',
      icon: '↩️',
      value: `${kpis.refundRate.toFixed(1)}%`,
      helper: 'Refunded / total transactions',
      trend: kpis.refundRate <= 8 ? 'Within control threshold' : 'Margin pressure risk',
      tone: (kpis.refundRate <= 8 ? 'success' : 'risk') as StatusTone
    },
    {
      label: 'Average Settlement Time',
      icon: '⏱️',
      value: `${kpis.averageSettlementTime.toFixed(2)}d`,
      helper: 'Average payout lag',
      trend: kpis.averageSettlementTime <= 2.5 ? 'Fast settlement cycle' : 'SLA attention needed',
      tone: (kpis.averageSettlementTime <= 2.5 ? 'success' : 'warning') as StatusTone
    },
    {
      label: 'Total Processed Amount',
      icon: '💳',
      value: formatCurrency(kpis.totalProcessedAmount),
      helper: 'Gross payment volume (GPV)',
      trend: 'Healthy transaction throughput',
      tone: 'info' as StatusTone
    },
    {
      label: 'Flagged Transactions',
      icon: '🛡️',
      value: kpis.flaggedTransactions.toLocaleString(),
      helper: 'Risk or policy-triggered reviews',
      trend: kpis.flaggedTransactions / Math.max(kpis.totalTransactions, 1) < 0.12 ? 'Monitoring within band' : 'Fraud alert density rising',
      tone: (kpis.flaggedTransactions / Math.max(kpis.totalTransactions, 1) < 0.12 ? 'warning' : 'risk') as StatusTone
    },
    {
      label: 'Net Revenue Impact',
      icon: '💰',
      value: formatCurrency(kpis.netRevenueImpact),
      helper: 'Amount minus refunds',
      trend: kpis.netRevenueImpact > 0 ? 'Positive contribution margin' : 'Negative impact risk',
      tone: (kpis.netRevenueImpact > 0 ? 'success' : 'risk') as StatusTone
    },
    {
      label: 'Week-over-Week Change',
      icon: '📊',
      value: `${kpis.weekOverWeekChange.toFixed(1)}%`,
      helper: 'Current week vs previous week volume',
      trend: kpis.weekOverWeekChange >= 0 ? 'Acceleration in throughput' : 'Demand softness observed',
      tone: (kpis.weekOverWeekChange >= 0 ? 'success' : 'warning') as StatusTone
    }
  ];

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
      {items.map((item, idx) => (
        <div key={item.label} className="card p-4 md:p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-brand-50/20 blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{item.label}</p>
              <p className="text-[11px] text-slate-400 mt-1">{item.helper}</p>
            </div>
            <span className="text-lg" aria-hidden>{item.icon}</span>
          </div>

          <div className="relative mt-3 flex items-end justify-between gap-3">
            <p className="text-2xl font-semibold tracking-tight text-slate-900">{item.value}</p>
            <Sparkline tone={item.tone} seed={idx * 17 + Math.round(kpis.totalTransactions % 53)} />
          </div>

          <div className="relative mt-3 flex items-center justify-between gap-2">
            <StatusBadge tone={item.tone}>
              {item.tone === 'success' ? 'Healthy' : item.tone === 'warning' ? 'Watch' : item.tone === 'risk' ? 'Risk' : item.tone === 'info' ? 'Info' : 'Neutral'}
            </StatusBadge>
            <p className="text-[11px] text-slate-600 text-right">{item.trend}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FilterEmptyState({ filteredCount }: { filteredCount: number }) {
  if (filteredCount > 0) return null;
  return (
    <div className="card p-4 border-rose-700/60 bg-rose-950/20">
      <p className="text-sm font-semibold text-rose-300">No records match the current filter scope.</p>
      <p className="text-xs text-slate-400 mt-1">Try widening the date range or resetting one or more filters.</p>
    </div>
  );
}
