import React from "react";
import { NavigationContainer } from "@react-navigation/native";
// Refresh trigger
import { SafeAreaView } from "react-native-safe-area-context";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DrawerContent } from "./DrawerContent";
import { MainTabs } from "./MainTabs";

// Screens
import { DashboardScreen } from "../screens/DashboardScreen";
import { CustomersScreen } from "../screens/CustomersScreen";
import { ItemsScreen } from "../screens/ItemsScreen";
import { SalesScreen } from "../screens/SalesScreen"; // Using as Sale Invoices for now
import { SettingsScreen } from "../screens/SettingsScreen";
import { PlaceholderScreen } from "../screens/PlaceholderScreen";
import { SaleInvoiceFormScreen } from "../screens/sales/SaleInvoiceFormScreen";
import { PurchaseInvoiceFormScreen } from "../screens/purchases/PurchaseInvoiceFormScreen";
import { CustomerFormScreen } from "../screens/CustomerFormScreen";
import { ItemFormScreen } from "../screens/ItemFormScreen";
import { SalesNavigator } from "./SalesNavigator";
import { PurchasesNavigator } from "./PurchasesNavigator";
import { PaymentInFormScreen } from "../screens/sales/PaymentInFormScreen";
import { PaymentOutFormScreen } from "../screens/purchases/PaymentOutFormScreen";
import { ExpenseFormScreen } from "../screens/purchases/ExpenseFormScreen";
import { EstimateFormScreen } from "../screens/sales/EstimateFormScreen";
import { CreditNoteFormScreen } from "../screens/sales/CreditNoteFormScreen";

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

function AppDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#f8fafc",
        },
        headerTintColor: "#0f172a",
        headerTitleStyle: {
          fontWeight: "600",
          color: "#0f172a",
        },
      }}
      id="AppDrawer"
    >
      {/* Core */}
      <Drawer.Screen
        name="Overview"
        component={MainTabs}
        options={{
          title: "Overview",
          headerShown: false, // Tabs handle their own headers (or lack thereof)
        }}
      />
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Customers" component={CustomersScreen} />
      <Drawer.Screen name="Items" component={ItemsScreen} />

      {/* Sales Module */}
      <Drawer.Screen
        name="Sales"
        component={SalesNavigator}
        options={{ title: "Sales" }}
      />

      {/* Purchases Module */}
      <Drawer.Screen
        name="Purchases"
        component={PurchasesNavigator}
        options={{ title: "Purchases" }}
      />

      {/* Cash & Bank Module */}
      <Drawer.Screen
        name="BankAccounts"
        component={PlaceholderScreen}
        options={{ title: "Bank Accounts" }}
      />
      <Drawer.Screen
        name="CashInHand"
        component={PlaceholderScreen}
        options={{ title: "Cash In Hand" }}
      />
      <Drawer.Screen
        name="Cheques"
        component={PlaceholderScreen}
        options={{ title: "Cheques" }}
      />
      <Drawer.Screen
        name="Loans"
        component={PlaceholderScreen}
        options={{ title: "Loans" }}
      />

      {/* Reports */}
      <Drawer.Screen name="Reports" component={PlaceholderScreen} />

      {/* Settings */}
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        {/* Wraps entire app to prevent content under status bar/home indicator */}
        {/* Note: Top/Bottom usually handled by individual screens or specific needs. 
                 If user wanted "top and bottom", we might add them here, but typically it conflicts with Headers.
                 But Drawer has header. 
                 Let's stick to Provider in App.tsx and let screens handle View.
                 Actually, the user requested "add safeareaview on top and bottom".
                 I will verify if I should put it here.
                 If I put it here, the Drawer Header is safe?
                 Yes.
              */}
        <Stack.Navigator screenOptions={{ headerShown: false }} id="RootStack">
          <Stack.Screen name="AppDrawer" component={AppDrawer} />
          <Stack.Screen
            name="SaleInvoiceForm"
            component={SaleInvoiceFormScreen}
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="PurchaseInvoiceForm"
            component={PurchaseInvoiceFormScreen}
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="CustomerForm"
            component={CustomerFormScreen}
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="ItemForm"
            component={ItemFormScreen}
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="PaymentInForm"
            component={PaymentInFormScreen}
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="PaymentOutForm"
            component={PaymentOutFormScreen}
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="ExpenseForm"
            component={ExpenseFormScreen}
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="EstimateForm"
            component={EstimateFormScreen}
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="CreditNoteForm"
            component={CreditNoteFormScreen}
            options={{ presentation: "modal" }}
          />
        </Stack.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  );
}
