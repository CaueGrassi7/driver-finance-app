import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * API Base URL - Environment-aware configuration
 * - Development: Uses localhost/emulator addresses
 * - Production: Uses API URL from app.json extra config
 * 
 * Configure production URL in app.json:
 * "extra": { "apiUrl": "https://your-api.com" }
 */
const getApiUrl = (): string => {
  // Check if running in development mode
  if (__DEV__) {
    // Android emulator: 10.0.2.2 is the host machine's localhost
    // iOS simulator: Can use localhost directly
    return Platform.OS === "android" 
      ? "http://10.0.2.2:8000" 
      : "http://localhost:8000";
  }
  
  // Production: Use API URL from app.json extra config
  const apiUrl = Constants.expoConfig?.extra?.apiUrl;
  
  if (!apiUrl || apiUrl === "https://your-production-api.com") {
    console.warn(
      "⚠️ Production API URL not configured! Update app.json extra.apiUrl"
    );
  }
  
  return apiUrl || "http://localhost:8000";
};

export const API_BASE_URL = getApiUrl();

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
