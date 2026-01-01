import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";
import { DailySummary, RecentTransaction } from "./types";

interface UseHomeReturn {
  dailySummary: DailySummary | null;
  recentTransactions: RecentTransaction[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export const useHome = (): UseHomeReturn => {
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<
    RecentTransaction[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDailySummary = async (token: string) => {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.ANALYTICS_DAILY}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 401) {
      // Token expirado ou inválido - remove o token
      console.log("Session expired, logging out...");
      await SecureStore.deleteItemAsync("user_token");
      setError("Sessão expirada");
      return;
    }

    if (response.ok) {
      const data = await response.json();
      setDailySummary(data);
    } else {
      console.error("Failed to fetch daily summary:", response.status);
      setError("Erro ao carregar dados");
    }
  };

  const fetchRecentTransactions = async (token: string) => {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.TRANSACTIONS}?limit=5`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 401) {
      // Token expirado ou inválido - remove o token
      console.log("Session expired, logging out...");
      await SecureStore.deleteItemAsync("user_token");
      return;
    }

    if (response.ok) {
      const data = await response.json();
      setRecentTransactions(data);
    } else {
      console.error("Failed to fetch recent transactions:", response.status);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await SecureStore.getItemAsync("user_token");
      if (!token) {
        setError("Não autenticado");
        return;
      }

      await Promise.all([
        fetchDailySummary(token),
        fetchRecentTransactions(token),
      ]);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  // useFocusEffect executa toda vez que a tela entra em foco
  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [])
  );

  return {
    dailySummary,
    recentTransactions,
    isLoading,
    error,
    refreshData,
  };
};
