import React, { useState, useEffect } from "react";
import { 
    View, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    ScrollView, 
    Alert, 
    KeyboardAvoidingView, 
    Platform, 
    Modal,
    Text,
    ActivityIndicator
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { usePowerSync, useQuery } from "@powersync/react-native";
import { generateUUID } from "../lib/utils";
import { X, Save, CheckSquare, Trash2 } from "lucide-react-native";
import { CustomerRecord } from "../lib/powersync";
import { 
    Button, 
    Input,
    Card,
    CardHeader,
    CardBody,
    Select
} from "../components/ui";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../lib/theme";
import { wp, hp } from "../lib/responsive";

export function ChequeFormScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const db = usePowerSync();
    const params = route.params as { id?: string } | undefined;
    const id = params?.id;
    const isEditing = !!id;

    // Fetch customers for selection
    const { data: customers } = useQuery<CustomerRecord>("SELECT id, name FROM customers ORDER BY name ASC");

    const [type, setType] = useState<'received' | 'issued'>('received');
    const [customerId, setCustomerId] = useState("");
    const [customerName, setCustomerName] = useState(""); // For issued cheques or manual override
    const [bankName, setBankName] = useState("");
    const [chequeNumber, setChequeNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Issue Date
    const [dueDate, setDueDate] = useState(""); // Cheque Date / Clearance Date
    const [status, setStatus] = useState("pending");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    
    // Customer Selection Modal
    const [showCustomerModal, setShowCustomerModal] = useState(false);

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    async function loadData() {
        const res = await db.getAll("SELECT * FROM cheques WHERE id = ?", [id]);
        if (res.length > 0) {
            const data = res[0] as any;
            setType(data.type);
            setCustomerId(data.customer_id || "");
            setCustomerName(data.customer_name || "");
            setBankName(data.bank_name || "");
            setChequeNumber(data.cheque_number || "");
            setAmount(String(data.amount || ""));
            setDate(data.date || "");
            setDueDate(data.due_date || "");
            setStatus(data.status || "pending");
            setNotes(data.notes || "");
        }
    }

    async function handleSave() {
        if (!chequeNumber || !amount || !bankName) {
            Alert.alert("Error", "Cheque No, Amount and Bank Name are required");
            return;
        }

        try {
            setLoading(true);
            const amt = parseFloat(amount);
            const now = new Date().toISOString();
            
            // Resolve Name if selected from DB
            let finalName = customerName;
            if (customerId) {
                const found = customers.find(c => c.id === customerId);
                if (found) finalName = found.name;
            }

            if (isEditing) {
                await db.execute(
                    `UPDATE cheques SET
                     type=?, customer_id=?, customer_name=?, bank_name=?, cheque_number=?, 
                     amount=?, date=?, due_date=?, status=?, notes=?, updated_at=?
                     WHERE id=?`,
                    [type, customerId || null, finalName, bankName, chequeNumber, 
                     amt, date, dueDate || null, status, notes, now, id]
                );
            } else {
                await db.execute(
                    `INSERT INTO cheques 
                    (id, user_id, type, customer_id, customer_name, bank_name, cheque_number, amount, date, due_date, status, notes, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [generateUUID(), 'user', type, customerId || null, finalName, bankName, chequeNumber, 
                     amt, date, dueDate || null, status, notes, now, now]
                );
            }
            navigation.goBack();
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to save cheque");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        Alert.alert("Delete", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => {
                await db.execute("DELETE FROM cheques WHERE id = ?", [id]);
                navigation.goBack();
            }}
        ]);
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
            <View style={styles.header}>
                <Button variant="ghost" size="icon" onPress={() => navigation.goBack()}>
                    <X color={colors.text} size={24} />
                </Button>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{isEditing ? "Edit Cheque" : "New Cheque"}</Text>
                </View>
                <Button variant="ghost" size="icon" onPress={handleSave} disabled={loading}>
                    {loading ? <ActivityIndicator color={colors.primary} /> : <Save color={colors.primary} size={24} />}
                </Button>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                {/* Type Switcher */}
                <View style={[styles.switchContainer, { borderColor: type === 'received' ? colors.success : colors.danger }]}>
                    <TouchableOpacity 
                        style={[styles.switchOption, type === 'received' && { backgroundColor: colors.success }]}
                        onPress={() => setType('received')}
                    >
                        <Text style={[styles.switchText, type === 'received' && { color: 'white' }]}>Received</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.switchOption, type === 'issued' && { backgroundColor: colors.danger }]}
                        onPress={() => setType('issued')}
                    >
                        <Text style={[styles.switchText, type === 'issued' && { color: 'white' }]}>Issued</Text>
                    </TouchableOpacity>
                </View>

                <Card>
                    <CardHeader title="Details" />
                    <CardBody>
                         <View style={styles.formGroup}>
                            <Text style={styles.label}>{type === 'received' ? 'From Customer' : 'To Party'}</Text>
                            <TouchableOpacity style={styles.selectBtn} onPress={() => setShowCustomerModal(true)}>
                                <Text style={{ color: customerId || customerName ? colors.text : colors.textSecondary }}>
                                    {(customerId && customers.find(c => c.id === customerId)?.name) || customerName || "Select or Enter Name"}
                                </Text>
                            </TouchableOpacity>
                            {!customerId && (
                                <Input 
                                    value={customerName}
                                    onChangeText={setCustomerName}
                                    placeholder="Or enter name manually"
                                    containerStyle={{ marginTop: 8 }}
                                />
                            )}
                        </View>

                        <Input 
                            label="Amount"
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            placeholder="0.00"
                            style={styles.inputBig}
                        />

                         <View style={styles.row}>
                            <Input 
                                label="Bank Name"
                                value={bankName}
                                onChangeText={setBankName}
                                placeholder="e.g. HDFC"
                                containerStyle={{ flex: 1, marginRight: 8 }}
                            />
                            <Input 
                                label="Cheque No."
                                value={chequeNumber}
                                onChangeText={setChequeNumber}
                                placeholder="######"
                                keyboardType="numeric"
                                containerStyle={{ flex: 1 }}
                            />
                        </View>

                         <View style={styles.row}>
                             <Input 
                                label="Issue Date"
                                value={date}
                                onChangeText={setDate}
                                placeholder="YYYY-MM-DD"
                                containerStyle={{ flex: 1, marginRight: 8 }}
                            />
                            <Input 
                                label="Due Date"
                                value={dueDate}
                                onChangeText={setDueDate}
                                placeholder="YYYY-MM-DD"
                                containerStyle={{ flex: 1 }}
                            />
                        </View>

                         <View style={styles.formGroup}>
                            <Text style={styles.label}>Status</Text>
                            <View style={styles.statusRow}>
                                {['pending', 'cleared', 'bounced', 'cancelled'].map(s => (
                                    <TouchableOpacity 
                                        key={s} 
                                        style={[styles.statusChip, status === s && styles.statusChipActive]}
                                        onPress={() => setStatus(s)}
                                    >
                                        <Text style={[styles.statusText, status === s && styles.statusTextActive]}>
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                         <Input 
                            label="Notes"
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={2}
                            placeholder="Any remarks..."
                        />
                    </CardBody>
                </Card>

                {isEditing && (
                     <Button
                        variant="outline"
                        style={{ marginTop: 24, borderColor: colors.danger }}
                        onPress={handleDelete}
                        leftIcon={<Trash2 size={18} color={colors.danger} />}
                     >
                        <Text style={{ color: colors.danger }}>Delete Cheque Entry</Text>
                     </Button>
                )}
            </ScrollView>

            {/* Customer Selection Modal */}
            <Modal visible={showCustomerModal} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Party</Text>
                        <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        <TouchableOpacity 
                            style={styles.customerItem}
                            onPress={() => {
                                setCustomerId("");
                                setCustomerName("");
                                setShowCustomerModal(false);
                            }}
                        >
                            <Text style={[styles.customerItemText, { fontStyle: 'italic', color: colors.textSecondary }]}>
                                Clear / Enter Manually
                            </Text>
                        </TouchableOpacity>
                        {customers?.map(c => (
                            <TouchableOpacity 
                                key={c.id} 
                                style={styles.customerItem}
                                onPress={() => {
                                    setCustomerId(c.id);
                                    setCustomerName(c.name);
                                    setShowCustomerModal(false);
                                }}
                            >
                                <Text style={styles.customerItemText}>{c.name}</Text>
                                {customerId === c.id && <CheckSquare size={20} color={colors.primary} />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        marginTop: Platform.OS === "android" ? 24 : 0,
    },
    titleContainer: { flex: 1, alignItems: "center" },
    title: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text },
    content: { padding: wp(4) },
    switchContainer: { flexDirection: "row", borderWidth: 1, borderRadius: borderRadius.md, overflow: 'hidden', marginBottom: 20 },
    switchOption: { flex: 1, paddingVertical: 10, alignItems: "center" },
    switchText: { fontWeight: fontWeight.semibold, color: colors.textSecondary },
    formGroup: { marginBottom: 16 },
    label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textSecondary, marginBottom: 6 },
    inputBig: { fontSize: 24, fontWeight: "bold" },
    row: { flexDirection: 'row' },
    selectBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: 12 },
    statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    statusChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
    statusChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
    statusText: { fontSize: 13, color: colors.textSecondary },
    statusTextActive: { color: colors.primary, fontWeight: '600' },
    modalContainer: { flex: 1, backgroundColor: colors.background },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text },
    customerItem: { padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between' },
    customerItemText: { fontSize: 16, color: colors.text }
});
