import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Modal } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { usePowerSync, useQuery } from "@powersync/react-native";
import { generateUUID } from "../lib/utils";
import { X, Save, CheckSquare } from "lucide-react-native";
import { CustomerRecord } from "../lib/powersync";

export function LoanFormScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const db = usePowerSync();
    const params = route.params as { id?: string } | undefined;
    const id = params?.id;
    const isEditing = !!id;

    // Fetch customers
    const { data: customers } = useQuery<CustomerRecord>("SELECT id, name FROM customers ORDER BY name ASC");
    
    // Fetch bank accounts
    const { data: bankAccounts } = useQuery<{id: string, name: string}>("SELECT id, name FROM bank_accounts ORDER BY name ASC");

    const [type, setType] = useState<'given' | 'taken'>('given');
    const [name, setName] = useState(""); // For internal tracking
    const [customerId, setCustomerId] = useState("");
    const [partyName, setPartyName] = useState(""); // Lender or Borrower name
    const [principal, setPrincipal] = useState("");
    const [interestRate, setInterestRate] = useState("");
    const [interestType, setInterestType] = useState<'simple' | 'compound'>('simple');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [totalEmis, setTotalEmis] = useState("");
    const [emiAmount, setEmiAmount] = useState(""); 
    const [linkedAccountId, setLinkedAccountId] = useState("");
    const [status, setStatus] = useState("active");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    
    // UI Helpers
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showBankModal, setShowBankModal] = useState(false);

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    async function loadData() {
        const res = await db.getAll("SELECT * FROM loans WHERE id = ?", [id]);
        if (res.length > 0) {
            const data = res[0] as any;
            setType(data.type);
            setName(data.name || "");
            setCustomerId(data.customer_id || "");
            
            // If taken, use lender_name. If given, use customer_name
            if (data.type === 'taken') setPartyName(data.lender_name || "");
            else setPartyName(data.customer_name || "");
            
            setPrincipal(String(data.principal_amount || ""));
            setInterestRate(String(data.interest_rate || ""));
            setInterestType(data.interest_type || "simple");
            setStartDate(data.start_date || "");
            setTotalEmis(String(data.total_emis || ""));
            setEmiAmount(String(data.emi_amount || ""));
            setLinkedAccountId(data.linked_bank_account_id || "");
            setStatus(data.status || "active");
            setNotes(data.notes || "");
        }
    }

    async function handleSave() {
        if (!principal || !partyName) {
            Alert.alert("Error", "Amount and Party Name are required");
            return;
        }

        try {
            setLoading(true);
            const pAmount = parseFloat(principal);
            const rate = parseFloat(interestRate) || 0;
            const emis = parseInt(totalEmis) || 0;
            const eAmount = parseFloat(emiAmount) || 0;
            const now = new Date().toISOString();

            // Depending on type, map partyName to correct field
            const dbFields: any = {
                type,
                name: name || `${type === 'given' ? 'Loan to' : 'Loan from'} ${partyName}`,
                customer_id: customerId || null,
                customer_name: type === 'given' ? partyName : null,
                lender_name: type === 'taken' ? partyName : null,
                principal_amount: pAmount,
                interest_rate: rate,
                interest_type: interestType,
                start_date: startDate,
                total_emis: emis,
                emi_amount: eAmount,
                linked_bank_account_id: linkedAccountId || null,
                status,
                notes,
                updated_at: now
            };

            // Calculate outstanding initial (same as principal if new)
            // If editing, we shouldn't reset outstanding unless logic demands it. Use logic for new only.
            if (!isEditing) {
                dbFields.outstanding_amount = pAmount; 
                dbFields.paid_emis = 0;
                dbFields.id = generateUUID();
                dbFields.user_id = 'user';
                dbFields.created_at = now;
            }

            if (isEditing) {
                // Update
                const sets = Object.keys(dbFields).map(k => `${k}=?`).join(", ");
                const values = Object.values(dbFields);
                await db.execute(`UPDATE loans SET ${sets} WHERE id = ?`, [...values, id]);
            } else {
                // Insert
                const columns = Object.keys(dbFields).join(", ");
                const questions = Object.keys(dbFields).map(() => "?").join(", ");
                const values = Object.values(dbFields);
                await db.execute(`INSERT INTO loans (${columns}) VALUES (${questions})`, values);
            }
            navigation.goBack();
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to save loan");
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
            <View style={styles.header}>
                 <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <X color="#0f172a" size={24} />
                 </TouchableOpacity>
                 <Text style={styles.headerTitle}>{isEditing ? "Edit Loan" : "New Loan"}</Text>
                 <TouchableOpacity onPress={handleSave} style={styles.iconBtn} disabled={loading}>
                    <Save color="#6366f1" size={24} />
                 </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                {/* Type Switcher */}
                <View style={styles.switchContainer}>
                    <TouchableOpacity 
                        style={[styles.switchOption, type === 'given' && styles.switchActiveGiven]}
                        onPress={() => setType('given')}
                    >
                        <Text style={[styles.switchText, type === 'given' && styles.switchTextActive]}>Money Given (Asset)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.switchOption, type === 'taken' && styles.switchActiveTaken]}
                        onPress={() => setType('taken')}
                    >
                        <Text style={[styles.switchText, type === 'taken' && styles.switchTextActive]}>Money Taken (Liability)</Text>
                    </TouchableOpacity>
                </View>

                {/* Party Selection */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>{type === 'given' ? 'Borrower (Customer/Other)' : 'Lender (Supplier/Bank)'}</Text>
                    <TouchableOpacity style={styles.selectBtn} onPress={() => setShowCustomerModal(true)}>
                         <Text style={{ color: partyName ? '#0f172a' : '#94a3b8' }}>
                            {partyName || "Select or Enter Name"}
                         </Text>
                    </TouchableOpacity>
                </View>

                {/* Amount */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Principal Loan Amount</Text>
                    <TextInput 
                        style={styles.inputBig}
                        value={principal}
                        onChangeText={setPrincipal}
                        keyboardType="numeric"
                        placeholder="0.00"
                    />
                </View>

                {/* Interest Details */}
                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>Interest Rate (%)</Text>
                        <TextInput 
                            style={styles.input}
                            value={interestRate}
                            onChangeText={setInterestRate}
                            keyboardType="numeric"
                            placeholder="0"
                        />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                         <Text style={styles.label}>Type</Text>
                         <View style={styles.radioRow}>
                            <TouchableOpacity 
                                style={[styles.radio, interestType === 'simple' && styles.radioActive]}
                                onPress={() => setInterestType('simple')}
                            >
                                <Text style={[styles.radioText, interestType === 'simple' && {color: 'white'}]}>Simple</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.radio, interestType === 'compound' && styles.radioActive]}
                                onPress={() => setInterestType('compound')}
                            >
                                <Text style={[styles.radioText, interestType === 'compound' && {color: 'white'}]}>Compound</Text>
                            </TouchableOpacity>
                         </View>
                    </View>
                </View>

                {/* Terms */}
                <View style={styles.row}>
                    <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}># of EMIs</Text>
                        <TextInput 
                            style={styles.input}
                            value={totalEmis}
                            onChangeText={setTotalEmis}
                            keyboardType="numeric"
                            placeholder="12"
                        />
                    </View>
                    <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.label}>EMI Amount</Text>
                        <TextInput 
                            style={styles.input}
                            value={emiAmount}
                            onChangeText={setEmiAmount}
                            keyboardType="numeric"
                            placeholder="0.00"
                        />
                    </View>
                </View>

                 <View style={styles.formGroup}>
                    <Text style={styles.label}>Start Date</Text>
                    <TextInput 
                        style={styles.input}
                        value={startDate}
                        onChangeText={setStartDate}
                        placeholder="YYYY-MM-DD"
                    />
                </View>

                {/* Linked Account */}
                 <View style={styles.formGroup}>
                    <Text style={styles.label}>Linked Bank Account (Optional)</Text>
                    <TouchableOpacity style={styles.selectBtn} onPress={() => setShowBankModal(true)}>
                         <Text style={{ color: linkedAccountId ? '#0f172a' : '#94a3b8' }}>
                            {linkedAccountId ? (bankAccounts?.find(b => b.id === linkedAccountId)?.name || "Unknown") : "None"}
                         </Text>
                    </TouchableOpacity>
                </View>
                
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Notes</Text>
                    <TextInput 
                        style={[styles.input, { height: 60 }]}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                    />
                </View>
                
            </ScrollView>

            {/* Customer/Party Modal */}
            <Modal visible={showCustomerModal} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Party</Text>
                        <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                            <X size={24} color="#0f172a" />
                        </TouchableOpacity>
                    </View>
                    <View style={{ padding: 16, borderBottomWidth: 1, borderColor: '#f1f5f9' }}>
                         <TextInput 
                            style={styles.input}
                            value={partyName} // Allow editing directly here or selecting
                            onChangeText={(t) => { setPartyName(t); setCustomerId(""); }}
                            placeholder="Type Name manually..."
                         />
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        <Text style={styles.sectionHeader}>Existing Customers</Text>
                        {customers?.map(c => (
                            <TouchableOpacity 
                                key={c.id} 
                                style={styles.listItem}
                                onPress={() => {
                                    setCustomerId(c.id);
                                    setPartyName(c.name);
                                    setShowCustomerModal(false);
                                }}
                            >
                                <Text style={styles.listItemText}>{c.name}</Text>
                                {customerId === c.id && <CheckSquare size={20} color="#6366f1" />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modal>

            {/* Bank Modal */}
            <Modal visible={showBankModal} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                     <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Bank Account</Text>
                        <TouchableOpacity onPress={() => setShowBankModal(false)}>
                            <X size={24} color="#0f172a" />
                        </TouchableOpacity>
                    </View>
                     <ScrollView contentContainerStyle={{ padding: 16 }}>
                        <TouchableOpacity 
                            style={styles.listItem}
                            onPress={() => {
                                setLinkedAccountId("");
                                setShowBankModal(false);
                            }}
                        >
                            <Text style={[styles.listItemText, { color: '#64748b', fontStyle: 'italic' }]}>None</Text>
                        </TouchableOpacity>
                        {bankAccounts?.map(b => (
                            <TouchableOpacity 
                                key={b.id} 
                                style={styles.listItem}
                                onPress={() => {
                                    setLinkedAccountId(b.id);
                                    setShowBankModal(false);
                                }}
                            >
                                <Text style={styles.listItemText}>{b.name}</Text>
                                {linkedAccountId === b.id && <CheckSquare size={20} color="#6366f1" />}
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
    switchContainer: { flexDirection: "row", backgroundColor: "#e2e8f0", borderRadius: 12, padding: 4, marginBottom: 24 },
    switchOption: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10 },
    switchActiveGiven: { backgroundColor: '#16a34a' },
    switchActiveTaken: { backgroundColor: '#dc2626' },
    switchText: { fontWeight: "600", color: "#64748b", fontSize: 13 },
    switchTextActive: { color: "white" },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: "500", color: "#64748b", marginBottom: 8 },
    input: { backgroundColor: "white", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 12, fontSize: 16, color: "#0f172a" },
    inputBig: { backgroundColor: "white", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 16, fontSize: 24, fontWeight: "bold", color: "#0f172a" },
    row: { flexDirection: 'row' },
    selectBtn: { backgroundColor: "white", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 12 },
    radioRow: { flexDirection: 'row', gap: 8 },
    radio: { flex: 1, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, backgroundColor: 'white' },
    radioActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
    radioText: { fontSize: 14, color: '#64748b' },
    modalContainer: { flex: 1, backgroundColor: '#f8fafc' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#e2e8f0', backgroundColor: 'white' },
    modalTitle: { fontSize: 18, fontWeight: '600' },
    listItem: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between' },
    listItemText: { fontSize: 16, color: '#0f172a' },
    sectionHeader: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8, marginTop: 16 }
});
