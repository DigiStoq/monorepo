import React from "react";
import { View, StyleSheet, ScrollView, Text, Alert, Platform } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { CustomHeader } from "../../components/CustomHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../contexts/AuthContext";
import { spacing, borderRadius, fontSize, fontWeight, shadows, ThemeColors } from "../../lib/theme";

export function UserProfileScreen() {
    const { colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);
    const { user, signOut } = useAuth();

    const displayName = user?.user_metadata?.full_name || "User";
    const email = user?.email || "";
    const initials = displayName.charAt(0).toUpperCase();

    const handleSignOut = async () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await signOut();
                            // Navigation to Login is usually handled by AuthContext state change
                        } catch (e) {
                            Alert.alert("Error", "Failed to sign out");
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <CustomHeader title="User Profile" showBack />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.headerCard}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                    </View>
                    <Text style={styles.nameText}>{displayName}</Text>
                    <Text style={styles.emailText}>{email}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Details</Text>
                    <View style={styles.card}>
                        <Input
                            label="Full Name"
                            value={displayName}
                            editable={false}
                        />
                        <Input
                            label="Email"
                            value={email}
                            editable={false}
                        />
                        <Input
                            label="User ID"
                            value={user?.id}
                            editable={false}
                            style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
                        />
                    </View>
                </View>

                <Button
                    onPress={handleSignOut}
                    variant="destructive"
                    style={{ marginTop: spacing.xl }}
                >
                    Sign Out
                </Button>

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
    headerCard: {
        alignItems: 'center',
        marginBottom: spacing.xl,
        padding: spacing.xl,
    },
    avatarContainer: {
        marginBottom: spacing.md,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.md,
    },
    avatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    nameText: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.text,
        marginBottom: 4,
    },
    emailText: {
        fontSize: fontSize.md,
        color: colors.textMuted,
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
        padding: spacing.md,
        ...shadows.sm,
        gap: spacing.md,
    },
});
