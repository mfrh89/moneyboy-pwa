
export type TransactionType = 'income' | 'expense';

export type SubscriptionCycle = 'monthly' | 'yearly' | 'quarterly';

export interface FinanceItem {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  isFlexible?: boolean; // True if it is a variable cost
  isSplit?: boolean;    // New: True if cost was split (e.g. /2)
  isWohnkosten?: boolean; // True if part of housing costs
  createdAt: number;
  
  // Subscription properties
  isSubscription?: boolean;
  subscriptionNextBilling?: number; // Timestamp of next billing date
  subscriptionCancellationDeadline?: number; // Timestamp when cancellation must happen
  subscriptionCycle?: SubscriptionCycle;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  ANALYSIS = 'ANALYSIS',
  WOHNEN = 'WOHNEN',
  ABOS = 'ABOS',
  SETTINGS = 'SETTINGS'
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}
