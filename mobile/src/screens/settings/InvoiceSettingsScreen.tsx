import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Switch, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeftIcon, SaveIcon, FileCheck02Icon, CreditCard01Icon, PaletteIcon, Hash01Icon } from "../../components/ui/UntitledIcons";
import type { InvoiceSettings } from "../../hooks/useSettings";
import { useInvoiceSettings } from "../../hooks/useSettings";
import { useTheme } from "../../contexts/ThemeContext";

export function InvoiceSettingsScreen() {
    const navigation = useNavigation<any>();
    const { settings, isLoading, updateInvoiceSettings } = useInvoiceSettings();
    const [formState, setFormState] = useState<InvoiceSettings | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { colors } = useTheme();

    useEffect(() => {
        if (settings) {
            setFormState(JSON.parse(JSON.stringify(settings)));
        }
    }, [settings]);

    const handleSave = async () => {
        if (!formState) return;
        setIsSaving(true);
        try {
            await updateInvoiceSettings(formState);
            Alert.alert("Success", "Invoice settings updated successfully");
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    const updateBankDetails = (field: string, value: string) => {
        setFormState(prev => prev ? ({
            ...prev,
            bankDetails: { ...prev.bankDetails, [field]: value }
        }) : null);
    };

    if (isLoading || !formState) return (
        <View className="flex-1 justify-center items-center bg-background">
            <Text className="text-text-secondary">Loading...</Text>
        </View>
    );

    // Helpers
    const formatInvoiceNumber = () => `${formState.prefix}-${String(formState.nextNumber).padStart(formState.padding, '0')}`;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
            <View className="flex-1 bg-background">
                <View className={`flex-row items-center justify-between p-4 bg-surface border-b border-border ${Platform.OS === 'android' ? 'mt-6' : ''}`}>
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
                        <ArrowLeftIcon color={colors.text} size={24} />
                    </TouchableOpacity>
                    <Text className="text-lg font-semibold text-text">Invoice Settings</Text>
                    <TouchableOpacity onPress={handleSave} disabled={isSaving} className="p-2">
                        <SaveIcon color={isSaving ? colors.textMuted : colors.primary} size={24} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ padding: 16 }}>

                    {/* Numbering */}
                    <View className="mb-6">
                        <View className="flex-row items-center mb-2 gap-2">
                            <Hash01Icon size={18} color={colors.textSecondary} />
                            <Text className="text-sm font-semibold text-text-secondary uppercase">Numbering</Text>
                        </View>
                        <View className="bg-surface rounded-xl p-4 border border-border">
                            <View className="flex-row">
                                <View className="flex-1 mr-2 mb-4">
                                    <Text className="text-sm font-medium text-text-secondary mb-1.5">Prefix</Text>
                                    <TextInput
                                        className="border border-border rounded-lg p-3 text-md text-text bg-surface"
                                        value={formState.prefix}
                                        onChangeText={(t) => { setFormState({ ...formState, prefix: t }); }}
                                        placeholderTextColor={colors.textMuted}
                                        style={{ color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }}
                                    />
                                </View>
                                <View className="flex-1 ml-2 mb-4">
                                    <Text className="text-sm font-medium text-text-secondary mb-1.5">Next Number</Text>
                                    <TextInput
                                        className="border border-border rounded-lg p-3 text-md text-text bg-surface"
                                        value={String(formState.nextNumber)}
                                        onChangeText={(t) => { setFormState({ ...formState, nextNumber: parseInt(t) || 0 }); }}
                                        keyboardType="number-pad"
                                        placeholderTextColor={colors.textMuted}
                                        style={{ color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }}
                                    />
                                </View>
                            </View>
                            <View className="mb-4">
                                <Text className="text-sm font-medium text-text-secondary mb-1.5">Padding (Digits)</Text>
                                <TextInput
                                    className="border border-border rounded-lg p-3 text-md text-text bg-surface"
                                    value={String(formState.padding)}
                                    onChangeText={(t) => { setFormState({ ...formState, padding: parseInt(t) || 0 }); }}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    placeholderTextColor={colors.textMuted}
                                    style={{ color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }}
                                />
                            </View>
                            <View className="flex-row items-center bg-surface-hover p-3 rounded-lg border border-border" style={{ backgroundColor: colors.surface + '10' }}>
                                <Text className="text-sm text-text-secondary mr-2">Preview:</Text>
                                <Text className="text-md font-bold text-primary font-mono" style={{ color: colors.primary }}>{formatInvoiceNumber()}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Tax Configuration (NEW) */}
                    <View className="mb-6">
                        <View className="flex-row items-center mb-2 gap-2">
                            <Hash01Icon size={18} color={colors.textSecondary} />
                            <Text className="text-sm font-semibold text-text-secondary uppercase">Tax Configuration</Text>
                        </View>
                        <View className="bg-surface rounded-xl p-4 border border-border">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-md font-medium text-text">Enable Tax Calculation</Text>
                                <Switch
                                    value={formState.taxEnabled}
                                    onValueChange={(v) => { setFormState({ ...formState, taxEnabled: v }); }}
                                    trackColor={{ false: colors.border, true: colors.primary + '50' }}
                                    thumbColor={formState.taxEnabled ? colors.primary : "#f4f3f4"}
                                />
                            </View>

                            {formState.taxEnabled && (
                                <>
                                    <View className="flex-row justify-between items-center mt-4">
                                        <Text className="text-md font-medium text-text">Prices Include Tax</Text>
                                        <Switch
                                            value={formState.taxInclusive}
                                            onValueChange={(v) => { setFormState({ ...formState, taxInclusive: v }); }}
                                            trackColor={{ false: colors.border, true: colors.primary + '50' }}
                                            thumbColor={formState.taxInclusive ? colors.primary : "#f4f3f4"}
                                        />
                                    </View>
                                    <View className="flex-row justify-between items-center mt-4">
                                        <Text className="text-md font-medium text-text">Round Tax at Subtotal</Text>
                                        <Switch
                                            value={formState.roundTax}
                                            onValueChange={(v) => { setFormState({ ...formState, roundTax: v }); }}
                                            trackColor={{ false: colors.border, true: colors.primary + '50' }}
                                            thumbColor={formState.roundTax ? colors.primary : "#f4f3f4"}
                                        />
                                    </View>

                                    <TouchableOpacity
                                        className="flex-row items-center justify-between mt-4 py-2 border-t border-border"
                                        onPress={() => navigation.navigate("TaxSettings")}
                                    >
                                        <Text className="text-md font-medium text-primary" style={{ color: colors.primary }}>Manage Tax Rates</Text>
                                        <View style={{ transform: [{ rotate: '180deg' }] }}>
                                            <ArrowLeftIcon size={16} color={colors.primary} />
                                        </View>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>

                    {/* Terms & Notes */}
                    <View className="mb-6">
                        <View className="flex-row items-center mb-2 gap-2">
                            <FileCheck02Icon size={18} color={colors.textSecondary} />
                            <Text className="text-sm font-semibold text-text-secondary uppercase">Terms & Content</Text>
                        </View>
                        <View className="bg-surface rounded-xl p-4 border border-border">
                            <View className="mb-4">
                                <Text className="text-sm font-medium text-text-secondary mb-1.5">Default Terms & Conditions</Text>
                                <TextInput
                                    className="border border-border rounded-lg p-3 text-md text-text bg-surface h-20"
                                    value={formState.termsAndConditions}
                                    onChangeText={(t) => { setFormState({ ...formState, termsAndConditions: t }); }}
                                    multiline
                                    placeholderTextColor={colors.textMuted}
                                    style={{ color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }}
                                />
                            </View>
                            <View>
                                <Text className="text-sm font-medium text-text-secondary mb-1.5">Footer Notes</Text>
                                <TextInput
                                    className="border border-border rounded-lg p-3 text-md text-text bg-surface h-16"
                                    value={formState.notes}
                                    onChangeText={(t) => { setFormState({ ...formState, notes: t }); }}
                                    multiline
                                    placeholderTextColor={colors.textMuted}
                                    style={{ color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Bank Details */}
                    <View className="mb-6">
                        <View className="flex-row items-center mb-2 gap-2">
                            <CreditCard01Icon size={18} color={colors.textSecondary} />
                            <Text className="text-sm font-semibold text-text-secondary uppercase">Payment Details</Text>
                        </View>
                        <View className="bg-surface rounded-xl p-4 border border-border">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-md font-medium text-text">Show Bank Details on Invoice</Text>
                                <Switch
                                    value={formState.showBankDetails}
                                    onValueChange={(v) => { setFormState({ ...formState, showBankDetails: v }); }}
                                    trackColor={{ false: colors.border, true: colors.primary + '50' }}
                                    thumbColor={formState.showBankDetails ? colors.primary : "#f4f3f4"}
                                />
                            </View>

                            {formState.showBankDetails && (
                                <View className="mt-4">
                                    <View className="mb-4">
                                        <Text className="text-sm font-medium text-text-secondary mb-1.5">Bank Name</Text>
                                        <TextInput
                                            className="border border-border rounded-lg p-3 text-md text-text bg-surface"
                                            value={formState.bankDetails?.bankName}
                                            onChangeText={(t) => { updateBankDetails('bankName', t); }}
                                            placeholderTextColor={colors.textMuted}
                                            style={{ color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }}
                                        />
                                    </View>
                                    <View className="mb-4">
                                        <Text className="text-sm font-medium text-text-secondary mb-1.5">Account Name</Text>
                                        <TextInput
                                            className="border border-border rounded-lg p-3 text-md text-text bg-surface"
                                            value={formState.bankDetails?.accountName}
                                            onChangeText={(t) => { updateBankDetails('accountName', t); }}
                                            placeholderTextColor={colors.textMuted}
                                            style={{ color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }}
                                        />
                                    </View>
                                    <View className="mb-4">
                                        <Text className="text-sm font-medium text-text-secondary mb-1.5">Account Number</Text>
                                        <TextInput
                                            className="border border-border rounded-lg p-3 text-md text-text bg-surface"
                                            value={formState.bankDetails?.accountNumber}
                                            onChangeText={(t) => { updateBankDetails('accountNumber', t); }}
                                            placeholderTextColor={colors.textMuted}
                                            style={{ color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }}
                                        />
                                    </View>
                                    <View className="flex-row">
                                        <View className="flex-1 mr-2">
                                            <Text className="text-sm font-medium text-text-secondary mb-1.5">Routing / IFSC</Text>
                                            <TextInput
                                                className="border border-border rounded-lg p-3 text-md text-text bg-surface"
                                                value={formState.bankDetails?.routingNumber}
                                                onChangeText={(t) => { updateBankDetails('routingNumber', t); }}
                                                placeholderTextColor={colors.textMuted}
                                                style={{ color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }}
                                            />
                                        </View>
                                        <View className="flex-1 ml-2">
                                            <Text className="text-sm font-medium text-text-secondary mb-1.5">Swift Code</Text>
                                            <TextInput
                                                className="border border-border rounded-lg p-3 text-md text-text bg-surface"
                                                value={formState.bankDetails?.swiftCode}
                                                onChangeText={(t) => { updateBankDetails('swiftCode', t); }}
                                                placeholderTextColor={colors.textMuted}
                                                style={{ color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }}
                                            />
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* PDF Template */}
                    <View className="mb-6">
                        <View className="flex-row items-center mb-2 gap-2">
                            <PaletteIcon size={18} color={colors.textSecondary} />
                            <Text className="text-sm font-semibold text-text-secondary uppercase">PDF Template</Text>
                        </View>
                        <View className="bg-surface rounded-xl p-4 border border-border">
                            {["classic", "modern", "minimal"].map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    className={`flex-row items-center justify-between p-3.5 rounded-lg mb-2 border ${formState.pdfTemplate === t ? 'border-primary bg-primary-10' : 'border-border bg-surface'}`}
                                    style={{
                                        borderColor: formState.pdfTemplate === t ? colors.primary : colors.border,
                                        backgroundColor: formState.pdfTemplate === t ? colors.primary + '10' : colors.surface
                                    }}
                                    onPress={() => { setFormState({ ...formState, pdfTemplate: t as any }); }}
                                >
                                    <Text
                                        className={`text-md ${formState.pdfTemplate === t ? 'font-semibold text-primary' : 'text-text'}`}
                                        style={{ color: formState.pdfTemplate === t ? colors.primary : colors.text }}
                                    >
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </Text>
                                    {formState.pdfTemplate === t && <View className="w-2.5 h-2.5 rounded-full bg-primary" style={{ backgroundColor: colors.primary }} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View className="h-10" />
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}
