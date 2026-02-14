import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../contexts/ThemeContext";
import { useCompanySettings } from "../hooks/useSettings";
import { CustomHeader } from "../components/CustomHeader";

// Icons
import {
  ChevronRightIcon,
  ReceiptIcon,
  WalletIcon,
  Tool01Icon,
  LogOut01Icon,
  BoxIcon,
  UsersIcon,
  SettingsIcon,
  FileIcon,
  ChartBreakoutSquareIcon,
} from "../components/ui/UntitledIcons";

function MenuItem({
  icon: Icon,
  title,
  subtitle,
  onPress,
  color,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  color?: string;
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      className="flex-row items-center p-4 gap-4"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        className="w-12 h-12 rounded-lg items-center justify-center"
        style={{ backgroundColor: (color || colors.primary) + "20" }}
      >
        <Icon size={24} color={color || colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-md font-semibold text-text">{title}</Text>
        {subtitle && <Text className="text-xs text-text-muted mt-0.5">{subtitle}</Text>}
      </View>
      <ChevronRightIcon size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

export function SettingsScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation<any>();
  const { colors, isDark, setMode } = useTheme();
  // const { settings: company } = useCompanySettings(); // Not used directly in UI yet

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <CustomHeader title="Menu" />

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>

        {/* Modules Section */}
        <Text className="text-sm font-bold text-text-muted mt-4 mb-2 uppercase tracking-widest">
          Modules
        </Text>
        <View className="bg-surface rounded-xl overflow-hidden shadow-sm">
          <MenuItem
            icon={ChartBreakoutSquareIcon}
            title="Reports"
            subtitle="Analytics & Summaries"
            onPress={() => navigation.navigate("Reports")}
            color="#f59e0b"
          />
          <View className="h-[1px] bg-border-light ml-[72px]" />
          <MenuItem
            icon={ReceiptIcon}
            title="Purchases"
            subtitle="Bills, Expenses, Payments"
            onPress={() => navigation.navigate("PurchasesModule")}
            color={colors.accent || "#ef4444"} // Fallback accent
          />
          <View className="h-[1px] bg-border-light ml-[72px]" />
          <MenuItem
            icon={BoxIcon}
            title="Inventory"
            subtitle="Items, Stock, Adjustments"
            onPress={() => navigation.navigate("ItemsTab")}
            color="#f59e0b"
          />
          <View className="h-[1px] bg-border-light ml-[72px]" />
          <MenuItem
            icon={WalletIcon}
            title="Cash & Bank"
            subtitle="Accounts, Ledger, Loans"
            onPress={() => navigation.navigate("BankAccounts")}
            color="#10b981"
          />
          <View className="h-[1px] bg-border-light ml-[72px]" />
          <MenuItem
            icon={FileIcon}
            title="Cheques"
            subtitle="Manage Cheques"
            onPress={() => navigation.navigate("Cheques")}
            color="#10b981"
          />
          <View className="h-[1px] bg-border-light ml-[72px]" />
          <MenuItem
            icon={Tool01Icon}
            title="Utilities"
            subtitle="Tools & Extras"
            onPress={() => navigation.navigate("Utilities")}
            color="#64748b"
          />
        </View>

        {/* Settings */}
        <Text className="text-sm font-bold text-text-muted mt-4 mb-2 uppercase tracking-widest">
          Settings
        </Text>
        <View className="bg-surface rounded-xl overflow-hidden shadow-sm">
          <MenuItem
            icon={SettingsIcon}
            title="Company Settings"
            subtitle="Profile, Address, Logo"
            onPress={() => navigation.navigate("CompanySettings")}
            color={colors.textSecondary}
          />
          <View className="h-[1px] bg-border-light ml-[72px]" />
          <MenuItem
            icon={UsersIcon}
            title="User Profile"
            subtitle="My Account"
            onPress={() => navigation.navigate("UserProfile")}
            color={colors.textSecondary}
          />
          <View className="h-[1px] bg-border-light ml-[72px]" />
          <MenuItem
            icon={ReceiptIcon}
            title="Tax & Invoice Settings"
            subtitle="Rates, Terms, Prefix"
            onPress={() => navigation.navigate("InvoiceSettings")}
            color={colors.textSecondary}
          />
          <View className="h-[1px] bg-border-light ml-[72px]" />
          <MenuItem
            icon={SettingsIcon}
            title="Preferences"
            subtitle="Theme, Formats"
            onPress={() => navigation.navigate("Preferences")}
            color={colors.textSecondary}
          />
          <View className="h-[1px] bg-border-light ml-[72px]" />
          <MenuItem
            icon={SettingsIcon}
            title="Security"
            subtitle="Password, 2FA"
            onPress={() => navigation.navigate("SecuritySettings")}
            color={colors.textSecondary}
          />
          <View className="h-[1px] bg-border-light ml-[72px]" />
          <MenuItem
            icon={SettingsIcon}
            title="Backup & Restore"
            subtitle="Cloud Saves"
            onPress={() => navigation.navigate("BackupSettings")}
            color={colors.textSecondary}
          />
          <View className="h-[1px] bg-border-light ml-[72px]" />

          <TouchableOpacity
            className="flex-row items-center p-4 gap-4"
            onPress={() => setMode(isDark ? 'light' : 'dark')}
            activeOpacity={0.7}
          >
            <View
              className="w-12 h-12 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.textSecondary + "20" }}
            >
              <Text style={{ fontSize: 18 }}>{isDark ? "🌙" : "☀️"}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-md font-semibold text-text">Dark Mode</Text>
              <Text className="text-xs text-text-muted mt-0.5">{isDark ? "On" : "Off"}</Text>
            </View>
            <Switch value={isDark} onValueChange={(v) => setMode(v ? 'dark' : 'light')} />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          className="flex-row justify-center items-center gap-2 p-4 rounded-xl mt-8"
          style={{ backgroundColor: colors.danger + '10' }}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <LogOut01Icon size={20} color={colors.danger} />
          <Text className="font-bold text-md" style={{ color: colors.danger }}>Sign Out</Text>
        </TouchableOpacity>

        <Text className="text-center text-text-muted text-xs mt-8">
          DigiStoq Mobile v1.1.0
        </Text>
      </ScrollView>
    </View>
  );
}
