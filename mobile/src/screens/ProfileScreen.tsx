import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { MainScreenProps } from "../types/navigation";
import { theme } from "../theme";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL, API_ENDPOINTS } from "../config/api";

type Props = MainScreenProps<"Profile">;

interface UserProfile {
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

export default function ProfileScreen({ navigation }: Props) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [fullName, setFullName] = useState("");

  // Password change states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await SecureStore.getItemAsync("user_token");

      if (!token) {
        throw new Error("Token não encontrado. Faça login novamente.");
      }

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ME}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        console.log("Session expired while loading profile");
        await SecureStore.deleteItemAsync("user_token");
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      if (!response.ok) {
        throw new Error(`Erro ao carregar perfil: ${response.status}`);
      }

      const data: UserProfile = await response.json();
      setUserProfile(data);
      setFullName(data.full_name || "");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro ao carregar dados do perfil");
      }
      console.error("Error loading profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [])
  );

  const handleUpdateName = async () => {
    if (!fullName.trim()) {
      Alert.alert("Erro", "O nome não pode estar vazio");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = await SecureStore.getItemAsync("user_token");
      if (!token) {
        throw new Error("Sessão expirada");
      }

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ME}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
        }),
      });

      if (response.status === 401) {
        await SecureStore.deleteItemAsync("user_token");
        throw new Error("Sessão expirada");
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erro ao atualizar perfil");
      }

      const updatedUser = await response.json();
      setUserProfile(updatedUser);
      setIsEditingName(false);
      setSuccessMessage("Nome atualizado com sucesso!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro ao atualizar nome");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    // Validações
    if (!newPassword || !confirmPassword) {
      Alert.alert("Erro", "Preencha todos os campos de senha");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Erro", "A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = await SecureStore.getItemAsync("user_token");
      if (!token) {
        throw new Error("Sessão expirada");
      }

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ME}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: newPassword,
        }),
      });

      if (response.status === 401) {
        await SecureStore.deleteItemAsync("user_token");
        throw new Error("Sessão expirada");
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erro ao alterar senha");
      }

      // Limpar campos
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
      setSuccessMessage("Senha alterada com sucesso!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro ao alterar senha");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.action.infoBg} />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </View>
    );
  }

  if (error && !userProfile) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={48}
            color={theme.colors.status.danger}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadUserProfile}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate("Home")}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Meu Perfil</Text>
          <View style={styles.backButton} />
        </View>

        {/* Messages */}
        {successMessage && (
          <View style={styles.messageSuccess}>
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color={theme.colors.status.success}
            />
            <Text style={styles.messageText}>{successMessage}</Text>
          </View>
        )}

        {error && (
          <View style={styles.messageError}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={20}
              color={theme.colors.status.danger}
            />
            <Text style={styles.messageText}>{error}</Text>
          </View>
        )}

        {/* Profile Info Card */}
        {userProfile && (
          <>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Informações Pessoais</Text>
              </View>

              {/* Email (read-only for security) */}
              <View style={styles.infoGroup}>
                <Text style={styles.label}>E-mail</Text>
                <View style={styles.readOnlyField}>
                  <MaterialCommunityIcons
                    name="email"
                    size={20}
                    color={theme.colors.text.muted}
                  />
                  <Text style={styles.readOnlyText}>{userProfile.email}</Text>
                </View>
                <Text style={styles.helperText}>
                  Por segurança, o e-mail não pode ser alterado
                </Text>
              </View>

              {/* Full Name (editable) */}
              <View style={styles.infoGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Nome Completo</Text>
                  {!isEditingName && (
                    <TouchableOpacity
                      onPress={() => setIsEditingName(true)}
                      disabled={isSaving}
                    >
                      <MaterialCommunityIcons
                        name="pencil"
                        size={20}
                        color={theme.colors.action.infoBg}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {isEditingName ? (
                  <>
                    <TextInput
                      style={styles.input}
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="Digite seu nome completo"
                      placeholderTextColor={theme.colors.text.muted}
                      editable={!isSaving}
                    />
                    <View style={styles.editButtons}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setIsEditingName(false);
                          setFullName(userProfile.full_name || "");
                        }}
                        disabled={isSaving}
                      >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleUpdateName}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.saveButtonText}>Salvar</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View style={styles.readOnlyField}>
                    <MaterialCommunityIcons
                      name="account"
                      size={20}
                      color={theme.colors.text.muted}
                    />
                    <Text style={styles.readOnlyText}>
                      {userProfile.full_name || "Não informado"}
                    </Text>
                  </View>
                )}
              </View>

              {/* Member Since */}
              <View style={styles.infoGroup}>
                <Text style={styles.label}>Membro desde</Text>
                <View style={styles.readOnlyField}>
                  <MaterialCommunityIcons
                    name="calendar"
                    size={20}
                    color={theme.colors.text.muted}
                  />
                  <Text style={styles.readOnlyText}>
                    {formatDate(userProfile.created_at)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Change Password Card */}
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => setIsChangingPassword(!isChangingPassword)}
                disabled={isSaving}
              >
                <Text style={styles.cardTitle}>Alterar Senha</Text>
                <MaterialCommunityIcons
                  name={isChangingPassword ? "chevron-up" : "chevron-down"}
                  size={24}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>

              {isChangingPassword && (
                <View style={styles.passwordForm}>
                  <Text style={styles.helperText}>
                    Por segurança, sua senha deve ter pelo menos 6 caracteres
                  </Text>

                  {/* New Password */}
                  <View style={styles.infoGroup}>
                    <Text style={styles.label}>Nova Senha</Text>
                    <View style={styles.passwordInput}>
                      <TextInput
                        style={styles.passwordField}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="Digite a nova senha"
                        placeholderTextColor={theme.colors.text.muted}
                        secureTextEntry={!showNewPassword}
                        editable={!isSaving}
                      />
                      <TouchableOpacity
                        onPress={() => setShowNewPassword(!showNewPassword)}
                      >
                        <MaterialCommunityIcons
                          name={showNewPassword ? "eye-off" : "eye"}
                          size={24}
                          color={theme.colors.text.muted}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Confirm Password */}
                  <View style={styles.infoGroup}>
                    <Text style={styles.label}>Confirmar Senha</Text>
                    <View style={styles.passwordInput}>
                      <TextInput
                        style={styles.passwordField}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Digite novamente a senha"
                        placeholderTextColor={theme.colors.text.muted}
                        secureTextEntry={!showConfirmPassword}
                        editable={!isSaving}
                      />
                      <TouchableOpacity
                        onPress={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        <MaterialCommunityIcons
                          name={showConfirmPassword ? "eye-off" : "eye"}
                          size={24}
                          color={theme.colors.text.muted}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.changePasswordButton}
                    onPress={handleChangePassword}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.changePasswordButtonText}>
                        Alterar Senha
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}
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
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.space[60],
    paddingBottom: theme.spacing.space[40],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.status.errorText,
    textAlign: "center",
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.action.infoBg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.action.infoText,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text.primary,
  },
  messageSuccess: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.status.successBg,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.status.success,
  },
  messageError: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.status.errorBg,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.status.danger,
  },
  messageText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  card: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text.primary,
  },
  infoGroup: {
    marginBottom: theme.spacing.lg,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  readOnlyField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background.screen,
    padding: theme.spacing.md,
    borderRadius: 12,
  },
  readOnlyText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.text.muted,
    marginTop: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.background.screen,
    borderWidth: 2,
    borderColor: theme.colors.action.infoBg,
    padding: theme.spacing.md,
    borderRadius: 12,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  editButtons: {
    flexDirection: "row",
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  cancelButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text.secondary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.action.infoBg,
    padding: theme.spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.action.infoText,
  },
  passwordForm: {
    paddingTop: theme.spacing.md,
  },
  passwordInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background.screen,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
  },
  passwordField: {
    flex: 1,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  changePasswordButton: {
    backgroundColor: theme.colors.status.warning,
    padding: theme.spacing.md,
    borderRadius: 12,
    alignItems: "center",
    marginTop: theme.spacing.md,
  },
  changePasswordButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
