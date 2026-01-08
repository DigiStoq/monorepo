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
          fontSize: 12,
          fontWeight: "600",
          textTransform: "capitalize",
        },
        tabBarIndicatorStyle: { backgroundColor: "#6366f1" },
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
