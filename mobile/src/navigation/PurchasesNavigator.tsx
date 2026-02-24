import React from "react";
import { View } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { CustomHeader } from "../components/CustomHeader";
import { PurchaseOrdersScreen } from "../screens/purchases/PurchaseOrdersScreen";
import { PurchaseInvoicesScreen } from "../screens/purchases/PurchaseInvoicesScreen";
import { PaymentOutScreen } from "../screens/purchases/PaymentOutScreen";
import { ExpensesScreen } from "../screens/purchases/ExpensesScreen";
import { useTheme } from "../contexts/ThemeContext";

const Tab = createMaterialTopTabNavigator();

export function PurchasesNavigator() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <CustomHeader title="Purchases" />
      <Tab.Navigator
        screenOptions={{
          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: "600",
            textTransform: "capitalize",
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarIndicatorStyle: {
            backgroundColor: colors.primary,
            height: 3,
            borderRadius: 3,
          },
          tabBarStyle: {
            backgroundColor: colors.surface,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
          tabBarPressColor: colors.primaryMuted,
        }}
        id="PurchasesTabs"
      >
        <Tab.Screen
          name="Orders"
          component={PurchaseOrdersScreen}
          options={{ title: "Orders" }}
        />
        <Tab.Screen
          name="Bills"
          component={PurchaseInvoicesScreen}
          options={{ title: "Bills" }}
        />
        <Tab.Screen
          name="Payments"
          component={PaymentOutScreen}
          options={{ title: "Payments" }}
        />
        <Tab.Screen
          name="Expenses"
          component={ExpensesScreen}
          options={{ title: "Expenses" }}
        />
      </Tab.Navigator>
    </View>
  );
}
