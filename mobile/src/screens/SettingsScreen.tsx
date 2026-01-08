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
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsIcon}>
        <Text style={styles.settingsIconText}>{icon}</Text>
      </View>
      <View style={styles.settingsInfo}>
        <Text style={styles.settingsTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
      </View>
      <Text style={styles.chevron}>›</Text>
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Company Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Company</Text>
        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.companyHeader}
            onPress={() => navigation.navigate("CompanySettings" as any)}
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
            <Text style={styles.chevron}>›</Text>
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
          <SettingsItem icon="🎨" title="Appearance" subtitle="Theme, colors" />
          <SettingsItem
            icon="🔔"
            title="Notifications"
            subtitle="Push, email alerts"
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
          <SettingsItem icon="👤" title="Profile" subtitle={user?.email} />
          <SettingsItem icon="🔐" title="Security" subtitle="Password, 2FA" />
          <SettingsItem
            icon="💾"
            title="Backup & Sync"
            subtitle="Data management"
          />
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>DigiStoq Mobile v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 12,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  companyHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  companyLogo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
  },
  companyLogoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  companyEmail: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  settingsIconText: {
    fontSize: 20,
  },
  settingsInfo: {
    flex: 1,
    marginLeft: 12,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0f172a",
  },
  settingsSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: "#64748b",
  },
  signOutButton: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    marginTop: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
  },
  version: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 12,
    marginTop: 24,
  },
});
