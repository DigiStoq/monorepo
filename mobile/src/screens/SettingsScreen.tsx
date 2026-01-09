import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from "@powersync/react-native";
import { useCompanySettings } from "../hooks/useSettings";
import { useNavigation } from "@react-navigation/native";
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../lib/theme";
import { CustomHeader } from "../components/CustomHeader";
import { ChevronRight } from "lucide-react-native";

function SettingsItem({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.settingsIcon}>
        <Text style={styles.settingsIconText}>{icon}</Text>
      </View>
      <View style={styles.settingsInfo}>
        <Text style={styles.settingsTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
      </View>
      {onPress && <ChevronRight size={20} color={colors.textMuted} />}
    </TouchableOpacity>
  );
}

export function SettingsScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();
  const { settings: company } = useCompanySettings();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <View style={styles.container}>
      <CustomHeader />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Company Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company</Text>
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.companyHeader}
              onPress={() => navigation.navigate("CompanySettings" as any)}
              activeOpacity={0.7}
            >
              <View style={styles.companyLogo}>
                <Text style={styles.companyLogoText}>
                  {company?.name?.charAt(0) || "D"}
                </Text>
              </View>
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>
                  {company?.name || "My Company"}
                </Text>
                <Text style={styles.companyEmail}>
                  {company?.contact?.email || user?.email || "Not set"}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <View style={styles.card}>
            <SettingsItem
              icon="🏢"
              title="Company Profile"
              subtitle="Name, logo, address"
              onPress={() => navigation.navigate("CompanySettings" as any)}
            />
            <SettingsItem
              icon="📄"
              title="Invoice Settings"
              subtitle="Templates, numbering"
              onPress={() => navigation.navigate("InvoiceSettings" as any)}
            />
            <SettingsItem
              icon="💰"
              title="Tax Configuration"
              subtitle="Manage tax rates"
              onPress={() => navigation.navigate("TaxSettings" as any)}
            />
            <SettingsItem
              icon="🏦"
              title="Bank Accounts"
              subtitle="Payment details"
              onPress={() => navigation.navigate("BankAccounts" as any)}
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <SettingsItem icon="🎨" title="Appearance" subtitle="Theme, colors" onPress={() => {}} />
            <SettingsItem
              icon="🔔"
              title="Notifications"
              subtitle="Push, email alerts"
              onPress={() => {}}
            />
            <SettingsItem
              icon="🌍"
              title="Regional"
              subtitle={company?.currency || "USD"}
              onPress={() => navigation.navigate("CompanySettings" as any)}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <SettingsItem icon="👤" title="Profile" subtitle={user?.email} onPress={() => {}} />
            <SettingsItem icon="🔐" title="Security" subtitle="Password, 2FA" onPress={() => {}} />
            <SettingsItem
              icon="💾"
              title="Backup & Sync"
              subtitle="Data management"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.7}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>DigiStoq Mobile v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.sm,
  },
  companyHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  companyLogo: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  companyLogoText: {
    fontSize: 24,
    fontWeight: fontWeight.bold,
    color: colors.textOnAccent,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  companyEmail: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceHover,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsIconText: {
    fontSize: 20,
  },
  settingsInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  settingsTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  settingsSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  signOutButton: {
    backgroundColor: colors.dangerMuted,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.danger + "40",
    marginTop: spacing.sm,
  },
  signOutText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.danger,
  },
  version: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xl,
  },
});
