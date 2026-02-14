import { useState } from "react";
import { View, ScrollView, Text, Alert } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { CustomHeader } from "../../components/CustomHeader";
import { Button } from "../../components/ui/Button";
import { CloudBlank01Icon, RefreshCw01Icon, HardDriveIcon } from "../../components/ui/UntitledIcons";

export function BackupSettingsScreen() {
    const { colors } = useTheme();
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
        <View className="flex-1 bg-background-light">
            <CustomHeader title="Backup & Restore" showBack />

            <ScrollView contentContainerStyle={{ padding: 24 }}>

                <View className="mb-6">
                    <Text className="text-sm font-bold text-text-muted mb-3 uppercase tracking-widest">Cloud Backup</Text>
                    <View className="bg-surface rounded-lg p-6 shadow-sm">
                        <View className="flex-row items-center mb-4">
                            <View className="mr-4">
                                <CloudBlank01Icon size={32} color={colors.primary} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-md font-bold text-text">Cloud Sync</Text>
                                <Text className="text-sm text-text-muted mt-1">Your data is automatically synced to the cloud when you are online.</Text>
                            </View>
                        </View>
                        <View className="flex-row items-center bg-primary-20 px-3 py-1.5 rounded-full self-start" style={{ backgroundColor: colors.primary + '20' }}>
                            <RefreshCw01Icon size={12} color={colors.primary} />
                            <Text className="text-xs font-semibold ml-1" style={{ color: colors.primary }}>Sync Active</Text>
                        </View>
                    </View>
                </View>

                <View className="mb-6">
                    <Text className="text-sm font-bold text-text-muted mb-3 uppercase tracking-widest">Local Backup</Text>
                    <View className="bg-surface rounded-lg p-6 shadow-sm">
                        <View className="mb-4">
                            <Text className="text-md font-bold text-text">Create Backup</Text>
                            <Text className="text-sm text-text-muted mt-1">Save a local copy of your data to your device.</Text>
                        </View>
                        <Button
                            variant="primary"
                            onPress={handleBackup}
                            loading={isLoading}
                            leftIcon={<HardDriveIcon size={16} color="white" />}
                        >
                            Create Local Backup
                        </Button>
                    </View>
                </View>

                <View className="mb-6">
                    <Text className="text-sm font-bold text-text-muted mb-3 uppercase tracking-widest">Restore</Text>
                    <View className="bg-surface rounded-lg p-6 shadow-sm">
                        <View className="mb-4">
                            <Text className="text-md font-bold text-text">Restore from File</Text>
                            <Text className="text-sm text-text-muted mt-1">Restore data from a previously saved backup file.</Text>
                        </View>
                        <Button
                            variant="ghost"
                            onPress={handleRestore}
                            disabled={isLoading}
                            className="border border-danger"
                        >
                            <Text className="font-semibold text-danger" style={{ color: colors.danger }}>Restore from Backup</Text>
                        </Button>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}
