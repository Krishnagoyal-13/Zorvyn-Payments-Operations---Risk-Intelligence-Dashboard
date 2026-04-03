import type { ReactNode } from 'react';

export type StatusTone = 'success' | 'warning' | 'risk' | 'neutral' | 'info';

export const toneTokens: Record<StatusTone, { badge: string; subtleBg: string; text: string; border: string }> = {
  success: {
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    subtleBg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200'
  },
  warning: {
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    subtleBg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200'
  },
  risk: {
    badge: 'border-rose-200 bg-rose-50 text-rose-700',
    subtleBg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200'
  },
  neutral: {
    badge: 'border-slate-200 bg-slate-100 text-slate-700',
    subtleBg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200'
  },
  info: {
    badge: 'border-sky-200 bg-sky-50 text-sky-700',
    subtleBg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200'
  }
};

export function SectionContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`section-card ${className}`.trim()}>{children}</section>;
}

export function ChartContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card p-4 md:p-5 flex flex-col ${className}`.trim()}>{children}</div>;
}

export function StatusBadge({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-medium ${toneTokens[tone].badge}`}>{children}</span>;
}

export function InsightCard({
  title,
  tone,
  children
}: {
  title: string;
  tone: StatusTone;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-xl border p-4 ${toneTokens[tone].border} ${toneTokens[tone].subtleBg}`}>
      <h4 className={`text-sm font-semibold mb-1 ${toneTokens[tone].text}`}>{title}</h4>
      <p className="text-xs text-slate-700 leading-relaxed">{children}</p>
    </div>
  );
}
