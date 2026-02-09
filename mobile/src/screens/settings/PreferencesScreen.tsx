import { useState, useEffect } from "react";
import { View, ScrollView, Switch, Text, TouchableOpacity, Alert, Modal } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { CustomHeader } from "../../components/CustomHeader";
import { Button } from "../../components/ui/Button";
import { useUserPreferences } from "../../hooks/useUserPreferences";
import {
    Moon01Icon,
    Globe01Icon,
    Bell01Icon,
    CalendarIcon,
    Hash01Icon,
    FileCheck02Icon,
    ChevronRightIcon,
    CheckIcon
} from "../../components/ui/UntitledIcons";

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

    const content = (
        <View className="flex-row items-center justify-between p-4 border-b border-border bg-surface">
            <View className="flex-row items-center flex-1">
                <View className="w-9 h-9 rounded-lg items-center justify-center mr-3 bg-surface-hover" style={{ backgroundColor: colors.surface + '20' }}>
                    <Icon size={20} color={colors.text} />
                </View>
                <View className="flex-1">
                    <Text className="text-md font-medium text-text">{title}</Text>
                    {subtitle && <Text className="text-xs text-text-muted mt-0.5">{subtitle}</Text>}
                </View>
            </View>
            {type === "switch" && (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: colors.border, true: colors.primary + '80' }}
                    thumbColor={value ? colors.primary : "#f4f3f4"}
                />
            )}
            {type === "arrow" && <ChevronRightIcon size={20} color={colors.textMuted} />}
        </View>
    );

    if (onPress) {
        return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>;
    }
    return content;
}

function SelectModal({ visible, onClose, title, options, value, onSelect, colors }: any) {
    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View className="flex-1 justify-center items-center bg-black/50">
                <TouchableOpacity className="absolute inset-0" onPress={onClose} activeOpacity={1} />
                <View className="bg-surface rounded-xl p-6 w-11/12 max-w-sm shadow-xl border border-border">
                    <Text className="text-lg font-bold text-text mb-4 text-center">{title}</Text>
                    <ScrollView style={{ maxHeight: 300 }}>
                        {options.map((opt: any) => (
                            <TouchableOpacity
                                key={opt.value}
                                className="flex-row justify-between items-center py-3 border-b border-border"
                                onPress={() => { onSelect(opt.value); onClose(); }}
                            >
                                <Text className="text-md text-text">
                                    {opt.label}{opt.example ? ` (${opt.example})` : ""}
                                </Text>
                                {value === opt.value && <CheckIcon size={20} color={colors.primary} />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <Button variant="ghost" onPress={onClose} className="mt-4">
                        Cancel
                    </Button>
                </View>
            </View>
        </Modal>
    );
}

export function PreferencesScreen() {
    const { colors, isDark, setMode } = useTheme();
    const { preferences, updatePreferences } = useUserPreferences();

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
        } catch (_e) {
            Alert.alert("Error", "Failed to save preferences.");
        } finally {
            setIsSaving(false);
        }
    };

    const currentDateLabel = dateFormatOptions.find(d => d.value === dateFormat)?.label || dateFormat;
    const currentTermsLabel = invoiceTermsOptions.find(t => t.value === invoiceTerms)?.label || `${invoiceTerms} days`;

    return (
        <View className="flex-1 bg-background-light">
            <CustomHeader title="Preferences" showBack />

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

                {/* Appearance */}
                <View className="mb-6">
                    <Text className="text-sm font-bold text-text-muted mb-2 uppercase tracking-widest">Appearance</Text>
                    <View className="bg-surface rounded-lg overflow-hidden border border-border shadow-sm">
                        <PreferenceItem
                            icon={Moon01Icon}
                            title="Dark Mode"
                            subtitle={isDark ? "On" : "Off"}
                            value={isDark}
                            onValueChange={(v: boolean) => setMode(v ? 'dark' : 'light')}
                        />
                    </View>
                </View>

                {/* Date & Number Format */}
                <View className="mb-6">
                    <Text className="text-sm font-bold text-text-muted mb-2 uppercase tracking-widest">Date & Number Format</Text>
                    <View className="bg-surface rounded-lg overflow-hidden border border-border shadow-sm">
                        <PreferenceItem
                            icon={CalendarIcon}
                            title="Date Format"
                            subtitle={currentDateLabel}
                            type="arrow"
                            onPress={() => { setShowDateModal(true); }}
                        />
                        <PreferenceItem
                            icon={Hash01Icon}
                            title="Decimal Separator"
                            subtitle={decimalSeparator === "." ? "Period (.)" : "Comma (,)"}
                            type="arrow"
                            onPress={() => {
                                Alert.alert(
                                    "Decimal Separator",
                                    "Select separator",
                                    [
                                        { text: "Period (.)", onPress: () => { setDecimalSeparator("."); } },
                                        { text: "Comma (,)", onPress: () => { setDecimalSeparator(","); } },
                                        { text: "Cancel", style: "cancel" }
                                    ]
                                );
                            }}
                        />
                        <PreferenceItem
                            icon={Hash01Icon}
                            title="Thousands Separator"
                            subtitle={thousandsSeparator === "," ? "Comma (,)" : thousandsSeparator === "." ? "Period (.)" : "Space"}
                            type="arrow"
                            onPress={() => {
                                Alert.alert(
                                    "Thousands Separator",
                                    "Select separator",
                                    [
                                        { text: "Comma (,)", onPress: () => { setThousandsSeparator(","); } },
                                        { text: "Period (.)", onPress: () => { setThousandsSeparator("."); } },
                                        { text: "Space", onPress: () => { setThousandsSeparator(" "); } },
                                        { text: "Cancel", style: "cancel" }
                                    ]
                                );
                            }}
                        />
                    </View>
                </View>

                {/* Default Values */}
                <View className="mb-6">
                    <Text className="text-sm font-bold text-text-muted mb-2 uppercase tracking-widest">Default Values</Text>
                    <View className="bg-surface rounded-lg overflow-hidden border border-border shadow-sm">
                        <PreferenceItem
                            icon={FileCheck02Icon}
                            title="Invoice Payment Terms"
                            subtitle={currentTermsLabel}
                            type="arrow"
                            onPress={() => { setShowTermsModal(true); }}
                        />
                        <PreferenceItem
                            icon={FileCheck02Icon}
                            title="Auto-Save"
                            subtitle="Automatically save changes"
                            value={autoSave}
                            onValueChange={setAutoSave}
                        />
                    </View>
                </View>

                {/* Localization */}
                <View className="mb-6">
                    <Text className="text-sm font-bold text-text-muted mb-2 uppercase tracking-widest">Localization</Text>
                    <View className="bg-surface rounded-lg overflow-hidden border border-border shadow-sm">
                        <PreferenceItem
                            icon={Globe01Icon}
                            title="Language"
                            subtitle="English (US)"
                            type="arrow"
                            onPress={() => { Alert.alert("Coming Soon", "Language selection will be available soon."); }}
                        />
                    </View>
                </View>

                {/* Notifications */}
                <View className="mb-6">
                    <Text className="text-sm font-bold text-text-muted mb-2 uppercase tracking-widest">Notifications</Text>
                    <View className="bg-surface rounded-lg overflow-hidden border border-border shadow-sm">
                        <PreferenceItem
                            icon={Bell01Icon}
                            title="Push Notifications"
                            value={true}
                            onValueChange={() => { Alert.alert("Coming Soon", "Notification settings will be available soon."); }}
                        />
                    </View>
                </View>

                {/* Save Button */}
                <Button
                    onPress={handleSave}
                    loading={isSaving}
                    className="mt-4"
                >
                    Save Preferences
                </Button>

            </ScrollView>

            {/* Date Format Modal */}
            <SelectModal
                visible={showDateModal}
                onClose={() => { setShowDateModal(false); }}
                title="Select Date Format"
                options={dateFormatOptions}
                value={dateFormat}
                onSelect={setDateFormat}
                colors={colors}
            />

            {/* Invoice Terms Modal */}
            <SelectModal
                visible={showTermsModal}
                onClose={() => { setShowTermsModal(false); }}
                title="Select Invoice Terms"
                options={invoiceTermsOptions}
                value={invoiceTerms}
                onSelect={setInvoiceTerms}
                colors={colors}
            />
        </View>
    );
}
