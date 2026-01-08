import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { PurchaseInvoicesScreen } from "../screens/purchases/PurchaseInvoicesScreen";
import { PaymentOutScreen } from "../screens/purchases/PaymentOutScreen";
import { ExpensesScreen } from "../screens/purchases/ExpensesScreen";

const Tab = createMaterialTopTabNavigator();

export function PurchasesNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          textTransform: "capitalize",
        },
        tabBarIndicatorStyle: { backgroundColor: "#6366f1" },
      }}
    >
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
