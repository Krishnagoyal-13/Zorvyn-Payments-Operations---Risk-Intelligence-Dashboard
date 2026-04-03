'use client';

import { useMemo, useState } from 'react';
import { rawTransactions } from '@/data/rawTransactions';
import { cleanTransactions } from '@/lib/cleaning';
import { buildKPISet, variancePercent } from '@/lib/metrics';
import { byFailureReason, byPaymentMethod, byRegion, groupByDay, merchantPerformance } from '@/lib/aggregations';
import { buildInsights } from '@/lib/insights';
import { buildExecutiveBrief } from '@/lib/executive';
import { FilterState } from '@/types/payments';
import { FilterBar, FilterEmptyState, KPIGrid, SectionHeader } from '@/components/dashboard/ui';
import { ExecutiveCard, InsightCard, SectionContainer, StatusBadge } from '@/components/dashboard/design-system';
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
const allDates = cleanedOutput.cleaned.map((t) => t.transactionDate).sort();
const minDate = allDates[0] ?? '2026-01-01';
const maxDate = allDates[allDates.length - 1] ?? '2026-03-31';

type TrendMode = 'volume' | 'success' | 'risk';

export default function Page() {
  const [filters, setFilters] = useState<FilterState>({
    startDate: minDate,
    endDate: maxDate,
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
  const executive = useMemo(() => buildExecutiveBrief(filtered), [filtered]);

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
    <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-5">
      <HeroSection />
      <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] gap-4 items-start">
        <aside className="lg:sticky top-4 space-y-3">
          <FilterBar filters={filters} options={filterOptions} onChange={setFilters} minDate={minDate} maxDate={maxDate} totalCount={cleanedOutput.cleaned.length} filteredCount={filtered.length} />
          <FilterEmptyState filteredCount={filtered.length} />
        </aside>

        <div className="space-y-6 md:space-y-7">
          <SectionContainer>
        <SectionHeader title="Executive Briefing" subtitle="Leadership-oriented summary with explicit separation of observed facts, interpretation, and recommended next actions." />
        <div className="grid lg:grid-cols-3 gap-3">
          {executive.observations.map((item) => (
            <ExecutiveCard
              key={`obs-${item.title}`}
              label={`Observation · ${item.title}`}
              tone="info"
              fact={item.fact}
              interpretation={item.interpretation}
              recommendation={item.recommendation}
              confidence={item.confidence}
            />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-3 mt-3">
          {executive.risks.map((item) => (
            <ExecutiveCard
              key={`risk-${item.title}`}
              label={`Operational Risk · ${item.title}`}
              tone="risk"
              fact={item.fact}
              interpretation={item.interpretation}
              recommendation={item.recommendation}
              confidence={item.confidence}
            />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-3 mt-3">
          {executive.actions.map((item, index) => (
            <ExecutiveCard
              key={`action-${item.title}-${index}`}
              label={`Recommended Action ${index + 1}`}
              tone="success"
              fact={item.fact}
              interpretation={item.interpretation}
              recommendation={item.recommendation}
              confidence={item.confidence}
            />
          ))}
        </div>
      </SectionContainer>

      <DataQualitySection summary={cleanedOutput.summary} rawSample={cleanedOutput.rawSample} cleanedSample={cleanedOutput.cleanedSample} />

      <section className="section-shell">
        <SectionHeader title="KPI Overview" subtitle="Core payments operations and risk intelligence indicators." />
        <KPIGrid kpis={kpis} />
      </section>

      <section className="section-shell">
        <SectionHeader title="Transaction Performance" subtitle="What is happening across volume and conversion, and where intervention should focus first." />
        <div className="grid lg:grid-cols-2 gap-3 md:gap-4">
          <ChartCard
            title="Daily Transaction Signal"
            subtitle="Volume, success, or risk signal over time"
            whyItMatters="Trend inflections here are the earliest sign of conversion shifts, risk surges, or demand slowdown."
            rightAction={
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs">
                {trendButtons.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTrendMode(mode)}
                    className={`px-2 py-1 rounded-md capitalize ${trendMode === mode ? 'bg-brand-900/40 border border-brand-600 text-brand-200' : 'text-slate-400'}`}
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
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickMargin={8} />
                <YAxis tick={{ fontSize: 11 }} width={42} />
                <Tooltip content={<CustomTooltip />} />
                <Area dataKey={trendMode === 'volume' ? 'volume' : trendMode === 'success' ? 'success' : 'flagged'} stroke={chartTheme.primary} fill="url(#trendGradient)" strokeWidth={2} />
                <Brush dataKey="date" height={20} stroke="#94a3b8" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Outcome Mix by Day" subtitle="Successful vs failed transactions" whyItMatters="A widening failure share is typically a conversion and revenue leak that should be triaged immediately.">
            <ResponsiveContainer><BarChart data={daily}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" hide /><YAxis tick={{ fontSize: 11 }} width={42} /><Tooltip content={<CustomTooltip />} /><Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="success" stackId="a" fill={chartTheme.success} radius={[6, 6, 0, 0]} /><Bar dataKey="failed" stackId="a" fill={chartTheme.failed} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard
            title="Payment Method Performance"
            subtitle="Compare throughput and amount by payment rail"
            rightAction={
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs">
                {(['count', 'amount'] as const).map((mode) => (
                  <button key={mode} onClick={() => setPaymentView(mode)} className={`px-2 py-1 rounded-md ${paymentView === mode ? 'bg-brand-900/40 border border-brand-600 text-brand-200' : 'text-slate-400'}`}>{mode}</button>
                ))}
              </div>
            }
          >
            <ResponsiveContainer><ComposedChart data={methods}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="method" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={42} /><Tooltip content={<CustomTooltip />} /><Bar dataKey={paymentView === 'count' ? 'count' : 'amount'} fill={chartTheme.primary} radius={[8, 8, 0, 0]} /></ComposedChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Top Failure Reasons" subtitle="Primary drivers behind declines and checkout friction" whyItMatters="Concentrated failure reasons indicate where retry logic, routing, or issuer partnerships can deliver fastest gains.">
            <ResponsiveContainer><BarChart data={failures} layout="vertical"><XAxis type="number" /><YAxis dataKey="reason" type="category" width={120} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="count" fill={chartTheme.failed} radius={[0, 8, 8, 0]} /></BarChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Regional Performance Balance" subtitle="Compare success and failure patterns by geography" whyItMatters="Regional variance often indicates localization, issuer mix, or gateway coverage gaps.">
            <ResponsiveContainer><BarChart data={regions}><XAxis dataKey="region" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={42} /><Tooltip content={<CustomTooltip />} /><Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="success" fill={chartTheme.success} radius={[6, 6, 0, 0]} /><Bar dataKey="failed" fill={chartTheme.failed} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
          </ChartCard>
        </div>
      </section>

      <section className="section-shell">
        <SectionHeader title="Refunds & Settlements" subtitle="How post-payment quality and payout speed impact merchant trust and margin." />
        <div className="grid lg:grid-cols-3 gap-3 md:gap-4">
          <ChartCard title="Refund Trend" subtitle="Daily refunded transaction count" whyItMatters="Sustained refund growth can signal product mismatch, operations friction, or policy abuse.">
            <ResponsiveContainer><LineChart data={daily}><XAxis dataKey="date" hide /><YAxis tick={{ fontSize: 11 }} width={42} /><Tooltip content={<CustomTooltip />} /><Line dataKey="refunds" stroke="#6366f1" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Refund Rate by Payment Method" subtitle="Method-level refund propensity" whyItMatters="Method-level outliers reveal where customer experience and policy controls should be tightened.">
            <ResponsiveContainer><BarChart data={refundByMethod}><XAxis dataKey="method" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={42} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="refundRate" fill="#f97316" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Settlement Delay Analysis" subtitle="Speed-of-settlement distribution" whyItMatters="Delayed settlements increase merchant dissatisfaction and working-capital pressure.">
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
        <SectionHeader title="Risk Monitoring" subtitle="Where risk pressure is rising and which segments need immediate review." />
        <div className="grid lg:grid-cols-3 gap-3 md:gap-4">
          <ChartCard title="Flagged Transaction Trend" subtitle="Daily flagged pattern" whyItMatters="A rising flagged trend increases manual-review load and potential chargeback exposure.">
            <ResponsiveContainer><LineChart data={daily}><XAxis dataKey="date" hide /><YAxis tick={{ fontSize: 11 }} width={42} /><Tooltip content={<CustomTooltip />} /><Line dataKey="flagged" stroke={chartTheme.flagged} strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>
          </ChartCard>
          <div className="card p-4 md:p-5">
            <div className="flex items-center justify-between mb-2"><h3 className="font-semibold">Suspicious Segment Highlights</h3><StatusBadge tone="risk">Risk Signal</StatusBadge></div>
            <div className="space-y-2">
              {suspiciousSegments.map((s) => (
                <div key={s.segment} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 flex justify-between">
                  <span>{s.segment}</span><span>{s.flagged} flagged</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <StatusBadge tone="risk">Anomaly: Risk score spikes</StatusBadge>
              <StatusBadge tone="warning">Anomaly: Refund cluster</StatusBadge>
              <StatusBadge tone="info">Anomaly: Geo mismatch</StatusBadge>
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
        <SectionHeader title="Forecast vs Actual" subtitle="Whether operational outcomes are tracking plan across throughput and dollar volume." />
        <div className="grid lg:grid-cols-3 gap-3 md:gap-4">
          <ChartCard title="Forecast vs Actual Volume" whyItMatters="Persistent underperformance vs forecast should trigger demand and funnel diagnostics.">
            <ResponsiveContainer><BarChart data={[{ name: 'Volume', forecast: forecastSummary.forecastVolume, actual: forecastSummary.actualVolume }]}><XAxis dataKey="name" /><YAxis tick={{ fontSize: 11 }} width={42} /><Tooltip content={<CustomTooltip />} /><Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="forecast" fill="#94a3b8" radius={[8, 8, 0, 0]} /><Bar dataKey="actual" fill={chartTheme.primary} radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Forecast vs Actual Amount" whyItMatters="Amount variance helps separate volume shifts from transaction-value shifts.">
            <ResponsiveContainer><BarChart data={[{ name: 'Amount', forecast: forecastSummary.forecastAmount, actual: forecastSummary.actualAmount }]}><XAxis dataKey="name" /><YAxis tick={{ fontSize: 11 }} width={42} /><Tooltip content={<CustomTooltip />} /><Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="forecast" fill="#94a3b8" radius={[8, 8, 0, 0]} /><Bar dataKey="actual" fill="#0ea5e9" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
          </ChartCard>
          <div className="card p-4 md:p-5">
            <h3 className="font-semibold mb-2">Variance Explanation Panel</h3>
            <p className="text-sm text-slate-600">Volume variance: <span className="font-semibold">{variancePercent(forecastSummary.actualVolume, forecastSummary.forecastVolume).toFixed(1)}%</span></p>
            <p className="text-sm text-slate-600">Amount variance: <span className="font-semibold">{variancePercent(forecastSummary.actualAmount, forecastSummary.forecastAmount).toFixed(1)}%</span></p>
            <p className="mt-3 text-sm text-slate-600">Variance is primarily influenced by regional mix shifts, settlement timing, and higher-than-forecast refunds in selected segments.</p>
          </div>
        </div>
      </section>

      <SectionContainer>
        <SectionHeader title="Key Insights & Recommended Actions" subtitle="Narrative synthesized from the currently filtered scope." />
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-slate-800">Key Insights</h3>
            {insights.insights.map((item) => (
              <InsightCard key={item} title="Observation" tone="info">{item}</InsightCard>
            ))}
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-slate-800">Business Risks</h3>
            {insights.risks.map((item) => (
              <InsightCard key={item} title="Risk" tone="risk">{item}</InsightCard>
            ))}
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-slate-800">Recommended Actions</h3>
            {insights.actions.map((item) => (
              <InsightCard key={item} title="Action" tone="success">{item}</InsightCard>
            ))}
          </div>
        </div>
      </SectionContainer>

          <SectionContainer>
            <SectionHeader title="Methodology & Metric Definitions" subtitle="Transparent metric formulas used for this dashboard." />
            <div className="grid md:grid-cols-2 gap-3 text-sm text-slate-700">
              <p><strong>Success Rate</strong> = Successful transactions / Total transactions. <strong>Refund Rate</strong> = Refunded transactions / Total transactions.</p>
              <p><strong>Average Settlement Time</strong> = Mean settlement delay days across filtered transactions.</p>
              <p><strong>Merchant Health Score</strong> combines success, refund, and risk rates into a 0-100 composite.</p>
              <p><strong>Net Revenue Impact</strong> = Sum(transaction amount - refund amount). <strong>WoW Change</strong> compares latest 7 days to prior 7 days.</p>
            </div>
          </SectionContainer>
        </div>
      </div>
    </main>
  );
}
