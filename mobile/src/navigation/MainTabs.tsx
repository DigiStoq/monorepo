import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  Package,
  PieChart,
  Menu,
} from "lucide-react-native";
import { Platform, View, TouchableOpacity } from "react-native";
import { DashboardScreen } from "../screens/DashboardScreen";
import { SalesNavigator } from "./SalesNavigator";
import { PurchasesNavigator } from "./PurchasesNavigator";
import { ItemsScreen } from "../screens/ItemsScreen";
import { ReportsScreen } from "../screens/reports/ReportsScreen";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { SyncStatus } from "../components/SyncStatus";
import { useAuth } from "../contexts/AuthContext";

const Tab = createBottomTabNavigator();

export function MainTabs() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true, // Enable header
        headerStatusBarHeight: 0,
        headerStyle: {
            backgroundColor: '#f8fafc',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
        },
        headerTitleAlign: 'left',
        headerTitleStyle: {
            fontSize: 18,
            fontWeight: '800',
            color: '#1e293b',
        },
        headerLeft: () => (
            <TouchableOpacity 
                onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} 
                style={{ marginLeft: 16, marginRight: -8, padding: 4 }}
            >
                <Menu color="#1e293b" size={24} strokeWidth={2.5} />
            </TouchableOpacity>
        ),
        headerRight: () => <SyncStatus />,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          paddingTop: 12,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarShowLabel: false, 
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          headerTitle: `Hello, ${displayName} 👋`,
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
                <LayoutDashboard color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
                {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, marginTop: 4 }} />}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="SalesTab"
        component={SalesNavigator}
        options={{
          headerTitle: "Sales",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
                <ShoppingCart color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
                {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, marginTop: 4 }} />}
            </View>
          ),
        }}
      />
       <Tab.Screen
        name="ItemsTab"
        component={ItemsScreen}
        options={{
          headerTitle: "Items",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', backgroundColor: '#6366f1', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', marginBottom: 24, shadowColor: '#6366f1', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8 }}>
                <Package color="white" size={24} strokeWidth={2.5} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="PurchasesTab"
        component={PurchasesNavigator}
        options={{
          headerTitle: "Purchases",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
                <CreditCard color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
                {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, marginTop: 4 }} />}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={ReportsScreen}
        options={{
          headerTitle: "Reports",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
                <PieChart color={color} size={24} strokeWidth={focused ? 2.5 : 2} />
                {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, marginTop: 4 }} />}
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
