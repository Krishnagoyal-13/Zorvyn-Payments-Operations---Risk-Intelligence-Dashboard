export type TransactionStatus = 'success' | 'failed' | 'pending';
export type RefundStatus = 'none' | 'partial' | 'full';
export type MerchantHealth = 'Healthy' | 'Watchlist' | 'Critical';

export interface RawTransaction {
  transaction_id: string;
  transaction_date: string;
  customer_id: string;
  merchant_id: string;
  merchant_name: string;
  merchant_segment?: string | null;
  region: string;
  payment_method: string;
  transaction_amount: number;
  transaction_status: string;
  failure_reason?: string | null;
  refund_status?: string | null;
  refund_amount?: number | null;
  settlement_date?: string | null;
  settlement_delay_days?: number | null;
  flagged_risk: boolean;
  risk_score: number;
  forecasted_volume: number;
  actual_volume: number;
  forecasted_amount: number;
  actual_amount: number;
}

export interface CleanTransaction {
  transactionId: string;
  transactionDate: string;
  customerId: string;
  merchantId: string;
  merchantName: string;
  merchantSegment: string;
  region: string;
  paymentMethod: string;
  transactionAmount: number;
  transactionStatus: TransactionStatus;
  failureReason: string | null;
  refundStatus: RefundStatus;
  refundAmount: number;
  settlementDate: string;
  settlementDelayDays: number;
  flaggedRisk: boolean;
  riskScore: number;
  forecastedVolume: number;
  actualVolume: number;
  forecastedAmount: number;
  actualAmount: number;
}

export interface CleaningSummary {
  rawRows: number;
  cleanedRows: number;
  duplicatesRemoved: number;
  missingValuesFilled: number;
  labelsStandardized: number;
  invalidDatesCorrected: number;
}

export interface FilterState {
  startDate: string;
  endDate: string;
  region: string;
  paymentMethod: string;
  merchantSegment: string;
  transactionStatus: string;
}

export interface KPISet {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  paymentSuccessRate: number;
  refundRate: number;
  averageSettlementTime: number;
  totalProcessedAmount: number;
  flaggedTransactions: number;
  netRevenueImpact: number;
  weekOverWeekChange: number;
}

export interface MerchantStats {
  merchantName: string;
  segment: string;
  volume: number;
  successRate: number;
  refundRate: number;
  averageTransactionValue: number;
  healthScore: number;
  healthLabel: MerchantHealth;
}
