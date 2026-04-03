'use client';

import { FilterState, KPISet } from '@/types/payments';
import { formatCurrency } from '@/lib/aggregations';

type OptionMap = {
  regions: string[];
  methods: string[];
  segments: string[];
  statuses: string[];
};

type Tone = 'positive' | 'warning' | 'risk' | 'neutral';

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-1">
      <h2 className="section-title">{title}</h2>
      {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
    </div>
  );
}

export function FilterBar({
  filters,
  options,
  onChange
}: {
  filters: FilterState;
  options: OptionMap;
  onChange: (next: FilterState) => void;
}) {
  const set = (key: keyof FilterState, value: string) => onChange({ ...filters, [key]: value });

  const selectClass =
    'h-10 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm font-medium text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-brand-100';

  return (
    <section className="card p-4 md:p-5 sticky top-3 z-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5 md:gap-3">
        <input className={selectClass} type="date" value={filters.startDate} onChange={(e) => set('startDate', e.target.value)} />
        <input className={selectClass} type="date" value={filters.endDate} onChange={(e) => set('endDate', e.target.value)} />
        <select className={selectClass} value={filters.region} onChange={(e) => set('region', e.target.value)}>
          {['All Regions', ...options.regions].map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <select className={selectClass} value={filters.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)}>
          {['All Methods', ...options.methods].map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <select className={selectClass} value={filters.merchantSegment} onChange={(e) => set('merchantSegment', e.target.value)}>
          {['All Segments', ...options.segments].map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <select className={selectClass} value={filters.transactionStatus} onChange={(e) => set('transactionStatus', e.target.value)}>
          {['All Statuses', ...options.statuses].map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <button
          className="h-10 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          onClick={() =>
            onChange({
              ...filters,
              region: 'All Regions',
              paymentMethod: 'All Methods',
              merchantSegment: 'All Segments',
              transactionStatus: 'All Statuses'
            })
          }
        >
          Reset Filters
        </button>
      </div>
    </section>
  );
}

const toneClasses: Record<Tone, string> = {
  positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  risk: 'bg-rose-50 text-rose-700 border-rose-200',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200'
};

function Sparkline({ tone, seed }: { tone: Tone; seed: number }) {
  const bars = Array.from({ length: 8 }).map((_, idx) => {
    const base = ((seed + idx * 13) % 65) + 25;
    return Math.max(18, Math.min(100, base));
  });

  const barClass = tone === 'positive' ? 'bg-emerald-400/70' : tone === 'warning' ? 'bg-amber-400/75' : tone === 'risk' ? 'bg-rose-400/75' : 'bg-slate-400/70';

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
      tone: (kpis.weekOverWeekChange >= 0 ? 'positive' : 'warning') as Tone
    },
    {
      label: 'Successful Transactions',
      icon: '✅',
      value: kpis.successfulTransactions.toLocaleString(),
      helper: 'Approved by gateway/acquirer',
      trend: kpis.paymentSuccessRate > 92 ? 'Strong quality band' : 'Needs reliability improvement',
      tone: (kpis.paymentSuccessRate > 92 ? 'positive' : 'warning') as Tone
    },
    {
      label: 'Failed Transactions',
      icon: '⛔',
      value: kpis.failedTransactions.toLocaleString(),
      helper: 'Declined, timeout, or processing errors',
      trend: kpis.failedTransactions < kpis.successfulTransactions * 0.1 ? 'Contained failure volume' : 'Failure escalation watch',
      tone: (kpis.failedTransactions < kpis.successfulTransactions * 0.1 ? 'warning' : 'risk') as Tone
    },
    {
      label: 'Payment Success Rate',
      icon: '🎯',
      value: `${kpis.paymentSuccessRate.toFixed(1)}%`,
      helper: 'Success / total transactions',
      trend: kpis.paymentSuccessRate >= 95 ? 'Excellent conversion stability' : 'Opportunity in checkout routing',
      tone: (kpis.paymentSuccessRate >= 95 ? 'positive' : 'warning') as Tone
    },
    {
      label: 'Refund Rate',
      icon: '↩️',
      value: `${kpis.refundRate.toFixed(1)}%`,
      helper: 'Refunded / total transactions',
      trend: kpis.refundRate <= 8 ? 'Within control threshold' : 'Margin pressure risk',
      tone: (kpis.refundRate <= 8 ? 'positive' : 'risk') as Tone
    },
    {
      label: 'Average Settlement Time',
      icon: '⏱️',
      value: `${kpis.averageSettlementTime.toFixed(2)}d`,
      helper: 'Average payout lag',
      trend: kpis.averageSettlementTime <= 2.5 ? 'Fast settlement cycle' : 'SLA attention needed',
      tone: (kpis.averageSettlementTime <= 2.5 ? 'positive' : 'warning') as Tone
    },
    {
      label: 'Total Processed Amount',
      icon: '💳',
      value: formatCurrency(kpis.totalProcessedAmount),
      helper: 'Gross payment volume (GPV)',
      trend: 'Healthy transaction throughput',
      tone: 'positive' as Tone
    },
    {
      label: 'Flagged Transactions',
      icon: '🛡️',
      value: kpis.flaggedTransactions.toLocaleString(),
      helper: 'Risk or policy-triggered reviews',
      trend: kpis.flaggedTransactions / Math.max(kpis.totalTransactions, 1) < 0.12 ? 'Monitoring within band' : 'Fraud alert density rising',
      tone: (kpis.flaggedTransactions / Math.max(kpis.totalTransactions, 1) < 0.12 ? 'warning' : 'risk') as Tone
    },
    {
      label: 'Net Revenue Impact',
      icon: '💰',
      value: formatCurrency(kpis.netRevenueImpact),
      helper: 'Amount minus refunds',
      trend: kpis.netRevenueImpact > 0 ? 'Positive contribution margin' : 'Negative impact risk',
      tone: (kpis.netRevenueImpact > 0 ? 'positive' : 'risk') as Tone
    },
    {
      label: 'Week-over-Week Change',
      icon: '📊',
      value: `${kpis.weekOverWeekChange.toFixed(1)}%`,
      helper: 'Current week vs previous week volume',
      trend: kpis.weekOverWeekChange >= 0 ? 'Acceleration in throughput' : 'Demand softness observed',
      tone: (kpis.weekOverWeekChange >= 0 ? 'positive' : 'warning') as Tone
    }
  ];

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
      {items.map((item, idx) => (
        <div key={item.label} className="card p-4 md:p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-brand-50/60 blur-2xl" />
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
            <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-medium ${toneClasses[item.tone]}`}>
              {item.tone === 'positive' ? 'Positive' : item.tone === 'warning' ? 'Watch' : item.tone === 'risk' ? 'Risk' : 'Neutral'}
            </span>
            <p className="text-[11px] text-slate-600 text-right">{item.trend}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
