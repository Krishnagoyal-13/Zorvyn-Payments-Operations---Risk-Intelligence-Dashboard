import { CleanTransaction, KPISet, MerchantHealth } from '@/types/payments';

const pct = (num: number, den: number) => (den === 0 ? 0 : (num / den) * 100);

export const successRate = (data: CleanTransaction[]) =>
  pct(
    data.filter((t) => t.transactionStatus === 'success').length,
    data.length
  );

export const failureRate = (data: CleanTransaction[]) =>
  pct(
    data.filter((t) => t.transactionStatus === 'failed').length,
    data.length
  );

export const refundRate = (data: CleanTransaction[]) =>
  pct(
    data.filter((t) => t.refundStatus !== 'none').length,
    data.length
  );

export const averageSettlementTime = (data: CleanTransaction[]) =>
  data.length === 0 ? 0 : data.reduce((sum, t) => sum + t.settlementDelayDays, 0) / data.length;

export const flaggedTransactionRate = (data: CleanTransaction[]) =>
  pct(
    data.filter((t) => t.flaggedRisk).length,
    data.length
  );

export const averageTransactionValue = (data: CleanTransaction[]) =>
  data.length === 0 ? 0 : data.reduce((sum, t) => sum + t.transactionAmount, 0) / data.length;

export const variancePercent = (actual: number, forecast: number) => pct(actual - forecast, forecast);

export const netRevenueImpact = (data: CleanTransaction[]) =>
  data.reduce((sum, t) => sum + t.transactionAmount - t.refundAmount, 0);

export function merchantHealthScore(transactions: CleanTransaction[]): number {
  const sRate = successRate(transactions);
  const rRate = refundRate(transactions);
  const riskRate = flaggedTransactionRate(transactions);
  return Math.max(0, Math.min(100, sRate * 0.55 + (100 - rRate) * 0.25 + (100 - riskRate) * 0.2));
}

export function merchantHealthLabel(score: number): MerchantHealth {
  if (score >= 80) return 'Healthy';
  if (score >= 60) return 'Watchlist';
  return 'Critical';
}

export function weekOverWeekChange(data: CleanTransaction[]): number {
  const sorted = [...data].sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));
  if (sorted.length < 14) return 0;

  const byDate = new Map<string, number>();
  sorted.forEach((tx) => {
    byDate.set(tx.transactionDate, (byDate.get(tx.transactionDate) ?? 0) + 1);
  });
  const daily = Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b));
  const recent = daily.slice(-14);
  const previousWeek = recent.slice(0, 7).reduce((s, [, v]) => s + v, 0);
  const currentWeek = recent.slice(7).reduce((s, [, v]) => s + v, 0);
  return variancePercent(currentWeek, previousWeek);
}

export function buildKPISet(data: CleanTransaction[]): KPISet {
  return {
    totalTransactions: data.length,
    successfulTransactions: data.filter((t) => t.transactionStatus === 'success').length,
    failedTransactions: data.filter((t) => t.transactionStatus === 'failed').length,
    paymentSuccessRate: successRate(data),
    refundRate: refundRate(data),
    averageSettlementTime: averageSettlementTime(data),
    totalProcessedAmount: data.reduce((sum, t) => sum + t.transactionAmount, 0),
    flaggedTransactions: data.filter((t) => t.flaggedRisk).length,
    netRevenueImpact: netRevenueImpact(data),
    weekOverWeekChange: weekOverWeekChange(data)
  };
}
