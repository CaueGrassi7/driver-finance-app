import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { MainScreenProps } from "../../types/navigation";
import { theme } from "../../theme";
import { BrandLogo } from "../../components";
import { styles } from "./styles";
import { useHome } from "./useHome";

type Props = MainScreenProps<"Home">;

export default function HomeScreen({ navigation }: Props) {
  const { dailySummary, recentTransactions, isLoading, refreshData } =
    useHome();

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync("user_token");
      console.log("Logged out successfully");
      // A navegação será tratada automaticamente pelo App.tsx
      // quando o isAuthenticated mudar
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) return "R$ 0,00";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "R$ 0,00";
    return `R$ ${numValue.toFixed(2).replace(".", ",")}`;
  };

  const formatDate = (dateString: string) => {
    // Parse da data sem considerar timezone
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("pt-BR");
  };

  const formatTransactionDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Hoje às ${date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Ontem às ${date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshData} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <BrandLogo size={80} color={theme.colors.status.success} />
          <Text style={styles.title}>Rota Financeira</Text>
          <Text style={styles.subtitle}>
            {dailySummary
              ? `Resumo de ${formatDate(dailySummary.date)}`
              : "Bem-vindo ao seu painel financeiro"}
          </Text>
        </View>

        {isLoading && !dailySummary ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={theme.colors.status.success}
            />
            <Text style={styles.loadingText}>Carregando dados...</Text>
          </View>
        ) : (
          <>
            {/* Quick Stats - Daily */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <MaterialCommunityIcons
                  name="cash"
                  size={32}
                  color={theme.colors.status.success}
                />
                <Text style={styles.statValue}>
                  {formatCurrency(dailySummary?.total_income)}
                </Text>
                <Text style={styles.statLabel}>Receitas Hoje</Text>
                {dailySummary && dailySummary.income_count > 0 && (
                  <Text style={styles.statSubLabel}>
                    {dailySummary.income_count}{" "}
                    {dailySummary.income_count === 1
                      ? "transação"
                      : "transações"}
                  </Text>
                )}
              </View>

              <View style={styles.statCard}>
                <MaterialCommunityIcons
                  name="credit-card"
                  size={32}
                  color={theme.colors.status.danger}
                />
                <Text style={styles.statValue}>
                  {formatCurrency(dailySummary?.total_expenses)}
                </Text>
                <Text style={styles.statLabel}>Despesas Hoje</Text>
                {dailySummary && dailySummary.expense_count > 0 && (
                  <Text style={styles.statSubLabel}>
                    {dailySummary.expense_count}{" "}
                    {dailySummary.expense_count === 1
                      ? "transação"
                      : "transações"}
                  </Text>
                )}
              </View>
            </View>

            {/* Overall Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <MaterialCommunityIcons
                  name="chart-line"
                  size={32}
                  color={theme.colors.action.infoBg}
                />
                <Text
                  style={[
                    styles.statValue,
                    (dailySummary?.balance || 0) < 0 &&
                      styles.statValueNegative,
                  ]}
                >
                  {formatCurrency(dailySummary?.balance || 0)}
                </Text>
                <Text style={styles.statLabel}>Balanço Total</Text>
              </View>

              <View style={styles.statCard}>
                <MaterialCommunityIcons
                  name="fuel"
                  size={32}
                  color={theme.colors.status.success}
                />
                <Text
                  style={[
                    styles.statValue,
                    (dailySummary?.total_fuel_expenses || 0) < 0 &&
                      styles.statValueNegative,
                  ]}
                >
                  {formatCurrency(dailySummary?.total_fuel_expenses)}
                </Text>
                <Text style={styles.statLabel}>Combustível</Text>
                {dailySummary && dailySummary.fuel_transaction_count > 0 && (
                  <Text style={styles.statSubLabel}>
                    {dailySummary.fuel_transaction_count}{" "}
                    {dailySummary.fuel_transaction_count === 1
                      ? "abastecimento"
                      : "abastecimentos"}
                  </Text>
                )}
              </View>
            </View>
          </>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>

          <TouchableOpacity
            style={styles.actionButtonSuccess}
            onPress={() => navigation.navigate("AddIncome")}
          >
            <MaterialCommunityIcons
              name="plus-circle"
              size={24}
              color={theme.colors.action.primaryText}
            />
            <Text style={styles.actionButtonTextSuccess}>
              Adicionar Receita
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButtonDanger}
            onPress={() => navigation.navigate("AddExpense")}
          >
            <MaterialCommunityIcons
              name="plus-circle"
              size={24}
              color={theme.colors.action.primaryText}
            />
            <Text style={styles.actionButtonTextDanger}>Nova Despesa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => navigation.navigate("Reports")}
          >
            <MaterialCommunityIcons
              name="file-chart"
              size={24}
              color={theme.colors.action.infoBg}
            />
            <Text
              style={[
                styles.actionButtonText,
                styles.actionButtonTextSecondary,
              ]}
            >
              Ver Relatórios
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => navigation.navigate("Profile")}
          >
            <MaterialCommunityIcons
              name="account-circle"
              size={24}
              color={theme.colors.action.infoBg}
            />
            <Text
              style={[
                styles.actionButtonText,
                styles.actionButtonTextSecondary,
              ]}
            >
              Meu Perfil
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>Atividade Recente</Text>
          {recentTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="inbox"
                size={48}
                color={theme.colors.text.disabled}
              />
              <Text style={styles.emptyStateText}>Nenhuma atividade ainda</Text>
              <Text style={styles.emptyStateSubtext}>
                Adicione sua primeira despesa ou receita para começar
              </Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {recentTransactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <View
                      style={[
                        styles.transactionIcon,
                        {
                          backgroundColor:
                            transaction.type === "income"
                              ? theme.colors.status.successBg
                              : theme.colors.status.errorBg,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={
                          transaction.type === "income"
                            ? "arrow-down"
                            : "arrow-up"
                        }
                        size={20}
                        color={
                          transaction.type === "income"
                            ? theme.colors.status.success
                            : theme.colors.status.danger
                        }
                      />
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionDescription}>
                        {transaction.description || "Sem descrição"}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatTransactionDate(transaction.transaction_date)}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      transaction.type === "income"
                        ? styles.transactionAmountIncome
                        : styles.transactionAmountExpense,
                    ]}
                  >
                    {transaction.type === "income" ? "+ " : "- "}
                    {formatCurrency(transaction.amount)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Logout Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons
            name="logout"
            size={18}
            color={theme.colors.status.danger}
          />
          <Text style={styles.logoutButtonText}>Sair da Conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
