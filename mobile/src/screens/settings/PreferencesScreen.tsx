import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Switch, Text, TouchableOpacity, Alert } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { CustomHeader } from "../../components/CustomHeader";
import { Button } from "../../components/ui/Button";
import { spacing, borderRadius, fontSize, fontWeight, shadows, ThemeColors } from "../../lib/theme";
import { Moon, Globe, Bell, Calendar, Hash, FileText, ChevronRight, Check } from "lucide-react-native";
import { useUserPreferences } from "../../hooks/useUserPreferences";

type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD" | "DD-MMM-YYYY";

const dateFormatOptions: { value: DateFormat; label: string; example: string }[] = [
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY", example: "25/12/2024" },
    { value: "MM/DD/YYYY", label: "MM/DD/YYYY", example: "12/25/2024" },
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD", example: "2024-12-25" },
    { value: "DD-MMM-YYYY", label: "DD-MMM-YYYY", example: "25-Dec-2024" },
];

const invoiceTermsOptions = [
    { value: 7, label: "7 days" },
    { value: 14, label: "14 days" },
    { value: 15, label: "15 days" },
    { value: 30, label: "30 days" },
    { value: 45, label: "45 days" },
    { value: 60, label: "60 days" },
    { value: 90, label: "90 days" },
];

function PreferenceItem({ icon: Icon, title, value, onValueChange, type = "switch", subtitle, onPress }: any) {
    const { colors } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    const content = (
        <View style={styles.item}>
            <View style={styles.itemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.surfaceHover }]}>
                    <Icon size={20} color={colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{title}</Text>
                    {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            {type === "switch" && (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: colors.border, true: colors.primary }}
                />
            )}
            {type === "arrow" && <ChevronRight size={20} color={colors.textMuted} />}
        </View>
    );

    if (onPress) {
        return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
    }
    return content;
}

function SelectModal({ visible, onClose, title, options, value, onSelect, colors, styles }: any) {
    if (!visible) return null;

    return (
        <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{title}</Text>
                <ScrollView style={{ maxHeight: 300 }}>
                    {options.map((opt: any) => (
                        <TouchableOpacity
                            key={opt.value}
                            style={styles.optionItem}
                            onPress={() => { onSelect(opt.value); onClose(); }}
                        >
                            <Text style={styles.optionText}>
                                {opt.label}{opt.example ? ` (${opt.example})` : ""}
                            </Text>
                            {value === opt.value && <Check size={20} color={colors.primary} />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <Button variant="secondary" onPress={onClose} style={{ marginTop: spacing.md }}>
                    Cancel
                </Button>
            </View>
        </View>
    );
}

export function PreferencesScreen() {
    const { colors, isDark, setMode } = useTheme();
    const styles = React.useMemo(() => createStyles(colors), [colors]);
    const { preferences, updatePreferences, isLoading } = useUserPreferences();

    const [dateFormat, setDateFormat] = useState<DateFormat>("DD/MM/YYYY");
    const [decimalSeparator, setDecimalSeparator] = useState<"." | ",">(".");
    const [thousandsSeparator, setThousandsSeparator] = useState<"," | "." | " ">(",");
    const [invoiceTerms, setInvoiceTerms] = useState(30);
    const [autoSave, setAutoSave] = useState(true);

    const [showDateModal, setShowDateModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (preferences) {
            setDateFormat(preferences.dateFormat || "DD/MM/YYYY");
            setDecimalSeparator(preferences.numberFormat?.decimalSeparator || ".");
            setThousandsSeparator(preferences.numberFormat?.thousandsSeparator || ",");
            setInvoiceTerms(preferences.defaultInvoiceTerms || 30);
            setAutoSave(preferences.autoSave ?? true);
        }
    }, [preferences]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updatePreferences({
                dateFormat,
                numberFormat: {
                    decimalSeparator,
                    thousandsSeparator,
                    decimalPlaces: 2,
                },
                defaultInvoiceTerms: invoiceTerms,
                autoSave,
            });
            Alert.alert("Success", "Preferences saved!");
        } catch (e) {
            Alert.alert("Error", "Failed to save preferences.");
        } finally {
            setIsSaving(false);
        }
    };

    const currentDateLabel = dateFormatOptions.find(d => d.value === dateFormat)?.label || dateFormat;
    const currentTermsLabel = invoiceTermsOptions.find(t => t.value === invoiceTerms)?.label || `${invoiceTerms} days`;

    return (
        <View style={styles.container}>
            <CustomHeader title="Preferences" showBack />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Appearance */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Appearance</Text>
                    <View style={styles.card}>
                        <PreferenceItem
                            icon={Moon}
                            title="Dark Mode"
                            subtitle={isDark ? "On" : "Off"}
                            value={isDark}
                            onValueChange={(v: boolean) => setMode(v ? 'dark' : 'light')}
                        />
                    </View>
                </View>

                {/* Date & Number Format */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Date & Number Format</Text>
                    <View style={styles.card}>
                        <PreferenceItem
                            icon={Calendar}
                            title="Date Format"
                            subtitle={currentDateLabel}
                            type="arrow"
                            onPress={() => setShowDateModal(true)}
                        />
                        <View style={styles.separator} />
                        <PreferenceItem
                            icon={Hash}
                            title="Decimal Separator"
                            subtitle={decimalSeparator === "." ? "Period (.)" : "Comma (,)"}
                            type="arrow"
                            onPress={() => {
                                Alert.alert(
                                    "Decimal Separator",
                                    "Select separator",
                                    [
                                        { text: "Period (.)", onPress: () => setDecimalSeparator(".") },
                                        { text: "Comma (,)", onPress: () => setDecimalSeparator(",") },
                                        { text: "Cancel", style: "cancel" }
                                    ]
                                );
                            }}
                        />
                        <View style={styles.separator} />
                        <PreferenceItem
                            icon={Hash}
                            title="Thousands Separator"
                            subtitle={thousandsSeparator === "," ? "Comma (,)" : thousandsSeparator === "." ? "Period (.)" : "Space"}
                            type="arrow"
                            onPress={() => {
                                Alert.alert(
                                    "Thousands Separator",
                                    "Select separator",
                                    [
                                        { text: "Comma (,)", onPress: () => setThousandsSeparator(",") },
                                        { text: "Period (.)", onPress: () => setThousandsSeparator(".") },
                                        { text: "Space", onPress: () => setThousandsSeparator(" ") },
                                        { text: "Cancel", style: "cancel" }
                                    ]
                                );
                            }}
                        />
                    </View>
                </View>

                {/* Default Values */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Default Values</Text>
                    <View style={styles.card}>
                        <PreferenceItem
                            icon={FileText}
                            title="Invoice Payment Terms"
                            subtitle={currentTermsLabel}
                            type="arrow"
                            onPress={() => setShowTermsModal(true)}
                        />
                        <View style={styles.separator} />
                        <PreferenceItem
                            icon={FileText}
                            title="Auto-Save"
                            subtitle="Automatically save changes"
                            value={autoSave}
                            onValueChange={setAutoSave}
                        />
                    </View>
                </View>

                {/* Localization */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Localization</Text>
                    <View style={styles.card}>
                        <PreferenceItem
                            icon={Globe}
                            title="Language"
                            subtitle="English (US)"
                            type="arrow"
                            onPress={() => Alert.alert("Coming Soon", "Language selection will be available soon.")}
                        />
                    </View>
                </View>

                {/* Notifications */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <View style={styles.card}>
                        <PreferenceItem
                            icon={Bell}
                            title="Push Notifications"
                            value={true}
                            onValueChange={() => Alert.alert("Coming Soon", "Notification settings will be available soon.")}
                        />
                    </View>
                </View>

                {/* Save Button */}
                <Button
                    onPress={handleSave}
                    isLoading={isSaving}
                    style={{ marginTop: spacing.md }}
                >
                    Save Preferences
                </Button>

            </ScrollView>

            {/* Date Format Modal */}
            <SelectModal
                visible={showDateModal}
                onClose={() => setShowDateModal(false)}
                title="Select Date Format"
                options={dateFormatOptions}
                value={dateFormat}
                onSelect={setDateFormat}
                colors={colors}
                styles={styles}
            />

            {/* Invoice Terms Modal */}
            <SelectModal
                visible={showTermsModal}
                onClose={() => setShowTermsModal(false)}
                title="Select Invoice Terms"
                options={invoiceTermsOptions}
                value={invoiceTerms}
                onSelect={setInvoiceTerms}
                colors={colors}
                styles={styles}
            />
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
        paddingBottom: 40,
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
        padding: spacing.sm,
        ...shadows.sm,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        flex: 1,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
        color: colors.text,
    },
    itemSubtitle: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        marginTop: 2,
    },
    separator: {
        height: 1,
        backgroundColor: colors.border,
        marginHorizontal: spacing.md,
    },
    // Modal styles
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        width: '85%',
        maxWidth: 400,
        ...shadows.lg,
    },
    modalTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    optionText: {
        fontSize: fontSize.md,
        color: colors.text,
    },
});
