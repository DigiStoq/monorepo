import "./global.css";
import "react-native-get-random-values";
import { useState, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Text, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { PowerSyncContext } from "@powersync/react-native";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { LoginScreen } from "./src/screens/LoginScreen";
import { ForgotPasswordScreen } from "./src/screens/ForgotPasswordScreen";
import { SplashScreen } from "./src/screens/SplashScreen";
import { WelcomeScreen } from "./src/screens/WelcomeScreen";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { initializePowerSync } from "./src/lib/powersync";
import type { PowerSyncDatabase } from "@powersync/react-native";
import { generateUUID } from "./src/lib/utils";

type AuthScreen = "splash" | "welcome" | "login" | "signup" | "forgot";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./src/lib/queryClient";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext";
import { vars } from "nativewind";

// CSS variable sets for NativeWind - values are space-separated RGB triplets
const lightThemeVars = vars({
  '--color-primary': '20 184 166',
  '--color-primary-light': '204 251 241',
  '--color-primary-dark': '15 118 110',
  '--color-primary-muted': '240 253 250',
  '--color-secondary': '15 23 42',
  '--color-accent': '139 92 246',
  '--color-background': '248 250 252',
  '--color-background-light': '255 255 255',
  '--color-background-card': '255 255 255',
  '--color-surface': '255 255 255',
  '--color-surface-hover': '241 245 249',
  '--color-surface-active': '226 232 240',
  '--color-text': '15 23 42',
  '--color-text-secondary': '71 85 105',
  '--color-text-muted': '148 163 184',
  '--color-text-light': '248 250 252',
  '--color-success': '34 197 94',
  '--color-success-muted': '220 252 231',
  '--color-warning': '245 158 11',
  '--color-warning-muted': '254 243 199',
  '--color-danger': '239 68 68',
  '--color-danger-muted': '254 226 226',
  '--color-info': '59 130 246',
  '--color-info-muted': '219 234 254',
  '--color-border': '226 232 240',
  '--color-border-light': '241 245 249',
  '--color-border-dark': '51 65 85',
});

const darkThemeVars = vars({
  '--color-primary': '45 212 191',
  '--color-primary-light': '19 78 74',
  '--color-primary-dark': '94 234 212',
  '--color-primary-muted': '2 44 34',
  '--color-secondary': '226 232 240',
  '--color-accent': '167 139 250',
  '--color-background': '15 23 42',
  '--color-background-light': '30 41 59',
  '--color-background-card': '30 41 59',
  '--color-surface': '30 41 59',
  '--color-surface-hover': '51 65 85',
  '--color-surface-active': '71 85 105',
  '--color-text': '248 250 252',
  '--color-text-secondary': '203 213 225',
  '--color-text-muted': '148 163 184',
  '--color-text-light': '15 23 42',
  '--color-success': '74 222 128',
  '--color-success-muted': '20 83 45',
  '--color-warning': '251 191 36',
  '--color-warning-muted': '120 53 15',
  '--color-danger': '248 113 113',
  '--color-danger-muted': '127 29 29',
  '--color-info': '96 165 250',
  '--color-info-muted': '30 58 138',
  '--color-border': '51 65 85',
  '--color-border-light': '30 41 59',
  '--color-border-dark': '71 85 105',
});

async function initializeUserData(db: PowerSyncDatabase, userId: string, email: string) {
  const now = new Date().toISOString();

  // Check if user profile already exists
  const profileResult = await db.execute(
    "SELECT id FROM user_profiles WHERE user_id = ? LIMIT 1",
    [userId]
  );
  if (profileResult.rows?.length > 0) return; // Already initialized

  console.log("First login detected - creating default user data");

  await db.writeTransaction(async (tx) => {
    const profileId = generateUUID();
    await tx.execute(
      `INSERT INTO user_profiles (
        id, user_id, first_name, last_name, phone, role, language,
        notification_email, notification_push, notification_sms,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [profileId, userId, "", "", "", "admin", "en", 0, 0, 0, now, now]
    );

    const prefsId = generateUUID();
    await tx.execute(
      `INSERT INTO user_preferences (
        id, user_id, theme, date_format, decimal_separator, thousands_separator,
        decimal_places, compact_mode, auto_save, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [prefsId, userId, "light", "DD/MM/YYYY", ".", ",", 2, 0, 1, now, now]
    );

    const companyId = generateUUID();
    await tx.execute(
      `INSERT INTO company_settings (
        id, user_id, name, currency, locale, timezone,
        financial_year_start_month, financial_year_start_day,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [companyId, userId, "My Company", "USD", "en-US", "America/New_York", 1, 1, now, now]
    );

    const invoiceId = generateUUID();
    await tx.execute(
      `INSERT INTO invoice_settings (
        id, user_id, prefix, next_number, padding,
        show_payment_qr, show_bank_details, due_date_days,
        late_fees_enabled, pdf_template, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [invoiceId, userId, "INV-", 1, 4, 0, 0, 30, 0, "classic", now, now]
    );

    // Create default sequence counters
    const sequences = [
      { prefix: "INV-", label: "Sale Invoice" },
      { prefix: "PI-", label: "Purchase Invoice" },
      { prefix: "EST-", label: "Estimate" },
      { prefix: "CN-", label: "Credit Note" },
      { prefix: "REC-", label: "Payment Receipt" },
      { prefix: "PAY-", label: "Payment Out" },
      { prefix: "EXP-", label: "Expense" },
    ];
    for (const seq of sequences) {
      const seqId = generateUUID();
      await tx.execute(
        `INSERT INTO sequence_counters (id, user_id, prefix, next_number, padding, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [seqId, userId, seq.prefix, 1, 4, now]
      );
    }
  });

  console.log("Default user data created successfully");
}

function AppContent(): JSX.Element | null {
  const { isLoading, isAuthenticated, user } = useAuth();
  const { colors } = useTheme();
  const [db, setDb] = useState<PowerSyncDatabase | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [authScreen, setAuthScreen] = useState<AuthScreen>("splash");

  useEffect(() => {
    if (isAuthenticated && !db) {
      const initDb = async () => {
        try {
          const database = await initializePowerSync();
          // Initialize default user data on first login
          if (user?.id) {
            await initializeUserData(database, user.id, user.email || "");
          }
          setDb(database);
        } catch (error) {
          console.error("Failed to initialize database:", error);
          setDbError(
            error instanceof Error
              ? error.message
              : "Database initialization failed"
          );
        }
      };

      initDb();
    }
  }, [isAuthenticated, db, user]);

  // Reset to welcome screen when user logs out
  useEffect(() => {
    if (!isAuthenticated && authScreen !== "splash") {
      setAuthScreen("welcome");
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    // Show auth flow screens
    if (authScreen === "splash") {
      return <SplashScreen onFinish={() => { setAuthScreen("welcome"); }} />;
    }

    if (authScreen === "welcome") {
      return (
        <WelcomeScreen
          onSignIn={() => { setAuthScreen("login"); }}
          onSignUp={() => { setAuthScreen("signup"); }}
        />
      );
    }

    if (authScreen === "forgot") {
      return (
        <ForgotPasswordScreen
          onBack={() => { setAuthScreen("login"); }}
        />
      );
    }

    return (
      <LoginScreen
        initialMode={authScreen === "signup" ? "signup" : "login"}
        onBack={() => { setAuthScreen("welcome"); }}
        onForgotPassword={() => { setAuthScreen("forgot"); }}
      />
    );
  }

  if (dbError) {
    return (
      <View style={styles.loading}>
        <Text style={[styles.errorText, { color: colors.danger }]}>Error: {dbError}</Text>
      </View>
    );
  }

  if (!db) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Initializing database...</Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PowerSyncContext.Provider value={db}>
        <ErrorBoundary>
          <AppNavigator />
        </ErrorBoundary>
      </PowerSyncContext.Provider>
    </QueryClientProvider>
  );
}

export default function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <AppWrapper />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function AppWrapper() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        { flex: 1, backgroundColor: colors.backgroundLight },
        isDark ? darkThemeVars : lightThemeVars,
      ]}
    >
      <StatusBar
        style={isDark ? "light" : "dark"}
        backgroundColor="transparent"
        translucent={true}
      />
      <View style={{ height: insets.top, backgroundColor: colors.surface }} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppContent />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
