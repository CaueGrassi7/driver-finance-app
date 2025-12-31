import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useEffect, useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import HomeScreen from "./src/screens/Home/HomeScreen";
import type {
  AuthStackParamList,
  MainStackParamList,
} from "./src/types/navigation";
import ProfileScreen from "./src/screens/ProfileScreen";
import AddIncomeScreen from "./src/screens/AddIncome";
import { theme } from "./src/theme";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    >
      <MainStack.Screen name="Home" component={HomeScreen} />
      <MainStack.Screen name="Profile" component={ProfileScreen} />
      <MainStack.Screen name="AddIncome" component={AddIncomeScreen} />
    </MainStack.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check for existing token on mount and on interval
  useEffect(() => {
    checkAuthStatus();

    // Poll for auth status changes (to detect logout from HomeScreen)
    const interval = setInterval(() => {
      checkAuthStatus();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("user_token");
      const newAuthState = !!token;

      setIsAuthenticated(newAuthState);

      if (isCheckingAuth) {
        setIsCheckingAuth(false);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
      if (isCheckingAuth) {
        setIsCheckingAuth(false);
      }
    }
  }, [isCheckingAuth]);

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.action.primaryBg} />
        <Text style={styles.loadingText}>Carregando...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    ...theme.typography.textStyles.body,
    color: theme.colors.text.secondary,
  },
});
