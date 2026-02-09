import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../contexts/ThemeContext";
import { CustomHeader } from "../components/CustomHeader";
import { Button } from "../components/ui/Button";
import {
    Upload01Icon,
    Download01Icon,
    LayersThree01Icon,
    HardDriveIcon,
    RefreshCw01Icon,
    TrashIcon,
    ChevronRightIcon,
    FileCheck02Icon,
    XCloseIcon,
    CheckIcon,
    TrendingUpIcon,
    TrendingDownIcon,
    PackageIcon,
    AlertTriangleIcon
} from "../components/ui/UntitledIcons";
import { getPowerSyncDatabase } from "../lib/powersync";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import "react-native-get-random-values";

const db = getPowerSyncDatabase();
const FS = FileSystem as any;

function UtilityItem({
    icon: Icon,
    title,
    description,
    onPress,
    color,
}: any) {
    const { colors } = useTheme();
    return (
        <TouchableOpacity
            className="flex-row items-center bg-surface p-4 rounded-lg mb-4 shadow-sm"
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View
                className="w-12 h-12 rounded-lg items-center justify-center mr-4"
                style={{ backgroundColor: `${(color || colors.primary) as string}20` }}
            >
                <Icon size={24} color={color || colors.primary} />
            </View>
            <View className="flex-1">
                <Text className="text-md font-semibold text-text mb-0.5">{title}</Text>
                <Text className="text-xs text-text-muted">{description}</Text>
            </View>
            <ChevronRightIcon size={20} color={colors.textMuted} />
        </TouchableOpacity>
    );
}

// Custom Alert Modal Component
function CustomAlert({
    visible,
    onClose,
    title,
    message,
    type,
}: {
    visible: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
}) {
    const { colors } = useTheme();
    if (!visible) return null;

    const iconColor = type === 'success' ? colors.success : type === 'error' ? colors.danger : colors.primary;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable className="flex-1 bg-black/50 justify-center p-6" onPress={onClose}>
                <Pressable className="bg-surface rounded-xl p-6 shadow-lg" onPress={e => { e.stopPropagation(); }}>
                    <TouchableOpacity className="absolute top-2 right-2 p-2" onPress={onClose}>
                        <XCloseIcon size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                    <View
                        className="w-12 h-12 rounded-full items-center justify-center self-center mb-4"
                        style={{ backgroundColor: iconColor + '20' }}
                    >
                        <CheckIcon size={24} color={iconColor} />
                    </View>
                    <Text className="text-lg font-bold text-text text-center mb-2">{title}</Text>
                    <Text className="text-sm text-text-secondary text-center mb-6">{message}</Text>
                    <Button onPress={onClose} block>
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
            const content = await FS.readAsStringAsync(file.uri);
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
            const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
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
            const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
            const now = new Date().toISOString();
            // Handle potentially undefined or empty strings for numbers
            const salePrice = parseFloat(row[salePriceIdx] || '0') || 0;
            const purchasePrice = parseFloat(row[purchasePriceIdx] || '0') || 0;
            const currentStock = parseInt(row[stockIdx] || '0') || 0;

            await db.execute(
                `INSERT INTO items (id, name, sku, sale_price, purchase_price, current_stock, category, created_at, updated_at, unit, min_stock_level)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pcs', 0)`,
                [
                    id,
                    row[nameIdx] || 'Unknown',
                    row[skuIdx] || '',
                    salePrice,
                    purchasePrice,
                    currentStock,
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

            const fileUri = `${FS.documentDirectory ?? ''}${filename}`;
            await FS.writeAsStringAsync(fileUri, csv, { encoding: FS.EncodingType?.UTF8 || 'utf8' });

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

        const fileUri = `${FS.documentDirectory ?? ''}${filename}`;
        await FS.writeAsStringAsync(fileUri, csv, { encoding: FS.EncodingType?.UTF8 || 'utf8' });

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
        } catch (_error) {
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
        } catch (_error) {
            showAlert('Error', 'Cleanup failed', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <View className="flex-1 bg-background">
            <CustomHeader title="Utilities" showBack />

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Text className="text-sm font-bold text-text-muted mb-4 uppercase tracking-widest">Data Management</Text>

                <UtilityItem
                    icon={Upload01Icon}
                    title="Import Data"
                    description="Import customers and items from CSV"
                    onPress={() => { setIsImportModalOpen(true); }}
                    color="#3b82f6"
                />

                <UtilityItem
                    icon={Download01Icon}
                    title="Export Data"
                    description="Export your data to CSV"
                    onPress={() => { setIsExportModalOpen(true); }}
                    color="#22c55e"
                />

                <UtilityItem
                    icon={LayersThree01Icon}
                    title="Bulk Updates"
                    description="Update prices or stock in bulk"
                    onPress={() => { setIsBulkUpdateModalOpen(true); }}
                    color="#a855f7"
                />

                <Text className="text-sm font-bold text-text-muted mt-8 mb-4 uppercase tracking-widest">Templates</Text>

                <UtilityItem
                    icon={FileCheck02Icon}
                    title="Customer Template"
                    description="Download CSV template for importing customers"
                    onPress={() => downloadTemplate('customers')}
                    color="#0891b2"
                />

                <UtilityItem
                    icon={FileCheck02Icon}
                    title="Items Template"
                    description="Download CSV template for importing items"
                    onPress={() => downloadTemplate('items')}
                    color="#0891b2"
                />

                <Text className="text-sm font-bold text-text-muted mt-8 mb-4 uppercase tracking-widest">System</Text>

                <UtilityItem
                    icon={HardDriveIcon}
                    title="Backup Data"
                    description="Create a secure backup"
                    onPress={() => navigation.navigate("BackupSettings")}
                    color="#14b8a6"
                />

                <UtilityItem
                    icon={RefreshCw01Icon}
                    title="Restore Data"
                    description="Restore from a previous backup"
                    onPress={() => navigation.navigate("BackupSettings")}
                    color="#f97316"
                />

                <UtilityItem
                    icon={TrashIcon}
                    title="Data Cleanup"
                    description="Remove unused data"
                    onPress={() => { setIsCleanupModalOpen(true); }}
                    color="#ef4444"
                />
            </ScrollView>

            {/* Import Modal */}
            <Modal visible={isImportModalOpen} transparent animationType="slide" onRequestClose={() => { setIsImportModalOpen(false); }}>
                <Pressable className="flex-1 bg-black/50 justify-center p-6" onPress={() => { setIsImportModalOpen(false); }}>
                    <Pressable className="bg-surface rounded-xl p-6" onPress={e => { e.stopPropagation(); }}>
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-bold text-text">Import Data</Text>
                            <TouchableOpacity onPress={() => { setIsImportModalOpen(false); }}>
                                <XCloseIcon size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-sm text-text-muted mb-4">Select what to import:</Text>

                        <TouchableOpacity
                            className={`flex-row justify-between items-center p-4 rounded-lg border mb-2 ${importType === 'customers' ? 'border-primary bg-primary-10' : 'border-border'}`}
                            style={{ backgroundColor: importType === 'customers' ? colors.primary + '10' : undefined, borderColor: importType === 'customers' ? colors.primary : colors.border }}
                            onPress={() => { setImportType('customers'); }}
                        >
                            <Text className="text-md text-text">Customers</Text>
                            {importType === 'customers' && <CheckIcon size={20} color={colors.primary} />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            className={`flex-row justify-between items-center p-4 rounded-lg border mb-2 ${importType === 'items' ? 'border-primary bg-primary-10' : 'border-border'}`}
                            style={{ backgroundColor: importType === 'items' ? colors.primary + '10' : undefined, borderColor: importType === 'items' ? colors.primary : colors.border }}
                            onPress={() => { setImportType('items'); }}
                        >
                            <Text className="text-md text-text">Items</Text>
                            {importType === 'items' && <CheckIcon size={20} color={colors.primary} />}
                        </TouchableOpacity>

                        <Button
                            onPress={handleImportFile}
                            loading={isProcessing}
                            className="mt-6"
                        >
                            Select CSV File
                        </Button>

                        <Button
                            variant="secondary"
                            onPress={() => { setIsImportModalOpen(false); }}
                            className="mt-2"
                        >
                            Cancel
                        </Button>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Export Modal */}
            <Modal visible={isExportModalOpen} transparent animationType="slide" onRequestClose={() => { setIsExportModalOpen(false); }}>
                <Pressable className="flex-1 bg-black/50 justify-center p-6" onPress={() => { setIsExportModalOpen(false); }}>
                    <Pressable className="bg-surface rounded-xl p-6" onPress={e => { e.stopPropagation(); }}>
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-bold text-text">Export Data</Text>
                            <TouchableOpacity onPress={() => { setIsExportModalOpen(false); }}>
                                <XCloseIcon size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-sm text-text-muted mb-4">Select what to export:</Text>

                        <TouchableOpacity
                            className={`flex-row justify-between items-center p-4 rounded-lg border mb-2 ${exportType === 'customers' ? 'border-primary bg-primary-10' : 'border-border'}`}
                            style={{ backgroundColor: exportType === 'customers' ? colors.primary + '10' : undefined, borderColor: exportType === 'customers' ? colors.primary : colors.border }}
                            onPress={() => { setExportType('customers'); }}
                        >
                            <Text className="text-md text-text">Customers</Text>
                            {exportType === 'customers' && <CheckIcon size={20} color={colors.primary} />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            className={`flex-row justify-between items-center p-4 rounded-lg border mb-2 ${exportType === 'items' ? 'border-primary bg-primary-10' : 'border-border'}`}
                            style={{ backgroundColor: exportType === 'items' ? colors.primary + '10' : undefined, borderColor: exportType === 'items' ? colors.primary : colors.border }}
                            onPress={() => { setExportType('items'); }}
                        >
                            <Text className="text-md text-text">Items</Text>
                            {exportType === 'items' && <CheckIcon size={20} color={colors.primary} />}
                        </TouchableOpacity>

                        <Button
                            onPress={handleExport}
                            loading={isProcessing}
                            className="mt-6"
                        >
                            Export to CSV
                        </Button>

                        <Button
                            variant="secondary"
                            onPress={() => { setIsExportModalOpen(false); }}
                            className="mt-2"
                        >
                            Cancel
                        </Button>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Bulk Update Modal */}
            <Modal visible={isBulkUpdateModalOpen} transparent animationType="slide" onRequestClose={() => { setIsBulkUpdateModalOpen(false); }}>
                <Pressable className="flex-1 bg-black/50 justify-center p-6" onPress={() => { setIsBulkUpdateModalOpen(false); }}>
                    <Pressable className="bg-surface rounded-xl p-6" onPress={e => { e.stopPropagation(); }}>
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-bold text-text">Bulk Updates</Text>
                            <TouchableOpacity onPress={() => { setIsBulkUpdateModalOpen(false); }}>
                                <XCloseIcon size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-sm text-text-muted mb-4">Select an action to apply to all items:</Text>

                        <TouchableOpacity
                            className="flex-row items-center p-3 rounded-lg bg-surface-hover mb-2"
                            onPress={() => handleBulkAction('increase')}
                            disabled={isProcessing}
                        >
                            <View className="w-10 h-10 rounded-md bg-success-20 items-center justify-center mr-3" style={{ backgroundColor: '#22c55e20' }}>
                                <TrendingUpIcon size={20} color="#22c55e" />
                            </View>
                            <View>
                                <Text className="text-md font-semibold text-text">Increase Prices by 10%</Text>
                                <Text className="text-xs text-text-muted">Apply to all items</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-row items-center p-3 rounded-lg bg-surface-hover mb-2"
                            onPress={() => handleBulkAction('decrease')}
                            disabled={isProcessing}
                        >
                            <View className="w-10 h-10 rounded-md bg-warning-20 items-center justify-center mr-3" style={{ backgroundColor: '#f9731620' }}>
                                <TrendingDownIcon size={20} color="#f97316" />
                            </View>
                            <View>
                                <Text className="text-md font-semibold text-text">Decrease Prices by 10%</Text>
                                <Text className="text-xs text-text-muted">Apply to all items</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-row items-center p-3 rounded-lg bg-surface-hover mb-2"
                            onPress={() => handleBulkAction('reset')}
                            disabled={isProcessing}
                        >
                            <View className="w-10 h-10 rounded-md bg-danger-20 items-center justify-center mr-3" style={{ backgroundColor: '#ef444420' }}>
                                <PackageIcon size={20} color="#ef4444" />
                            </View>
                            <View>
                                <Text className="text-md font-semibold text-danger">Reset All Stock to Zero</Text>
                                <Text className="text-xs text-text-muted">This action cannot be undone</Text>
                            </View>
                        </TouchableOpacity>

                        <Button
                            variant="secondary"
                            onPress={() => { setIsBulkUpdateModalOpen(false); }}
                            className="mt-6"
                        >
                            Cancel
                        </Button>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Data Cleanup Modal */}
            <Modal visible={isCleanupModalOpen} transparent animationType="slide" onRequestClose={() => { setIsCleanupModalOpen(false); }}>
                <Pressable className="flex-1 bg-black/50 justify-center p-6" onPress={() => { setIsCleanupModalOpen(false); }}>
                    <Pressable className="bg-surface rounded-xl p-6" onPress={e => { e.stopPropagation(); }}>
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-bold text-text">Data Cleanup</Text>
                            <TouchableOpacity onPress={() => { setIsCleanupModalOpen(false); }}>
                                <XCloseIcon size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row items-center p-3 bg-warning-10 rounded-lg mb-4" style={{ backgroundColor: '#fff7ed' }}>
                            <AlertTriangleIcon size={20} color="#f97316" />
                            <Text className="text-sm text-warning-dark ml-2 flex-1" style={{ color: '#c2410c' }}>This will permanently delete data. This action cannot be undone.</Text>
                        </View>

                        <TouchableOpacity
                            className="flex-row items-center p-3 rounded-lg bg-surface-hover mb-2"
                            onPress={() => handleCleanupAction('zero-stock')}
                            disabled={isProcessing}
                        >
                            <View className="w-10 h-10 rounded-md bg-danger-20 items-center justify-center mr-3" style={{ backgroundColor: '#ef444420' }}>
                                <PackageIcon size={20} color="#ef4444" />
                            </View>
                            <View>
                                <Text className="text-md font-semibold text-danger">Remove Zero-Stock Items</Text>
                                <Text className="text-xs text-text-muted">Delete items with 0 stock</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-row items-center p-3 rounded-lg bg-surface-hover mb-2"
                            onPress={() => handleCleanupAction('zero-balance')}
                            disabled={isProcessing}
                        >
                            <View className="w-10 h-10 rounded-md bg-danger-20 items-center justify-center mr-3" style={{ backgroundColor: '#ef444420' }}>
                                <TrashIcon size={20} color="#ef4444" />
                            </View>
                            <View>
                                <Text className="text-md font-semibold text-danger">Remove Zero-Balance Customers</Text>
                                <Text className="text-xs text-text-muted">Delete customers with $0 balance</Text>
                            </View>
                        </TouchableOpacity>

                        <Button
                            variant="secondary"
                            onPress={() => { setIsCleanupModalOpen(false); }}
                            className="mt-6"
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
            />
        </View>
    );
}
