import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { PieChart, BarChart, LineChart } from "react-native-gifted-charts";
import { MainScreenProps } from "../../types/navigation";
import { theme } from "../../theme";
import { styles } from "./styles";
import { useReports } from "./useReports";

type Props = MainScreenProps<"Reports">;

export default function ReportsScreen({ navigation }: Props) {
  const {
    summary,
    monthlyData,
    trendData,
    isLoading,
    error,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    applyFilters,
    refreshData,
  } = useReports();

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) return "R$ 0,00";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "R$ 0,00";
    return `R$ ${numValue.toFixed(2).replace(".", ",")}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR");
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const renderPieChart = (data: any[], title: string, emptyMessage: string) => {
    if (!data || data.length === 0) {
      return (
        <View style={styles.emptyChartContainer}>
          <MaterialCommunityIcons
            name="chart-pie"
            size={48}
            color={theme.colors.text.disabled}
          />
          <Text style={styles.emptyChartText}>{emptyMessage}</Text>
        </View>
      );
    }

    const total = data.reduce((sum, d) => sum + d.total, 0);
    const pieData = data.map((item, index) => ({
      value: item.total,
      color: item.category_color || getDefaultColor(index),
      text: `${((item.total / total) * 100).toFixed(1)}%`,
      textColor: theme.colors.text.primary,
      textSize: 12,
      fontWeight: "600",
    }));

    return (
      <>
        <View style={styles.chartWrapper}>
          <PieChart
            data={pieData}
            donut
            radius={90}
            innerRadius={60}
            innerCircleColor={theme.colors.background.surface}
            showText
            textColor={theme.colors.background.surface}
            textSize={11}
            fontWeight="bold"
            showTextBackground
            textBackgroundRadius={12}
            strokeWidth={2}
            strokeColor={theme.colors.background.surface}
            centerLabelComponent={() => (
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: theme.colors.text.primary,
                  }}
                >
                  {formatCurrency(total)}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.colors.text.muted,
                    marginTop: 2,
                  }}
                >
                  Total
                </Text>
              </View>
            )}
          />
        </View>
        <View style={styles.legendContainer}>
          {data.map((item, index) => (
            <View key={item.category_id} style={styles.legendItem}>
              <View style={styles.legendLeft}>
                <View
                  style={[
                    styles.legendColor,
                    {
                      backgroundColor:
                        item.category_color || getDefaultColor(index),
                    },
                  ]}
                />
                <Text style={styles.legendLabel} numberOfLines={1}>
                  {item.category_name}
                </Text>
              </View>
              <Text style={styles.legendValue}>
                {formatCurrency(item.total)}
              </Text>
            </View>
          ))}
        </View>
      </>
    );
  };

  const renderBarChart = () => {
    if (!monthlyData || monthlyData.length === 0) {
      return (
        <View style={styles.emptyChartContainer}>
          <MaterialCommunityIcons
            name="chart-bar"
            size={48}
            color={theme.colors.text.disabled}
          />
          <Text style={styles.emptyChartText}>
            Sem dados mensais para o período selecionado
          </Text>
        </View>
      );
    }

    // Calculate max value for better scaling
    const maxValue = Math.max(
      ...monthlyData.map((d) => Math.max(d.income, d.expenses))
    );
    const adjustedMaxValue = maxValue > 0 ? maxValue * 1.15 : 100;

    const barData = monthlyData.flatMap((data, index) => [
      {
        value: data.income,
        label: data.month,
        frontColor: theme.colors.status.success,
        spacing: 3,
        labelWidth: 40,
        labelTextStyle: {
          color: theme.colors.text.muted,
          fontSize: 10,
        },
        topLabelComponent: () => (
          <Text
            style={{
              fontSize: 9,
              color: theme.colors.text.muted,
              marginBottom: 2,
            }}
          >
            {data.income > 0 ? `R$ ${data.income.toFixed(0)}` : ""}
          </Text>
        ),
      },
      {
        value: data.expenses,
        frontColor: theme.colors.status.danger,
        spacing: index < monthlyData.length - 1 ? 20 : 3,
        topLabelComponent: () => (
          <Text
            style={{
              fontSize: 9,
              color: theme.colors.text.muted,
              marginBottom: 2,
            }}
          >
            {data.expenses > 0 ? `R$ ${data.expenses.toFixed(0)}` : ""}
          </Text>
        ),
      },
    ]);

    return (
      <>
        <View style={styles.chartWrapper}>
          <BarChart
            data={barData}
            width={Dimensions.get("window").width - 80}
            height={220}
            barWidth={22}
            spacing={3}
            roundedTop
            roundedBottom
            xAxisThickness={1}
            yAxisThickness={1}
            xAxisColor={theme.colors.border.subtle}
            yAxisColor={theme.colors.border.subtle}
            yAxisTextStyle={{
              color: theme.colors.text.muted,
              fontSize: 10,
              fontWeight: "500",
            }}
            xAxisLabelTextStyle={{
              color: theme.colors.text.muted,
              fontSize: 10,
              textAlign: "center",
            }}
            noOfSections={4}
            maxValue={adjustedMaxValue}
            yAxisLabelPrefix="R$ "
            showFractionalValues={false}
            hideRules={false}
            rulesColor={theme.colors.border.subtle}
            rulesType="solid"
            dashWidth={4}
            dashGap={8}
          />
        </View>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={styles.legendLeft}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: theme.colors.status.success },
                ]}
              />
              <Text style={styles.legendLabel}>Receitas</Text>
            </View>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendLeft}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: theme.colors.status.danger },
                ]}
              />
              <Text style={styles.legendLabel}>Despesas</Text>
            </View>
          </View>
        </View>
      </>
    );
  };

  const renderLineChart = () => {
    if (!trendData || trendData.length === 0) {
      return (
        <View style={styles.emptyChartContainer}>
          <MaterialCommunityIcons
            name="chart-line"
            size={48}
            color={theme.colors.text.disabled}
          />
          <Text style={styles.emptyChartText}>
            Sem dados de tendência para o período selecionado
          </Text>
        </View>
      );
    }

    const lineData = trendData.map((data) => ({
      value: data.balance,
      label: data.month,
      dataPointText: `R$ ${data.balance.toFixed(0)}`,
    }));

    const allBalances = trendData.map((d) => d.balance);
    const maxBalance = Math.max(...allBalances, 0);
    const minBalance = Math.min(...allBalances, 0);

    // Adjust scale to include both positive and negative values
    const absMax = Math.max(Math.abs(maxBalance), Math.abs(minBalance));
    const adjustedMaxValue = absMax > 0 ? absMax * 1.2 : 100;

    return (
      <View style={styles.chartWrapper}>
        <LineChart
          data={lineData}
          width={Dimensions.get("window").width - 80}
          height={220}
          spacing={Math.max(
            40,
            (Dimensions.get("window").width - 120) / trendData.length
          )}
          color={theme.colors.action.infoBg}
          thickness={3}
          startFillColor={theme.colors.action.infoBg}
          endFillColor={theme.colors.background.surface}
          startOpacity={0.3}
          endOpacity={0.05}
          initialSpacing={20}
          noOfSections={5}
          maxValue={adjustedMaxValue}
          yAxisColor={theme.colors.border.subtle}
          xAxisColor={theme.colors.border.subtle}
          yAxisThickness={1}
          xAxisThickness={1}
          yAxisTextStyle={{
            color: theme.colors.text.muted,
            fontSize: 10,
            fontWeight: "500",
          }}
          xAxisLabelTextStyle={{
            color: theme.colors.text.muted,
            fontSize: 10,
            textAlign: "center",
          }}
          hideDataPoints={false}
          dataPointsHeight={8}
          dataPointsWidth={8}
          dataPointsColor={theme.colors.action.infoBg}
          dataPointsRadius={4}
          textShiftY={-12}
          textShiftX={0}
          textFontSize={10}
          textColor={theme.colors.text.primary}
          rulesColor={theme.colors.border.subtle}
          rulesType="solid"
          dashWidth={4}
          dashGap={8}
          showVerticalLines
          verticalLinesColor={theme.colors.border.subtle}
          curved
          areaChart
          yAxisLabelPrefix="R$ "
        />
      </View>
    );
  };

  const getDefaultColor = (index: number): string => {
    const colors = [
      "#FF6384",
      "#36A2EB",
      "#FFCE56",
      "#4BC0C0",
      "#9966FF",
      "#FF9F40",
      "#FF6384",
      "#C9CBCF",
    ];
    return colors[index % colors.length];
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Relatórios</Text>
          <Text style={styles.subtitle}>
            Visualize suas finanças em detalhes
          </Text>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Date Filters */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Período</Text>
          <View style={styles.dateInputsRow}>
            <View style={styles.dateInputWrapper}>
              <Text style={styles.dateLabel}>Data Inicial</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {formatDate(startDate)}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateInputWrapper}>
              <Text style={styles.dateLabel}>Data Final</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
            <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
          </TouchableOpacity>
        </View>

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={onStartDateChange}
            maximumDate={endDate}
          />
        )}
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={onEndDateChange}
            minimumDate={startDate}
            maximumDate={new Date()}
          />
        )}

        {isLoading && !summary ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={theme.colors.status.success}
            />
            <Text style={styles.loadingText}>Carregando relatórios...</Text>
          </View>
        ) : (
          <>
            {/* Summary Cards */}
            {summary &&
            (summary.total_income > 0 || summary.total_expenses > 0) ? (
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <MaterialCommunityIcons
                    name="cash"
                    size={28}
                    color={theme.colors.status.success}
                  />
                  <Text style={styles.statValue}>
                    {formatCurrency(summary?.total_income)}
                  </Text>
                  <Text style={styles.statLabel}>Total Receitas</Text>
                </View>

                <View style={styles.statCard}>
                  <MaterialCommunityIcons
                    name="credit-card"
                    size={28}
                    color={theme.colors.status.danger}
                  />
                  <Text style={styles.statValue}>
                    {formatCurrency(summary?.total_expenses)}
                  </Text>
                  <Text style={styles.statLabel}>Total Despesas</Text>
                </View>

                <View style={styles.statCard}>
                  <MaterialCommunityIcons
                    name="chart-line"
                    size={28}
                    color={
                      (summary?.balance || 0) >= 0
                        ? theme.colors.action.infoBg
                        : theme.colors.status.danger
                    }
                  />
                  <Text
                    style={[
                      styles.statValue,
                      (summary?.balance || 0) < 0 && styles.statValueNegative,
                    ]}
                  >
                    {formatCurrency(summary?.balance)}
                  </Text>
                  <Text style={styles.statLabel}>Balanço</Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="chart-box-outline"
                  size={64}
                  color={theme.colors.text.disabled}
                />
                <Text style={styles.emptyStateText}>
                  Nenhuma transação encontrada
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Adicione receitas ou despesas no período selecionado para ver
                  seus relatórios
                </Text>
              </View>
            )}

            {/* Charts Section */}
            <View style={styles.chartSection}>
              {/* Expenses Pie Chart */}
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Despesas por Categoria</Text>
                {renderPieChart(
                  summary?.expense_categories || [],
                  "Despesas",
                  "Sem despesas no período selecionado"
                )}
              </View>

              {/* Income Pie Chart */}
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Receitas por Categoria</Text>
                {renderPieChart(
                  summary?.income_categories || [],
                  "Receitas",
                  "Sem receitas no período selecionado"
                )}
              </View>

              {/* Monthly Comparison Bar Chart */}
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Comparação Mensal</Text>
                {renderBarChart()}
              </View>

              {/* Balance Trend Line Chart */}
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Tendência de Balanço</Text>
                {renderLineChart()}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
