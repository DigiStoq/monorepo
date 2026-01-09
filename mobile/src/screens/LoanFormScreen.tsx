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
    const [name, setName] = useState(""); 
    const [customerId, setCustomerId] = useState("");
    const [partyName, setPartyName] = useState(""); 
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

            if (!isEditing) {
                dbFields.outstanding_amount = pAmount; 
                dbFields.paid_emis = 0;
                dbFields.id = generateUUID();
                dbFields.user_id = 'user';
                dbFields.created_at = now;
            }

            if (isEditing) {
                const sets = Object.keys(dbFields).map(k => `${k}=?`).join(", ");
                const values = Object.values(dbFields);
                await db.execute(`UPDATE loans SET ${sets} WHERE id = ?`, [...values, id]);
            } else {
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
                <Button variant="ghost" size="icon" onPress={() => navigation.goBack()}>
                    <X color={colors.text} size={24} />
                </Button>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{isEditing ? "Edit Loan" : "New Loan"}</Text>
                </View>
                <Button variant="ghost" size="icon" onPress={handleSave} disabled={loading}>
                    {loading ? <ActivityIndicator color={colors.primary} /> : <Save color={colors.primary} size={24} />}
                </Button>
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

                <Card>
                    <CardHeader title="Loan Details" />
                    <CardBody>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>{type === 'given' ? 'Borrower (Customer/Other)' : 'Lender (Supplier/Bank)'}</Text>
                            <TouchableOpacity style={styles.selectBtn} onPress={() => setShowCustomerModal(true)}>
                                <Text style={{ color: partyName ? colors.text : colors.textSecondary }}>
                                    {partyName || "Select or Enter Name"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                         <Input 
                            label="Principal Loan Amount"
                            value={principal}
                            onChangeText={setPrincipal}
                            keyboardType="numeric"
                            placeholder="0.00"
                            style={styles.inputBig}
                        />

                         <View style={styles.row}>
                             <Input 
                                label="Interest Rate (%)"
                                value={interestRate}
                                onChangeText={setInterestRate}
                                keyboardType="numeric"
                                placeholder="0"
                                containerStyle={{ flex: 1, marginRight: 8 }}
                            />
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

                         <View style={styles.row}>
                            <Input 
                                label="# of EMIs"
                                value={totalEmis}
                                onChangeText={setTotalEmis}
                                keyboardType="numeric"
                                placeholder="12"
                                containerStyle={{ flex: 1, marginRight: 8 }}
                            />
                            <Input 
                                label="EMI Amount"
                                value={emiAmount}
                                onChangeText={setEmiAmount}
                                keyboardType="numeric"
                                placeholder="0.00"
                                containerStyle={{ flex: 1 }}
                            />
                        </View>

                        <Input 
                            label="Start Date"
                            value={startDate}
                            onChangeText={setStartDate}
                            placeholder="YYYY-MM-DD"
                        />

                         <View style={styles.formGroup}>
                            <Text style={styles.label}>Linked Bank Account</Text>
                            <TouchableOpacity style={styles.selectBtn} onPress={() => setShowBankModal(true)}>
                                <Text style={{ color: linkedAccountId ? colors.text : colors.textSecondary }}>
                                    {linkedAccountId ? (bankAccounts?.find(b => b.id === linkedAccountId)?.name || "Unknown") : "None"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        
                         <Input 
                            label="Notes"
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            numberOfLines={2}
                        />
                    </CardBody>
                </Card>
            </ScrollView>

            {/* Customer/Party Modal */}
            <Modal visible={showCustomerModal} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Party</Text>
                        <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ padding: 16, borderBottomWidth: 1, borderColor: colors.border }}>
                         <Input 
                            value={partyName} 
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
                                {customerId === c.id && <CheckSquare size={20} color={colors.primary} />}
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
                            <X size={24} color={colors.text} />
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
                            <Text style={[styles.listItemText, { color: colors.textSecondary, fontStyle: 'italic' }]}>None</Text>
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
                                {linkedAccountId === b.id && <CheckSquare size={20} color={colors.primary} />}
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
    switchContainer: { flexDirection: "row", backgroundColor: colors.border, borderRadius: borderRadius.md, padding: 4, marginBottom: 24 },
    switchOption: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: borderRadius.sm },
    switchActiveGiven: { backgroundColor: colors.success },
    switchActiveTaken: { backgroundColor: colors.danger },
    switchText: { fontWeight: fontWeight.semibold, color: colors.textSecondary, fontSize: 13 },
    switchTextActive: { color: "white" },
    formGroup: { marginBottom: 16 },
    label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textSecondary, marginBottom: 8 },
    inputBig: { fontSize: 24, fontWeight: "bold" },
    row: { flexDirection: 'row' },
    selectBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: 12 },
    radioRow: { flexDirection: 'row', gap: 8 },
    radio: { flex: 1, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, backgroundColor: colors.surface },
    radioActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    radioText: { fontSize: 14, color: colors.textSecondary },
    modalContainer: { flex: 1, backgroundColor: colors.background },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text },
    listItem: { padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between' },
    listItemText: { fontSize: 16, color: colors.text },
    sectionHeader: { fontSize: 14, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: 8, marginTop: 16 }
});
