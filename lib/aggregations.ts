import { CleanTransaction, MerchantStats } from '@/types/payments';
import { averageTransactionValue, merchantHealthLabel, merchantHealthScore, refundRate, successRate } from './metrics';

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

export function groupByDay(data: CleanTransaction[]) {
  const map = new Map<string, { date: string; volume: number; success: number; failed: number; flagged: number; refunds: number }>();
  data.forEach((t) => {
    const base = map.get(t.transactionDate) ?? { date: t.transactionDate, volume: 0, success: 0, failed: 0, flagged: 0, refunds: 0 };
    base.volume += 1;
    if (t.transactionStatus === 'success') base.success += 1;
    if (t.transactionStatus === 'failed') base.failed += 1;
    if (t.flaggedRisk) base.flagged += 1;
    if (t.refundStatus !== 'none') base.refunds += 1;
    map.set(t.transactionDate, base);
  });
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function byPaymentMethod(data: CleanTransaction[]) {
  const map = new Map<string, { method: string; count: number; amount: number; refunds: number }>();
  data.forEach((t) => {
    const base = map.get(t.paymentMethod) ?? { method: t.paymentMethod, count: 0, amount: 0, refunds: 0 };
    base.count += 1;
    base.amount += t.transactionAmount;
    if (t.refundStatus !== 'none') base.refunds += 1;
    map.set(t.paymentMethod, base);
  });
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export function byFailureReason(data: CleanTransaction[]) {
  const map = new Map<string, number>();
  data
    .filter((t) => t.transactionStatus === 'failed')
    .forEach((t) => {
      const reason = t.failureReason ?? 'Unknown';
      map.set(reason, (map.get(reason) ?? 0) + 1);
    });
  return Array.from(map.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export function byRegion(data: CleanTransaction[]) {
  const map = new Map<string, { region: string; success: number; failed: number; amount: number }>();
  data.forEach((t) => {
    const base = map.get(t.region) ?? { region: t.region, success: 0, failed: 0, amount: 0 };
    if (t.transactionStatus === 'success') base.success += 1;
    if (t.transactionStatus === 'failed') base.failed += 1;
    base.amount += t.transactionAmount;
    map.set(t.region, base);
  });
  return Array.from(map.values());
}

export function merchantPerformance(data: CleanTransaction[]): MerchantStats[] {
  const byMerchant = new Map<string, CleanTransaction[]>();
  data.forEach((t) => {
    const key = `${t.merchantId}:${t.merchantName}:${t.merchantSegment}`;
    const list = byMerchant.get(key) ?? [];
    list.push(t);
    byMerchant.set(key, list);
  });

  return Array.from(byMerchant.entries())
    .map(([key, rows]) => {
      const [, merchantName, segment] = key.split(':');
      const score = merchantHealthScore(rows);
      return {
        merchantName,
        segment,
        volume: rows.length,
        successRate: successRate(rows),
        refundRate: refundRate(rows),
        averageTransactionValue: averageTransactionValue(rows),
        healthScore: score,
        healthLabel: merchantHealthLabel(score)
      };
    })
    .sort((a, b) => b.volume - a.volume);
}
