import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, Platform, Switch, KeyboardAvoidingView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Plus, Edit2, Trash2, CheckCircle, Percent } from "lucide-react-native";
import { useTaxRates, TaxRate } from "../../hooks/useSettings";
import { useTheme } from "../../contexts/ThemeContext";
import { ThemeColors, spacing, borderRadius, fontSize, fontWeight, shadows } from "../../lib/theme";

export function TaxSettingsScreen() {
    const navigation = useNavigation();
    const { taxRates, isLoading, createTaxRate, updateTaxRate, deleteTaxRate } = useTaxRates();
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingRate, setEditingRate] = useState<Partial<TaxRate> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleAdd = () => {
        setEditingRate({ name: "", rate: 0, type: "percentage", description: "", isDefault: false });
        setModalVisible(true);
    };

    const handleEdit = (rate: TaxRate) => {
        setEditingRate({ ...rate });
        setModalVisible(true);
    };

    const handleSavedRate = async () => {
        if (!editingRate?.name || editingRate.rate === undefined) return;
        setIsSaving(true);
        try {
            if (editingRate.id) {
                await updateTaxRate(editingRate.id, editingRate);
            } else {
                await createTaxRate(editingRate as Omit<TaxRate, "id" | "isActive">);
            }
            setModalVisible(false);
        } catch (error) {
            Alert.alert("Error", "Failed to save tax rate");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert("Delete Tax Rate", "Are you sure you want to delete this tax rate?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => deleteTaxRate(id) }
        ]);
    };

    const handleSetDefault = (id: string) => {
        updateTaxRate(id, { isDefault: true });
    };

    const renderItem = ({ item }: { item: TaxRate }) => (
        <View style={styles.card}>
            <View style={styles.row}>
                <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                        <Text style={styles.rateName}>{item.name}</Text>
                        {item.isDefault && <View style={styles.badge}><Text style={styles.badgeText}>Default</Text></View>}
                    </View>
                    <Text style={styles.rateDesc}>{item.description || "No description"}</Text>
                </View>
                <Text style={styles.rateValue}>{item.rate}%</Text>
            </View>
            <View style={styles.actionRow}>
                {!item.isDefault && (
                    <TouchableOpacity onPress={() => handleSetDefault(item.id)} style={styles.textBtn}>
                        <Text style={styles.actionText}>Set Default</Text>
                    </TouchableOpacity>
                )}
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconBtn}>
                    <Edit2 size={18} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.iconBtn, { marginLeft: 8 }]}>
                    <Trash2 size={18} color={colors.danger} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <ArrowLeft color={colors.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tax Configuration</Text>
                <TouchableOpacity onPress={handleAdd} style={styles.headerBtn}>
                    <Plus color={colors.primary} size={24} />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.center}><Text style={{ color: colors.text }}>Loading...</Text></View>
            ) : (
                <FlatList
                    data={taxRates}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Percent size={48} color={colors.border} />
                            <Text style={styles.emptyText}>No tax rates configured</Text>
                            <TouchableOpacity onPress={handleAdd} style={styles.addBtn}>
                                <Text style={styles.addBtnText}>Add Tax Rate</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

            {/* Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editingRate?.id ? "Edit Tax Rate" : "New Tax Rate"}</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={editingRate?.name}
                                onChangeText={t => setEditingRate(prev => ({ ...prev!, name: t }))}
                                placeholder="e.g. VAT"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Rate (%)</Text>
                            <TextInput
                                style={styles.input}
                                value={editingRate?.rate !== undefined ? String(editingRate.rate) : ""}
                                onChangeText={t => setEditingRate(prev => ({ ...prev!, rate: parseFloat(t) || 0 }))}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={styles.input}
                                value={editingRate?.description}
                                onChangeText={t => setEditingRate(prev => ({ ...prev!, description: t }))}
                                placeholder="Optional description"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                        <View style={styles.switchRow}>
                            <Text style={styles.label}>Set as Default</Text>
                            <Switch
                                value={editingRate?.isDefault || false}
                                onValueChange={v => setEditingRate(prev => ({ ...prev!, isDefault: v }))}
                                trackColor={{ false: colors.border, true: colors.primary + '50' }}
                                thumbColor={editingRate?.isDefault ? colors.primary : "#f4f3f4"}
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveModalBtn} onPress={handleSavedRate} disabled={isSaving}>
                                <Text style={styles.saveText}>{isSaving ? "Saving..." : "Save"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border, marginTop: Platform.OS === 'android' ? 24 : 0 },
    headerBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: "600", color: colors.text },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    list: { padding: 16, gap: 12 },
    card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    rateName: { fontSize: 16, fontWeight: '600', color: colors.text },
    rateDesc: { fontSize: 13, color: colors.textSecondary },
    rateValue: { fontSize: 20, fontWeight: '700', color: colors.text },
    badge: { backgroundColor: colors.primary + '10', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    badgeText: { fontSize: 10, color: colors.primary, fontWeight: '700' },

    actionRow: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: colors.border, alignItems: 'center' },
    textBtn: { paddingVertical: 4 },
    actionText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    iconBtn: { padding: 4 },

    emptyState: { alignItems: 'center', padding: 40, gap: 12 },
    emptyText: { color: colors.textSecondary },
    addBtn: { marginTop: 16, backgroundColor: colors.text, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    addBtnText: { color: colors.background, fontWeight: '600' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20, color: colors.text },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '500', color: colors.textSecondary, marginBottom: 6 },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },

    modalActions: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
    cancelText: { color: colors.textSecondary, fontWeight: '600' },
    saveModalBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: colors.text, alignItems: 'center' },
    saveText: { color: colors.background, fontWeight: '600' },
});
