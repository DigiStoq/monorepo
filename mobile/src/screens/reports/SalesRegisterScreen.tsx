import { useState, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SearchIcon } from "../../components/ui/UntitledIcons";
import { ReportScreenLayout } from "../../components/reports/ReportScreenLayout";
import type { DateRange } from "../../hooks/useReports";
import { useSalesRegisterReport } from "../../hooks/useReports";
import { useTheme } from "../../contexts/ThemeContext";

export function SalesRegisterScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>("all");

    const { entries, isLoading } = useSalesRegisterReport(dateRange);

    const filteredData = useMemo(() => {
        return entries.filter((entry) => {
            const matchesSearch =
                (entry.invoiceNumber || "").toLowerCase().includes(search.toLowerCase()) ||
                (entry.customerName || "").toLowerCase().includes(search.toLowerCase());
            const matchesStatus =
                statusFilter === "all" || entry.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [entries, search, statusFilter]);

    const totals = useMemo(() => {
        return filteredData.reduce(
            (acc, entry) => ({
                total: acc.total + (entry.total || 0),
                paid: acc.paid + (entry.paid || 0),
                due: acc.due + (entry.due || 0),
            }),
            { total: 0, paid: 0, due: 0 }
        );
    }, [filteredData]);

    const formatCurrency = (amount: number) => "$" + (amount || 0).toFixed(2);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'paid': return { bg: 'bg-success/20', text: 'text-success', color: colors.success };
            case 'partial': return { bg: 'bg-warning/20', text: 'text-warning', color: colors.warning };
            case 'unpaid': return { bg: 'bg-danger/20', text: 'text-danger', color: colors.danger };
            default: return { bg: 'bg-surface-hover', text: 'text-text-muted', color: colors.textMuted };
        }
    };

    return (
        <ReportScreenLayout title="Sales Register" dateRange={dateRange} onDateRangeChange={setDateRange}>
            {/* Filters */}
            <View className="p-4 bg-surface border-b border-border">
                <View className="flex-row items-center bg-surface-hover rounded-lg px-3 h-10 mb-3">
                    <SearchIcon size={18} color={colors.textMuted} />
                    <TextInput
                        className="flex-1 ml-2 h-full text-base text-text"
                        placeholder="Search invoice or customer..."
                        placeholderTextColor={colors.textMuted}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    {['all', 'paid', 'partial', 'unpaid'].map(s => {
                        const isActive = statusFilter === s;
                        const styleInfo = getStatusStyle(s);
                        return (
                            <TouchableOpacity
                                key={s}
                                className={`px-3 py-1.5 rounded-full mr-2 ${isActive ? 'bg-text' : 'bg-surface-hover'}`}
                                onPress={() => { setStatusFilter(s as any); }}
                            >
                                <Text className={`text-sm font-medium ${isActive ? 'text-background' : 'text-text-muted'}`}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Summary Strip */}
            <View className="flex-row bg-surface p-3 justify-around border-b border-border">
                <View className="items-center">
                    <Text className="text-[11px] text-text-muted mb-0.5">Total Sales</Text>
                    <Text className="text-base font-bold text-text">{formatCurrency(totals.total)}</Text>
                </View>
                <View className="w-[1px] bg-border" />
                <View className="items-center">
                    <Text className="text-[11px] text-text-muted mb-0.5">Received</Text>
                    <Text className="text-base font-bold text-success">{formatCurrency(totals.paid)}</Text>
                </View>
                <View className="w-[1px] bg-border" />
                <View className="items-center">
                    <Text className="text-[11px] text-text-muted mb-0.5">Due</Text>
                    <Text className="text-base font-bold text-danger">{formatCurrency(totals.due)}</Text>
                </View>
            </View>

            {/* List */}
            <FlatList
                data={filteredData}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
                renderItem={({ item }) => {
                    const statusStyle = getStatusStyle(item.status);
                    return (
                        <View className="bg-surface rounded-xl p-4 border border-border shadow-sm">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-base font-semibold text-text">{item.invoiceNumber}</Text>
                                <View className={`px-2 py-0.5 rounded ${statusStyle.bg}`}>
                                    <Text className={`text-[10px] font-bold ${statusStyle.text}`}>
                                        {item.status.toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                            <View className="flex-row justify-between items-center mt-1">
                                <Text className="text-sm text-text-secondary">{item.customerName}</Text>
                                <Text className="text-xs text-text-muted">{item.date}</Text>
                            </View>

                            <View className="h-[1px] bg-border my-3" />

                            <View className="flex-row justify-between items-center">
                                <Text className="text-sm text-text-secondary">Total</Text>
                                <Text className="text-base font-bold text-text">{formatCurrency(item.total)}</Text>
                            </View>

                            {(item.due > 0 || item.paid > 0) && (
                                <View className="flex-row justify-between items-center mt-1">
                                    <Text className="text-xs text-success">
                                        {item.paid > 0 ? `Paid: ${formatCurrency(item.paid)}` : ''}
                                    </Text>
                                    <Text className={`text-xs font-semibold ${item.due > 0 ? 'text-danger' : 'text-success'}`}>
                                        Due: {formatCurrency(item.due)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View className="p-10 items-center">
                        <Text className="text-text-muted">{isLoading ? "Loading..." : "No invoices found"}</Text>
                    </View>
                }
            />
        </ReportScreenLayout>
    );
}
