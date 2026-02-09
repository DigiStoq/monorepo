import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Text, Alert } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { CustomHeader } from "../../components/CustomHeader";
import { Button } from "../../components/ui/Button";
import { spacing, borderRadius, fontSize, fontWeight, shadows, ThemeColors } from "../../lib/theme";
import { Cloud, RefreshCw, HardDrive } from "lucide-react-native";

export function BackupSettingsScreen() {
    const { colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);
    const [isLoading, setIsLoading] = useState(false);

    const handleBackup = async () => {
        setIsLoading(true);
        // Simulate backup
        setTimeout(() => {
            setIsLoading(false);
            Alert.alert("Success", "Backup created successfully.");
        }, 1500);
    };

    const handleRestore = async () => {
        Alert.alert(
            "Restore Backup",
            "This will overwrite your current data. Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Restore",
                    style: "destructive",
                    onPress: () => {
                        setIsLoading(true);
                        // Simulate restore
                        setTimeout(() => {
                            setIsLoading(false);
                            Alert.alert("Success", "Data restored successfully.");
                        }, 1500);
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <CustomHeader title="Backup & Restore" showBack />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Cloud Backup</Text>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Cloud size={32} color={colors.primary} style={{ marginRight: spacing.md }} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.title}>Cloud Sync</Text>
                                <Text style={styles.subtitle}>Your data is automatically synced to the cloud when you are online.</Text>
                            </View>
                        </View>
                        <View style={styles.statusBadge}>
                            <RefreshCw size={12} color={colors.primary} style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>Sync Active</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Local Backup</Text>
                    <View style={styles.card}>
                        <View style={{ marginBottom: spacing.md }}>
                            <Text style={styles.title}>Create Backup</Text>
                            <Text style={styles.subtitle}>Save a local copy of your data to your device.</Text>
                        </View>
                        <Button
                            variant="default"
                            onPress={handleBackup}
                            isLoading={isLoading}
                            leftIcon={<HardDrive size={16} color="white" />}
                        >
                            Create Local Backup
                        </Button>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Restore</Text>
                    <View style={styles.card}>
                        <View style={{ marginBottom: spacing.md }}>
                            <Text style={styles.title}>Restore from File</Text>
                            <Text style={styles.subtitle}>Restore data from a previously saved backup file.</Text>
                        </View>
                        <Button
                            variant="secondary"
                            onPress={handleRestore}
                            disabled={isLoading}
                            style={{ borderColor: colors.danger, borderWidth: 1 }}
                        >
                            <Text style={{ color: colors.danger, fontWeight: '600' }}>Restore from Backup</Text>
                        </Button>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundLight,
    },
    scrollContent: {
        padding: spacing.lg,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
        color: colors.textMuted,
        marginBottom: spacing.sm,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    subtitle: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: spacing.md,
    }
});
