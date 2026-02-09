import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../contexts/ThemeContext";
import { CustomHeader } from "../components/CustomHeader";
import { Button } from "../components/ui/Button";
import {
    Upload,
    Download,
    Layers,
    HardDrive,
    RefreshCw,
    Trash2,
    ChevronRight,
    FileSpreadsheet,
    X,
    Check,
    TrendingUp,
    TrendingDown,
    Package,
    AlertTriangle
} from "lucide-react-native";
import { spacing, borderRadius, fontSize, fontWeight, shadows, ThemeColors } from "../lib/theme";
import { db } from "../lib/powersync";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

function UtilityItem({
    icon: Icon,
    title,
    description,
    onPress,
    color,
    styles,
    colors
}: any) {
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
                <Icon size={24} color={color} />
            </View>
            <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} />
        </TouchableOpacity>
    );
}

// Custom Alert Modal Component
function CustomAlert({
    visible,
    onClose,
    title,
    message,
    type = 'info',
    colors,
    styles
}: {
    visible: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
    colors: ThemeColors;
    styles: any;
}) {
    if (!visible) return null;

    const iconColor = type === 'success' ? colors.success : type === 'error' ? colors.danger : colors.primary;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Pressable style={styles.alertContent} onPress={e => e.stopPropagation()}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <X size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                    <View style={[styles.alertIconContainer, { backgroundColor: iconColor + '20' }]}>
                        <Check size={32} color={iconColor} />
                    </View>
                    <Text style={styles.alertTitle}>{title}</Text>
                    <Text style={styles.alertMessage}>{message}</Text>
                    <Button onPress={onClose} style={{ marginTop: spacing.lg, width: '100%' }}>
                        OK
                    </Button>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

// CSV Parser helper
function parseCSV(content: string): { headers: string[]; rows: string[][] } {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line =>
        line.split(',').map(cell => cell.trim().replace(/"/g, ''))
    );
    return { headers, rows };
}

// CSV Generator helper
function generateCSV(headers: string[], rows: (string | number)[][]): string {
    const headerLine = headers.join(',');
    const dataLines = rows.map(row => row.map(cell => `"${cell}"`).join(','));
    return [headerLine, ...dataLines].join('\n');
}

export function UtilitiesScreen() {
    const { colors } = useTheme();
    const navigation = useNavigation<any>();
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    // Modal states
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
    const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);

    // Alert state
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'info';
    }>({ visible: false, title: '', message: '', type: 'info' });

    const [isProcessing, setIsProcessing] = useState(false);
    const [importType, setImportType] = useState<'customers' | 'items'>('customers');
    const [exportType, setExportType] = useState<'customers' | 'items'>('customers');

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setAlertConfig({ visible: true, title, message, type });
    };

    const hideAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    };

    // ========== IMPORT ==========
    const handleImportFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];
            const content = await FileSystem.readAsStringAsync(file.uri);
            const { headers, rows } = parseCSV(content);

            if (rows.length === 0) {
                showAlert('Error', 'No data found in file', 'error');
                return;
            }

            setIsProcessing(true);

            if (importType === 'customers') {
                await importCustomers(headers, rows);
            } else {
                await importItems(headers, rows);
            }

            setIsProcessing(false);
            setIsImportModalOpen(false);
            showAlert('Success', `Imported ${rows.length} ${importType}`, 'success');
        } catch (error) {
            console.error('Import error:', error);
            setIsProcessing(false);
            showAlert('Error', 'Failed to import file', 'error');
        }
    };

    const importCustomers = async (headers: string[], rows: string[][]) => {
        const nameIdx = headers.findIndex(h => h.toLowerCase().includes('name'));
        const typeIdx = headers.findIndex(h => h.toLowerCase().includes('type'));
        const phoneIdx = headers.findIndex(h => h.toLowerCase().includes('phone'));
        const emailIdx = headers.findIndex(h => h.toLowerCase().includes('email'));
        const addressIdx = headers.findIndex(h => h.toLowerCase().includes('address'));

        for (const row of rows) {
            const id = crypto.randomUUID();
            const now = new Date().toISOString();
            await db.execute(
                `INSERT INTO customers (id, name, type, phone, email, address, created_at, updated_at, current_balance, opening_balance)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
                [
                    id,
                    row[nameIdx] || 'Unknown',
                    row[typeIdx] || 'customer',
                    row[phoneIdx] || '',
                    row[emailIdx] || '',
                    row[addressIdx] || '',
                    now,
                    now
                ]
            );
        }
    };

    const importItems = async (headers: string[], rows: string[][]) => {
        const nameIdx = headers.findIndex(h => h.toLowerCase().includes('name'));
        const skuIdx = headers.findIndex(h => h.toLowerCase() === 'sku');
        const salePriceIdx = headers.findIndex(h => h.toLowerCase().includes('sale') && h.toLowerCase().includes('price'));
        const purchasePriceIdx = headers.findIndex(h => h.toLowerCase().includes('purchase') && h.toLowerCase().includes('price'));
        const stockIdx = headers.findIndex(h => h.toLowerCase().includes('stock'));
        const categoryIdx = headers.findIndex(h => h.toLowerCase().includes('category'));

        for (const row of rows) {
            const id = crypto.randomUUID();
            const now = new Date().toISOString();
            await db.execute(
                `INSERT INTO items (id, name, sku, sale_price, purchase_price, current_stock, category, created_at, updated_at, unit, min_stock_level)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pcs', 0)`,
                [
                    id,
                    row[nameIdx] || 'Unknown',
                    row[skuIdx] || '',
                    parseFloat(row[salePriceIdx]) || 0,
                    parseFloat(row[purchasePriceIdx]) || 0,
                    parseInt(row[stockIdx]) || 0,
                    row[categoryIdx] || '',
                    now,
                    now
                ]
            );
        }
    };

    // ========== EXPORT ==========
    const handleExport = async () => {
        try {
            setIsProcessing(true);

            let csv = '';
            let filename = '';

            if (exportType === 'customers') {
                const customers = await db.getAll<any>(`SELECT * FROM customers`);
                const headers = ['Name', 'Type', 'Phone', 'Email', 'Address', 'Balance'];
                const rows = customers.map(c => [
                    c.name || '',
                    c.type || '',
                    c.phone || '',
                    c.email || '',
                    c.address || '',
                    c.current_balance || 0
                ]);
                csv = generateCSV(headers, rows);
                filename = 'customers_export.csv';
            } else {
                const items = await db.getAll<any>(`SELECT * FROM items`);
                const headers = ['Name', 'SKU', 'Sale Price', 'Purchase Price', 'Stock', 'Category'];
                const rows = items.map(i => [
                    i.name || '',
                    i.sku || '',
                    i.sale_price || 0,
                    i.purchase_price || 0,
                    i.current_stock || 0,
                    i.category || ''
                ]);
                csv = generateCSV(headers, rows);
                filename = 'items_export.csv';
            }

            const fileUri = FileSystem.documentDirectory + filename;
            await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(fileUri);
            } else {
                showAlert('Export Complete', `File saved to: ${fileUri}`, 'success');
            }

            setIsProcessing(false);
            setIsExportModalOpen(false);
        } catch (error) {
            console.error('Export error:', error);
            setIsProcessing(false);
            showAlert('Error', 'Failed to export data', 'error');
        }
    };

    // ========== TEMPLATES ==========
    const downloadTemplate = async (type: 'customers' | 'items') => {
        let csv = '';
        let filename = '';

        if (type === 'customers') {
            csv = 'Name,Type,Phone,Email,Tax ID,Address,City,State,ZIP Code,Opening Balance,Credit Limit';
            filename = 'customers_template.csv';
        } else {
            csv = 'Name,SKU,Description,Category,Sale Price,Purchase Price,Unit,Opening Stock,Min Stock,Tax Rate';
            filename = 'items_template.csv';
        }

        const fileUri = FileSystem.documentDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
            await Sharing.shareAsync(fileUri);
        } else {
            showAlert('Template Ready', `File saved to: ${fileUri}`, 'success');
        }
    };

    // ========== BULK UPDATE ACTIONS ==========
    const handleBulkAction = async (action: 'increase' | 'decrease' | 'reset') => {
        setIsProcessing(true);
        try {
            const now = new Date().toISOString();
            if (action === 'increase') {
                await db.execute(`UPDATE items SET sale_price = sale_price * 1.10, updated_at = ?`, [now]);
                setIsBulkUpdateModalOpen(false);
                showAlert('Success', 'All prices increased by 10%', 'success');
            } else if (action === 'decrease') {
                await db.execute(`UPDATE items SET sale_price = sale_price * 0.90, updated_at = ?`, [now]);
                setIsBulkUpdateModalOpen(false);
                showAlert('Success', 'All prices decreased by 10%', 'success');
            } else if (action === 'reset') {
                await db.execute(`UPDATE items SET current_stock = 0, updated_at = ?`, [now]);
                setIsBulkUpdateModalOpen(false);
                showAlert('Success', 'All stock reset to zero', 'success');
            }
        } catch (error) {
            showAlert('Error', 'Operation failed', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    // ========== DATA CLEANUP ACTIONS ==========
    const handleCleanupAction = async (action: 'zero-stock' | 'zero-balance') => {
        setIsProcessing(true);
        try {
            if (action === 'zero-stock') {
                const result = await db.execute(`DELETE FROM items WHERE current_stock = 0`);
                setIsCleanupModalOpen(false);
                showAlert('Success', `Removed ${result.rowsAffected} items with zero stock`, 'success');
            } else if (action === 'zero-balance') {
                const result = await db.execute(`DELETE FROM customers WHERE current_balance = 0`);
                setIsCleanupModalOpen(false);
                showAlert('Success', `Removed ${result.rowsAffected} customers with zero balance`, 'success');
            }
        } catch (error) {
            showAlert('Error', 'Cleanup failed', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <View style={styles.container}>
            <CustomHeader title="Utilities" showBack />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionTitle}>Data Management</Text>

                <UtilityItem
                    icon={Upload}
                    title="Import Data"
                    description="Import customers and items from CSV"
                    onPress={() => setIsImportModalOpen(true)}
                    color="#3b82f6"
                    styles={styles} colors={colors}
                />

                <UtilityItem
                    icon={Download}
                    title="Export Data"
                    description="Export your data to CSV"
                    onPress={() => setIsExportModalOpen(true)}
                    color="#22c55e"
                    styles={styles} colors={colors}
                />

                <UtilityItem
                    icon={Layers}
                    title="Bulk Updates"
                    description="Update prices or stock in bulk"
                    onPress={() => setIsBulkUpdateModalOpen(true)}
                    color="#a855f7"
                    styles={styles} colors={colors}
                />

                <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Templates</Text>

                <UtilityItem
                    icon={FileSpreadsheet}
                    title="Customer Template"
                    description="Download CSV template for importing customers"
                    onPress={() => downloadTemplate('customers')}
                    color="#0891b2"
                    styles={styles} colors={colors}
                />

                <UtilityItem
                    icon={FileSpreadsheet}
                    title="Items Template"
                    description="Download CSV template for importing items"
                    onPress={() => downloadTemplate('items')}
                    color="#0891b2"
                    styles={styles} colors={colors}
                />

                <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>System</Text>

                <UtilityItem
                    icon={HardDrive}
                    title="Backup Data"
                    description="Create a secure backup"
                    onPress={() => navigation.navigate("BackupSettings")}
                    color="#14b8a6"
                    styles={styles} colors={colors}
                />

                <UtilityItem
                    icon={RefreshCw}
                    title="Restore Data"
                    description="Restore from a previous backup"
                    onPress={() => navigation.navigate("BackupSettings")}
                    color="#f97316"
                    styles={styles} colors={colors}
                />

                <UtilityItem
                    icon={Trash2}
                    title="Data Cleanup"
                    description="Remove unused data"
                    onPress={() => setIsCleanupModalOpen(true)}
                    color="#ef4444"
                    styles={styles} colors={colors}
                />
            </ScrollView>

            {/* Import Modal */}
            <Modal visible={isImportModalOpen} transparent animationType="slide" onRequestClose={() => setIsImportModalOpen(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setIsImportModalOpen(false)}>
                    <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Import Data</Text>
                            <TouchableOpacity onPress={() => setIsImportModalOpen(false)} style={styles.closeButton}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>Select what to import:</Text>

                        <TouchableOpacity
                            style={[styles.optionItem, importType === 'customers' && styles.optionSelected]}
                            onPress={() => setImportType('customers')}
                        >
                            <Text style={styles.optionText}>Customers</Text>
                            {importType === 'customers' && <Check size={20} color={colors.primary} />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.optionItem, importType === 'items' && styles.optionSelected]}
                            onPress={() => setImportType('items')}
                        >
                            <Text style={styles.optionText}>Items</Text>
                            {importType === 'items' && <Check size={20} color={colors.primary} />}
                        </TouchableOpacity>

                        <Button
                            onPress={handleImportFile}
                            isLoading={isProcessing}
                            style={{ marginTop: spacing.lg }}
                        >
                            Select CSV File
                        </Button>

                        <Button
                            variant="secondary"
                            onPress={() => setIsImportModalOpen(false)}
                            style={{ marginTop: spacing.sm }}
                        >
                            Cancel
                        </Button>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Export Modal */}
            <Modal visible={isExportModalOpen} transparent animationType="slide" onRequestClose={() => setIsExportModalOpen(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setIsExportModalOpen(false)}>
                    <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Export Data</Text>
                            <TouchableOpacity onPress={() => setIsExportModalOpen(false)} style={styles.closeButton}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>Select what to export:</Text>

                        <TouchableOpacity
                            style={[styles.optionItem, exportType === 'customers' && styles.optionSelected]}
                            onPress={() => setExportType('customers')}
                        >
                            <Text style={styles.optionText}>Customers</Text>
                            {exportType === 'customers' && <Check size={20} color={colors.primary} />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.optionItem, exportType === 'items' && styles.optionSelected]}
                            onPress={() => setExportType('items')}
                        >
                            <Text style={styles.optionText}>Items</Text>
                            {exportType === 'items' && <Check size={20} color={colors.primary} />}
                        </TouchableOpacity>

                        <Button
                            onPress={handleExport}
                            isLoading={isProcessing}
                            style={{ marginTop: spacing.lg }}
                        >
                            Export to CSV
                        </Button>

                        <Button
                            variant="secondary"
                            onPress={() => setIsExportModalOpen(false)}
                            style={{ marginTop: spacing.sm }}
                        >
                            Cancel
                        </Button>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Bulk Update Modal */}
            <Modal visible={isBulkUpdateModalOpen} transparent animationType="slide" onRequestClose={() => setIsBulkUpdateModalOpen(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setIsBulkUpdateModalOpen(false)}>
                    <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Bulk Updates</Text>
                            <TouchableOpacity onPress={() => setIsBulkUpdateModalOpen(false)} style={styles.closeButton}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>Select an action to apply to all items:</Text>

                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => handleBulkAction('increase')}
                            disabled={isProcessing}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#22c55e20' }]}>
                                <TrendingUp size={20} color="#22c55e" />
                            </View>
                            <View style={styles.actionText}>
                                <Text style={styles.actionTitle}>Increase Prices by 10%</Text>
                                <Text style={styles.actionDesc}>Apply to all items</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => handleBulkAction('decrease')}
                            disabled={isProcessing}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#f9731620' }]}>
                                <TrendingDown size={20} color="#f97316" />
                            </View>
                            <View style={styles.actionText}>
                                <Text style={styles.actionTitle}>Decrease Prices by 10%</Text>
                                <Text style={styles.actionDesc}>Apply to all items</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => handleBulkAction('reset')}
                            disabled={isProcessing}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#ef444420' }]}>
                                <Package size={20} color="#ef4444" />
                            </View>
                            <View style={styles.actionText}>
                                <Text style={[styles.actionTitle, { color: '#ef4444' }]}>Reset All Stock to Zero</Text>
                                <Text style={styles.actionDesc}>This action cannot be undone</Text>
                            </View>
                        </TouchableOpacity>

                        <Button
                            variant="secondary"
                            onPress={() => setIsBulkUpdateModalOpen(false)}
                            style={{ marginTop: spacing.lg }}
                        >
                            Cancel
                        </Button>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Data Cleanup Modal */}
            <Modal visible={isCleanupModalOpen} transparent animationType="slide" onRequestClose={() => setIsCleanupModalOpen(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setIsCleanupModalOpen(false)}>
                    <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Data Cleanup</Text>
                            <TouchableOpacity onPress={() => setIsCleanupModalOpen(false)} style={styles.closeButton}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.warningBox}>
                            <AlertTriangle size={20} color="#f97316" />
                            <Text style={styles.warningText}>This will permanently delete data. This action cannot be undone.</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => handleCleanupAction('zero-stock')}
                            disabled={isProcessing}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#ef444420' }]}>
                                <Package size={20} color="#ef4444" />
                            </View>
                            <View style={styles.actionText}>
                                <Text style={[styles.actionTitle, { color: '#ef4444' }]}>Remove Zero-Stock Items</Text>
                                <Text style={styles.actionDesc}>Delete items with 0 stock</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => handleCleanupAction('zero-balance')}
                            disabled={isProcessing}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#ef444420' }]}>
                                <Trash2 size={20} color="#ef4444" />
                            </View>
                            <View style={styles.actionText}>
                                <Text style={[styles.actionTitle, { color: '#ef4444' }]}>Remove Zero-Balance Customers</Text>
                                <Text style={styles.actionDesc}>Delete customers with $0 balance</Text>
                            </View>
                        </TouchableOpacity>

                        <Button
                            variant="secondary"
                            onPress={() => setIsCleanupModalOpen(false)}
                            style={{ marginTop: spacing.lg }}
                        >
                            Cancel
                        </Button>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Custom Alert */}
            <CustomAlert
                visible={alertConfig.visible}
                onClose={hideAlert}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                colors={colors}
                styles={styles}
            />
        </View>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        padding: spacing.lg,
    },
    sectionTitle: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
        color: colors.textMuted,
        marginBottom: spacing.md,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text,
        marginBottom: 2,
    },
    description: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
    },
    // Modal styles
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
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    modalTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    closeButton: {
        padding: spacing.xs,
    },
    modalSubtitle: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginBottom: spacing.md,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.sm,
    },
    optionSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '10',
    },
    optionText: {
        fontSize: fontSize.md,
        color: colors.text,
    },
    // Action items
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surfaceHover,
        marginBottom: spacing.sm,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    actionText: {
        flex: 1,
    },
    actionTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.medium,
        color: colors.text,
    },
    actionDesc: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        marginTop: 2,
    },
    // Warning box
    warningBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f97316' + '15',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    warningText: {
        flex: 1,
        fontSize: fontSize.sm,
        color: '#f97316',
    },
    // Alert styles
    alertContent: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        alignItems: 'center',
        maxWidth: 320,
        alignSelf: 'center',
        width: '100%',
    },
    alertIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    alertTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    alertMessage: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        textAlign: 'center',
    },
});
