import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";
import { DailySummary, RecentTransaction } from "./types";
import { logger } from "../../utils/logger";

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

  const fetchDailySummary = useCallback(async (token: string) => {
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
      logger.log("Session expired, logging out...");
      await SecureStore.deleteItemAsync("user_token");
      setError("Sessão expirada");
      return;
    }

    if (response.ok) {
      const data = await response.json();
      setDailySummary(data);
    } else {
      logger.error("Failed to fetch daily summary:", response.status);
      setError("Erro ao carregar dados");
    }
  }, []);

  const fetchRecentTransactions = useCallback(async (token: string) => {
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
      logger.log("Session expired, logging out...");
      await SecureStore.deleteItemAsync("user_token");
      return;
    }

    if (response.ok) {
      const data = await response.json();
      setRecentTransactions(data);
    } else {
      logger.error("Failed to fetch recent transactions:", response.status);
    }
  }, []);

  const refreshData = useCallback(async () => {
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
      logger.error("Error fetching data:", err);
      setError("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  }, [fetchDailySummary, fetchRecentTransactions]);

  // useFocusEffect executa toda vez que a tela entra em foco
  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  return {
    dailySummary,
    recentTransactions,
    isLoading,
    error,
    refreshData,
  };
};
