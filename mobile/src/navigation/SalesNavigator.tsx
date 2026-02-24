import React from "react";
import { View } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { CustomHeader } from "../components/CustomHeader";
import { SalesScreen } from "../screens/SalesScreen";
import { PaymentInScreen } from "../screens/sales/PaymentInScreen";
import { EstimatesScreen } from "../screens/sales/EstimatesScreen";
import { CreditNotesScreen } from "../screens/sales/CreditNotesScreen";
import { useTheme } from "../contexts/ThemeContext";

const Tab = createMaterialTopTabNavigator();

export function SalesNavigator() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <CustomHeader title="Sales" />
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
