import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { CustomHeader } from '../../components/CustomHeader';
import type { DateRange} from './DateRangePicker';
import { DateRangePicker } from './DateRangePicker';
import type { ThemeColors } from '../../lib/theme';
import { spacing, borderRadius, fontSize, fontWeight } from '../../lib/theme';
import { Calendar, Download } from 'lucide-react-native';

interface ReportScreenLayoutProps {
    title: string;
    children: React.ReactNode;
    dateRange?: DateRange;
    onDateRangeChange?: (range: DateRange) => void;
    onExport?: () => void;
    isLoading?: boolean;
    isEmpty?: boolean;
    emptyText?: string;
}

export function ReportScreenLayout({
    title,
    children,
    dateRange,
    onDateRangeChange,
    onExport,
    isLoading,
    isEmpty,
    emptyText
}: ReportScreenLayoutProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const [pickerVisible, setPickerVisible] = React.useState(false);

    return (
        <View style={styles.container}>
            <CustomHeader title={title} showBack
                rightAction={onExport ? (
                    <TouchableOpacity onPress={onExport} style={styles.headerButton}>
                        <Download size={22} color={colors.primary} />
                    </TouchableOpacity>
                ) : undefined}
            />

            {dateRange && onDateRangeChange && (
                <View style={styles.filterBar}>
                    <TouchableOpacity onPress={() => { setPickerVisible(true); }} style={styles.dateSelector}>
                        <Calendar size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
                        <Text style={styles.dateText}>{dateRange.from} - {dateRange.to}</Text>
                    </TouchableOpacity>

                    <DateRangePicker
                        visible={pickerVisible}
                        onClose={() => { setPickerVisible(false); }}
                        onSelect={onDateRangeChange}
                        currentRange={dateRange}
                    />
                </View>
            )}

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Generatng report...</Text>
                </View>
            ) : isEmpty ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>{emptyText}</Text>
                </View>
            ) : (
                <View style={styles.content}>
                    {children}
                </View>
            )}
        </View>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    filterBar: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: colors.background,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: colors.border,
    },
    dateText: {
        fontSize: fontSize.sm,
        color: colors.text,
        fontWeight: fontWeight.medium,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    loadingText: {
        marginTop: spacing.md,
        color: colors.textMuted,
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: fontSize.md,
    },
    content: {
        flex: 1,
    },
    headerButton: {
        padding: 8,
    }
});
