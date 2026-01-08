import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
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

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const menuItems: MenuItem[] = [
    { label: "Dashboard", icon: LayoutDashboard, route: "Dashboard" },
    { label: "Customers", icon: Users, route: "Customers" },
    { label: "Items", icon: Package, route: "Items" },
    {
      label: "Sales",
      icon: TrendingUp,
      children: [
        { label: "Invoices", route: "Sales", params: { screen: "Invoices" } },
        { label: "Estimates", route: "Sales", params: { screen: "Estimates" } },
        { label: "Payment In", route: "Sales", params: { screen: "Payments" } },
        {
          label: "Credit Notes",
          route: "Sales",
          params: { screen: "Returns" },
        },
      ],
    },
    {
      label: "Purchases",
      icon: ShoppingCart,
      children: [
        { label: "Invoices", route: "Purchases", params: { screen: "Bills" } },
        {
          label: "Payment Out",
          route: "Purchases",
          params: { screen: "Payments" },
        },
        {
          label: "Expenses",
          route: "Purchases",
          params: { screen: "Expenses" },
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
    { label: "Reports", icon: PieChart, route: "Reports" },
    { label: "Settings", icon: Settings, route: "Settings" },
  ];

  const handleNavigation = (route: string, params?: any) => {
    props.navigation.navigate(route, params);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>
              {user?.email?.split("@")[0] || "User"}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>
      </SafeAreaView>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <View key={index}>
              {item.children ? (
                <>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      toggleSection(item.label);
                    }}
                  >
                    <View style={styles.menuItemIcon}>
                      <item.icon size={20} color="#64748b" />
                    </View>
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                    {expandedSections[item.label] ? (
                      <ChevronDown size={16} color="#94a3b8" />
                    ) : (
                      <ChevronRight size={16} color="#94a3b8" />
                    )}
                  </TouchableOpacity>

                  {expandedSections[item.label] && (
                    <View style={styles.subMenuContainer}>
                      {item.children.map((child, childIndex) => (
                        <TouchableOpacity
                          key={childIndex}
                          style={styles.subMenuItem}
                          onPress={() => {
                            handleNavigation(child.route, child.params);
                          }}
                        >
                          <Text style={styles.subMenuItemLabel}>
                            {child.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    handleNavigation(item.route, item.params);
                  }}
                >
                  <View style={styles.menuItemIcon}>
                    <item.icon size={20} color="#64748b" />
                  </View>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <LogOut size={20} color="#ef4444" />
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
    backgroundColor: "#f1f5f9",
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  userEmail: {
    fontSize: 14,
    color: "#64748b",
  },
  scrollContent: {
    paddingTop: 10,
  },
  menuContainer: {
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 15,
    color: "#334155",
    fontWeight: "500",
  },
  subMenuContainer: {
    paddingLeft: 44,
    paddingBottom: 4,
  },
  subMenuItem: {
    paddingVertical: 10,
  },
  subMenuItemLabel: {
    fontSize: 14,
    color: "#64748b",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "600",
  },
});
