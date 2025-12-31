import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";
import { DailySummary, OverallSummary } from "./types";

interface UseHomeReturn {
  dailySummary: DailySummary | null;
  overallSummary: OverallSummary | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export const useHome = (): UseHomeReturn => {
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [overallSummary, setOverallSummary] = useState<OverallSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDailySummary = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ANALYTICS_DAILY}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setDailySummary(data);
    } else {
      console.error("Failed to fetch daily summary:", response.status);
    }
  };

  const fetchOverallSummary = async (token: string) => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ANALYTICS_SUMMARY}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setOverallSummary(data);
    } else {
      console.error("Failed to fetch overall summary:", response.status);
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
        fetchOverallSummary(token),
      ]);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return {
    dailySummary,
    overallSummary,
    isLoading,
    error,
    refreshData,
  };
};

