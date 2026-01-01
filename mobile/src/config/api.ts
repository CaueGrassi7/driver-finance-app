import { Platform } from "react-native";

/**
 * API Base URL - Platform specific configuration
 * - Android emulator: 10.0.2.2 is the host machine's localhost
 * - iOS simulator: Can use localhost directly
 */
export const API_BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000";

/**
 * API Endpoints
 * Note: Trailing slashes are important to avoid 307 redirects
 */
export const API_ENDPOINTS = {
  LOGIN: "/api/v1/auth/login",
  SIGNUP: "/api/v1/auth/signup",
  ME: "/api/v1/users/me",
  TRANSACTIONS: "/api/v1/transactions/",
  CATEGORIES: "/api/v1/categories/",
  ANALYTICS_DAILY: "/api/v1/analytics/daily",
  ANALYTICS_SUMMARY: "/api/v1/analytics/summary",
  ANALYTICS_FUEL_ANALYTICS: "/api/v1/analytics/fuel",
  ANALYTICS_CATEGORY_BREAKDOWN: "/api/v1/analytics/category-breakdown",
  ANALYTICS_MONTHLY: "/api/v1/analytics/monthly",
} as const;
