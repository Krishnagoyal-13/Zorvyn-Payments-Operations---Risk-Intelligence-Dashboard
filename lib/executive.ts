import { CleanTransaction } from '@/types/payments';
import { byFailureReason } from './aggregations';
import { refundRate, successRate } from './metrics';

export interface ExecutiveBriefItem {
  title: string;
  fact: string;
  interpretation: string;
  recommendation: string;
  confidence: 'High' | 'Medium';
}

export function buildExecutiveBrief(data: CleanTransaction[]): {
  observations: ExecutiveBriefItem[];
  risks: ExecutiveBriefItem[];
  actions: ExecutiveBriefItem[];
} {
  const sRate = successRate(data);
  const rRate = refundRate(data);
  const flagged = data.filter((d) => d.flaggedRisk).length;
  const total = data.length || 1;
  const failTop = byFailureReason(data)[0];
  const westRefundRate = (() => {
    const west = data.filter((d) => d.region === 'North America');
    if (!west.length) return 0;
    return (west.filter((d) => d.refundStatus !== 'none').length / west.length) * 100;
  })();

  const observations: ExecutiveBriefItem[] = [
    {
      title: 'Payment reliability',
      fact: `Observed fact: Payment success rate is ${sRate.toFixed(1)}% for the selected period.`,
      interpretation:
        sRate >= 94
          ? 'Interpretation: Performance appears stable; intermittent failures still warrant routine monitoring.'
          : 'Interpretation: This may indicate conversion friction in parts of the payment flow.',
      recommendation:
        'Recommended next step: review decline cohorts by merchant and payment method before changing retry or routing logic.',
      confidence: 'High'
    },
    {
      title: 'Refund behavior',
      fact: `Observed fact: Overall refund rate is ${rRate.toFixed(1)}%, and North America is ${westRefundRate.toFixed(1)}%.`,
      interpretation:
        'Interpretation: Elevated refund activity may indicate operational friction or merchant-specific fulfillment issues.',
      recommendation:
        'Recommended next step: review merchant-level refund concentration before adjusting policy.',
      confidence: 'Medium'
    },
    {
      title: 'Failure concentration',
      fact: `Observed fact: Top failure reason is ${failTop?.reason ?? 'not available'} (${failTop?.count ?? 0} records).`,
      interpretation:
        'Interpretation: Concentration in one failure mode can support targeted remediation without broad platform changes.',
      recommendation:
        'Recommended next step: validate gateway/issuer path performance for this failure category over the next cycle.',
      confidence: 'High'
    }
  ];

  const risks: ExecutiveBriefItem[] = [
    {
      title: 'Fraud review load',
      fact: `Observed fact: ${flagged} of ${total} transactions are flagged (${((flagged / total) * 100).toFixed(1)}%).`,
      interpretation:
        'Interpretation: If flagged density remains elevated, manual review queues may delay decisioning and settlement.',
      recommendation:
        'Recommended next step: validate queue SLA and prioritize high-score cases for same-day review.',
      confidence: 'High'
    },
    {
      title: 'Margin sensitivity',
      fact: `Observed fact: Refund rate currently stands at ${rRate.toFixed(1)}%.`,
      interpretation:
        'Interpretation: This may create net revenue sensitivity if concentrated in high-volume merchants.',
      recommendation:
        'Recommended next step: perform merchant-segment variance analysis before enforcing portfolio-wide policy changes.',
      confidence: 'Medium'
    }
  ];

  const actions = [
    observations[0],
    observations[1],
    risks[0]
  ];

  return { observations, risks, actions };
}
