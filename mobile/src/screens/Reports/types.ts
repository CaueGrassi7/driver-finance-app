export interface CategoryBreakdown {
  category_id: number;
  category_name: string;
  category_type: string;
  category_color: string;
  category_icon: string;
  total: number;
  transaction_count: number;
}

export interface MonthlySummary {
  year: number;
  month: number;
  total_income: number;
  income_count: number;
  total_expenses: number;
  expense_count: number;
  balance: number;
  total_transactions: number;
}

export interface ReportsSummary {
  total_income: number;
  total_expenses: number;
  balance: number;
  expense_categories: CategoryBreakdown[];
  income_categories: CategoryBreakdown[];
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

export interface TrendData {
  month: string;
  balance: number;
}

