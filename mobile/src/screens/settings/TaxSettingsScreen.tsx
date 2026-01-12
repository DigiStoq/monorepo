import React, { useState, useEffect } from "react";
import {
    View,
    StyleSheet,
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
import { useInvoiceSettings, useTaxRates, InvoiceSettings, TaxRate } from "../../hooks/useSettings";
import { spacing, borderRadius, fontSize, fontWeight, shadows, ThemeColors } from "../../lib/theme";
import { Trash2, Plus, X } from "lucide-react-native";

function Section({ title, children, styles, action }: any) {
    return (
        <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {action}
            </View>
            <View style={styles.card}>
                {children}
            </View>
        </View>
    );
}

export function TaxSettingsScreen() {
    const { colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);
    const { settings: invoiceSettings, updateInvoiceSettings } = useInvoiceSettings();
    const { taxRates, createTaxRate, deleteTaxRate } = useTaxRates();

    const [formState, setFormState] = useState<InvoiceSettings | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newRate, setNewRate] = useState<Partial<TaxRate>>({ name: "", rate: 0, type: "percentage", isDefault: false });

    useEffect(() => {
        if (invoiceSettings && !formState) {
            setFormState(invoiceSettings);
        }
    }, [invoiceSettings]);

    const handleSaveInvoiceSettings = async () => {
        if (!formState) return;
        setIsSaving(true);
        try {
            await updateInvoiceSettings(formState);
            Alert.alert("Success", "Invoice settings updated.");
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to save settings.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddRate = async () => {
        if (!newRate.name || newRate.rate === undefined) {
            Alert.alert("Error", "Name and Rate are required.");
            return;
        }
        try {
            await createTaxRate({
                name: newRate.name,
                rate: Number(newRate.rate),
                type: newRate.type || "percentage",
                isDefault: newRate.isDefault || false,
                description: newRate.description
            });
            setIsAddModalOpen(false);
            setNewRate({ name: "", rate: 0, type: "percentage", isDefault: false });
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

    const updateField = (field: keyof InvoiceSettings, value: any) => {
        setFormState(prev => prev ? ({ ...prev, [field]: value }) : null);
    };

    if (!formState) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.textMuted }}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CustomHeader title="Tax & Invoice" showBack />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <Section title="Invoice Settings" styles={styles}>
                        <Input
                            label="Invoice Prefix"
                            value={formState.prefix}
                            onChangeText={(v) => updateField("prefix", v)}
                            placeholder="INV-"
                        />
                        <Input
                            label="Terms & Conditions"
                            value={formState.termsAndConditions}
                            onChangeText={(v) => updateField("termsAndConditions", v)}
                            multiline
                            numberOfLines={3}
                            style={{ height: 80, textAlignVertical: 'top' }}
                        />
                        <Input
                            label="Default Notes"
                            value={formState.notes}
                            onChangeText={(v) => updateField("notes", v)}
                            multiline
                            numberOfLines={2}
                            style={{ height: 60, textAlignVertical: 'top' }}
                        />
                        <Input
                            label="Due Days"
                            value={formState.dueDateDays?.toString()}
                            onChangeText={(v) => updateField("dueDateDays", parseInt(v) || 0)}
                            keyboardType="number-pad"
                        />
                        <Button
                            onPress={handleSaveInvoiceSettings}
                            disabled={isSaving}
                            isLoading={isSaving}
                            style={{ marginTop: spacing.md }}
                        >
                            {isSaving ? "Saving..." : "Save Settings"}
                        </Button>
                    </Section>

                    <Section
                        title="Tax Rates"
                        styles={styles}
                        action={
                            <TouchableOpacity onPress={() => setIsAddModalOpen(true)}>
                                <Plus size={20} color={colors.primary} />
                            </TouchableOpacity>
                        }
                    >
                        {taxRates.map((rate: TaxRate) => (
                            <View key={rate.id} style={styles.rateItem}>
                                <View>
                                    <Text style={styles.rateName}>{rate.name}</Text>
                                    <Text style={styles.rateValue}>{rate.rate}% {rate.type}</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleDeleteRate(rate.id)}>
                                    <Trash2 size={18} color={colors.danger} />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {taxRates.length === 0 && (
                            <Text style={{ color: colors.textMuted, fontStyle: 'italic' }}>No tax rates defined.</Text>
                        )}
                    </Section>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Add Rate Modal */}
            <Modal visible={isAddModalOpen} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Tax Rate</Text>
                            <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <Input
                            label="Name"
                            value={newRate.name}
                            onChangeText={(v) => setNewRate(prev => ({ ...prev, name: v }))}
                            placeholder="e.g. VAT"
                        />
                        <Input
                            label="Rate (%)"
                            value={newRate.rate?.toString()}
                            onChangeText={(v) => setNewRate(prev => ({ ...prev, rate: v as any }))}
                            keyboardType="numeric"
                        />
                        <Button
                            onPress={handleAddRate}
                            style={{ marginTop: spacing.lg }}
                        >
                            Add Rate
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
    rateItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    rateName: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
        color: colors.text,
    },
    rateValue: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
    },
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
        gap: spacing.md,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    modalTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    }
});
