'use client';

import { useMemo, useState } from 'react';
import { rawTransactions } from '@/data/rawTransactions';
import { cleanTransactions } from '@/lib/cleaning';
import { buildKPISet, variancePercent } from '@/lib/metrics';
import { byFailureReason, byPaymentMethod, byRegion, groupByDay, merchantPerformance } from '@/lib/aggregations';
import { buildInsights } from '@/lib/insights';
import { FilterState } from '@/types/payments';
import { FilterBar, KPIGrid, SectionHeader } from '@/components/dashboard/ui';
import {
  AlertsPanel,
  Area,
  AreaChart,
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Cell,
  ChartCard,
  ComposedChart,
  CustomTooltip,
  DataQualitySection,
  DelayedMerchantsTable,
  HeroSection,
  Legend,
  Line,
  LineChart,
  MerchantTable,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  chartTheme
} from '@/components/dashboard/sections';

const cleanedOutput = cleanTransactions(rawTransactions);

type TrendMode = 'volume' | 'success' | 'risk';

export default function Page() {
  const [filters, setFilters] = useState<FilterState>({
    startDate: '2026-01-01',
    endDate: '2026-03-31',
    region: 'All Regions',
    paymentMethod: 'All Methods',
    merchantSegment: 'All Segments',
    transactionStatus: 'All Statuses'
  });
  const [trendMode, setTrendMode] = useState<TrendMode>('volume');
  const [paymentView, setPaymentView] = useState<'count' | 'amount'>('count');

  const filterOptions = useMemo(
    () => ({
      regions: [...new Set(cleanedOutput.cleaned.map((t) => t.region))],
      methods: [...new Set(cleanedOutput.cleaned.map((t) => t.paymentMethod))],
      segments: [...new Set(cleanedOutput.cleaned.map((t) => t.merchantSegment))],
      statuses: [...new Set(cleanedOutput.cleaned.map((t) => t.transactionStatus))]
    }),
    []
  );

  const filtered = useMemo(
    () =>
      cleanedOutput.cleaned.filter((t) => {
        const passDate = t.transactionDate >= filters.startDate && t.transactionDate <= filters.endDate;
        const passRegion = filters.region === 'All Regions' || t.region === filters.region;
        const passMethod = filters.paymentMethod === 'All Methods' || t.paymentMethod === filters.paymentMethod;
        const passSegment = filters.merchantSegment === 'All Segments' || t.merchantSegment === filters.merchantSegment;
        const passStatus = filters.transactionStatus === 'All Statuses' || t.transactionStatus === filters.transactionStatus;
        return passDate && passRegion && passMethod && passSegment && passStatus;
      }),
    [filters]
  );

  const kpis = useMemo(() => buildKPISet(filtered), [filtered]);
  const daily = useMemo(() => groupByDay(filtered), [filtered]);
  const methods = useMemo(() => byPaymentMethod(filtered), [filtered]);
  const failures = useMemo(() => byFailureReason(filtered), [filtered]);
  const regions = useMemo(() => byRegion(filtered), [filtered]);
  const merchants = useMemo(() => merchantPerformance(filtered), [filtered]);
  const insights = useMemo(() => buildInsights(filtered), [filtered]);

  const refundByMethod = methods.map((m) => ({ method: m.method, refundRate: m.count ? (m.refunds / m.count) * 100 : 0 }));

  const delayedMerchants = merchants
    .map((m) => {
      const rows = filtered.filter((t) => t.merchantName === m.merchantName);
      const avgDelay = rows.reduce((s, t) => s + t.settlementDelayDays, 0) / Math.max(rows.length, 1);
      return { merchant: m.merchantName, avgDelay, txCount: rows.length };
    })
    .filter((m) => m.avgDelay > 3)
    .slice(0, 6);

  const suspiciousSegments = Object.entries(
    filtered.reduce<Record<string, number>>((acc, tx) => {
      if (tx.flaggedRisk) acc[tx.merchantSegment] = (acc[tx.merchantSegment] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([segment, flagged]) => ({ segment, flagged }))
    .sort((a, b) => b.flagged - a.flagged)
    .slice(0, 3);

  const forecastSummary = {
    forecastVolume: filtered.reduce((s, t) => s + t.forecastedVolume, 0),
    actualVolume: filtered.reduce((s, t) => s + t.actualVolume, 0),
    forecastAmount: filtered.reduce((s, t) => s + t.forecastedAmount, 0),
    actualAmount: filtered.reduce((s, t) => s + t.actualAmount, 0)
  };

  const alerts = [
    `${kpis.flaggedTransactions} transactions flagged for elevated fraud risk in selected period.`,
    `${delayedMerchants.length} merchants exceeded 3-day settlement threshold.`,
    `${failures[0]?.reason ?? 'No failure reason'} is the top payment failure reason currently.`
  ];

  const trendButtons: TrendMode[] = ['volume', 'success', 'risk'];

  return (
    <main className="max-w-[1360px] mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6 md:space-y-7">
      <HeroSection />
      <FilterBar filters={filters} options={filterOptions} onChange={setFilters} />

      <DataQualitySection summary={cleanedOutput.summary} rawSample={cleanedOutput.rawSample} cleanedSample={cleanedOutput.cleanedSample} />

      <section className="section-shell">
        <SectionHeader title="KPI Overview" subtitle="Core payments operations and risk intelligence indicators." />
        <KPIGrid kpis={kpis} />
      </section>

      <section className="section-shell">
        <SectionHeader title="Transaction Performance" subtitle="Interactive command center for payment throughput, conversion quality, and regional behavior." />
        <div className="grid lg:grid-cols-2 gap-3 md:gap-4">
          <ChartCard
            title="Daily Transaction Intelligence"
            subtitle="Toggle the primary signal"
            rightAction={
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs">
                {trendButtons.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTrendMode(mode)}
                    className={`px-2 py-1 rounded-md capitalize ${trendMode === mode ? 'bg-white shadow text-brand-700' : 'text-slate-600'}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            }
          >
            <ResponsiveContainer>
              <AreaChart data={daily}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartTheme.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartTheme.primary} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" hide />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Area dataKey={trendMode === 'volume' ? 'volume' : trendMode === 'success' ? 'success' : 'flagged'} stroke={chartTheme.primary} fill="url(#trendGradient)" strokeWidth={2} />
                <Brush dataKey="date" height={20} stroke="#94a3b8" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Success vs Failure (Stacked)" subtitle="Outcome mix by day">
            <ResponsiveContainer><BarChart data={daily}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" hide /><YAxis /><Tooltip content={<CustomTooltip />} /><Legend /><Bar dataKey="success" stackId="a" fill={chartTheme.success} radius={[6, 6, 0, 0]} /><Bar dataKey="failed" stackId="a" fill={chartTheme.failed} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard
            title="Payment Method Comparison"
            subtitle="Switch between transaction count and gross amount"
            rightAction={
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs">
                {(['count', 'amount'] as const).map((mode) => (
                  <button key={mode} onClick={() => setPaymentView(mode)} className={`px-2 py-1 rounded-md ${paymentView === mode ? 'bg-white shadow text-brand-700' : 'text-slate-600'}`}>{mode}</button>
                ))}
              </div>
            }
          >
            <ResponsiveContainer><ComposedChart data={methods}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="method" /><YAxis /><Tooltip content={<CustomTooltip />} /><Bar dataKey={paymentView === 'count' ? 'count' : 'amount'} fill={chartTheme.primary} radius={[8, 8, 0, 0]} /></ComposedChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Top Failure Reasons" subtitle="Failure concentration prioritization">
            <ResponsiveContainer><BarChart data={failures} layout="vertical"><XAxis type="number" /><YAxis dataKey="reason" type="category" width={120} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="count" fill={chartTheme.failed} radius={[0, 8, 8, 0]} /></BarChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Region-wise Performance" subtitle="Regional success/failure balance">
            <ResponsiveContainer><BarChart data={regions}><XAxis dataKey="region" /><YAxis /><Tooltip content={<CustomTooltip />} /><Legend /><Bar dataKey="success" fill={chartTheme.success} radius={[6, 6, 0, 0]} /><Bar dataKey="failed" fill={chartTheme.failed} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
          </ChartCard>
        </div>
      </section>

      <section className="section-shell">
        <SectionHeader title="Refunds & Settlements" subtitle="Post-transaction quality and payout efficiency." />
        <div className="grid lg:grid-cols-3 gap-3 md:gap-4">
          <ChartCard title="Refund Trend" subtitle="Daily refunded transaction count">
            <ResponsiveContainer><LineChart data={daily}><XAxis dataKey="date" hide /><YAxis /><Tooltip content={<CustomTooltip />} /><Line dataKey="refunds" stroke="#6366f1" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Refund Rate by Payment Method" subtitle="Method-level refund propensity">
            <ResponsiveContainer><BarChart data={refundByMethod}><XAxis dataKey="method" /><YAxis /><Tooltip content={<CustomTooltip />} /><Bar dataKey="refundRate" fill="#f97316" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Settlement Delay Analysis" subtitle="Speed-of-settlement distribution">
            <ResponsiveContainer><PieChart><Pie data={[
              { name: 'On-time (<=2d)', value: filtered.filter((t) => t.settlementDelayDays <= 2).length },
              { name: 'Moderate (3-4d)', value: filtered.filter((t) => t.settlementDelayDays > 2 && t.settlementDelayDays <= 4).length },
              { name: 'Delayed (>4d)', value: filtered.filter((t) => t.settlementDelayDays > 4).length }
            ]} dataKey="value" outerRadius={90} label>{['#10b981', '#f59e0b', '#ef4444'].map((c) => <Cell key={c} fill={c} />)}</Pie><Tooltip content={<CustomTooltip />} /></PieChart></ResponsiveContainer>
          </ChartCard>
        </div>
        <DelayedMerchantsTable delayed={delayedMerchants} />
      </section>

      <section className="section-shell">
        <SectionHeader title="Risk Monitoring" subtitle="Fraud-adjacent behavior signals and monitoring alerts." />
        <div className="grid lg:grid-cols-3 gap-3 md:gap-4">
          <ChartCard title="Flagged Transaction Trend" subtitle="Daily flagged pattern">
            <ResponsiveContainer><LineChart data={daily}><XAxis dataKey="date" hide /><YAxis /><Tooltip content={<CustomTooltip />} /><Line dataKey="flagged" stroke={chartTheme.flagged} strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>
          </ChartCard>
          <div className="card p-4 md:p-5">
            <h3 className="font-semibold mb-2">Suspicious Segment Highlights</h3>
            <div className="space-y-2">
              {suspiciousSegments.map((s) => (
                <div key={s.segment} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 flex justify-between">
                  <span>{s.segment}</span><span>{s.flagged} flagged</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-full">Anomaly: Risk score spikes</span>
              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full">Anomaly: Refund cluster</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Anomaly: Geo mismatch</span>
            </div>
          </div>
          <AlertsPanel alerts={alerts} />
        </div>
      </section>

      <section className="section-shell">
        <SectionHeader title="Merchant Performance" subtitle="Performance leaderboard with health segmentation." />
        <MerchantTable merchants={merchants} />
      </section>

      <section className="section-shell">
        <SectionHeader title="Forecast vs Actual" subtitle="Plan-vs-delivery view across volume and amount." />
        <div className="grid lg:grid-cols-3 gap-3 md:gap-4">
          <ChartCard title="Forecast vs Actual Volume">
            <ResponsiveContainer><BarChart data={[{ name: 'Volume', forecast: forecastSummary.forecastVolume, actual: forecastSummary.actualVolume }]}><XAxis dataKey="name" /><YAxis /><Tooltip content={<CustomTooltip />} /><Legend /><Bar dataKey="forecast" fill="#94a3b8" radius={[8, 8, 0, 0]} /><Bar dataKey="actual" fill={chartTheme.primary} radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Forecast vs Actual Amount">
            <ResponsiveContainer><BarChart data={[{ name: 'Amount', forecast: forecastSummary.forecastAmount, actual: forecastSummary.actualAmount }]}><XAxis dataKey="name" /><YAxis /><Tooltip content={<CustomTooltip />} /><Legend /><Bar dataKey="forecast" fill="#94a3b8" radius={[8, 8, 0, 0]} /><Bar dataKey="actual" fill="#0ea5e9" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
          </ChartCard>
          <div className="card p-4 md:p-5">
            <h3 className="font-semibold mb-2">Variance Explanation Panel</h3>
            <p className="text-sm text-slate-600">Volume variance: <span className="font-semibold">{variancePercent(forecastSummary.actualVolume, forecastSummary.forecastVolume).toFixed(1)}%</span></p>
            <p className="text-sm text-slate-600">Amount variance: <span className="font-semibold">{variancePercent(forecastSummary.actualAmount, forecastSummary.forecastAmount).toFixed(1)}%</span></p>
            <p className="mt-3 text-sm text-slate-600">Variance is primarily influenced by regional mix shifts, settlement timing, and higher-than-forecast refunds in selected segments.</p>
          </div>
        </div>
      </section>

      <section className="section-card">
        <SectionHeader title="Key Insights & Recommended Actions" subtitle="Narrative synthesized from the currently filtered scope." />
        <div className="grid lg:grid-cols-3 gap-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2">Key Insights</h3>
            <ul className="space-y-2 list-disc ml-5 text-slate-700">{insights.insights.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Business Risks</h3>
            <ul className="space-y-2 list-disc ml-5 text-slate-700">{insights.risks.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Recommended Actions</h3>
            <ul className="space-y-2 list-disc ml-5 text-slate-700">{insights.actions.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="section-card">
        <SectionHeader title="Methodology & Metric Definitions" subtitle="Transparent metric formulas used for this dashboard." />
        <div className="grid md:grid-cols-2 gap-3 text-sm text-slate-700">
          <p><strong>Success Rate</strong> = Successful transactions / Total transactions. <strong>Refund Rate</strong> = Refunded transactions / Total transactions.</p>
          <p><strong>Average Settlement Time</strong> = Mean settlement delay days across filtered transactions.</p>
          <p><strong>Merchant Health Score</strong> combines success, refund, and risk rates into a 0-100 composite.</p>
          <p><strong>Net Revenue Impact</strong> = Sum(transaction amount - refund amount). <strong>WoW Change</strong> compares latest 7 days to prior 7 days.</p>
        </div>
      </section>
    </main>
  );
}
