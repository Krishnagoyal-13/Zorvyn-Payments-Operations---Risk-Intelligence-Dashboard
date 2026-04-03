'use client';

import { FilterState, KPISet } from '@/types/payments';
import { formatCurrency } from '@/lib/aggregations';

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

export function KPIGrid({ kpis }: { kpis: KPISet }) {
  const items = [
    ['Total Transactions', kpis.totalTransactions.toLocaleString()],
    ['Successful Transactions', kpis.successfulTransactions.toLocaleString()],
    ['Failed Transactions', kpis.failedTransactions.toLocaleString()],
    ['Payment Success Rate', `${kpis.paymentSuccessRate.toFixed(1)}%`],
    ['Refund Rate', `${kpis.refundRate.toFixed(1)}%`],
    ['Average Settlement Time', `${kpis.averageSettlementTime.toFixed(2)} days`],
    ['Total Processed Amount', formatCurrency(kpis.totalProcessedAmount)],
    ['Flagged Transactions', kpis.flaggedTransactions.toLocaleString()],
    ['Net Revenue Impact', formatCurrency(kpis.netRevenueImpact)],
    ['Week-over-Week Change', `${kpis.weekOverWeekChange.toFixed(1)}%`]
  ];

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
      {items.map(([label, value]) => (
        <div key={label} className="card p-4 md:p-5">
          <p className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">{label}</p>
          <p className="text-2xl font-semibold tracking-tight text-slate-900 mt-2">{value}</p>
        </div>
      ))}
    </div>
  );
}
