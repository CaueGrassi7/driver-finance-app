import { useState, useCallback, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";
import { logger } from "../../utils/logger";
import {
  CategoryBreakdown,
  ReportsSummary,
  MonthlyData,
  TrendData,
  MonthlySummary,
} from "./types";

interface UseReportsReturn {
  summary: ReportsSummary | null;
  monthlyData: MonthlyData[];
  trendData: TrendData[];
  isLoading: boolean;
  error: string | null;
  startDate: Date;
  endDate: Date;
  setStartDate: (date: Date) => void;
  setEndDate: (date: Date) => void;
  applyFilters: () => Promise<void>;
  refreshData: () => Promise<void>;
}

export const useReports = (): UseReportsReturn => {
  // Initialize with last 90 days to capture more data
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return date;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());

  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDateForAPI = (date: Date, isEndDate = false): string => {
    // Format date as YYYY-MM-DD in local timezone
    // For end dates, add 1 day to make it inclusive
    const adjustedDate = isEndDate ? new Date(date.getTime() + 24 * 60 * 60 * 1000) : date;
    const year = adjustedDate.getFullYear();
    const month = String(adjustedDate.getMonth() + 1).padStart(2, "0");
    const day = String(adjustedDate.getDate()).padStart(2, "0");
    const formatted = `${year}-${month}-${day}`;
    return formatted;
  };

  const fetchCategoryBreakdown = async (
    token: string,
    type: "income" | "expense"
  ): Promise<CategoryBreakdown[]> => {
    const params = new URLSearchParams({
      type,
      start_date: formatDateForAPI(startDate, false),
      end_date: formatDateForAPI(endDate, true),
    });

    const url = `${API_BASE_URL}${API_ENDPOINTS.ANALYTICS_CATEGORY_BREAKDOWN}?${params}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      logger.log("Session expired, logging out...");
      await SecureStore.deleteItemAsync("user_token");
      setError("Sessão expirada");
      return [];
    }

    if (response.ok) {
      return await response.json();
    } else {
      logger.error(`Failed to fetch ${type} breakdown:`, response.status);
      return [];
    }
  };

  const fetchTransactions = async (token: string) => {
    const params = new URLSearchParams({
      start_date: formatDateForAPI(startDate, false),
      end_date: formatDateForAPI(endDate, true),
      limit: "1000",
    });

    const url = `${API_BASE_URL}${API_ENDPOINTS.TRANSACTIONS}?${params}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      logger.log("Session expired, logging out...");
      await SecureStore.deleteItemAsync("user_token");
      return [];
    }

    if (response.ok) {
      return await response.json();
    } else {
      logger.error("Failed to fetch transactions:", response.status);
      return [];
    }
  };

  const processMonthlyData = (transactions: any[]): MonthlyData[] => {
    const monthlyMap: { [key: string]: { income: number; expenses: number } } =
      {};

    transactions.forEach((transaction) => {
      const date = new Date(transaction.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { income: 0, expenses: 0 };
      }

      if (transaction.type === "income") {
        monthlyMap[monthKey].income += parseFloat(transaction.amount);
      } else {
        monthlyMap[monthKey].expenses += parseFloat(transaction.amount);
      }
    });

    // Convert to array and sort by month
    return Object.entries(monthlyMap)
      .map(([month, data]) => ({
        month: formatMonthLabel(month),
        income: data.income,
        expenses: data.expenses,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const processTrendData = (monthlyData: MonthlyData[]): TrendData[] => {
    let cumulativeBalance = 0;
    return monthlyData.map((data) => {
      cumulativeBalance += data.income - data.expenses;
      return {
        month: data.month,
        balance: cumulativeBalance,
      };
    });
  };

  const formatMonthLabel = (monthKey: string): string => {
    const [year, month] = monthKey.split("-");
    const monthNames = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    return `${monthNames[parseInt(month) - 1]}/${year.slice(2)}`;
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await SecureStore.getItemAsync("user_token");
      if (!token) {
        setError("Não autenticado");
        return;
      }

      // Fetch category breakdowns and transactions in parallel
      const [expenseCategories, incomeCategories, transactions] =
        await Promise.all([
          fetchCategoryBreakdown(token, "expense"),
          fetchCategoryBreakdown(token, "income"),
          fetchTransactions(token),
        ]);

      // Calculate totals from transactions (includes all transactions, even without category)
      const total_income = transactions
        .filter((t: any) => t.type === "income")
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
      
      const total_expenses = transactions
        .filter((t: any) => t.type === "expense")
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
      
      const balance = total_income - total_expenses;

      // Add uncategorized transactions to category breakdown if they exist
      const processedExpenseCategories = [...expenseCategories];
      const processedIncomeCategories = [...incomeCategories];

      // Check for uncategorized expenses
      const expensesWithCategory = transactions.filter(
        (t: any) => t.type === "expense" && t.category_id
      );
      const expensesWithoutCategory = transactions.filter(
        (t: any) => t.type === "expense" && !t.category_id
      );

      if (expensesWithoutCategory.length > 0) {
        const uncategorizedTotal = expensesWithoutCategory.reduce(
          (sum: number, t: any) => sum + parseFloat(t.amount),
          0
        );
        processedExpenseCategories.push({
          category_id: 0,
          category_name: "Sem Categoria",
          category_type: "expense",
          category_color: "#9CA3AF",
          category_icon: "help-circle",
          total: uncategorizedTotal,
          transaction_count: expensesWithoutCategory.length,
        });
      }

      // Check for uncategorized income
      const incomesWithoutCategory = transactions.filter(
        (t: any) => t.type === "income" && !t.category_id
      );

      if (incomesWithoutCategory.length > 0) {
        const uncategorizedTotal = incomesWithoutCategory.reduce(
          (sum: number, t: any) => sum + parseFloat(t.amount),
          0
        );
        processedIncomeCategories.push({
          category_id: 0,
          category_name: "Sem Categoria",
          category_type: "income",
          category_color: "#9CA3AF",
          category_icon: "help-circle",
          total: uncategorizedTotal,
          transaction_count: incomesWithoutCategory.length,
        });
      }

      setSummary({
        total_income,
        total_expenses,
        balance,
        expense_categories: processedExpenseCategories,
        income_categories: processedIncomeCategories,
      });

      // Process monthly and trend data
      const monthly = processMonthlyData(transactions);
      setMonthlyData(monthly);
      setTrendData(processTrendData(monthly));
    } catch (err) {
      logger.error("Error fetching reports data:", err);
      setError("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = async () => {
    await fetchData();
  };

  const refreshData = async () => {
    await fetchData();
  };

  // Load data on initial mount and whenever screen focuses
  useFocusEffect(
    useCallback(() => {
      fetchData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // Also reload when dates change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  return {
    summary,
    monthlyData,
    trendData,
    isLoading,
    error,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    applyFilters,
    refreshData,
  };
};

