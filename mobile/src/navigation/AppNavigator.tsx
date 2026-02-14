import React from "react";
import { NavigationContainer } from "@react-navigation/native";
// Refresh trigger
import { SafeAreaView } from "react-native-safe-area-context";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DrawerContent } from "./DrawerContent";
import { MainTabs } from "./MainTabs";
import { SyncStatus } from "../components/SyncStatus";

// Screens
import { DashboardScreen } from "../screens/DashboardScreen";
import { CustomersScreen } from "../screens/CustomersScreen";
import PDFViewerScreen from "../screens/PDFViewerScreen";
import { ItemsScreen } from "../screens/ItemsScreen";
import { SalesScreen } from "../screens/SalesScreen"; // Using as Sale Invoices for now
import { SettingsScreen } from "../screens/SettingsScreen";
import { PlaceholderScreen } from "../screens/PlaceholderScreen";
import { SaleInvoiceFormScreen } from "../screens/sales/SaleInvoiceFormScreen";
import { SaleInvoiceDetailScreen } from "../screens/sales/SaleInvoiceDetailScreen";
import { PurchaseInvoiceFormScreen } from "../screens/purchases/PurchaseInvoiceFormScreen";
import { PurchaseInvoiceDetailScreen } from "../screens/purchases/PurchaseInvoiceDetailScreen";
import { PurchaseOrderFormScreen } from "../screens/purchases/PurchaseOrderFormScreen";
import { CustomerFormScreen } from "../screens/CustomerFormScreen";
import { CustomerDetailScreen } from "../screens/CustomerDetailScreen";
import { ItemFormScreen } from "../screens/ItemFormScreen";
import { ItemDetailScreen } from "../screens/ItemDetailScreen";
import { SalesNavigator } from "./SalesNavigator";
import { PurchasesNavigator } from "./PurchasesNavigator";
import { PaymentInFormScreen } from "../screens/sales/PaymentInFormScreen";
import { PaymentOutFormScreen } from "../screens/purchases/PaymentOutFormScreen";
import { ExpenseFormScreen } from "../screens/purchases/ExpenseFormScreen";
import { EstimateFormScreen } from "../screens/sales/EstimateFormScreen";
import { CreditNoteFormScreen } from "../screens/sales/CreditNoteFormScreen";
import { BankAccountsScreen } from "../screens/BankAccountsScreen";
import { BankAccountFormScreen } from "../screens/BankAccountFormScreen";
import { CashInHandScreen } from "../screens/CashInHandScreen";
import { CashTransactionFormScreen } from "../screens/CashTransactionFormScreen";
import { ChequesScreen } from "../screens/ChequesScreen";
import { ChequeFormScreen } from "../screens/ChequeFormScreen";
import { LoansScreen } from "../screens/LoansScreen";
import { LoanFormScreen } from "../screens/LoanFormScreen";
import { ReportsScreen } from "../screens/reports/ReportsScreen";
import { SalesSummaryScreen } from "../screens/reports/SalesSummaryScreen";
import { SalesRegisterScreen } from "../screens/reports/SalesRegisterScreen";
import { SalesByCustomerScreen } from "../screens/reports/SalesByCustomerScreen";
import { ProfitLossScreen } from "../screens/reports/ProfitLossScreen";
import { StockSummaryScreen } from "../screens/reports/StockSummaryScreen";
import { CashFlowScreen } from "../screens/reports/CashFlowScreen";
import { PurchaseSummaryScreen } from "../screens/reports/PurchaseSummaryScreen";
import { PurchaseRegisterScreen } from "../screens/reports/PurchaseRegisterScreen";
import { ReceivablesAgingScreen } from "../screens/reports/ReceivablesAgingScreen";
import { PayablesAgingScreen } from "../screens/reports/PayablesAgingScreen";
import { ExpenseReportScreen } from "../screens/reports/ExpenseReportScreen";
import { SalesByItemScreen } from "../screens/reports/SalesByItemScreen";
import { CustomerBalanceScreen } from "../screens/reports/CustomerBalanceScreen";
import { PurchasesBySupplierScreen } from "../screens/reports/PurchasesBySupplierScreen";
import { LowStockScreen } from "../screens/reports/LowStockScreen";
import { ItemProfitabilityScreen } from "../screens/reports/ItemProfitabilityScreen";
import { StockMovementScreen } from "../screens/reports/StockMovementScreen";
import { CashMovementScreen } from "../screens/reports/CashMovementScreen";
import { DayBookScreen } from "../screens/reports/DayBookScreen";
import { TaxSummaryScreen } from "../screens/reports/TaxSummaryScreen";

import { CustomerStatementScreen } from "../screens/reports/CustomerStatementScreen";
import { CompanySettingsScreen } from "../screens/settings/CompanySettingsScreen";
import { InvoiceSettingsScreen } from "../screens/settings/InvoiceSettingsScreen";
import { TaxSettingsScreen } from "../screens/settings/TaxSettingsScreen";
import { UserProfileScreen } from "../screens/settings/UserProfileScreen";
import { PreferencesScreen } from "../screens/settings/PreferencesScreen";
import { SecuritySettingsScreen } from "../screens/settings/SecuritySettingsScreen";
import { BackupSettingsScreen } from "../screens/settings/BackupSettingsScreen";
import { UtilitiesScreen } from "../screens/UtilitiesScreen";

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

function AppDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        headerStatusBarHeight: 0,
        headerStyle: {
          backgroundColor: "#ffffff",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: "#e2e8f0",
        },
        headerTitleAlign: 'left',
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: '600',
          color: '#0f172a',
        },
        headerTintColor: '#C4A484',
      }}
      id="AppDrawer"
    >
      <Drawer.Screen
        name="Main"
        component={MainTabs}
        options={{
          headerShown: false,
        }}
      />
      <Drawer.Screen name="Customers" component={CustomersScreen} options={{ headerShown: false }} />

      {/* Cash & Bank Module */}
      <Drawer.Screen
        name="BankAccounts"
        component={BankAccountsScreen}
        options={{ headerShown: false }}
      />
      <Drawer.Screen
        name="CashInHand"
        component={CashInHandScreen}
        options={{ headerShown: false }}
      />
      <Drawer.Screen
        name="Cheques"
        component={ChequesScreen}
        options={{ headerShown: false }}
      />
      <Drawer.Screen
        name="Loans"
        component={LoansScreen}
        options={{ headerShown: false }}
      />

      {/* Settings */}
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
    </Drawer.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTitleStyle: {
            fontSize: 17,
            fontWeight: '600',
            color: '#0f172a',
          },
          headerTintColor: '#C4A484',
          headerShadowVisible: false,
          headerBackVisible: false, // Changed from headerBackTitleVisible which might be invalid
          contentStyle: {
            backgroundColor: '#f8fafc',
          },
        }}
        id="RootStack"
      >
        <Stack.Screen name="AppDrawer" component={AppDrawer} options={{ headerShown: false }} />
        <Stack.Screen name="Reports" component={ReportsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PDFViewer" component={PDFViewerScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="SalesModule" component={SalesNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="PurchasesModule" component={PurchasesNavigator} options={{ headerShown: false }} />
        <Stack.Screen
          name="SaleInvoiceForm"
          component={SaleInvoiceFormScreen}
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="SaleInvoiceDetail"
          component={SaleInvoiceDetailScreen}
          options={{ title: "Invoice Details" }}
        />
        <Stack.Screen
          name="PurchaseInvoiceForm"
          component={PurchaseInvoiceFormScreen}
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="PurchaseInvoiceDetail"
          component={PurchaseInvoiceDetailScreen}
          options={{ title: "Purchase Details" }}
        />
        <Stack.Screen
          name="PurchaseOrderForm"
          component={PurchaseOrderFormScreen}
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="CustomerForm"
          component={CustomerFormScreen}
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="CustomerDetail"
          component={CustomerDetailScreen}
          options={{ title: "Customer Details" }}
        />
        <Stack.Screen
          name="ItemForm"
          component={ItemFormScreen}
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="ItemDetail"
          component={ItemDetailScreen}
          options={{ title: "Item Details" }}
        />
        <Stack.Screen
          name="PaymentInForm"
          component={PaymentInFormScreen}
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="PaymentOutForm"
          component={PaymentOutFormScreen}
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="ExpenseForm"
          component={ExpenseFormScreen}
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="EstimateForm"
          component={EstimateFormScreen}
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="CreditNoteForm"
          component={CreditNoteFormScreen}
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="BankAccountForm"
          component={BankAccountFormScreen}
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="CashTransactionForm"
          component={CashTransactionFormScreen}
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="ChequeForm"
          component={ChequeFormScreen}
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="LoanForm"
          component={LoanFormScreen}
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Group screenOptions={{ headerShown: false }}>
          <Stack.Screen name="SalesSummary" component={SalesSummaryScreen} />
          <Stack.Screen name="SalesRegister" component={SalesRegisterScreen} />
          <Stack.Screen name="SalesByCustomer" component={SalesByCustomerScreen} />
          <Stack.Screen name="ProfitLoss" component={ProfitLossScreen} />
          <Stack.Screen name="StockSummary" component={StockSummaryScreen} />
          <Stack.Screen name="CashFlow" component={CashFlowScreen} />
          <Stack.Screen name="CustomerStatement" component={CustomerStatementScreen} />
          <Stack.Screen name="PurchaseSummary" component={PurchaseSummaryScreen} />
          <Stack.Screen name="PurchaseRegister" component={PurchaseRegisterScreen} />
          <Stack.Screen name="ReceivablesAging" component={ReceivablesAgingScreen} />
          <Stack.Screen name="PayablesAging" component={PayablesAgingScreen} />
          <Stack.Screen name="ExpenseReport" component={ExpenseReportScreen} />
          <Stack.Screen name="SalesByItem" component={SalesByItemScreen} />
          <Stack.Screen name="CustomerBalance" component={CustomerBalanceScreen} />
          <Stack.Screen name="PurchasesBySupplier" component={PurchasesBySupplierScreen} />
          <Stack.Screen name="LowStock" component={LowStockScreen} />
          <Stack.Screen name="ItemProfitability" component={ItemProfitabilityScreen} />
          <Stack.Screen name="StockMovement" component={StockMovementScreen} />
          <Stack.Screen name="CashMovement" component={CashMovementScreen} />
          <Stack.Screen name="DayBook" component={DayBookScreen} />
          <Stack.Screen name="TaxSummary" component={TaxSummaryScreen} />
        </Stack.Group>

        {/* Settings Sub-screens */}
        <Stack.Group screenOptions={{ headerShown: false }}>
          <Stack.Screen name="CompanySettings" component={CompanySettingsScreen} />
          <Stack.Screen name="InvoiceSettings" component={InvoiceSettingsScreen} />
          <Stack.Screen name="TaxSettings" component={TaxSettingsScreen} />
          <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          <Stack.Screen name="Preferences" component={PreferencesScreen} />
          <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
          <Stack.Screen name="BackupSettings" component={BackupSettingsScreen} />
          <Stack.Screen name="Utilities" component={UtilitiesScreen} />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
