import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigationState } from "@react-navigation/native";
import { SidebarNav } from "../components/SidebarNav";
import { DashboardScreen } from "../screens/DashboardScreen";
import { SalesNavigator } from "./SalesNavigator";
import { PurchasesNavigator } from "./PurchasesNavigator";
import { ItemsScreen } from "../screens/ItemsScreen";
import { ReportsScreen } from "../screens/reports/ReportsScreen";
import { colors, borderRadius } from "../lib/theme";

const Stack = createNativeStackNavigator();

function ContentArea() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="DashboardTab" component={DashboardScreen} />
      <Stack.Screen name="SalesTab" component={SalesNavigator} />
      <Stack.Screen name="ItemsTab" component={ItemsScreen} />
      <Stack.Screen name="PurchasesTab" component={PurchasesNavigator} />
      <Stack.Screen name="ReportsTab" component={ReportsScreen} />
    </Stack.Navigator>
  );
}

export function MainLayout() {
  const state = useNavigationState((state) => state);
  
  // Get the active route name from navigation state
  const getActiveRoute = (state: any): string => {
    if (!state?.routes) return "DashboardTab";
    const route = state.routes[state.index];
    if (route.state) {
      return getActiveRoute(route.state);
    }
    return route.name;
  };

  const activeRoute = getActiveRoute(state);

  return (
    <View style={styles.container}>
      <SidebarNav activeRoute={activeRoute} />
      <View style={styles.content}>
        <ContentArea />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.backgroundLight,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xxl,
    borderBottomLeftRadius: Platform.OS === "ios" ? borderRadius.xxl : 0,
    overflow: "hidden",
  },
});

export default MainLayout;
