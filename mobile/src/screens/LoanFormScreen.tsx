import React, { useState, useEffect } from "react";
import {
    View,
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
import { useQuery } from "@powersync/react-native";
import type { CustomerRecord } from "../lib/powersync";
import {
    Button,
    Input,
    Card,
    CardHeader,
    CardBody,
} from "../components/ui";
import { useTheme } from "../contexts/ThemeContext";
import { useLoanMutations, useLoanById } from "../hooks/useLoans";
import { XCloseIcon, SaveIcon, CheckSquareIcon, TrashIcon } from "../components/ui/UntitledIcons";
import { CustomHeader } from "../components/CustomHeader";

export function LoanFormScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const params = route.params as { id?: string } | undefined;
    const id = params?.id;
    const isEditing = !!id;
    const { colors } = useTheme();

    const { createLoan, updateLoan, deleteLoan } = useLoanMutations();
    const { loan, isLoading: loadingData } = useLoanById(id || null);

    // Fetch customers
    const { data: customers } = useQuery<CustomerRecord>("SELECT id, name FROM customers ORDER BY name ASC");

    // Fetch bank accounts
    const { data: bankAccounts } = useQuery<{ id: string, name: string }>("SELECT id, name FROM bank_accounts ORDER BY name ASC");

    const [type, setType] = useState<'given' | 'taken'>('given');
    const [customerId, setCustomerId] = useState("");
    const [partyName, setPartyName] = useState("");
    const [principal, setPrincipal] = useState("");
    const [interestRate, setInterestRate] = useState("");
    const [interestType, setInterestType] = useState<'simple' | 'compound'>('simple');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [totalEmis, setTotalEmis] = useState("");
    const [emiAmount, setEmiAmount] = useState("");
    const [linkedAccountId, setLinkedAccountId] = useState("");
    const [status, setStatus] = useState<"active" | "closed" | "defaulted">("active");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    // UI Helpers
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showBankModal, setShowBankModal] = useState(false);

    useEffect(() => {
        if (loan) {
            setType(loan.type);
            setCustomerId(loan.customerId || "");
            setPartyName(loan.type === 'given' ? (loan.customerName || "") : (loan.lenderName || ""));
            setPrincipal(String(loan.principalAmount || ""));
            setInterestRate(String(loan.interestRate || ""));
            setInterestType(loan.interestType);
            setStartDate(loan.startDate);
            setTotalEmis(String(loan.totalEmis || ""));
            setEmiAmount(String(loan.emiAmount || ""));
            setLinkedAccountId(loan.linkedBankAccountId || "");
            setStatus(loan.status);
            setNotes(loan.notes || "");
        }
    }, [loan]);

    async function handleSave() {
        if (!principal || !partyName) {
            Alert.alert("Error", "Amount and Party Name are required");
            return;
        }

        try {
            setLoading(true);
            const pAmount = parseFloat(principal);
            const rate = parseFloat(interestRate) || 0;
            const emis = totalEmis ? parseInt(totalEmis) : undefined;
            const eAmount = emiAmount ? parseFloat(emiAmount) : undefined;

            const payload: any = {
                type,
                customerId: customerId || undefined,
                partyName,
                principalAmount: pAmount,
                interestRate: rate,
                interestType,
                startDate,
                totalEmis: emis,
                emiAmount: eAmount,
                linkedBankAccountId: linkedAccountId || undefined,
                notes,
                status // For update
            };

            if (isEditing && id) {
                await updateLoan(id, payload);
            } else {
                await createLoan(payload);
            }
            navigation.goBack();
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to save loan");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        if (!id) return;
        Alert.alert("Delete", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive", onPress: async () => {
                    await deleteLoan(id);
                    navigation.goBack();
                }
            }
        ]);
    }

    if (loadingData) {
        return (
            <View className="flex-1 justify-center items-center bg-background">
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-background">
            <CustomHeader
                title={isEditing ? "Edit Loan" : "New Loan"}
                showBack
                rightAction={
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={loading}
                        className="p-1.5"
                    >
                        {loading ? <ActivityIndicator size="small" color={colors.primary} /> : <SaveIcon color={colors.primary} size={24} />}
                    </TouchableOpacity>
                }
            />

            <ScrollView contentContainerStyle={{ padding: 16 }}>

                {/* Type Switcher */}
                <View className="flex-row bg-surface-hover rounded-lg p-1 mb-6">
                    <TouchableOpacity
                        className={`flex-1 py-3 items-center rounded-md ${type === 'given' ? 'bg-success' : ''}`}
                        style={{ backgroundColor: type === 'given' ? colors.success : undefined }}
                        onPress={() => { setType('given'); }}
                    >
                        <Text className={`text-sm font-semibold  ${type === 'given' ? 'text-white' : 'text-text-secondary'}`}>
                            Money Given (Asset)
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`flex-1 py-3 items-center rounded-md ${type === 'taken' ? 'bg-danger' : ''}`}
                        style={{ backgroundColor: type === 'taken' ? colors.danger : undefined }}
                        onPress={() => { setType('taken'); }}
                    >
                        <Text className={`text-sm font-semibold ${type === 'taken' ? 'text-white' : 'text-text-secondary'}`}>
                            Money Taken (Liability)
                        </Text>
                    </TouchableOpacity>
                </View>

                <Card>
                    <CardHeader title="Loan Details" />
                    <CardBody>
                        <View className="mb-4">
                            <Text className="text-sm font-medium text-text-secondary mb-2">
                                {type === 'given' ? 'Borrower (Customer/Other)' : 'Lender (Supplier/Bank)'}
                            </Text>
                            <TouchableOpacity
                                className="bg-surface border border-border rounded-lg p-3"
                                onPress={() => { setShowCustomerModal(true); }}
                            >
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
                            className="text-2xl font-bold text-text"
                            style={{ fontSize: 24, fontWeight: 'bold' }}
                        />

                        <View className="flex-row gap-2">
                            <Input
                                label="Interest Rate (%)"
                                value={interestRate}
                                onChangeText={setInterestRate}
                                keyboardType="numeric"
                                placeholder="0"
                                containerStyle={{ flex: 1 }}
                            />
                            <View className="flex-1 mb-4">
                                <Text className="text-sm font-medium text-text-secondary mb-2">Type</Text>
                                <View className="flex-row gap-2">
                                    <TouchableOpacity
                                        className={`flex-1 p-2.5 items-center border border-border rounded-lg ${interestType === 'simple' ? 'bg-primary border-primary' : 'bg-surface'}`}
                                        style={{ backgroundColor: interestType === 'simple' ? colors.primary : colors.surface, borderColor: interestType === 'simple' ? colors.primary : colors.border }}
                                        onPress={() => { setInterestType('simple'); }}
                                    >
                                        <Text className={`text-sm ${interestType === 'simple' ? 'text-white' : 'text-text-secondary'}`}>Simple</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        className={`flex-1 p-2.5 items-center border border-border rounded-lg ${interestType === 'compound' ? 'bg-primary border-primary' : 'bg-surface'}`}
                                        style={{ backgroundColor: interestType === 'compound' ? colors.primary : colors.surface, borderColor: interestType === 'compound' ? colors.primary : colors.border }}
                                        onPress={() => { setInterestType('compound'); }}
                                    >
                                        <Text className={`text-sm ${interestType === 'compound' ? 'text-white' : 'text-text-secondary'}`}>Compound</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View className="flex-row gap-2">
                            <Input
                                label="# of EMIs"
                                value={totalEmis}
                                onChangeText={setTotalEmis}
                                keyboardType="numeric"
                                placeholder="12"
                                containerStyle={{ flex: 1 }}
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

                        <View className="mb-4">
                            <Text className="text-sm font-medium text-text-secondary mb-2">Linked Bank Account</Text>
                            <TouchableOpacity
                                className="bg-surface border border-border rounded-lg p-3"
                                onPress={() => { setShowBankModal(true); }}
                            >
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

                {isEditing && (
                    <Button
                        variant="outline"
                        className="mt-6 border-danger"
                        onPress={handleDelete}
                        style={{ borderColor: colors.danger }}
                        leftIcon={<TrashIcon size={18} color={colors.danger} />}
                    >
                        <Text style={{ color: colors.danger }}>Delete Loan Entry</Text>
                    </Button>
                )}
            </ScrollView>

            {/* Customer/Party Modal */}
            <Modal visible={showCustomerModal} animationType="slide" presentationStyle="pageSheet" transparent={false}>
                <View className="flex-1 bg-background">
                    <View className="flex-row justify-between p-4 border-b border-border bg-surface">
                        <Text className="text-lg font-semibold text-text">Select Party</Text>
                        <TouchableOpacity onPress={() => { setShowCustomerModal(false); }}>
                            <XCloseIcon size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <View className="p-4 border-b border-border">
                        <Input
                            value={partyName}
                            onChangeText={(t) => { setPartyName(t); setCustomerId(""); }}
                            placeholder="Type Name manually..."
                        />
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        <Text className="text-sm font-semibold text-text-secondary mb-2 mt-4">Existing Customers</Text>
                        {customers?.map(c => (
                            <TouchableOpacity
                                key={c.id}
                                className="p-4 bg-surface border-b border-border flex-row justify-between"
                                onPress={() => {
                                    setCustomerId(c.id);
                                    setPartyName(c.name);
                                    setShowCustomerModal(false);
                                }}
                            >
                                <Text className="text-md text-text">{c.name}</Text>
                                {customerId === c.id && <CheckSquareIcon size={20} color={colors.primary} />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modal>

            {/* Bank Modal */}
            <Modal visible={showBankModal} animationType="slide" presentationStyle="pageSheet" transparent={false}>
                <View className="flex-1 bg-background">
                    <View className="flex-row justify-between p-4 border-b border-border bg-surface">
                        <Text className="text-lg font-semibold text-text">Select Bank Account</Text>
                        <TouchableOpacity onPress={() => { setShowBankModal(false); }}>
                            <XCloseIcon size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        <TouchableOpacity
                            className="p-4 bg-surface border-b border-border"
                            onPress={() => {
                                setLinkedAccountId("");
                                setShowBankModal(false);
                            }}
                        >
                            <Text className="text-md text-text-secondary italic">None</Text>
                        </TouchableOpacity>
                        {bankAccounts?.map(b => (
                            <TouchableOpacity
                                key={b.id}
                                className="p-4 bg-surface border-b border-border flex-row justify-between"
                                onPress={() => {
                                    setLinkedAccountId(b.id);
                                    setShowBankModal(false);
                                }}
                            >
                                <Text className="text-md text-text">{b.name}</Text>
                                {linkedAccountId === b.id && <CheckSquareIcon size={20} color={colors.primary} />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}
