import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL, API_ENDPOINTS } from "../config/api";
import { AuthScreenProps } from "../types/navigation";
import { theme } from "../theme";
import { BrandLogo } from "../components";
import { logger } from "../utils/logger";

type Props = AuthScreenProps<"Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    // Clear previous errors
    setErrorMessage("");

    // Validate inputs
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Por favor, preencha e-mail e senha");
      return;
    }

    setIsLoading(true);

    try {
      // Create form-encoded data (OAuth2 password flow requirement)
      const formData = new URLSearchParams();
      formData.append("username", email.trim()); // OAuth2 spec uses 'username' field
      formData.append("password", password);

      // Make API request
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOGIN}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      // Handle non-200 responses
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("E-mail ou senha inválidos");
        } else if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Requisição inválida");
        } else {
          throw new Error(`Falha no login com status ${response.status}`);
        }
      }

      // Parse successful response
      const data = await response.json();

      if (!data.access_token) {
        throw new Error("Token de acesso não recebido");
      }

      // Save token securely
      await SecureStore.setItemAsync("user_token", data.access_token);

      logger.log("Login successful");

      // Navigation will be handled automatically by App.tsx
      // when it detects the token exists
    } catch (error) {
      // Handle different error types
      if (
        error instanceof TypeError &&
        error.message === "Network request failed"
      ) {
        setErrorMessage("Erro de rede. Verifique sua conexão.");
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Ocorreu um erro inesperado");
      }
      logger.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <BrandLogo size={120} />
        </View>

        <Text style={styles.title}>Rota Financeira</Text>
        <Text style={styles.subtitle}>Entre para continuar</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu e-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite sua senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.action.primaryText} />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <View style={styles.signupLinkContainer}>
          <Text style={styles.signupLinkText}>Não tem uma conta? </Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate("Signup")} 
            disabled={isLoading}
          >
            <Text style={[styles.signupLink, isLoading && styles.linkDisabled]}>
              Cadastre-se
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: theme.spacing["2xl"],
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: theme.spacing["3xl"],
  },
  title: {
    ...theme.typography.textStyles.title,
    color: theme.colors.text.primary,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.textStyles.body,
    color: theme.colors.text.secondary,
    textAlign: "center",
    marginBottom: theme.spacing["5xl"],
  },
  inputContainer: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    ...theme.typography.textStyles.label,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    ...theme.typography.textStyles.body,
    color: theme.colors.text.primary,
  },
  button: {
    backgroundColor: theme.colors.action.primaryBg,
    borderRadius: theme.spacing.sm,
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...theme.typography.textStyles.button,
    color: theme.colors.action.primaryText,
  },
  errorContainer: {
    backgroundColor: theme.colors.status.errorBg,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    ...theme.typography.textStyles.caption,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.status.errorText,
    textAlign: "center",
  },
  signupLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: theme.spacing.xl,
  },
  signupLinkText: {
    ...theme.typography.textStyles.caption,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  signupLink: {
    ...theme.typography.textStyles.caption,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.action.primaryBg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  linkDisabled: {
    opacity: 0.5,
  },
});
