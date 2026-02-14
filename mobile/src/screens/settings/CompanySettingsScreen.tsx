import { useState, useEffect } from "react";
import {
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Text,
    ActivityIndicator
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../contexts/ThemeContext";
import { CustomHeader } from "../../components/CustomHeader";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import type { CompanySettings } from "../../hooks/useSettings";
import { useCompanySettings } from "../../hooks/useSettings";

function Section({ title, children }: any) {
    return (
        <View className="mb-6">
            <Text className="text-sm font-bold text-text-muted mb-2 uppercase tracking-widest">{title}</Text>
            <View className="bg-surface rounded-lg p-4 shadow-sm gap-4">
                {children}
            </View>
        </View>
    );
}

export function CompanySettingsScreen() {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const { settings: dbSettings, isLoading, updateCompanySettings } = useCompanySettings();

    const [formState, setFormState] = useState<CompanySettings | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (dbSettings && !formState) {
            setFormState(dbSettings);
        }
    }, [dbSettings, formState]);

    const handleSave = async () => {
        if (!formState) return;
        setIsSaving(true);
        try {
            await updateCompanySettings(formState);
            Alert.alert("Success", "Company settings updated successfully.");
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to save settings.");
        } finally {
            setIsSaving(false);
        }
    };

    const updateField = (section: keyof CompanySettings, field: string | null, value: string) => {
        setFormState(prev => {
            if (!prev) return null;
            // Handle top-level string fields differently from nested objects
            if (field === null) {
                // Determine if the section is one of the string fields
                if (typeof prev[section] === 'string') {
                    return { ...prev, [section]: value };
                }
                // If it's an object but we're trying to set it directly (shouldn't happen with current logic but for safety)
                return prev;
            }

            // Handle nested fields
            // We need to assert that prev[section] is an object here
            const sectionValue = prev[section];
            if (typeof sectionValue === 'object' && sectionValue !== null) {
                return {
                    ...prev,
                    [section]: {
                        ...sectionValue,
                        [field]: value
                    }
                };
            }
            return prev;
        });
    };

    if (isLoading || !formState) {
        return (
            <View className="flex-1 justify-center items-center bg-background">
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background-light">
            <CustomHeader title="Company Settings" showBack />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ padding: 16 }}>

                    <Section title="Business Profile">
                        <Input
                            label="Business Name"
                            value={formState.name}
                            onChangeText={(v) => { updateField("name", null, v); }}
                            placeholder="My Company"
                        />
                        <Input
                            label="Legal Name"
                            value={formState.legalName}
                            onChangeText={(v) => { updateField("legalName", null, v); }}
                            placeholder="Registered Legal Name"
                        />
                    </Section>

                    <Section title="Address">
                        <Input
                            label="Street Address"
                            value={formState.address.street}
                            onChangeText={(v) => { updateField("address", "street", v); }}
                        />
                        <View className="flex-row gap-4">
                            <View className="flex-1">
                                <Input
                                    label="City"
                                    value={formState.address.city}
                                    onChangeText={(v) => { updateField("address", "city", v); }}
                                />
                            </View>
                            <View className="flex-1">
                                <Input
                                    label="State"
                                    value={formState.address.state}
                                    onChangeText={(v) => { updateField("address", "state", v); }}
                                />
                            </View>
                        </View>
                        <View className="flex-row gap-4">
                            <View className="flex-1">
                                <Input
                                    label="Postal Code"
                                    value={formState.address.postalCode}
                                    onChangeText={(v) => { updateField("address", "postalCode", v); }}
                                />
                            </View>
                            <View className="flex-1">
                                <Input
                                    label="Country"
                                    value={formState.address.country}
                                    onChangeText={(v) => { updateField("address", "country", v); }}
                                />
                            </View>
                        </View>
                    </Section>

                    <Section title="Contact">
                        <Input
                            label="Phone"
                            value={formState.contact.phone}
                            onChangeText={(v) => { updateField("contact", "phone", v); }}
                            keyboardType="phone-pad"
                        />
                        <Input
                            label="Email"
                            value={formState.contact.email}
                            onChangeText={(v) => { updateField("contact", "email", v); }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <Input
                            label="Website"
                            value={formState.contact.website}
                            onChangeText={(v) => { updateField("contact", "website", v); }}
                            autoCapitalize="none"
                        />
                    </Section>

                    <Section title="Registration">
                        <Input
                            label="Tax ID"
                            value={formState.registration.taxId}
                            onChangeText={(v) => { updateField("registration", "taxId", v); }}
                        />
                        <Input
                            label="EIN"
                            value={formState.registration.ein}
                            onChangeText={(v) => { updateField("registration", "ein", v); }}
                        />
                    </Section>

                    <Button
                        onPress={handleSave}
                        variant="primary"
                        disabled={isSaving}
                        loading={isSaving}
                        className="mt-4"
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>

                    <View className="h-10" />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
