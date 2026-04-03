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
    <div className="mb-4">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      {subtitle ? <p className="text-sm text-slate-600 mt-1">{subtitle}</p> : null}
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

  const selectClass = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700';

  return (
    <section className="card p-4 sticky top-3 z-20">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
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
          className="rounded-xl bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
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
    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {items.map(([label, value]) => (
        <div key={label} className="card p-4">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-lg font-semibold text-slate-900 mt-1">{value}</p>
        </div>
      ))}
    </div>
  );
}
