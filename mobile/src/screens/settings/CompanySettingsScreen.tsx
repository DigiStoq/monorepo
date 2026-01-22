import React, { useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Text
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../contexts/ThemeContext";
import { CustomHeader } from "../../components/CustomHeader";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useCompanySettings, CompanySettings } from "../../hooks/useSettings";
import { spacing, borderRadius, fontSize, fontWeight, shadows, ThemeColors } from "../../lib/theme";

function Section({ title, children, styles }: any) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.card}>
                {children}
            </View>
        </View>
    );
}

export function CompanySettingsScreen() {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const styles = React.useMemo(() => createStyles(colors), [colors]);
    const { settings: dbSettings, isLoading, updateCompanySettings } = useCompanySettings();

    const [formState, setFormState] = useState<CompanySettings | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (dbSettings && !formState) {
            setFormState(dbSettings);
        }
    }, [dbSettings]);

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
            if (field === null) {
                // Top level field like name
                return { ...prev, [section]: value };
            }
            // Nested field like address.city
            return {
                ...prev,
                [section]: {
                    ...(prev[section] as any),
                    [field]: value
                }
            };
        });
    };

    if (isLoading || !formState) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.textMuted }}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CustomHeader title="Company Settings" showBack />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <Section title="Business Profile" styles={styles}>
                        <Input
                            label="Business Name"
                            value={formState.name}
                            onChangeText={(v) => updateField("name", null, v)}
                            placeholder="My Company"
                        />
                        <Input
                            label="Legal Name"
                            value={formState.legalName}
                            onChangeText={(v) => updateField("legalName", null, v)}
                            placeholder="Registered Legal Name"
                        />
                    </Section>

                    <Section title="Address" styles={styles}>
                        <Input
                            label="Street Address"
                            value={formState.address.street}
                            onChangeText={(v) => updateField("address", "street", v)}
                        />
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Input
                                    label="City"
                                    value={formState.address.city}
                                    onChangeText={(v) => updateField("address", "city", v)}
                                />
                            </View>
                            <View style={{ width: spacing.md }} />
                            <View style={{ flex: 1 }}>
                                <Input
                                    label="State"
                                    value={formState.address.state}
                                    onChangeText={(v) => updateField("address", "state", v)}
                                />
                            </View>
                        </View>
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Input
                                    label="Postal Code"
                                    value={formState.address.postalCode}
                                    onChangeText={(v) => updateField("address", "postalCode", v)}
                                />
                            </View>
                            <View style={{ width: spacing.md }} />
                            <View style={{ flex: 1 }}>
                                <Input
                                    label="Country"
                                    value={formState.address.country}
                                    onChangeText={(v) => updateField("address", "country", v)}
                                />
                            </View>
                        </View>
                    </Section>

                    <Section title="Contact" styles={styles}>
                        <Input
                            label="Phone"
                            value={formState.contact.phone}
                            onChangeText={(v) => updateField("contact", "phone", v)}
                            keyboardType="phone-pad"
                        />
                        <Input
                            label="Email"
                            value={formState.contact.email}
                            onChangeText={(v) => updateField("contact", "email", v)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <Input
                            label="Website"
                            value={formState.contact.website}
                            onChangeText={(v) => updateField("contact", "website", v)}
                            autoCapitalize="none"
                        />
                    </Section>

                    <Section title="Registration" styles={styles}>
                        <Input
                            label="Tax ID"
                            value={formState.registration.taxId}
                            onChangeText={(v) => updateField("registration", "taxId", v)}
                        />
                        <Input
                            label="EIN"
                            value={formState.registration.ein}
                            onChangeText={(v) => updateField("registration", "ein", v)}
                        />
                    </Section>

                    <Button
                        onPress={handleSave}
                        variant="default"
                        disabled={isSaving}
                        isLoading={isSaving}
                        style={{ marginTop: spacing.lg }}
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
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
        padding: spacing.md,
        ...shadows.sm,
        gap: spacing.md,
    },
    row: {
        flexDirection: 'row',
    }
});
