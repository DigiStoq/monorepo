import React from "react";
import { View } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { CustomHeader } from "../components/CustomHeader";
import { SalesScreen } from "../screens/SalesScreen";
import { PaymentInScreen } from "../screens/sales/PaymentInScreen";
import { EstimatesScreen } from "../screens/sales/EstimatesScreen";
import { CreditNotesScreen } from "../screens/sales/CreditNotesScreen";

const Tab = createMaterialTopTabNavigator();

export function SalesNavigator() {
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <CustomHeader title="Sales" />
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
        id="SalesTabs"
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
    </View>
  );
}
