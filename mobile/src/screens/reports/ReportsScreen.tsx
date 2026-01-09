import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  ChevronRight,
  Search,
} from "lucide-react-native";
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../../lib/theme";

const reportCategories = [
  {
    id: "sales",
    title: "Sales Reports",
    icon: TrendingUp,
    color: colors.success,
    bgColor: colors.successMuted,
    reports: [
      { id: "sales-summary", title: "Sales Summary", route: "SalesSummary" },
      { id: "sales-register", title: "Sales Register", route: "SalesRegister" },
      { id: "sales-by-customer", title: "Sales by Customer", route: "SalesByCustomer" },
      { id: "sales-by-item", title: "Sales by Item", route: "SalesByItem" },
    ],
  },
  {
    id: "purchases",
    title: "Purchase Reports",
    icon: ShoppingCart,
    color: colors.warning,
    bgColor: colors.warningMuted,
    reports: [
      { id: "purchase-summary", title: "Purchase Summary", route: "PurchaseSummary" },
      { id: "purchase-register", title: "Purchase Register", route: "PurchaseRegister" },
      { id: "purchase-by-supplier", title: "Purchases by Supplier", route: "PurchasesBySupplier" },
      { id: "expense-report", title: "Expense Report", route: "ExpenseReport" },
    ],
  },
  {
    id: "customers",
    title: "Customer Reports",
    icon: Users,
    color: colors.info,
    bgColor: colors.infoMuted,
    reports: [
      { id: "customer-statement", title: "Customer Statement", route: "CustomerStatement" },
      { id: "receivables-aging", title: "Receivables Aging", route: "ReceivablesAging" },
      { id: "payables-aging", title: "Payables Aging", route: "PayablesAging" },
      { id: "customer-balance", title: "Balance Summary", route: "CustomerBalance" },
    ],
  },
  {
    id: "inventory",
    title: "Inventory Reports",
    icon: Package,
    color: colors.danger,
    bgColor: colors.dangerMuted,
    reports: [
      { id: "stock-summary", title: "Stock Summary", route: "StockSummary" },
      { id: "stock-movement", title: "Stock Movement", route: "StockMovement" },
      { id: "low-stock", title: "Low Stock Alert", route: "LowStock" },
      { id: "item-profitability", title: "Item Profitability", route: "ItemProfitability" },
    ],
  },
  {
    id: "financial",
    title: "Financial Reports",
    icon: DollarSign,
    color: colors.secondary,
    bgColor: "#ede9fe",
    reports: [
      { id: "profit-loss", title: "Profit & Loss", route: "ProfitLoss" },
      { id: "cash-flow", title: "Cash Flow", route: "CashFlow" },
      { id: "cash-movement", title: "Cash Movement", route: "CashMovement" },
      { id: "day-book", title: "Day Book", route: "DayBook" },
      { id: "tax-summary", title: "Tax Summary", route: "TaxSummary" },
    ],
  },
];

export function ReportsScreen() {
  const navigation = useNavigation<any>();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const handleCategoryPress = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handleReportPress = (route: string) => {
    navigation.navigate(route);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchText}
            placeholder="Search reports..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {reportCategories.map((category) => {
          const Icon = category.icon;
          const isExpanded = expandedCategory === category.id;

          return (
            <View key={category.id} style={styles.categorySection}>
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.bgColor }]}>
                  <Icon size={22} color={category.color} strokeWidth={2} />
                </View>
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categoryCount}>{category.reports.length} reports</Text>
                </View>
                <ChevronRight 
                  size={20} 
                  color={colors.textMuted} 
                  style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.reportsList}>
                  {category.reports.map((report, index) => (
                    <TouchableOpacity
                      key={report.id}
                      style={[
                        styles.reportItem,
                        index === category.reports.length - 1 && { borderBottomWidth: 0 }
                      ]}
                      onPress={() => handleReportPress(report.route)}
                    >
                      <Text style={styles.reportTitle}>{report.title}</Text>
                      <ChevronRight size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBar: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  categorySection: {
    marginBottom: spacing.xs,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  categoryCount: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  reportsList: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reportTitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
