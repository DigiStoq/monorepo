import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  Menu,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { DrawerActions } from "@react-navigation/native";

// Screens
import { DashboardScreen } from "../screens/DashboardScreen";
import { SalesScreen } from "../screens/SalesScreen";
import { PurchaseInvoicesScreen } from "../screens/purchases/PurchaseInvoicesScreen";
import { PlaceholderScreen } from "../screens/PlaceholderScreen";

// ... (clean up JSX later in same file?)

// Wait, I can't touch two parts of file easily with one replace if they are far apart.
// Lines 8-10 are imports.
// Lines 52-54 are the bad injection.
// I will do two replaces. First: add import to top.

const Tab = createBottomTabNavigator();

function MenuPlaceholder() {
  return null; // This tab just opens drawer
}

export function MainTabs() {
  const navigation = useNavigation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e2e8f0",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: "#64748b",
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="SalesTab"
        component={SalesScreen}
        options={{
          title: "Sales",
          tabBarIcon: ({ color, size }) => (
            <ShoppingCart color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="PurchasesTab"
        component={PurchaseInvoicesScreen}
        options={{
          title: "Purchases",
          tabBarIcon: ({ color, size }) => (
            <CreditCard color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Menu"
        component={MenuPlaceholder}
        listeners={{
          tabPress: (e: any) => {
            e.preventDefault();
            navigation.dispatch(DrawerActions.toggleDrawer());
          },
        }}
        options={{
          title: "Menu",
          tabBarIcon: ({ color, size }) => <Menu color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
