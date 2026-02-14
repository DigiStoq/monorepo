import type React from "react";
import { useState, useMemo } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
    DollarSignIcon,
    FileTextIcon,
    TrendingUpIcon,
    TrendingDownIcon,
    UsersIcon,
    PackageIcon,
} from "../../components/ui/UntitledIcons";
import type { DateRange } from "../../hooks/useReports";
import { useSalesSummaryReport } from "../../hooks/useReports";
import { ReportScreenLayout } from "../../components/reports/ReportScreenLayout";
import { exportToCSV } from "../../lib/export";
import { usePDFGenerator } from "../../hooks/usePDFGenerator";
import { useTheme } from "../../contexts/ThemeContext";

export function SalesSummaryScreen() {
    const { colors } = useTheme();
    const { generatePDF, sharePDF, previewPDF } = usePDFGenerator();

    function Card({
        children,
        className,
    }: {
        children: React.ReactNode;
        className?: string;
    }) {
        return (
            <View className={`bg-surface rounded-lg border border-border p-4 shadow-sm ${className}`}>
                {children}
            </View>
        );
    }

    // Default to current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState<DateRange>({ from: startOfMonth, to: today });

    const { summary, isLoading } = useSalesSummaryReport(dateRange);

    const formatCurrency = (amount: number) => {
        return "$" + (amount || 0).toFixed(2);
    };

    // Derived stats
    const collectionPercent = summary && summary.totalSales > 0
        ? ((summary.totalPaid / summary.totalSales) * 100).toFixed(1)
        : "0";

    const outstandingPercent = summary && summary.totalSales > 0
        ? ((summary.totalDue / summary.totalSales) * 100).toFixed(1)
        : "0";

    // Chart helpers
    const maxMonthAmount = summary?.salesByMonth.reduce((max, m) => Math.max(max, m.amount), 0) || 1;
    const maxCustomerAmount = summary?.topCustomers.reduce((max, c) => Math.max(max, c.amount), 0) || 1;
    const maxItemAmount = summary?.topItems.reduce((max, i) => Math.max(max, i.amount), 0) || 1;

    // Export Logic
    const handleExport = () => {
        if (!summary) return;

        const showPDFOptions = () => {
            const html = `
                <html>
                  <body>
                    <h1>Sales Summary</h1>
                    <p>Period: ${dateRange.from} to ${dateRange.to}</p>
                    <h2>Total Sales: ${formatCurrency(summary.totalSales)}</h2>
                    <p>Total Paid: ${formatCurrency(summary.totalPaid)}</p>
                    <p>Total Due: ${formatCurrency(summary.totalDue)}</p>
                    <hr/>
                    <h3>Monthly Trend</h3>
                    <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">
                        <tr>
                            <th>Month</th>
                            <th>Amount</th>
                        </tr>
                        ${summary.salesByMonth.map(m => `
                            <tr>
                                <td>${m.month}</td>
                                <td>${formatCurrency(m.amount)}</td>
                            </tr>
                        `).join('')}
                    </table>
                  </body>
                </html>
             `;
            const filename = `Sales_Summary_${dateRange.from}_${dateRange.to}.pdf`;

            Alert.alert(
                "PDF Export",
                "Choose action",
                [
                    {
                        text: "Preview",
                        onPress: async () => {
                            try {
                                const uri = await generatePDF(html, filename);
                                await previewPDF(uri, `Sales Summary (${dateRange.from} - ${dateRange.to})`);
                            } catch (e) {
                                Alert.alert("Error", (e as Error).message);
                            }
                        }
                    },
                    {
                        text: "Share",
                        onPress: async () => {
                            try {
                                const uri = await generatePDF(html, filename);
                                await sharePDF(uri);
                            } catch (e) {
                                Alert.alert("Error", (e as Error).message);
                            }
                        }
                    },
                    { text: "Cancel", style: "cancel" }
                ]
            );
        };

        Alert.alert(
            "Export Report",
            "Choose export format",
            [
                {
                    text: "CSV (Excel)",
                    onPress: async () => {
                        try {
                            const csvData = summary.salesByMonth.map(m => ({
                                Month: m.month,
                                Sales: m.amount.toFixed(2)
                            }));
                            await exportToCSV(csvData, [
                                { key: 'Month', label: 'Month' },
                                { key: 'Sales', label: 'Sales Amount' }
                            ], `Sales_Summary_${dateRange.from}_${dateRange.to}`);
                        } catch (e) {
                            Alert.alert("Export Failed", (e as Error).message);
                        }
                    }
                },
                {
                    text: "PDF",
                    onPress: showPDFOptions
                },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    return (
        <ReportScreenLayout
            title="Sales Summary"
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            isLoading={isLoading}
            isEmpty={!summary}
            onExport={handleExport}
        >
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                {summary && (
                    <>
                        {/* Summary Grid */}
                        <View className="flex-row gap-4 mb-4">
                            {/* Total Sales */}
                            <Card className="flex-1">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-xs text-text-secondary font-medium">Total Sales</Text>
                                    <View className="p-1.5 rounded-sm bg-success/20">
                                        <DollarSignIcon size={16} color={colors.success} />
                                    </View>
                                </View>
                                <Text className="text-lg font-bold text-text mb-0.5">{formatCurrency(summary.totalSales)}</Text>
                                <Text className="text-[10px] text-text-muted">{summary.totalInvoices} invoices</Text>
                            </Card>

                            {/* Total Due */}
                            <Card className="flex-1">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-xs text-text-secondary font-medium">Amount Due</Text>
                                    <View className="p-1.5 rounded-sm bg-danger/20">
                                        <TrendingDownIcon size={16} color={colors.danger} />
                                    </View>
                                </View>
                                <Text className="text-lg font-bold text-danger mb-0.5">{formatCurrency(summary.totalDue)}</Text>
                                <Text className="text-[10px] text-text-muted">{outstandingPercent}% outstanding</Text>
                            </Card>
                        </View>

                        <View className="flex-row gap-4 mb-4">
                            {/* Total Paid */}
                            <Card className="flex-1">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-xs text-text-secondary font-medium">Received</Text>
                                    <View className="p-1.5 rounded-sm bg-info/20">
                                        <TrendingUpIcon size={16} color={colors.info} />
                                    </View>
                                </View>
                                <Text className="text-lg font-bold text-success mb-0.5">{formatCurrency(summary.totalPaid)}</Text>
                                <Text className="text-[10px] text-text-muted">{collectionPercent}% collected</Text>
                            </Card>

                            {/* Avg Order */}
                            <Card className="flex-1">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-xs text-text-secondary font-medium">Avg Order</Text>
                                    <View className="p-1.5 rounded-sm bg-primary/20">
                                        <FileTextIcon size={16} color={colors.primary} />
                                    </View>
                                </View>
                                <Text className="text-lg font-bold text-text mb-0.5">{formatCurrency(summary.averageOrderValue)}</Text>
                                <Text className="text-[10px] text-text-muted">Per invoice</Text>
                            </Card>
                        </View>

                        {/* Monthly Trend */}
                        <Card className="mb-4">
                            <Text className="text-md font-semibold text-text mb-2">Sales Trend</Text>
                            <View className="flex-row h-[120px] items-end gap-2 pt-2.5">
                                {summary.salesByMonth.length === 0 ? <Text className="text-center text-text-muted p-5 w-full">No trend data</Text> :
                                    summary.salesByMonth.map((m, i) => (
                                        <View key={i} className="flex-1 items-center gap-1">
                                            <View className="w-3 bg-primary rounded" style={{ height: `${Math.max(4, (m.amount / maxMonthAmount) * 100)}%` }} />
                                            <Text className="text-[10px] text-text-muted">{m.month}</Text>
                                        </View>
                                    ))}
                            </View>
                        </Card>

                        {/* Top Customers */}
                        <Card className="mb-4">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-md font-semibold text-text">Top Customers</Text>
                                <UsersIcon size={16} color={colors.textMuted} />
                            </View>
                            <View className="gap-2">
                                {summary.topCustomers.length === 0 ? <Text className="text-center text-text-muted p-5">No customers found</Text> :
                                    summary.topCustomers.map((c, i) => (
                                        <View key={c.customerId} className="gap-1">
                                            <View className="flex-row justify-between">
                                                <Text className="text-sm text-text font-medium flex-1">{i + 1}. {c.customerName}</Text>
                                                <Text className="text-sm text-text font-bold">{formatCurrency(c.amount)}</Text>
                                            </View>
                                            <View className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                                                <View className="h-full bg-primary rounded-full" style={{ width: `${(c.amount / maxCustomerAmount) * 100}%` }} />
                                            </View>
                                        </View>
                                    ))}
                            </View>
                        </Card>

                        {/* Top Items */}
                        <Card className="mb-4">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-md font-semibold text-text">Top Selling Items</Text>
                                <PackageIcon size={16} color={colors.textMuted} />
                            </View>
                            <View className="gap-2">
                                {summary.topItems.length === 0 ? <Text className="text-center text-text-muted p-5">No items sold</Text> :
                                    summary.topItems.map((item, i) => (
                                        <View key={item.itemId} className="gap-1">
                                            <View className="flex-row justify-between">
                                                <Text className="text-sm text-text font-medium flex-1">{i + 1}. {item.itemName}</Text>
                                                <Text className="text-sm text-text font-bold">{formatCurrency(item.amount)}</Text>
                                            </View>
                                            <Text className="text-[10px] text-text-muted">{item.quantity} sold</Text>
                                        </View>
                                    ))}
                            </View>
                        </Card>
                    </>
                )}
            </ScrollView>
        </ReportScreenLayout>
    );
}
