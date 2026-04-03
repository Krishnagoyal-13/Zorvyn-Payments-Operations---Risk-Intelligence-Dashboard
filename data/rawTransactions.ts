import { RawTransaction } from '@/types/payments';

const merchants = [
  { id: 'M100', name: 'SwiftCart', segment: 'E-commerce' },
  { id: 'M101', name: 'TripNest', segment: 'Travel' },
  { id: 'M102', name: 'MediDrop', segment: 'Healthcare' },
  { id: 'M103', name: 'EduPrime', segment: '' },
  { id: 'M104', name: 'UrbanPlate', segment: 'Food Delivery' },
  { id: 'M105', name: 'FlexFit+', segment: null }
] as const;

const regions = ['North America', 'north america', 'NA', 'Europe', 'EU', 'APAC', 'Asia Pacific'];
const paymentMethods = ['Card', 'card', 'Credit Card', 'Bank Transfer', 'bank-transfer', 'UPI', 'Wallet'];
const failureReasons = ['Insufficient Funds', 'Gateway Timeout', '3DS Failure', 'Bank Declined', ''];

const startDate = new Date('2026-01-01');

function formatDateVariant(d: Date, idx: number): string {
  if (idx % 7 === 0) return d.toISOString().split('T')[0];
  if (idx % 7 === 1) return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  if (idx % 7 === 2) return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
  if (idx % 7 === 3) return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  if (idx % 11 === 0) return '2026-13-05';
  return d.toISOString();
}

const generated: RawTransaction[] = Array.from({ length: 160 }).map((_, idx) => {
  const merchant = merchants[idx % merchants.length];
  const dt = new Date(startDate);
  dt.setDate(dt.getDate() + (idx % 75));
  const isFailed = idx % 9 === 0;
  const isPending = idx % 14 === 0;
  const refundStatus = idx % 8 === 0 ? 'full' : idx % 5 === 0 ? 'partial' : 'none';
  const amount = 80 + ((idx * 37) % 900);

  return {
    transaction_id: `TX-${1000 + idx}`,
    transaction_date: formatDateVariant(dt, idx),
    customer_id: `C${500 + (idx % 70)}`,
    merchant_id: merchant.id,
    merchant_name: merchant.name,
    merchant_segment: merchant.segment,
    region: regions[idx % regions.length],
    payment_method: paymentMethods[idx % paymentMethods.length],
    transaction_amount: amount,
    transaction_status: isPending ? 'pending' : isFailed ? 'failed' : 'success',
    failure_reason: isFailed ? failureReasons[idx % failureReasons.length] : '',
    refund_status: refundStatus,
    refund_amount: refundStatus === 'none' ? 0 : Math.round(amount * (refundStatus === 'full' ? 1 : 0.35)),
    settlement_date: idx % 13 === 0 ? '' : new Date(dt.getTime() + (1 + (idx % 5)) * 86400000).toISOString().split('T')[0],
    settlement_delay_days: idx % 13 === 0 ? null : 1 + (idx % 5),
    flagged_risk: idx % 6 === 0,
    risk_score: 20 + (idx % 81),
    forecasted_volume: 320 + (idx % 60),
    actual_volume: 300 + ((idx * 3) % 90),
    forecasted_amount: 120000 + (idx % 40) * 1400,
    actual_amount: 112000 + (idx % 47) * 1650
  };
});

const duplicates: RawTransaction[] = [generated[22], generated[44], generated[88]];

export const rawTransactions: RawTransaction[] = [...generated, ...duplicates].map((row, idx) => {
  if (idx % 17 === 0) {
    return { ...row, merchant_segment: '', payment_method: 'CC' };
  }
  if (idx % 23 === 0) {
    return { ...row, region: 'n. america', refund_status: null };
  }
  if (idx % 31 === 0) {
    return { ...row, transaction_date: 'not-a-date', settlement_date: null };
  }
  return row;
});
