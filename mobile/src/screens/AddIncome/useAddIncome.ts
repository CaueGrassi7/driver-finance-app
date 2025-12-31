import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";
import { Category } from "./types";

interface UseAddIncomeReturn {
  // Form states
  amount: string;
  setAmount: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  date: Date;
  setDate: (value: Date) => void;
  showDatePicker: boolean;
  setShowDatePicker: (value: boolean) => void;

  // Loading states
  isLoading: boolean;
  loadingCategories: boolean;

  // Messages
  errorMessage: string;
  successMessage: string;

  // Categories
  categories: Category[];
  selectedCategory: Category | null;
  setSelectedCategory: (value: Category | null) => void;
  showCategoryModal: boolean;
  setShowCategoryModal: (value: boolean) => void;

  // Actions
  handleSubmit: () => Promise<void>;
  fetchCategories: () => Promise<void>;
}

export const useAddIncome = (onSuccess?: () => void): UseAddIncomeReturn => {
  // Form states
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Messages
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const token = await SecureStore.getItemAsync("user_token");
      if (!token) {
        setCategories([]);
        return;
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.CATEGORIES}?type=income`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        // If unauthorized or any error, categories will remain empty
        // User can still create transaction without category
        console.error("Failed to fetch categories:", response.status);
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    const value = parseFloat(amount.replace(",", "."));
    if (Number.isNaN(value) || value <= 0) {
      setErrorMessage("Informe um valor válido maior que zero");
      return;
    }

    setIsLoading(true);

    try {
      const token = await SecureStore.getItemAsync("user_token");
      if (!token) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const payload = {
        type: "income",
        amount: Number(value.toFixed(2)),
        description: description.trim() || null,
        transaction_date: date.toISOString(),
        category_id: selectedCategory?.id || null,
      };

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.TRANSACTIONS}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(
          detail || `Erro ao salvar receita (status ${response.status})`
        );
      }

      setSuccessMessage("Receita adicionada com sucesso!");
      setAmount("");
      setDescription("");
      setSelectedCategory(null);

      // Call success callback after a short delay
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro inesperado ao salvar receita");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Form states
    amount,
    setAmount,
    description,
    setDescription,
    date,
    setDate,
    showDatePicker,
    setShowDatePicker,

    // Loading states
    isLoading,
    loadingCategories,

    // Messages
    errorMessage,
    successMessage,

    // Categories
    categories,
    selectedCategory,
    setSelectedCategory,
    showCategoryModal,
    setShowCategoryModal,

    // Actions
    handleSubmit,
    fetchCategories,
  };
};
