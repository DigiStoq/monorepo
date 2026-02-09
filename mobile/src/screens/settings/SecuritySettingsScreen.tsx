import { useState } from "react";
import { View, ScrollView, Text, Alert, Modal, TouchableOpacity } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { CustomHeader } from "../../components/CustomHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Lock01Icon, ShieldTickIcon, XCloseIcon, EyeIcon, EyeOffIcon } from "../../components/ui/UntitledIcons";
import { supabase } from "../../lib/supabase";

export function SecuritySettingsScreen() {
    const { colors } = useTheme();

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

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
        <View className="flex-1 bg-background-light">
            <CustomHeader title="Security" showBack />

            <ScrollView contentContainerStyle={{ padding: 24 }}>

                <View className="mb-6">
                    <Text className="text-sm font-bold text-text-muted mb-2 uppercase tracking-widest">Authentication</Text>
                    <View className="bg-surface rounded-lg p-6 shadow-sm">
                        <View className="flex-row items-center mb-4">
                            <View className="mr-3">
                                <Lock01Icon size={20} color={colors.text} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-md font-bold text-text">Password</Text>
                                <Text className="text-sm text-text-muted mt-1">Update your account password</Text>
                            </View>
                        </View>
                        <Button
                            variant="primary"
                            onPress={() => { setIsPasswordModalOpen(true); }}
                            className="mt-2"
                        >
                            Change Password
                        </Button>
                    </View>
                </View>

                <View className="mb-6">
                    <Text className="text-sm font-bold text-text-muted mb-2 uppercase tracking-widest">Two-Factor Authentication</Text>
                    <View className="bg-surface rounded-lg p-6 shadow-sm">
                        <View className="flex-row items-center mb-4">
                            <View className="mr-3">
                                <ShieldTickIcon size={20} color={colors.text} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-md font-bold text-text">2FA</Text>
                                <Text className="text-sm text-text-muted mt-1">Add an extra layer of security to your account.</Text>
                            </View>
                        </View>
                        <Button
                            variant="outline"
                            onPress={() => { Alert.alert("Coming Soon", "2FA setup requires additional configuration and will be available soon."); }}
                            className="mt-2"
                        >
                            Enable 2FA
                        </Button>
                    </View>
                </View>

                <View className="mb-6">
                    <Text className="text-sm font-bold text-text-muted mb-2 uppercase tracking-widest">Session</Text>
                    <View className="bg-surface rounded-lg p-6 shadow-sm">
                        <Text className="text-sm text-text-muted leading-5">
                            Your session is securely managed. You can sign out from the Menu screen.
                        </Text>
                    </View>
                </View>

            </ScrollView>

            {/* Password Change Modal */}
            <Modal visible={isPasswordModalOpen} transparent animationType="slide">
                <View className="flex-1 bg-black/50 justify-center p-6">
                    <View className="bg-surface rounded-xl p-6 shadow-xl">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-lg font-bold text-text">Change Password</Text>
                            <TouchableOpacity onPress={() => { setIsPasswordModalOpen(false); }}>
                                <XCloseIcon size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View className="relative mb-4">
                            <Input
                                label="New Password"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showNewPassword}
                                placeholder="Enter new password"
                            />
                            <TouchableOpacity
                                className="absolute right-3 top-9"
                                onPress={() => { setShowNewPassword(!showNewPassword); }}
                            >
                                {showNewPassword ?
                                    <EyeOffIcon size={20} color={colors.textMuted} /> :
                                    <EyeIcon size={20} color={colors.textMuted} />
                                }
                            </TouchableOpacity>
                        </View>

                        <View className="mb-4">
                            <Input
                                label="Confirm New Password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showNewPassword}
                                placeholder="Re-enter new password"
                            />
                        </View>

                        <Text className="text-xs text-text-muted mt-2 mb-6">
                            Password must be at least 6 characters long.
                        </Text>

                        <Button
                            onPress={handleChangePassword}
                            loading={isLoading}
                            className="mt-4"
                        >
                            Update Password
                        </Button>

                        <Button
                            variant="ghost"
                            onPress={() => { setIsPasswordModalOpen(false); }}
                            className="mt-2"
                        >
                            Cancel
                        </Button>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
