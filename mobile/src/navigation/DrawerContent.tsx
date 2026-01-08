import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Platform,
} from "react-native";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Landmark,
  PieChart,
} from "lucide-react-native";

interface MenuItem {
  label: string;
  icon: any;
  route?: string;
  params?: any;
  children?: { label: string; route: string; params?: any; icon?: any }[];
}

export function DrawerContent(props: DrawerContentComponentProps) {
  const { user, signOut } = useAuth();
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  const displayName = user?.user_metadata?.full_name || 
                    user?.email?.split('@')[0] || 
                    "Business Owner";

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const menuItems: MenuItem[] = [
    { label: "Dashboard", icon: LayoutDashboard, route: "Main", params: { screen: "DashboardTab" } },
    { label: "Customers", icon: Users, route: "Customers" },
    { label: "Items", icon: Package, route: "Main", params: { screen: "ItemsTab" } },
    {
      label: "Sales",
      icon: TrendingUp,
      children: [
        { label: "Invoices", route: "Main", params: { screen: "SalesTab", params: { screen: "Invoices" } } },
        { label: "Estimates", route: "Main", params: { screen: "SalesTab", params: { screen: "Estimates" } } },
        { label: "Payment In", route: "Main", params: { screen: "SalesTab", params: { screen: "Payments" } } },
        {
          label: "Credit Notes",
          route: "Main",
          params: { screen: "SalesTab", params: { screen: "Returns" } },
        },
      ],
    },
    {
      label: "Purchases",
      icon: ShoppingCart,
      children: [
        { label: "Bills / Invoices", route: "Main", params: { screen: "PurchasesTab", params: { screen: "Bills" } } },
        {
          label: "Payment Out",
          route: "Main",
          params: { screen: "PurchasesTab", params: { screen: "Payments" } },
        },
        {
          label: "Expenses",
          route: "Main",
          params: { screen: "PurchasesTab", params: { screen: "Expenses" } },
        },
      ],
    },
    {
      label: "Cash & Bank",
      icon: Landmark,
      children: [
        { label: "Bank Accounts", route: "BankAccounts" },
        { label: "Cash In Hand", route: "CashInHand" },
        { label: "Cheques", route: "Cheques" },
        { label: "Loans", route: "Loans" },
      ],
    },
    { label: "Reports", icon: PieChart, route: "Main", params: { screen: "ReportsTab" } },
    { label: "Settings", icon: Settings, route: "Settings" },
  ];

  const getActiveRouteName = (state: any): string | null => {
    const route = state.routes[state.index];
    if (route.state) {
      return getActiveRouteName(route.state);
    }
    return route.name;
  };

  const currentActiveRoute = getActiveRouteName(props.state);

  const isItemActive = (item: MenuItem) => {
    if (!item.route) return false;
    
    // Check if simple route matches
    if (item.route !== "Main" && currentActiveRoute === item.route) return true;
    
    // Check nested routes in MainTabs
    if (item.route === "Main" && item.params?.screen === currentActiveRoute) return true;

    // Check nested sub-screens in navigators (SalesTab, PurchasesTab)
    if (item.route === "Main" && item.params?.screen) {
        // This covers cases where we navigate to SalesTab but the active screen within it is "Invoices"
        // We need to check if the active route is indeed inside the target tab
        // For simplicity, we can also check the children if they match
        const isChildActive = item.children?.some(child => 
            child.params?.screen === currentActiveRoute || 
            (child.params?.params?.screen === currentActiveRoute)
        );
        if (isChildActive) return true;
    }

    return false;
  };

  const handleNavigation = (route: string, params?: any) => {
    props.navigation.navigate(route, params);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>{user?.email}</Text>
          </View>
        </View>
      </View>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => {
            const active = isItemActive(item);
            const expanded = expandedSections[item.label];

            return (
              <View key={index} style={styles.menuItemWrapper}>
                {item.children ? (
                  <>
                    <TouchableOpacity
                      style={[
                          styles.menuItem,
                          (expanded || active) && styles.menuItemActive
                      ]}
                      onPress={() => {
                        toggleSection(item.label);
                      }}
                    >
                      <View style={[styles.menuItemIcon, (expanded || active) && styles.iconActive]}>
                        <item.icon size={20} color={(expanded || active) ? "#6366f1" : "#64748b"} />
                      </View>
                      <Text style={[styles.menuItemLabel, (expanded || active) && styles.labelActive]}>
                          {item.label}
                      </Text>
                      {expanded ? (
                        <ChevronDown size={16} color="#6366f1" />
                      ) : (
                        <ChevronRight size={16} color={active ? "#6366f1" : "#94a3b8"} />
                      )}
                    </TouchableOpacity>

                    {expanded && (
                      <View style={styles.subMenuContainer}>
                        {item.children.map((child, childIndex) => {
                          const isChildActive = child.params?.screen === currentActiveRoute || 
                                              child.params?.params?.screen === currentActiveRoute;
                          return (
                            <TouchableOpacity
                              key={childIndex}
                              style={styles.subMenuItem}
                              onPress={() => {
                                handleNavigation(child.route, child.params);
                              }}
                            >
                              <Text style={[
                                styles.subMenuItemLabel,
                                isChildActive && { color: "#6366f1", fontWeight: "700" }
                              ]}>
                                {child.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </>
                ) : (
                  <TouchableOpacity
                    style={[styles.menuItem, active && styles.menuItemActive]}
                    onPress={() => {
                      handleNavigation(item.route, item.params);
                    }}
                  >
                    <View style={[styles.menuItemIcon, active && styles.iconActive]}>
                      <item.icon size={20} color={active ? "#6366f1" : "#64748b"} />
                    </View>
                    <Text style={[styles.menuItemLabel, active && styles.labelActive]}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <LogOut size={18} color="#ef4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: "#f8fafc",
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
  },
  userName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: "#94a3b8",
  },
  scrollContent: {
    paddingTop: 16,
  },
  menuContainer: {
    paddingHorizontal: 16,
  },
  menuItemWrapper: {
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  menuItemActive: {
    backgroundColor: "#f5f3ff",
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconActive: {
    backgroundColor: "#ede9fe",
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 15,
    color: "#475569",
    fontWeight: "600",
  },
  labelActive: {
    color: "#6366f1",
  },
  subMenuContainer: {
    paddingLeft: 48,
    marginTop: 4,
    marginBottom: 8,
  },
  subMenuItem: {
    paddingVertical: 10,
  },
  subMenuItemLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#fef2f2",
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "700",
  },
});
