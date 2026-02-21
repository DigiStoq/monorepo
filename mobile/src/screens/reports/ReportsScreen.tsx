import { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  TrendingUpIcon,
  ShoppingCartIcon,
  UsersIcon,
  BoxIcon,
  DollarSignIcon,
  ChevronRightIcon,
  SearchIcon,
} from "../../components/ui/UntitledIcons";
import { useTheme } from "../../contexts/ThemeContext";
import { CustomHeader } from "../../components/CustomHeader";

export function ReportsScreen() {
  const navigation = useNavigation<any>();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { colors } = useTheme();

  const reportCategories = useMemo(() => [
    {
      id: "sales",
      title: "Sales Reports",
      icon: TrendingUpIcon,
      color: colors.success,
      bgColor: colors.success + '20', // Opacity 20%
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
      icon: ShoppingCartIcon,
      color: colors.warning,
      bgColor: colors.warning + '20',
      reports: [
        { id: "purchase-summary", title: "Purchase Summary", route: "PurchaseSummary" },
        { id: "purchase-register", title: "Purchase Register", route: "PurchaseRegister" },
        { id: "purchase-by-supplier", title: "Purchases by Supplier", route: "PurchasesBySupplier" },
        { id: "purchase-by-item", title: "Purchases by Item", route: "PurchaseByItem" },
        { id: "expense-report", title: "Expense Report", route: "ExpenseReport" },
      ],
    },
    {
      id: "customers",
      title: "Customer Reports",
      icon: UsersIcon,
      color: colors.info,
      bgColor: colors.info + '20',
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
      icon: BoxIcon,
      color: colors.danger,
      bgColor: colors.danger + '20',
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
      icon: DollarSignIcon,
      color: colors.secondary,
      bgColor: colors.secondary + '20',
      reports: [
        { id: "profit-loss", title: "Profit & Loss", route: "ProfitLoss" },
        { id: "cash-flow", title: "Cash Flow", route: "CashFlow" },
        { id: "cash-movement", title: "Cash Movement", route: "CashMovement" },
        { id: "day-book", title: "Day Book", route: "DayBook" },
        { id: "tax-summary", title: "Tax Summary", route: "TaxSummary" },
      ],
    },
  ], [colors]);

  const handleCategoryPress = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handleReportPress = (route: string) => {
    navigation.navigate(route);
  };

  return (
    <View className="flex-1 bg-background">
      <CustomHeader title="Reports" showBack />

      {/* Search Bar */}
      <View className="px-4 pt-1 pb-3">
        <View className="flex-row items-center bg-surface rounded-lg px-3 py-2 gap-2 border border-border">
          <SearchIcon size={18} color={colors.textMuted} />
          <TextInput
            className="flex-1 text-base text-text"
            placeholder="Search reports..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {reportCategories.map((category) => {
          const Icon = category.icon;
          const isExpanded = expandedCategory === category.id;

          return (
            <View key={category.id} className="mb-2">
              <TouchableOpacity
                className="bg-surface rounded-lg p-4 flex-row items-center shadow-sm"
                onPress={() => { handleCategoryPress(category.id); }}
                activeOpacity={0.7}
              >
                <View
                  className="w-11 h-11 rounded-md justify-center items-center mr-3"
                  style={{ backgroundColor: category.bgColor }}
                >
                  <Icon size={22} color={category.color} strokeWidth={2} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-text">{category.title}</Text>
                  <Text className="text-sm text-text-muted">{category.reports.length} reports</Text>
                </View>
                <View style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}>
                  <ChevronRightIcon size={20} color={colors.textMuted} />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View className="mt-2 bg-surface rounded-lg px-4 shadow-sm">
                  {category.reports.map((report, index) => (
                    <TouchableOpacity
                      key={report.id}
                      className={`flex-row items-center justify-between py-3 ${index === category.reports.length - 1 ? '' : 'border-b border-border'}`}
                      onPress={() => { handleReportPress(report.route); }}
                    >
                      <Text className="text-base text-text-secondary">{report.title}</Text>
                      <ChevronRightIcon size={16} color={colors.textMuted} />
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
