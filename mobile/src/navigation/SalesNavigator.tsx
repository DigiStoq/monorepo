import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { SalesScreen } from "../screens/SalesScreen";
import { PaymentInScreen } from "../screens/sales/PaymentInScreen";
import { EstimatesScreen } from "../screens/sales/EstimatesScreen";
import { CreditNotesScreen } from "../screens/sales/CreditNotesScreen";

const Tab = createMaterialTopTabNavigator();

export function SalesNavigator() {
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
        name="Invoices"
        component={SalesScreen}
        options={{ title: "Invoices" }}
      />
      <Tab.Screen
        name="Estimates"
        component={EstimatesScreen}
        options={{ title: "Estimates" }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentInScreen}
        options={{ title: "Payments" }}
      />
      <Tab.Screen
        name="Returns"
        component={CreditNotesScreen}
        options={{ title: "Returns" }}
      />
    </Tab.Navigator>
  );
}
