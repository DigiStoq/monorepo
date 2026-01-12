import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  Home,
  Box,
  BarChart3,
  Grid,
} from "lucide-react-native";
import { Platform, View, StyleSheet } from "react-native";
import { DashboardScreen } from "../screens/DashboardScreen";
import { ItemsScreen } from "../screens/ItemsScreen"; // This will be the Inventory Screen
import { ReportsScreen } from "../screens/reports/ReportsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { colors } from "../lib/theme";

const Tab = createBottomTabNavigator();

export function MainTabs() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 0,
            height: Platform.OS === 'ios' ? 90 : 70,
            paddingBottom: Platform.OS === 'ios' ? 30 : 12,
            paddingTop: 12,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            borderTopLeftRadius: 24, // Optional: rounded top corners for tab bar
            borderTopRightRadius: 24,
            position: 'absolute', // Floating effect if desired, or just standard
            bottom: 0,
            left: 0,
            right: 0,
          },
          tabBarActiveTintColor: colors.primary, // Using primary Teal
          tabBarInactiveTintColor: colors.textMuted,
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen
          name="DashboardTab"
          component={DashboardScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabItem}>
                {focused && <View style={[styles.activeBackground, { backgroundColor: colors.primary + '15' }]} />}
                <Home color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="ItemsTab"
          component={ItemsScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabItem}>
                {focused && <View style={[styles.activeBackground, { backgroundColor: colors.primary + '15' }]} />}
                <Box color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="ReportsTab"
          component={ReportsScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabItem}>
                {focused && <View style={[styles.activeBackground, { backgroundColor: colors.primary + '15' }]} />}
                <BarChart3 color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="MenuTab"
          component={SettingsScreen}
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabItem}>
                {focused && <View style={[styles.activeBackground, { backgroundColor: colors.primary + '15' }]} />}
                <Grid color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
              </View>
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
  activeBackground: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 16,
  },
});
