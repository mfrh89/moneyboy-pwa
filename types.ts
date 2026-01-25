
export type TransactionType = 'income' | 'expense';

export interface FinanceItem {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  isFlexible?: boolean; // True if it is a variable cost
  isSplit?: boolean;    // New: True if cost was split (e.g. /2)
  createdAt: number;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  ANALYSIS = 'ANALYSIS',
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
