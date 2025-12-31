import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  FlatList,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MainScreenProps } from "../../types/navigation";
import { theme } from "../../theme";
import { useAddIncome } from "./useAddIncome";
import { styles } from "./styles";

type Props = MainScreenProps<"AddIncome">;

export default function AddIncomeScreen({ navigation }: Props) {
  const {
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
  } = useAddIncome(() => navigation.goBack());

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>💰 Nova Receita</Text>
          <Text style={styles.subtitle}>Registre uma entrada de dinheiro</Text>
        </View>

        {/* Amount Card */}
        <View style={styles.card}>
          <Text style={styles.label}>Valor (R$)</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0,00"
              placeholderTextColor={theme.colors.text.muted}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Category Card */}
        <View style={styles.card}>
          <Text style={styles.label}>Categoria</Text>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => setShowCategoryModal(true)}
            disabled={isLoading || loadingCategories}
          >
            {selectedCategory ? (
              <View style={styles.selectedCategoryContainer}>
                <View
                  style={[
                    styles.categoryColorIndicator,
                    { backgroundColor: selectedCategory.color },
                  ]}
                />
                <Text style={styles.categoryButtonText}>
                  {selectedCategory.name}
                </Text>
              </View>
            ) : (
              <Text style={styles.categoryButtonPlaceholder}>
                {loadingCategories
                  ? "Carregando..."
                  : "Selecione uma categoria (opcional)"}
              </Text>
            )}
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Description Card */}
        <View style={styles.card}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Ex: Corrida Uber, entrega, bônus..."
            placeholderTextColor={theme.colors.text.muted}
            value={description}
            onChangeText={setDescription}
            editable={!isLoading}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Date Card */}
        <View style={styles.card}>
          <Text style={styles.label}>Data e Hora</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
            disabled={isLoading}
          >
            <Text style={styles.dateIcon}>📅</Text>
            <Text style={styles.dateButtonText}>
              {date.toLocaleDateString("pt-BR")} às{" "}
              {date.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="datetime"
            display="default"
            onChange={(_, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setDate(selectedDate);
              }
            }}
          />
        )}

        {/* Messages */}
        {errorMessage ? (
          <View style={styles.messageError}>
            <Text style={styles.messageIcon}>⚠️</Text>
            <Text style={styles.messageText}>{errorMessage}</Text>
          </View>
        ) : null}

        {successMessage ? (
          <View style={styles.messageSuccess}>
            <Text style={styles.messageIcon}>✓</Text>
            <Text style={styles.messageText}>{successMessage}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>💾 Salvar Receita</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Categoria</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={categories}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    selectedCategory?.id === item.id &&
                      styles.categoryItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedCategory(item);
                    setShowCategoryModal(false);
                  }}
                >
                  <View style={styles.categoryItemLeft}>
                    <View
                      style={[
                        styles.categoryColorDot,
                        { backgroundColor: item.color },
                      ]}
                    />
                    <Text style={styles.categoryItemName}>{item.name}</Text>
                  </View>
                  {selectedCategory?.id === item.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    Nenhuma categoria encontrada
                  </Text>
                </View>
              }
            />

            {selectedCategory && (
              <TouchableOpacity
                style={styles.clearCategoryButton}
                onPress={() => {
                  setSelectedCategory(null);
                  setShowCategoryModal(false);
                }}
              >
                <Text style={styles.clearCategoryText}>Limpar seleção</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
