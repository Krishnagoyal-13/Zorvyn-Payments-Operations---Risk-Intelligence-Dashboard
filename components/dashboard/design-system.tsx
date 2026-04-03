import type { ReactNode } from 'react';

export type StatusTone = 'success' | 'warning' | 'risk' | 'neutral' | 'info';

export const toneTokens: Record<StatusTone, { badge: string; subtleBg: string; text: string; border: string }> = {
  success: {
    badge: 'border-emerald-700/60 bg-emerald-900/30 text-emerald-300',
    subtleBg: 'bg-emerald-950/25',
    text: 'text-emerald-300',
    border: 'border-emerald-800/60'
  },
  warning: {
    badge: 'border-amber-700/60 bg-amber-900/25 text-amber-300',
    subtleBg: 'bg-amber-950/25',
    text: 'text-amber-300',
    border: 'border-amber-800/60'
  },
  risk: {
    badge: 'border-rose-700/60 bg-rose-900/25 text-rose-300',
    subtleBg: 'bg-rose-950/25',
    text: 'text-rose-300',
    border: 'border-rose-800/60'
  },
  neutral: {
    badge: 'border-slate-700/60 bg-slate-800/60 text-slate-300',
    subtleBg: 'bg-slate-900/55',
    text: 'text-slate-300',
    border: 'border-slate-700/70'
  },
  info: {
    badge: 'border-sky-700/60 bg-sky-900/25 text-sky-300',
    subtleBg: 'bg-sky-950/25',
    text: 'text-sky-300',
    border: 'border-sky-800/60'
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
      <p className="text-xs text-slate-300 leading-relaxed">{children}</p>
    </div>
  );
}


export function ExecutiveCard({
  label,
  tone,
  fact,
  interpretation,
  recommendation,
  confidence
}: {
  label: string;
  tone: StatusTone;
  fact: string;
  interpretation: string;
  recommendation: string;
  confidence: 'High' | 'Medium';
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-100">{label}</p>
        <StatusBadge tone={tone}>Confidence: {confidence}</StatusBadge>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed">{fact}</p>
      <p className="text-xs text-slate-400 leading-relaxed">{interpretation}</p>
      <p className="text-xs text-slate-200 leading-relaxed">{recommendation}</p>
    </div>
  );
}
