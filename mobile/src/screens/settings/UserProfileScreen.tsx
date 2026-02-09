import { View, ScrollView, Text, Alert, Platform } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { CustomHeader } from "../../components/CustomHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../contexts/AuthContext";

export function UserProfileScreen() {
    const { colors } = useTheme();
    const { user, signOut } = useAuth(); // Assuming useAuth is correctly imported

    const displayName = user?.user_metadata?.full_name || "User";
    const email = user?.email || "";
    // Handle cases where displayName might be empty or undefined safely
    const initials = (displayName && displayName.length > 0) ? displayName.charAt(0).toUpperCase() : "U";

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
                            // Verify signOut exists on the context before calling
                            if (signOut) {
                                await signOut();
                            } else {
                                console.error("signOut function is not available in useAuth context");
                                Alert.alert("Error", "Sign out functionality is currently unavailable.");
                            }
                        } catch (_e) {
                            Alert.alert("Error", "Failed to sign out");
                        }
                    }
                }
            ]
        );
    };

    return (
        <View className="flex-1 bg-background-light">
            <CustomHeader title="User Profile" showBack />

            <ScrollView contentContainerStyle={{ padding: 24 }}>
                <View className="items-center mb-8 bg-surface rounded-xl p-6 shadow-sm border border-border">
                    <View className="mb-4 shadow-md">
                        <View className="w-24 h-24 rounded-full bg-primary justify-center items-center" style={{ backgroundColor: colors.primary }}>
                            <Text className="text-4xl font-bold text-white">{initials}</Text>
                        </View>
                    </View>
                    <Text className="text-xl font-bold text-text mb-1">{displayName}</Text>
                    <Text className="text-md text-text-muted">{email}</Text>
                </View>

                <View className="mb-8">
                    <Text className="text-sm font-bold text-text-muted mb-2 uppercase tracking-widest">Account Details</Text>
                    <View className="bg-surface rounded-lg p-4 shadow-sm space-y-4">
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
                            // Using a monospaced font style if possible via class or style
                            style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
                        />
                    </View>
                </View>

                <Button
                    onPress={handleSignOut}
                    variant="danger"
                    className="mt-4"
                >
                    Sign Out
                </Button>

            </ScrollView>
        </View>
    );
}
