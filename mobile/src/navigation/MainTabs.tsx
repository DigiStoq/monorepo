import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  Home,
  Box,
  BarChart3,
  Grid,
} from "lucide-react-native";
import { Platform, View, StyleSheet, Pressable } from "react-native";
import { DashboardScreen } from "../screens/DashboardScreen";
import { ItemsScreen } from "../screens/ItemsScreen"; // This will be the Inventory Screen
import { ReportsScreen } from "../screens/reports/ReportsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { colors } from "../lib/theme";

const Tab = createBottomTabNavigator();

// Helper to create accessible tab button that preserves navigation behavior
const TabButton = (props: any) => {
  const { testID, accessibilityLabel, onPress, onLongPress, children, style } = props;
  return (
    <Pressable
      onPress={(e) => {
        console.log(`Tab pressed: ${testID}`);
        onPress?.(e);
      }}
      onLongPress={onLongPress}
      style={({ pressed }) => [style, { opacity: pressed ? 0.7 : 1 }]}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      {children}
    </Pressable>
  );
};

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
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen
          name="DashboardTab"
          component={DashboardScreen}
          options={{
            tabBarLabel: "Dashboard",
            tabBarButton: (props) => <TabButton {...props} testID="dashboard-tab" accessibilityLabel="Dashboard" />,
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
            tabBarLabel: "Items",
            tabBarButton: (props) => <TabButton {...props} testID="items-tab" accessibilityLabel="Items" />,
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
            tabBarLabel: "Reports",
            tabBarButton: (props) => <TabButton {...props} testID="reports-tab" accessibilityLabel="Reports" />,
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
            tabBarLabel: "Menu",
            tabBarButton: (props) => <TabButton {...props} testID="menu-tab" accessibilityLabel="Menu" />,
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
