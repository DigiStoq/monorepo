import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Text, Alert, Modal, TouchableOpacity } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { CustomHeader } from "../../components/CustomHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { spacing, borderRadius, fontSize, fontWeight, shadows, ThemeColors } from "../../lib/theme";
import { Lock, Shield, X, Eye, EyeOff } from "lucide-react-native";
import { supabase } from "../../lib/supabase";

export function SecuritySettingsScreen() {
    const { colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleChangePassword = async () => {
        // Validate
        if (!newPassword || !confirmPassword) {
            Alert.alert("Error", "Please fill in all password fields");
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                throw error;
            }

            Alert.alert("Success", "Password updated successfully!");
            setIsPasswordModalOpen(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error("Password update error:", error);
            Alert.alert("Error", error.message || "Failed to update password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <CustomHeader title="Security" showBack />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Authentication</Text>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Lock size={20} color={colors.text} style={{ marginRight: spacing.md }} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.title}>Password</Text>
                                <Text style={styles.subtitle}>Update your account password</Text>
                            </View>
                        </View>
                        <Button
                            variant="default"
                            onPress={() => setIsPasswordModalOpen(true)}
                            style={{ marginTop: spacing.md }}
                        >
                            Change Password
                        </Button>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Two-Factor Authentication</Text>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Shield size={20} color={colors.text} style={{ marginRight: spacing.md }} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.title}>2FA</Text>
                                <Text style={styles.subtitle}>Add an extra layer of security to your account.</Text>
                            </View>
                        </View>
                        <Button
                            variant="secondary"
                            onPress={() => Alert.alert("Coming Soon", "2FA setup requires additional configuration and will be available soon.")}
                            style={{ marginTop: spacing.md }}
                        >
                            Enable 2FA
                        </Button>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Session</Text>
                    <View style={styles.card}>
                        <Text style={styles.infoText}>
                            Your session is securely managed. You can sign out from the Menu screen.
                        </Text>
                    </View>
                </View>

            </ScrollView>

            {/* Password Change Modal */}
            <Modal visible={isPasswordModalOpen} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Change Password</Text>
                            <TouchableOpacity onPress={() => setIsPasswordModalOpen(false)}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Input
                                label="New Password"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showNewPassword}
                                placeholder="Enter new password"
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowNewPassword(!showNewPassword)}
                            >
                                {showNewPassword ?
                                    <EyeOff size={20} color={colors.textMuted} /> :
                                    <Eye size={20} color={colors.textMuted} />
                                }
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Input
                                label="Confirm New Password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showNewPassword}
                                placeholder="Re-enter new password"
                            />
                        </View>

                        <Text style={styles.helpText}>
                            Password must be at least 6 characters long.
                        </Text>

                        <Button
                            onPress={handleChangePassword}
                            isLoading={isLoading}
                            style={{ marginTop: spacing.lg }}
                        >
                            Update Password
                        </Button>

                        <Button
                            variant="secondary"
                            onPress={() => setIsPasswordModalOpen(false)}
                            style={{ marginTop: spacing.sm }}
                        >
                            Cancel
                        </Button>
                    </View>
                </View>
            </Modal>
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
    infoText: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        lineHeight: 20,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    inputContainer: {
        position: 'relative',
        marginBottom: spacing.md,
    },
    eyeButton: {
        position: 'absolute',
        right: 12,
        top: 38,
    },
    helpText: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        marginTop: spacing.xs,
    },
});
