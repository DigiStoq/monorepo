import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { PurchaseOrdersScreen } from "../screens/purchases/PurchaseOrdersScreen";
import { PurchaseInvoicesScreen } from "../screens/purchases/PurchaseInvoicesScreen";
import { PaymentOutScreen } from "../screens/purchases/PaymentOutScreen";
import { ExpensesScreen } from "../screens/purchases/ExpensesScreen";

const Tab = createMaterialTopTabNavigator();

export function PurchasesNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: "700",
          textTransform: "capitalize",
        },
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarIndicatorStyle: { 
          backgroundColor: "#6366f1",
          height: 3,
          borderRadius: 3,
        },
        tabBarStyle: {
          backgroundColor: "#f8fafc",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: "#e2e8f0",
        },
        tabBarPressColor: "#6366f120",
      }}
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
  );
}
