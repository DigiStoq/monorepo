import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { spacing, borderRadius, fontSize, fontWeight, shadows, ThemeColors } from "../lib/theme";
import { useTheme } from "../contexts/ThemeContext";
import { useCompanySettings } from "../hooks/useSettings";
// Icons
import {
  ChevronRight,
  ShoppingCart,
  Receipt,
  Box,
  Users,
  Wallet,
  Wrench,
  Settings,
  LogOut,
  Menu // using grid for menu or similar
} from "lucide-react-native";
import { CustomHeader } from "../components/CustomHeader";

function MenuItem({
  icon: Icon,
  title,
  subtitle,
  onPress,
  color,
  styles,
  colors,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  color?: string;
  styles: any;
  colors: any;
}) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: (color || colors.primary) + "20" }]}>
        <Icon size={24} color={color || colors.primary} />
      </View>
      <View style={styles.menuInfo}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRight size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

export function SettingsScreen() {
  // We renamed the tab to "Menu", but keeping the file name SettingsScreen to avoid breaking imports for now.
  // Ideally, we should rename the file to MenuScreen.tsx later.

  const { user, signOut } = useAuth();
  const navigation = useNavigation<any>();
  const { colors, isDark, setMode } = useTheme();
  const { settings: company } = useCompanySettings();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <Text style={styles.headerTitle}>Menu</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Modules Section */}
        <Text style={styles.sectionTitle}>Modules</Text>
        <View style={styles.card}>
          <MenuItem
            icon={ShoppingCart}
            title="Sales"
            subtitle="Invoices, Estimates, Credit Notes"
            onPress={() => navigation.navigate("SalesSummary")} // Should navigate to SalesNavigator ideally if registered
            // Check AppNavigator: SalesSummary is strictly a report screen? 
            // Wait, SalesNavigator IS registered in other places but AppNavigator has flat list.
            // Let's check linking. "SalesScreen" is likely the old name. 
            // Ideally we should navigate to the Sales Dashboard or List.
            // For now, let's link to the Report or specific Screen if navigator isn't top level.
            // Actually, looking at AppNavigator, "SalesNavigator" is NOT in the main stack. 
            // Wait, line 23 import { SalesNavigator } ... but where is it used?
            // It seems missing from the Stack in AppNavigator.tsx!
            // Ah, I need to fix that too. For now I will link to known screens or placeholders.
            color={colors.primary}
            styles={styles} colors={colors}
          />
          <View style={styles.separator} />
          <MenuItem
            icon={Receipt}
            title="Purchases"
            subtitle="Bills, Expenses, Payments"
            onPress={() => navigation.navigate("PurchaseSummary")} // linking to report/summary for now
            color={colors.accent}
            styles={styles} colors={colors}
          />
          <View style={styles.separator} />
          <MenuItem
            icon={Box}
            title="Inventory"
            subtitle="Items, Stock, Adjustments"
            onPress={() => navigation.navigate("ItemsTab")} // Go to tab
            color="#f59e0b"
            styles={styles} colors={colors}
          />
          <View style={styles.separator} />
          <MenuItem
            icon={Users}
            title="Customers"
            subtitle="Manage Clients"
            onPress={() => navigation.navigate("Customers")}
            color="#8b5cf6"
            styles={styles} colors={colors}
          />
          <View style={styles.separator} />
          <MenuItem
            icon={Wallet}
            title="Cash & Bank"
            subtitle="Accounts, Ledger, Loans"
            onPress={() => navigation.navigate("BankAccounts")} // Linking to BankAccounts for start
            color="#10b981"
            styles={styles} colors={colors}
          />
          <View style={styles.separator} />
          <MenuItem
            icon={Wrench}
            title="Utilities"
            subtitle="Tools & Extras"
            onPress={() => navigation.navigate("Utilities")}
            color="#64748b"
            styles={styles} colors={colors}
          />
        </View>

        {/* Settings */}
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.card}>
          <MenuItem
            icon={Settings}
            title="Company Settings"
            subtitle="Profile, Address, Logo"
            onPress={() => navigation.navigate("CompanySettings")}
            color={colors.textSecondary}
            styles={styles} colors={colors}
          />
          <View style={styles.separator} />
          <MenuItem
            icon={Users}
            title="User Profile"
            subtitle="My Account"
            onPress={() => navigation.navigate("UserProfile")}
            color={colors.textSecondary}
            styles={styles} colors={colors}
          />
          <View style={styles.separator} />
          <MenuItem
            icon={Receipt}
            title="Tax & Invoice Settings"
            subtitle="Rates, Terms, Prefix"
            onPress={() => navigation.navigate("TaxSettings")}
            color={colors.textSecondary}
            styles={styles} colors={colors}
          />
          <View style={styles.separator} />
          <MenuItem
            icon={Settings}
            title="Preferences"
            subtitle="Theme, Formats"
            onPress={() => navigation.navigate("Preferences")}
            color={colors.textSecondary}
            styles={styles} colors={colors}
          />
          <View style={styles.separator} />
          <MenuItem
            icon={Settings}
            title="Security"
            subtitle="Password, 2FA"
            onPress={() => navigation.navigate("SecuritySettings")}
            color={colors.textSecondary}
            styles={styles} colors={colors}
          />
          <View style={styles.separator} />
          <MenuItem
            icon={Settings}
            title="Backup & Restore"
            subtitle="Cloud Saves"
            onPress={() => navigation.navigate("BackupSettings")}
            color={colors.textSecondary}
            styles={styles} colors={colors}
          />
          <View style={styles.separator} />
          <TouchableOpacity style={styles.menuItem} onPress={() => setMode(isDark ? 'light' : 'dark')}>
            <View style={[styles.menuIconContainer, { backgroundColor: colors.textSecondary + "20" }]}>
              <Text style={{ fontSize: 18 }}>{isDark ? "🌙" : "☀️"}</Text>
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Dark Mode</Text>
              <Text style={styles.menuSubtitle}>{isDark ? "On" : "Off"}</Text>
            </View>
            <Switch value={isDark} onValueChange={(v) => setMode(v ? 'dark' : 'light')} />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.7}>
          <LogOut size={20} color={colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>DigiStoq Mobile v1.1.0</Text>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 50, // safe area approximation
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  menuSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 48 + spacing.md * 2, // Icon width + padding
  },
  signOutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger + '10',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    marginTop: spacing.xl,
  },
  signOutText: {
    color: colors.danger,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.md,
  },
  version: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.lg,
  },
});
