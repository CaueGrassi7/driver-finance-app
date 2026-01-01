export interface DailySummary {
  date: string;
  total_income: number;
  income_count: number;
  total_expenses: number;
  expense_count: number;
  balance: number;
  total_transactions: number;
  total_fuel_expenses: number;
  fuel_transaction_count: number;
  average_fuel_expense: number;
}

export interface RecentTransaction {
  id: number;
  type: "income" | "expense";
  amount: number;
  description: string | null;
  transaction_date: string;
  category_id: number | null;
  category_name?: string | null;
  category_color?: string | null;
  category_icon?: string | null;
  created_at: string;
}
