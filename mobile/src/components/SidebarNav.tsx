import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  PieChart,
  Settings,
  Bell,
} from "lucide-react-native";
import { colors, spacing, borderRadius } from "../lib/theme";

interface SidebarNavProps {
  activeRoute?: string;
}

const navItems = [
  { icon: LayoutDashboard, route: "DashboardTab", label: "Dashboard" },
  { icon: ShoppingCart, route: "SalesTab", label: "Sales" },
  { icon: Package, route: "ItemsTab", label: "Items" },
  { icon: PieChart, route: "ReportsTab", label: "Reports" },
];

const bottomItems = [
  { icon: Settings, route: "Settings", label: "Settings" },
];

export function SidebarNav({ activeRoute }: SidebarNavProps) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const handlePress = (route: string) => {
    navigation.navigate("Main", { screen: route });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      {/* Logo Area */}
      <View style={styles.logoArea}>
        <View style={styles.logo}>
          <Package size={24} color={colors.accent} />
        </View>
      </View>

      {/* Main Navigation */}
      <View style={styles.navSection}>
        {navItems.map((item) => {
          const isActive = activeRoute === item.route;
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => handlePress(item.route)}
              activeOpacity={0.7}
            >
              <Icon
                size={22}
                color={isActive ? colors.accent : colors.textMuted}
                strokeWidth={isActive ? 2.5 : 2}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom Navigation */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + spacing.lg }]}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <Bell size={22} color={colors.textMuted} strokeWidth={2} />
        </TouchableOpacity>
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.route}
              style={styles.navItem}
              onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.7}
            >
              <Icon size={22} color={colors.textMuted} strokeWidth={2} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 60,
    backgroundColor: colors.backgroundLight,
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoArea: {
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  navSection: {
    flex: 1,
    gap: spacing.sm,
  },
  navItem: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  navItemActive: {
    backgroundColor: colors.surfaceActive,
  },
  bottomSection: {
    gap: spacing.sm,
  },
});

export default SidebarNav;
