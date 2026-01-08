import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Search,
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  FileText,
  BarChart3,
  PieChart,
  LineChart,
  ArrowRight,
  Receipt,
  CreditCard,
  Wallet,
  AlertTriangle,
  Calendar,
  Building2,
  Boxes,
  Scale,
  ArrowLeftRight,
} from "lucide-react-native";

// ============================================================================
// DATA
// ============================================================================

const reportCategories = [
  {
    id: "sales",
    title: "Sales Reports",
    description: "Track sales performance and analytics",
    icon: TrendingUp,
    bgColor: "#dcfce7", // green-100
    iconColor: "#15803d", // green-700
    reports: [
      { id: "sales-summary", title: "Sales Summary", description: "Overview by period", icon: BarChart3 },
      { id: "sales-register", title: "Sales Register", description: "Detailed sales list", icon: FileText },
      { id: "sales-by-customer", title: "Sales by Customer", description: "Customer breakdown", icon: Users },
      { id: "sales-by-item", title: "Sales by Item", description: "Item breakdown", icon: Package },
    ],
  },
  {
    id: "purchases",
    title: "Purchase Reports",
    description: "Monitor purchases and expenses",
    icon: ShoppingCart,
    bgColor: "#ffedd5", // orange-100
    iconColor: "#c2410c", // orange-700
    reports: [
      { id: "purchase-summary", title: "Purchase Summary", description: "Overview by period", icon: BarChart3 },
      { id: "purchase-register", title: "Purchase Register", description: "Detailed purchase list", icon: FileText },
      { id: "purchase-by-supplier", title: "Purchases by Supplier", description: "Supplier breakdown", icon: Building2 },
      { id: "expense-report", title: "Expense Report", description: "Expense categories", icon: Receipt },
    ],
  },
  {
    id: "customers",
    title: "Customer Reports",
    description: "Statements, aging, and balances",
    icon: Users,
    bgColor: "#dbeafe", // blue-100
    iconColor: "#1d4ed8", // blue-700
    reports: [
      { id: "customer-statement", title: "Customer Statement", description: "Detailed ledger", icon: FileText },
      { id: "receivables-aging", title: "Receivables Aging", description: "Outstanding by age", icon: AlertTriangle },
      { id: "payables-aging", title: "Payables Aging", description: "Outstanding to suppliers", icon: CreditCard },
      { id: "customer-balance", title: "Balance Summary", description: "All balances", icon: Scale },
    ],
  },
  {
    id: "inventory",
    title: "Inventory Reports",
    description: "Stock levels and movements",
    icon: Package,
    bgColor: "#f3e8ff", // purple-100
    iconColor: "#7e22ce", // purple-700
    reports: [
      { id: "stock-summary", title: "Stock Summary", description: "Current stock levels", icon: Boxes },
      { id: "stock-movement", title: "Stock Movement", description: "In/Out analysis", icon: LineChart },
      { id: "low-stock", title: "Low Stock Alert", description: "Below reorder level", icon: AlertTriangle },
      { id: "item-profitability", title: "Item Profitability", description: "Profit margins", icon: PieChart },
    ],
  },
  {
    id: "financial",
    title: "Financial Reports",
    description: "P&L, Cash Flow, Financials",
    icon: DollarSign,
    bgColor: "#ccfbf1", // teal-100
    iconColor: "#0f766e", // teal-700
    reports: [
      { id: "profit-loss", title: "Profit & Loss", description: "Revenue vs Expenses", icon: BarChart3 },
      { id: "cash-flow", title: "Cash Flow", description: "Inflows and outflows", icon: Wallet },
      { id: "cash-movement", title: "Cash Movement", description: "Flow by mode", icon: ArrowLeftRight },
      { id: "day-book", title: "Day Book", description: "Daily transactions", icon: Calendar },
      { id: "tax-summary", title: "Tax Summary", description: "Tax collected/paid", icon: Receipt },
    ],
  },
];

// ============================================================================
// SCREEN
// ============================================================================

export function ReportsScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");

  const filteredCategories = reportCategories
    .map((category) => ({
      ...category,
      reports: category.reports.filter(
        (report) =>
          report.title.toLowerCase().includes(search.toLowerCase()) ||
          report.description.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(
      (category) =>
        search === "" ||
        category.title.toLowerCase().includes(search.toLowerCase()) ||
        category.reports.length > 0
    );

  const handleReportPress = (reportId: string, title: string) => {
    switch(reportId) {
        case 'sales-summary':
            navigation.navigate("SalesSummary" as any);
            break;
        case 'sales-register':
            navigation.navigate("SalesRegister" as any);
            break;
        case 'sales-by-customer':
            navigation.navigate("SalesByCustomer" as any);
            break;
        case 'profit-loss':
            navigation.navigate("ProfitLoss" as any);
            break;
        case 'stock-summary':
            navigation.navigate("StockSummary" as any);
            break;
        case 'cash-flow':
            navigation.navigate("CashFlow" as any);
            break;
        case 'customer-statement':
            navigation.navigate("CustomerStatement" as any);
            break;
        case 'purchase-summary':
            navigation.navigate("PurchaseSummary" as any);
            break;
        case 'purchase-register':
            navigation.navigate("PurchaseRegister" as any);
            break;
        case 'receivables-aging':
            navigation.navigate("ReceivablesAging" as any);
            break;
        case 'payables-aging':
            navigation.navigate("PayablesAging" as any);
            break;
        case 'expense-report':
            navigation.navigate("ExpenseReport" as any);
            break;
        case 'sales-by-item':
            navigation.navigate("SalesByItem" as any);
            break;
        case 'customer-balance':
            navigation.navigate("CustomerBalance" as any);
            break;
        case 'purchase-by-supplier':
            navigation.navigate("PurchasesBySupplier" as any);
            break;
        case 'low-stock':
            navigation.navigate("LowStock" as any);
            break;
        case 'item-profitability':
            navigation.navigate("ItemProfitability" as any);
            break;
        case 'stock-movement':
            navigation.navigate("StockMovement" as any);
            break;
        case 'cash-movement':
            navigation.navigate("CashMovement" as any);
            break;
        case 'day-book':
            navigation.navigate("DayBook" as any);
            break;
        case 'tax-summary':
            navigation.navigate("TaxSummary" as any);
            break;
        default:
            console.log("Not implemented:", reportId);
            // Alert.alert("Coming Soon", `The ${title} report is under construction.`);
            break;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Search */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#64748b" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filteredCategories.map((category) => {
          const CategoryIcon = category.icon;
          return (
            <View key={category.id} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <View style={[styles.iconBox, { backgroundColor: category.bgColor }]}>
                  <CategoryIcon size={20} color={category.iconColor} />
                </View>
                <View>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categoryDesc}>{category.description}</Text>
                </View>
              </View>

              <View style={styles.grid}>
                {category.reports.map((report) => {
                  const isImplemented = ['sales-summary', 'sales-register', 'sales-by-customer', 'profit-loss', 'stock-summary', 'cash-flow', 'customer-statement', 'purchase-summary', 'purchase-register', 'receivables-aging', 'payables-aging', 'expense-report', 'sales-by-item', 'customer-balance', 'purchase-by-supplier', 'low-stock', 'item-profitability', 'stock-movement', 'cash-movement', 'day-book', 'tax-summary'].includes(report.id);
                  const ReportIcon = report.icon;
                  return (
                    <TouchableOpacity
                      key={report.id}
                      style={[styles.card, !isImplemented && { opacity: 0.6 }]}
                      onPress={() => handleReportPress(report.id, report.title)}
                      disabled={!isImplemented}
                    >
                      <View style={styles.cardHeader}>
                         <View style={[styles.miniIconBox, { backgroundColor: category.bgColor }]}>
                            <ReportIcon size={16} color={category.iconColor} />
                         </View>
                         {isImplemented ? (
                            <ArrowRight size={16} color="#cbd5e1" />
                         ) : (
                             <View style={styles.soonBadge}>
                                <Text style={styles.soonText}>SOON</Text>
                             </View>
                         )}
                      </View>
                      <Text style={styles.reportTitle}>{report.title}</Text>
                      <Text style={styles.reportDesc}>{report.description}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        {filteredCategories.length === 0 && (
          <View style={styles.emptyState}>
            <FileText size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No reports found</Text>
            <Text style={styles.emptyDesc}>Try adjusting your search term</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    height: "100%",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  categoryDesc: {
    fontSize: 13,
    color: "#64748b",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    width: "48%", 
    minWidth: 140,
    flexGrow: 1,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  miniIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  reportDesc: {
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 16,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: "#64748b",
  },
  soonBadge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  soonText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  }
});
