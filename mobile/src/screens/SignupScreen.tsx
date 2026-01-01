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
  ScrollView,
} from "react-native";
import { API_BASE_URL, API_ENDPOINTS } from "../config/api";
import { AuthScreenProps } from "../types/navigation";
import { theme } from "../theme";
import { BrandLogo } from "../components";
import { logger } from "../utils/logger";

type Props = AuthScreenProps<"Signup">;

export default function SignupScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSignup = async () => {
    // Clear previous messages
    setErrorMessage("");
    setSuccessMessage("");

    // Validate inputs
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Por favor, preencha e-mail e senha");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("A senha deve ter no mínimo 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem");
      return;
    }

    setIsLoading(true);

    try {
      // Create JSON payload (signup uses JSON, not form-encoded)
      const payload: { email: string; password: string; full_name?: string } = {
        email: email.trim(),
        password: password,
      };

      // Add full_name only if provided
      if (fullName.trim()) {
        payload.full_name = fullName.trim();
      }

      // Make API request
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SIGNUP}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Handle non-200 responses
      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Requisição inválida");
        } else if (response.status === 422) {
          const errorData = await response.json();
          // Validation error from Pydantic
          const detail = errorData.detail;
          if (Array.isArray(detail) && detail.length > 0) {
            throw new Error(detail[0].msg || "Erro de validação");
          }
          throw new Error("Dados de entrada inválidos");
        } else {
          throw new Error(`Falha no cadastro com status ${response.status}`);
        }
      }

      // Parse successful response
      const data = await response.json();

      logger.log("Signup successful:", data);

      // Show success message
      setSuccessMessage(
        "Conta criada com sucesso! Redirecionando para o login..."
      );

      // Wait a moment then navigate to login
      setTimeout(() => {
        navigation.navigate("Login");
      }, 2000);
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
      logger.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <BrandLogo size={100} />
          </View>

          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>Cadastre-se para começar</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome Completo (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu nome completo"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>E-mail *</Text>
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
            <Text style={styles.label}>Senha *</Text>
            <TextInput
              style={styles.input}
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirmar Senha *</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite sua senha novamente"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
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

          {successMessage ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
          >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.action.primaryText} />
          ) : (
            <Text style={styles.buttonText}>Cadastrar</Text>
          )}
          </TouchableOpacity>

          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkText}>Já tem uma conta? </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate("Login")} 
              disabled={isLoading}
            >
              <Text
                style={[styles.loginLink, isLoading && styles.linkDisabled]}
              >
                Entrar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.screen,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: theme.spacing["2xl"],
    paddingVertical: theme.spacing["5xl"],
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
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
    marginBottom: theme.spacing["4xl"],
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
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
  successContainer: {
    backgroundColor: theme.colors.status.successBg,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  successText: {
    ...theme.typography.textStyles.caption,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.status.successText,
    textAlign: "center",
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: theme.spacing.xl,
  },
  loginLinkText: {
    ...theme.typography.textStyles.caption,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  loginLink: {
    ...theme.typography.textStyles.caption,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.action.primaryBg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  linkDisabled: {
    opacity: 0.5,
  },
});
