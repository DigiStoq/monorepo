import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Modal } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { usePowerSync, useQuery } from "@powersync/react-native";
import { generateUUID } from "../lib/utils";
import { X, Save, Calendar, CheckSquare } from "lucide-react-native";
import { CustomerRecord } from "../lib/powersync";

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
                 <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <X color="#0f172a" size={24} />
                 </TouchableOpacity>
                 <Text style={styles.headerTitle}>{isEditing ? "Edit Cheque" : "New Cheque"}</Text>
                 <TouchableOpacity onPress={handleSave} style={styles.iconBtn} disabled={loading}>
                    <Save color="#6366f1" size={24} />
                 </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                {/* Type Switcher */}
                <View style={[styles.switchContainer, { borderColor: type === 'received' ? '#16a34a' : '#dc2626' }]}>
                    <TouchableOpacity 
                        style={[styles.switchOption, type === 'received' && { backgroundColor: '#16a34a' }]}
                        onPress={() => setType('received')}
                    >
                        <Text style={[styles.switchText, type === 'received' && { color: 'white' }]}>Received</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.switchOption, type === 'issued' && { backgroundColor: '#dc2626' }]}
                        onPress={() => setType('issued')}
                    >
                        <Text style={[styles.switchText, type === 'issued' && { color: 'white' }]}>Issued</Text>
                    </TouchableOpacity>
                </View>

                {/* Customer Select */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>{type === 'received' ? 'From Customer' : 'To Party'}</Text>
                    <TouchableOpacity style={styles.selectBtn} onPress={() => setShowCustomerModal(true)}>
                         <Text style={{ color: customerId || customerName ? '#0f172a' : '#94a3b8' }}>
                            {(customerId && customers.find(c => c.id === customerId)?.name) || customerName || "Select or Enter Name"}
                         </Text>
                    </TouchableOpacity>
                    {/* Fallback Manual Input if not in list */}
                    {!customerId && (
                        <TextInput 
                            style={[styles.input, { marginTop: 8 }]}
                            value={customerName}
                            onChangeText={setCustomerName}
                            placeholder="Or enter name manually"
                        />
                    )}
                </View>

                {/* Bank & Cheque Details */}
                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>Bank Name</Text>
                        <TextInput 
                            style={styles.input}
                            value={bankName}
                            onChangeText={setBankName}
                            placeholder="e.g. HDFC"
                        />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Cheque No.</Text>
                        <TextInput 
                            style={styles.input}
                            value={chequeNumber}
                            onChangeText={setChequeNumber}
                            placeholder="######"
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                {/* Amount */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Amount</Text>
                    <TextInput 
                        style={styles.inputBig}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        placeholder="0.00"
                    />
                </View>

                {/* Dates */}
                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>Issue Date</Text>
                        <TextInput 
                            style={styles.input}
                            value={date}
                            onChangeText={setDate}
                            placeholder="YYYY-MM-DD"
                        />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.label}>Due Date</Text>
                        <TextInput 
                            style={styles.input}
                            value={dueDate}
                            onChangeText={setDueDate}
                            placeholder="YYYY-MM-DD"
                        />
                    </View>
                </View>

                {/* Status */}
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

                {/* Notes */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Notes</Text>
                    <TextInput 
                        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        placeholder="Any remarks..."
                    />
                </View>

                {isEditing && (
                    <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                        <Text style={styles.deleteText}>Delete Cheque Entry</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/* Simple Customer Selection Modal */}
            <Modal visible={showCustomerModal} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Party</Text>
                        <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                            <X size={24} color="#0f172a" />
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
                            <Text style={[styles.customerItemText, { fontStyle: 'italic', color: '#64748b' }]}>
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
                                {customerId === c.id && <CheckSquare size={20} color="#6366f1" />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8fafc" },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: "white", borderBottomWidth: 1, borderColor: "#e2e8f0", marginTop: Platform.OS === 'android' ? 24 : 0 },
    iconBtn: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: "600", color: "#0f172a" },
    content: { padding: 20 },
    switchContainer: { flexDirection: "row", borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
    switchOption: { flex: 1, paddingVertical: 10, alignItems: "center" },
    switchText: { fontWeight: "600", color: "#64748b" },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: "500", color: "#64748b", marginBottom: 8 },
    input: { backgroundColor: "white", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 12, fontSize: 16, color: "#0f172a" },
    inputBig: { backgroundColor: "white", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 16, fontSize: 24, fontWeight: "bold", color: "#0f172a" },
    row: { flexDirection: 'row' },
    selectBtn: { backgroundColor: "white", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 12 },
    statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    statusChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
    statusChipActive: { backgroundColor: '#e0e7ff', borderColor: '#6366f1' },
    statusText: { fontSize: 13, color: '#64748b' },
    statusTextActive: { color: '#4338ca', fontWeight: '600' },
    deleteBtn: { marginTop: 20, backgroundColor: "#fee2e2", padding: 16, borderRadius: 12, alignItems: "center" },
    deleteText: { color: "#dc2626", fontWeight: "600", fontSize: 16 },
    modalContainer: { flex: 1, backgroundColor: '#f8fafc' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#e2e8f0', backgroundColor: 'white' },
    modalTitle: { fontSize: 18, fontWeight: '600' },
    customerItem: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between' },
    customerItemText: { fontSize: 16, color: '#0f172a' }
});
