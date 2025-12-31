import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MainScreenProps } from "../types/navigation";
import { theme } from "../theme";
import { useEffect, useState } from "react";
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
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Obter o token do SecureStore
      const token = await SecureStore.getItemAsync("user_token");

      if (!token) {
        throw new Error("Token não encontrado. Faça login novamente.");
      }

      // 2. Fazer requisição autenticada ao endpoint /me
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ME}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sessão expirada. Faça login novamente.");
        }
        throw new Error(`Erro ao carregar perfil: ${response.status}`);
      }

      // 3. Parsear e armazenar os dados
      const data: UserProfile = await response.json();
      setUserProfile(data);
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

  useEffect(() => {
    loadUserProfile();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator
            size="large"
            color={theme.colors.action.primaryBg}
          />
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={loadUserProfile}>
            <Text style={styles.buttonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Perfil</Text>

        {userProfile && (
          <>
            <View style={styles.profileInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>E-mail:</Text>
                <Text style={styles.value}>{userProfile.email}</Text>
              </View>

              {userProfile.full_name && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Nome:</Text>
                  <Text style={styles.value}>{userProfile.full_name}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.label}>Criado em:</Text>
                <Text style={styles.value}>
                  {formatDate(userProfile.created_at)}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.buttonText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...theme.typography.textStyles.sectionTitle,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xl,
  },
  profileInfo: {
    width: "100%",
    backgroundColor: theme.colors.background.screen,
    padding: theme.spacing.xl,
    borderRadius: theme.spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.textStyles.body,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  value: {
    ...theme.typography.textStyles.body,
    color: theme.colors.text.primary,
  },
  loadingText: {
    ...theme.typography.textStyles.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  errorText: {
    ...theme.typography.textStyles.body,
    color: theme.colors.status.errorText,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  button: {
    backgroundColor: theme.colors.action.infoBg,
    padding: theme.spacing.space[10],
    borderRadius: theme.spacing.space[4],
    alignItems: "center",
  },
  buttonText: {
    ...theme.typography.textStyles.button,
    color: theme.colors.action.infoText,
    fontWeight: theme.typography.fontWeight.bold,
  },
});
