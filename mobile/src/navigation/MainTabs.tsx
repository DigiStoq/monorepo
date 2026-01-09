import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  Package,
  PieChart,
} from "lucide-react-native";
import { Platform, View, StyleSheet } from "react-native";
import { DashboardScreen } from "../screens/DashboardScreen";
import { SalesNavigator } from "./SalesNavigator";
import { PurchasesNavigator } from "./PurchasesNavigator";
import { ItemsScreen } from "../screens/ItemsScreen";
import { ReportsScreen } from "../screens/reports/ReportsScreen";
import { colors } from "../lib/theme";
import { CustomHeader } from "../components/CustomHeader";

const Tab = createBottomTabNavigator();

export function MainTabs() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <CustomHeader />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            height: Platform.OS === 'ios' ? 90 : 70,
            paddingBottom: Platform.OS === 'ios' ? 30 : 12,
            paddingTop: 12,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarShowLabel: false, 
        }}
      >
        <Tab.Screen
          name="DashboardTab"
          component={DashboardScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={{ alignItems: 'center' }}>
                <LayoutDashboard color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
                {focused && <View style={[styles.tabIndicator, { backgroundColor: color }]} />}
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="SalesTab"
          component={SalesNavigator}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={{ alignItems: 'center' }}>
                <ShoppingCart color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
                {focused && <View style={[styles.tabIndicator, { backgroundColor: color }]} />}
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="PurchasesTab"
          component={PurchasesNavigator}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={{ alignItems: 'center' }}>
                <CreditCard color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
                {focused && <View style={[styles.tabIndicator, { backgroundColor: color }]} />}
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="ItemsTab"
          component={ItemsScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={{ alignItems: 'center' }}>
                <Package color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
                {focused && <View style={[styles.tabIndicator, { backgroundColor: color }]} />}
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="ReportsTab"
          component={ReportsScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={{ alignItems: 'center' }}>
                <PieChart color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
                {focused && <View style={[styles.tabIndicator, { backgroundColor: color }]} />}
              </View>
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  tabIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
});
