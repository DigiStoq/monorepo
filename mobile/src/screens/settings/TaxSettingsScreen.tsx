import { useState } from "react";
import {
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Text,
    TouchableOpacity,
    Modal
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { CustomHeader } from "../../components/CustomHeader";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import type { TaxRate } from "../../hooks/useSettings"; // Removed useTaxRates from here as we'll mock it or it should be passed in if needed. Wait, the original imported it. Let's assume it exists.
import { useTaxRates } from "../../hooks/useSettings";
import { TrashIcon, PlusIcon, XCloseIcon } from "../../components/ui/UntitledIcons";

export function TaxSettingsScreen() {
    const { colors } = useTheme();
    const { taxRates, createTaxRate, deleteTaxRate } = useTaxRates();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newRateName, setNewRateName] = useState("");
    const [newRateValue, setNewRateValue] = useState("");

    const handleAddRate = async () => {
        if (!newRateName || !newRateValue) {
            Alert.alert("Error", "Name and Rate are required.");
            return;
        }
        try {
            await createTaxRate({
                name: newRateName,
                rate: Number(newRateValue),
                type: "percentage",
                isDefault: false,
                description: ""
            } as any); // Casting as any to bypass potential partial type issues if necessary, or just matching interface
            setIsAddModalOpen(false);
            setNewRateName("");
            setNewRateValue("");
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to add tax rate.");
        }
    };

    const handleDeleteRate = (id: string) => {
        Alert.alert("Delete Tax Rate", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => deleteTaxRate(id) }
        ]);
    };

    return (
        <View className="flex-1 bg-background-light">
            <CustomHeader title="Manage Tax Rates" showBack />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    <View className="mb-6">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-sm font-bold text-text-muted uppercase tracking-widest">Tax Rates</Text>
                            <TouchableOpacity onPress={() => { setIsAddModalOpen(true); }} className="p-1">
                                <PlusIcon size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                        <View className="bg-surface rounded-lg p-4 shadow-sm">
                            {taxRates.map((rate: TaxRate) => (
                                <View key={rate.id} className="flex-row justify-between items-center py-3 border-b border-border last:border-b-0">
                                    <View>
                                        <Text className="text-md font-medium text-text">{rate.name}</Text>
                                        <Text className="text-sm text-text-muted">{rate.rate}% {rate.type}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => { handleDeleteRate(rate.id); }} className="p-2">
                                        <TrashIcon size={18} color={colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {taxRates.length === 0 && (
                                <Text className="text-text-muted italic text-center py-4">No tax rates defined.</Text>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Add Rate Modal */}
            <Modal visible={isAddModalOpen} transparent animationType="slide">
                <View className="flex-1 bg-black/50 justify-center p-6">
                    <View className="bg-surface rounded-xl p-6 shadow-xl space-y-4">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-bold text-text">Add Tax Rate</Text>
                            <TouchableOpacity onPress={() => { setIsAddModalOpen(false); }}>
                                <XCloseIcon size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <View className="space-y-4">
                            <Input
                                label="Name"
                                value={newRateName}
                                onChangeText={setNewRateName}
                                placeholder="e.g. VAT"
                            />
                            <Input
                                label="Rate (%)"
                                value={newRateValue}
                                onChangeText={setNewRateValue}
                                keyboardType="numeric"
                                placeholder="0.00"
                            />
                        </View>
                        <Button
                            onPress={handleAddRate}
                            className="mt-6"
                        >
                            Add Rate
                        </Button>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
