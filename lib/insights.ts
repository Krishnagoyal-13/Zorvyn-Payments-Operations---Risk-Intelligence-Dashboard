import { CleanTransaction } from '@/types/payments';
import { byFailureReason, merchantPerformance } from './aggregations';
import { refundRate, successRate } from './metrics';

export function buildInsights(data: CleanTransaction[]) {
  const insights: string[] = [];
  const risks: string[] = [];
  const actions: string[] = [];

  const sRate = successRate(data);
  const rRate = refundRate(data);

  insights.push(`Payment success rate is ${sRate.toFixed(1)}%, indicating ${sRate > 90 ? 'strong operational reliability' : 'material checkout friction'}.`);
  insights.push(`Refund rate is ${rRate.toFixed(1)}%, ${rRate > 12 ? 'above target and pressuring margin' : 'within acceptable control bands'}.`);

  const topFailure = byFailureReason(data)[0];
  if (topFailure) insights.push(`Top failure driver is ${topFailure.reason} with ${topFailure.count} failed transactions.`);

  const merchants = merchantPerformance(data);
  const critical = merchants.filter((m) => m.healthLabel === 'Critical');
  if (critical.length) {
    insights.push(`${critical.length} merchant(s) are in Critical health status and require immediate follow-up.`);
  }

  risks.push('High-risk flagged transactions may increase chargeback exposure if review queues are delayed.');
  risks.push('Settlement delays beyond 3 days create working capital pressure for merchants.');
  if (rRate > 10) risks.push('Elevated refund activity suggests product mismatch or fulfillment quality issues.');

  actions.push('Route top failure reasons through payment gateway retry logic and smart routing experiments.');
  actions.push('Introduce a daily watchlist for merchants with success rate below 85% or refund rate above 15%.');
  actions.push('Escalate all flagged transactions above risk score 85 for manual analyst verification.');
  actions.push('Set settlement SLA alerts for operations teams when average delay exceeds 2.5 days.');

  return {
    insights: insights.slice(0, 5),
    risks: risks.slice(0, 3),
    actions: actions.slice(0, 5)
  };
}
