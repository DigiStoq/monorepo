import React from "react";
import { View } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { CustomHeader } from "../components/CustomHeader";
import { PurchaseOrdersScreen } from "../screens/purchases/PurchaseOrdersScreen";
import { PurchaseInvoicesScreen } from "../screens/purchases/PurchaseInvoicesScreen";
import { PaymentOutScreen } from "../screens/purchases/PaymentOutScreen";
import { ExpensesScreen } from "../screens/purchases/ExpensesScreen";

const Tab = createMaterialTopTabNavigator();

export function PurchasesNavigator() {
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <CustomHeader title="Purchases" />
      <Tab.Navigator
        screenOptions={{
          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: "600",
            textTransform: "capitalize",
          },
          tabBarActiveTintColor: "#C4A484",
          tabBarInactiveTintColor: "#94a3b8",
          tabBarIndicatorStyle: {
            backgroundColor: "#C4A484",
            height: 3,
            borderRadius: 3,
          },
          tabBarStyle: {
            backgroundColor: "#ffffff",
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: "#e2e8f0",
          },
          tabBarPressColor: "#C4A48420",
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
