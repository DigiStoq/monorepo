import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeColors } from '../../lib/theme';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../lib/theme';
import { Calendar, X, Check } from 'lucide-react-native';

export interface DateRange {
    from: string;
    to: string;
}

interface DateRangePickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (range: DateRange) => void;
    currentRange: DateRange;
}

type Preset = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year' | 'custom';

export function DateRangePicker({ visible, onClose, onSelect, currentRange }: DateRangePickerProps) {
    const { colors } = useTheme();
    const styles = createStyles(colors);

    const [selectedPreset, setSelectedPreset] = useState<Preset>('this_month');
    const [customFrom, setCustomFrom] = useState(currentRange.from);
    const [customTo, setCustomTo] = useState(currentRange.to);

    const getPresetRange = (preset: Preset): DateRange => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        switch (preset) {
            case 'today':
                return { from: today, to: today };
            case 'yesterday': {
                const y = new Date(now);
                y.setDate(y.getDate() - 1);
                const str = y.toISOString().split('T')[0];
                return { from: str, to: str };
            }
            case 'this_week': {
                const first = new Date(now.setDate(now.getDate() - now.getDay()));
                const last = new Date(now.setDate(now.getDate() - now.getDay() + 6));
                return { from: first.toISOString().split('T')[0], to: last.toISOString().split('T')[0] };
            }
            case 'last_week': {
                // Simplified logic, better to use date-fns if available but trying to stay lean
                const todayDate = new Date();
                const lastWeekStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() - 7 - todayDate.getDay());
                const lastWeekEnd = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() - 1 - todayDate.getDay());
                return { from: lastWeekStart.toISOString().split('T')[0], to: lastWeekEnd.toISOString().split('T')[0] };
            }
            case 'this_month': {
                const first = new Date(now.getFullYear(), now.getMonth(), 1);
                return { from: first.toISOString().split('T')[0], to: today };
            }
            case 'last_month': {
                const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const last = new Date(now.getFullYear(), now.getMonth(), 0);
                return { from: first.toISOString().split('T')[0], to: last.toISOString().split('T')[0] };
            }
            case 'this_year': {
                const first = new Date(now.getFullYear(), 0, 1);
                return { from: first.toISOString().split('T')[0], to: today };
            }
            default:
                return currentRange;
        }
    };

    const handleApply = () => {
        if (selectedPreset === 'custom') {
            onSelect({ from: customFrom, to: customTo });
        } else {
            onSelect(getPresetRange(selectedPreset));
        }
        onClose();
    };

    const handlePresetSelect = (preset: Preset) => {
        setSelectedPreset(preset);
        if (preset !== 'custom') {
            const range = getPresetRange(preset);
            setCustomFrom(range.from);
            setCustomTo(range.to);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Select Date Range</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presets}>
                            {(['today', 'yesterday', 'this_week', 'this_month', 'last_month', 'this_year', 'custom'] as Preset[]).map((p) => (
                                <TouchableOpacity
                                    key={p}
                                    style={[styles.presetBadge, selectedPreset === p && styles.presetActive]}
                                    onPress={() => { handlePresetSelect(p); }}
                                >
                                    <Text style={[styles.presetText, selectedPreset === p && styles.presetTextActive]}>
                                        {p.replace('_', ' ').toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.inputs}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>From (YYYY-MM-DD)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={customFrom}
                                    onChangeText={(t) => {
                                        setCustomFrom(t);
                                        setSelectedPreset('custom');
                                    }}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>To (YYYY-MM-DD)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={customTo}
                                    onChangeText={(t) => {
                                        setCustomTo(t);
                                        setSelectedPreset('custom');
                                    }}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={onClose} style={[styles.button, styles.cancelButton]}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleApply} style={[styles.button, styles.applyButton]}>
                            <Check size={18} color="white" style={{ marginRight: 8 }} />
                            <Text style={styles.applyButtonText}>Apply Range</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    modal: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        ...shadows.lg,
        maxHeight: 500,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    content: {
        padding: spacing.md,
    },
    presets: {
        flexDirection: 'row',
        marginBottom: spacing.lg,
        paddingBottom: spacing.sm,
    },
    presetBadge: {
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        borderRadius: borderRadius.full,
        backgroundColor: colors.background,
        marginRight: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    presetActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    presetText: {
        fontSize: fontSize.xs,
        color: colors.textSecondary,
        fontWeight: fontWeight.medium,
    },
    presetTextActive: {
        color: 'white',
    },
    inputs: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    label: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        marginBottom: 6,
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        padding: spacing.sm,
        color: colors.text,
        fontSize: fontSize.md,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.md,
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surfaceHover,
        borderBottomLeftRadius: borderRadius.lg,
        borderBottomRightRadius: borderRadius.lg,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: borderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
    },
    cancelButton: {

    },
    cancelButtonText: {
        color: colors.textMuted,
        fontWeight: fontWeight.medium,
    },
    applyButton: {
        backgroundColor: colors.primary,
    },
    applyButtonText: {
        color: 'white',
        fontWeight: fontWeight.bold,
    },
});
