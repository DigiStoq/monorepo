import "react-native-get-random-values";
import { useState, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Text, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { PowerSyncContext } from "@powersync/react-native";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { LoginScreen } from "./src/screens/LoginScreen";
import { SplashScreen } from "./src/screens/SplashScreen";
import { WelcomeScreen } from "./src/screens/WelcomeScreen";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { initializePowerSync } from "./src/lib/powersync";
import type { PowerSyncDatabase } from "@powersync/react-native";

type AuthScreen = "splash" | "welcome" | "login" | "signup";

function AppContent(): JSX.Element | null {
  const { isLoading, isAuthenticated } = useAuth();
  const [db, setDb] = useState<PowerSyncDatabase | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [authScreen, setAuthScreen] = useState<AuthScreen>("splash");

  useEffect(() => {
    if (isAuthenticated && !db) {
      const initDb = async () => {
        try {
          const database = await initializePowerSync();
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
  }, [isAuthenticated, db]);

  // Reset to welcome screen when user logs out
  useEffect(() => {
    if (!isAuthenticated && authScreen !== "splash") {
      setAuthScreen("welcome");
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!isAuthenticated) {
    // Show auth flow screens
    if (authScreen === "splash") {
      return <SplashScreen onFinish={() => setAuthScreen("welcome")} />;
    }

    if (authScreen === "welcome") {
      return (
        <WelcomeScreen
          onSignIn={() => setAuthScreen("login")}
          onSignUp={() => setAuthScreen("signup")}
        />
      );
    }

    // Both login and signup use the same LoginScreen component
    // The LoginScreen has its own toggle for signup mode
    return <LoginScreen />;
  }

  if (dbError) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>Error: {dbError}</Text>
      </View>
    );
  }

  if (!db) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Initializing database...</Text>
      </View>
    );
  }

  return (
    <PowerSyncContext.Provider value={db}>
      <AppNavigator />
    </PowerSyncContext.Provider>
  );
}

import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext";

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
    <View style={{ flex: 1, backgroundColor: colors.backgroundLight }}>
      <StatusBar
        style={isDark ? "light" : "dark"}
        backgroundColor={colors.backgroundLight}
        translucent={false}
      />
      <View style={{ height: insets.top, backgroundColor: colors.backgroundLight }} />
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
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    color: "#64748b",
    marginTop: 16,
    fontSize: 14,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
