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
import { XCloseIcon, SaveIcon, CheckSquareIcon, TrashIcon } from "../components/ui/UntitledIcons";
import type { CustomerRecord } from "../lib/powersync";
import {
    Button,
    Input,
    DateInput,
    Card,
    CardHeader,
    CardBody,
} from "../components/ui";
import { useTheme } from "../contexts/ThemeContext";
import { CustomHeader } from "../components/CustomHeader";
import { useChequeMutations, useChequeById } from "../hooks/useCheques";

export function ChequeFormScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const params = route.params as { id?: string } | undefined;
    const id = params?.id;
    const isEditing = !!id;
    const { colors } = useTheme();

    const { createCheque, updateCheque, deleteCheque } = useChequeMutations();
    const { cheque, isLoading: loadingData } = useChequeById(id || null);

    // Fetch customers (still needed for picker)
    const { data: customers } = useQuery<CustomerRecord>("SELECT id, name FROM customers ORDER BY name ASC");

    const [type, setType] = useState<'received' | 'issued'>('received');
    const [customerId, setCustomerId] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [bankName, setBankName] = useState("");
    const [chequeNumber, setChequeNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState("");
    const [status, setStatus] = useState("pending");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);

    useEffect(() => {
        if (cheque) {
            setType(cheque.type);
            setCustomerId(cheque.customerId || "");
            setCustomerName(cheque.customerName || "");
            setBankName(cheque.bankName || "");
            setChequeNumber(cheque.chequeNumber || "");
            setAmount(String(cheque.amount || ""));
            setDate(cheque.date || "");
            setDueDate(cheque.dueDate || "");
            setStatus(cheque.status || "pending");
            setNotes(cheque.notes || "");
        }
    }, [cheque]);

    async function handleSave() {
        if (!chequeNumber || !amount || !bankName) {
            Alert.alert("Error", "Cheque No, Amount and Bank Name are required");
            return;
        }

        try {
            setLoading(true);
            const amt = parseFloat(amount);

            // Resolve Name
            let finalName = customerName;
            if (customerId) {
                const found = customers?.find(c => c.id === customerId);
                if (found) finalName = found.name;
            }

            const payload: any = {
                type,
                customerId: customerId || undefined,
                customerName: finalName,
                bankName,
                chequeNumber,
                amount: amt,
                date,
                dueDate,
                status: status as any,
                notes
            };

            if (isEditing && id) {
                await updateCheque(id, payload);
            } else {
                await createCheque(payload);
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
        if (!id) return;
        Alert.alert("Delete", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive", onPress: async () => {
                    await deleteCheque(id);
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
                title={isEditing ? "Edit Cheque" : "New Cheque"}
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
                <View className="flex-row border border-border rounded-lg overflow-hidden mb-5">
                    <TouchableOpacity
                        className={`flex-1 py-3 items-center ${type === 'received' ? 'bg-success' : 'bg-surface'}`}
                        style={{ backgroundColor: type === 'received' ? colors.success : undefined }}
                        onPress={() => { setType('received'); }}
                    >
                        <Text className={`font-semibold ${type === 'received' ? 'text-white' : 'text-text-secondary'}`}
                            style={{ color: type === 'received' ? '#ffffff' : colors.textSecondary }}>
                            Received
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`flex-1 py-3 items-center ${type === 'issued' ? 'bg-danger' : 'bg-surface'}`}
                        style={{ backgroundColor: type === 'issued' ? colors.danger : undefined }}
                        onPress={() => { setType('issued'); }}
                    >
                        <Text className={`font-semibold ${type === 'issued' ? 'text-white' : 'text-text-secondary'}`}
                            style={{ color: type === 'issued' ? '#ffffff' : colors.textSecondary }}>
                            Issued
                        </Text>
                    </TouchableOpacity>
                </View>

                <Card>
                    <CardHeader title="Details" />
                    <CardBody>
                        <View className="mb-4">
                            <Text className="text-sm font-medium text-text-secondary mb-1.5">{type === 'received' ? 'From Customer' : 'To Party'}</Text>
                            <TouchableOpacity
                                className="bg-surface border border-border rounded-lg p-3"
                                onPress={() => { setShowCustomerModal(true); }}
                            >
                                <Text style={{ color: customerId || customerName ? colors.text : colors.textSecondary }}>
                                    {(customerId && customers?.find(c => c.id === customerId)?.name) || customerName || "Select or Enter Name"}
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

                        <Text className="text-sm font-medium text-text-secondary mb-1.5">Amount</Text>
                        <TextInput
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            placeholder="0.00"
                            placeholderTextColor={colors.textMuted}
                            style={{
                                fontSize: 24,
                                fontWeight: "bold",
                                color: colors.text,
                                backgroundColor: colors.surface,
                                padding: 12,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: colors.border,
                                marginBottom: 16
                            }}
                        />

                        <View className="flex-row gap-2 mb-4">
                            <View className="flex-1">
                                <Input
                                    label="Bank Name"
                                    value={bankName}
                                    onChangeText={setBankName}
                                    placeholder="e.g. HDFC"
                                />
                            </View>
                            <View className="flex-1">
                                <Input
                                    label="Cheque No."
                                    value={chequeNumber}
                                    onChangeText={setChequeNumber}
                                    placeholder="######"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View className="flex-row gap-2 mb-4">
                            <View className="flex-1">
                                <DateInput
                                    label="Issue Date"
                                    value={date}
                                    onChange={setDate}
                                />
                            </View>
                            <View className="flex-1">
                                <DateInput
                                    label="Due Date"
                                    value={dueDate}
                                    onChange={setDueDate}
                                />
                            </View>
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-medium text-text-secondary mb-2">Status</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {['pending', 'cleared', 'bounced', 'cancelled'].map(s => (
                                    <TouchableOpacity
                                        key={s}
                                        className={`px-3 py-1.5 rounded-full border ${status === s ? 'bg-primary-10 border-primary' : 'bg-background border-border'}`}
                                        style={{
                                            backgroundColor: status === s ? colors.primary + '20' : colors.background,
                                            borderColor: status === s ? colors.primary : colors.border
                                        }}
                                        onPress={() => { setStatus(s); }}
                                    >
                                        <Text className="text-xs capitalize"
                                            style={{
                                                color: status === s ? colors.primary : colors.textSecondary,
                                                fontWeight: status === s ? '600' : '400'
                                            }}>
                                            {s}
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
                        variant="ghost"
                        className="mt-6 border border-danger"
                        onPress={handleDelete}
                    >
                        <View className="flex-row items-center justify-center gap-2">
                            <TrashIcon size={18} color={colors.danger} />
                            <Text style={{ color: colors.danger, fontWeight: '600' }}>Delete Cheque Entry</Text>
                        </View>
                    </Button>
                )}
            </ScrollView>

            <Modal visible={showCustomerModal} animationType="slide" presentationStyle="pageSheet" transparent={false}>
                <View className="flex-1 bg-background">
                    <View className="flex-row justify-between items-center p-4 border-b border-border bg-surface">
                        <Text className="text-lg font-semibold text-text">Select Party</Text>
                        <TouchableOpacity onPress={() => { setShowCustomerModal(false); }}>
                            <XCloseIcon size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        <TouchableOpacity
                            className="p-4 bg-surface border-b border-border flex-row justify-between items-center"
                            onPress={() => {
                                setCustomerId("");
                                setCustomerName("");
                                setShowCustomerModal(false);
                            }}
                        >
                            <Text className="text-md italic text-text-secondary">
                                Clear / Enter Manually
                            </Text>
                        </TouchableOpacity>
                        {customers?.map(c => (
                            <TouchableOpacity
                                key={c.id}
                                className="p-4 bg-surface border-b border-border flex-row justify-between items-center"
                                onPress={() => {
                                    setCustomerId(c.id);
                                    setCustomerName(c.name);
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
        </KeyboardAvoidingView>
    );
}
