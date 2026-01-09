import "react-native-get-random-values";
import { useState, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Text, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { PowerSyncContext } from "@powersync/react-native";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { LoginScreen } from "./src/screens/LoginScreen";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { getPowerSyncDatabase } from "./src/lib/powersync";
import type { PowerSyncDatabase } from "@powersync/react-native";

function AppContent(): JSX.Element | null {
  const { isLoading, isAuthenticated } = useAuth();
  const [db, setDb] = useState<PowerSyncDatabase | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && !db) {
      try {
        const database = getPowerSyncDatabase();
        setDb(database);
      } catch (error) {
        console.error("Failed to initialize database:", error);
        setDbError(
          error instanceof Error
            ? error.message
            : "Database initialization failed"
        );
      }
    }
  }, [isAuthenticated, db]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!isAuthenticated) {
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

export default function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppWrapper />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function AppWrapper() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar style="dark" backgroundColor="#ffffff" translucent={false} />
      <View style={{ height: insets.top, backgroundColor: "#ffffff" }} />
      <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
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
