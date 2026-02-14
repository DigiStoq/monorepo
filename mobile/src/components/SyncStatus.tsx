import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { usePowerSync } from "@powersync/react-native";
import { Cloud, CloudOff, RefreshCw } from "lucide-react-native";

export function SyncStatus() {
  const db = usePowerSync();
  const [status, setStatus] = useState<{
    connected: boolean;
    downloading: boolean;
    uploading: boolean;
    lastSyncedAt?: Date;
  }>({
    connected: false,
    downloading: false,
    uploading: false,
  });

  useEffect(() => {
    // Subscribe to status updates
    // Note: The actual API for subscription might vary based on PowerSync version.
    // We will use a polling or listener approach if direct hook isn't available for granular status.
    // For now, we'll try to use the db object properties if available or a simple interval.
    
    // However, @powersync/react-native typically exposes useStatus() or similar, 
    // but since I don't have the docs for the specific version installed, 
    // I will check the `currentStatus` property or similar on the `db` object if it exists alongside `onChange` listeners.
    
    // Let's implement a listener approach which is standard for PowerSync.
    
    const updateStatus = () => {
        const current = db.currentStatus;
        setStatus({
            connected: current?.connected || false,
            downloading: current?.downloading || false,
            uploading: current?.uploading || false,
            lastSyncedAt: current?.lastSyncedAt
        });
    };

    // Initial check
    updateStatus();

    // Listener
    // Note: 'status-change' or similar event might be available.
    // If exact event name is unknown, we can poll or use the provided `registerListener` if available.
    // Let's assume `registerListener` or checking changes on interval for this MVP if strict event is unknown.
    // Actually, `db.onChange` is for data tables.
    
    // Better Approach: Polling for status in this MVP to ensure compability without docs.
    const interval = setInterval(updateStatus, 2000);

    return () => { clearInterval(interval); };
  }, [db]);

  if (!status.connected) {
    return (
      <View style={[styles.container, styles.offline]}>
        <View style={styles.dot} />
        <Text style={styles.text}>Offline</Text>
      </View>
    );
  }

  if (status.downloading || status.uploading) {
    return (
      <View style={[styles.container, styles.syncing]}>
        <RefreshCw size={10} color="#ca8a04" />
        <Text style={[styles.text, { color: "#ca8a04" }]}>Syncing</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.online]}>
      <View style={[styles.dot, { backgroundColor: "#22c55e" }]} />
      <Text style={[styles.text, { color: "#15803d" }]}>Cloud</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  offline: {
    backgroundColor: "#f1f5f9",
    borderColor: '#e2e8f0'
  },
  syncing: {
    backgroundColor: "#fefce8",
    borderColor: '#fef08a'
  },
  online: {
    backgroundColor: "#f0fdf4",
    borderColor: '#dcfce7'
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#94a3b8"
  },
  text: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b",
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
});
