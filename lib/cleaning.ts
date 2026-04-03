import { CleanTransaction, CleaningSummary, RawTransaction, RefundStatus, TransactionStatus } from '@/types/payments';

const regionMap: Record<string, string> = {
  na: 'North America',
  'north america': 'North America',
  'n. america': 'North America',
  eu: 'Europe',
  europe: 'Europe',
  apac: 'APAC',
  'asia pacific': 'APAC'
};

const paymentMap: Record<string, string> = {
  card: 'Card',
  'credit card': 'Card',
  cc: 'Card',
  'bank-transfer': 'Bank Transfer',
  'bank transfer': 'Bank Transfer',
  upi: 'UPI',
  wallet: 'Wallet'
};

function parseDate(input: string | null | undefined, fallback?: string): string {
  if (!input || !input.trim()) return fallback ?? '2026-01-01';
  const raw = input.trim();
  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString().split('T')[0];

  const dmY = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmY) {
    const [, d, m, y] = dmY;
    const parsed = new Date(Number(y), Number(m) - 1, Number(d));
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  }

  return fallback ?? '2026-01-01';
}

function normalizeStatus(status: string): TransactionStatus {
  const s = status.toLowerCase();
  if (s.includes('fail')) return 'failed';
  if (s.includes('pend')) return 'pending';
  return 'success';
}

function normalizeRefund(status?: string | null): RefundStatus {
  const s = (status ?? '').toLowerCase();
  if (s === 'full') return 'full';
  if (s === 'partial') return 'partial';
  return 'none';
}

export function cleanTransactions(raw: RawTransaction[]): {
  cleaned: CleanTransaction[];
  summary: CleaningSummary;
  rawSample: RawTransaction[];
  cleanedSample: CleanTransaction[];
} {
  const seen = new Set<string>();
  let duplicatesRemoved = 0;
  let missingValuesFilled = 0;
  let labelsStandardized = 0;
  let invalidDatesCorrected = 0;

  const cleaned: CleanTransaction[] = [];

  for (const row of raw) {
    if (seen.has(row.transaction_id)) {
      duplicatesRemoved += 1;
      continue;
    }
    seen.add(row.transaction_id);

    const merchantSegment = row.merchant_segment?.trim() ? row.merchant_segment : 'Uncategorized';
    if (!row.merchant_segment?.trim()) missingValuesFilled += 1;

    const rawRegion = row.region.toLowerCase().trim();
    const region = regionMap[rawRegion] ?? row.region;
    if (region !== row.region) labelsStandardized += 1;

    const rawPayment = row.payment_method.toLowerCase().trim();
    const paymentMethod = paymentMap[rawPayment] ?? row.payment_method;
    if (paymentMethod !== row.payment_method) labelsStandardized += 1;

    const transactionDate = parseDate(row.transaction_date, '2026-01-02');
    if (transactionDate !== row.transaction_date?.slice(0, 10)) invalidDatesCorrected += 1;

    const settlementDate = parseDate(row.settlement_date, transactionDate);

    const status = normalizeStatus(row.transaction_status);
    const refundStatus = normalizeRefund(row.refund_status);

    if (refundStatus === 'none' && (row.refund_amount ?? 0) > 0) missingValuesFilled += 1;

    cleaned.push({
      transactionId: row.transaction_id,
      transactionDate,
      customerId: row.customer_id,
      merchantId: row.merchant_id,
      merchantName: row.merchant_name,
      merchantSegment,
      region,
      paymentMethod,
      transactionAmount: row.transaction_amount,
      transactionStatus: status,
      failureReason: row.failure_reason?.trim() ? row.failure_reason : status === 'failed' ? 'Unspecified Failure' : null,
      refundStatus,
      refundAmount: refundStatus === 'none' ? 0 : row.refund_amount ?? 0,
      settlementDate,
      settlementDelayDays: row.settlement_delay_days ?? Math.max(1, Math.round((new Date(settlementDate).getTime() - new Date(transactionDate).getTime()) / 86400000)),
      flaggedRisk: row.flagged_risk || row.risk_score >= 80,
      riskScore: row.risk_score,
      forecastedVolume: row.forecasted_volume,
      actualVolume: row.actual_volume,
      forecastedAmount: row.forecasted_amount,
      actualAmount: row.actual_amount
    });
  }

  return {
    cleaned,
    summary: {
      rawRows: raw.length,
      cleanedRows: cleaned.length,
      duplicatesRemoved,
      missingValuesFilled,
      labelsStandardized,
      invalidDatesCorrected
    },
    rawSample: raw.slice(0, 8),
    cleanedSample: cleaned.slice(0, 8)
  };
}
