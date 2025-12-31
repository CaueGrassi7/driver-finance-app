export interface DailySummary {
  date: string;
  total_income: number;
  income_count: number;
  total_expenses: number;
  expense_count: number;
  balance: number;
  total_transactions: number;
}

export interface OverallSummary {
  total_income: number;
  total_expenses: number;
  balance: number;
}

