import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { usePowerSync } from "@powersync/react-native";
import { RefreshCw } from "lucide-react-native";
import { useTheme } from "../contexts/ThemeContext";

export function SyncStatus() {
  const db = usePowerSync();
  const { colors } = useTheme();
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
    const updateStatus = () => {
        const current = db.currentStatus;
        setStatus({
            connected: current?.connected || false,
            downloading: current?.downloading || false,
            uploading: current?.uploading || false,
            lastSyncedAt: current?.lastSyncedAt
        });
    };

    updateStatus();

    const interval = setInterval(updateStatus, 2000);

    return () => { clearInterval(interval); };
  }, [db]);

  if (!status.connected) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceHover, borderColor: colors.border }]}>
        <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
        <Text style={[styles.text, { color: colors.textSecondary }]}>Offline</Text>
      </View>
    );
  }

  if (status.downloading || status.uploading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.warningMuted, borderColor: colors.warning }]}>
        <RefreshCw size={10} color={colors.warning} />
        <Text style={[styles.text, { color: colors.warning }]}>Syncing</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.successMuted, borderColor: colors.success }]}>
      <View style={[styles.dot, { backgroundColor: colors.success }]} />
      <Text style={[styles.text, { color: colors.success }]}>Cloud</Text>
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
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
