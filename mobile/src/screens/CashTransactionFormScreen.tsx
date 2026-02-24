import React, { useState, useEffect } from "react";
import {
    View,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Text,
    TouchableOpacity,
    ActivityIndicator
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { XCloseIcon, SaveIcon, TrashIcon } from "../components/ui/UntitledIcons";
import {
    Button,
    Input,
    DateInput,
    Card,
    CardHeader,
    CardBody
} from "../components/ui";
import { useTheme } from "../contexts/ThemeContext";
import { CustomHeader } from "../components/CustomHeader";
import { useCashTransactionMutations, useCashTransactionById } from "../hooks/useCashTransactions";

export function CashTransactionFormScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const params = route.params as { id?: string } | undefined;
    const id = params?.id;
    const isEditing = !!id;
    const { colors } = useTheme();

    const { createTransaction, updateTransaction, deleteTransaction } = useCashTransactionMutations();
    const { transaction, isLoading: loadingData } = useCashTransactionById(id || null);

    const [type, setType] = useState<'in' | 'out'>('out');
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (transaction) {
            setType(transaction.type === 'in' ? 'in' : 'out'); // Handle 'adjustment' if needed, mostly in/out
            setAmount(String(transaction.amount));
            setDate(transaction.date);
            setDescription(transaction.description || "");
            setCategory(transaction.category || "");
        }
    }, [transaction]);

    async function handleSave() {
        if (!amount || isNaN(parseFloat(amount))) {
            Alert.alert("Error", "Please enter a valid amount");
            return;
        }
        if (!date) {
            Alert.alert("Error", "Date is required");
            return;
        }

        try {
            setLoading(true);
            const amt = parseFloat(amount);

            if (isEditing && id) {
                await updateTransaction(id, {
                    type,
                    amount: amt,
                    date,
                    description,
                    category
                });
            } else {
                await createTransaction({
                    type,
                    amount: amt,
                    date,
                    description,
                    category
                });
            }
            navigation.goBack();
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to save transaction");
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
                    await deleteTransaction(id);
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
                title={isEditing ? "Edit Transaction" : "New Cash Transaction"}
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
                <View className="flex-row bg-border rounded-lg p-1 mb-6">
                    <TouchableOpacity
                        className={`flex-1 py-3 items-center rounded-md ${type === 'in' ? 'bg-success' : 'bg-transparent'}`}
                        style={{ backgroundColor: type === 'in' ? colors.success : undefined }}
                        onPress={() => { setType('in'); }}
                    >
                        <Text className={`font-medium ${type === 'in' ? 'text-white font-bold' : 'text-text-secondary'}`}
                            style={{ color: type === 'in' ? '#ffffff' : colors.textSecondary }}>
                            Cash In (+)
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`flex-1 py-3 items-center rounded-md ${type === 'out' ? 'bg-danger' : 'bg-transparent'}`}
                        style={{ backgroundColor: type === 'out' ? colors.danger : undefined }}
                        onPress={() => { setType('out'); }}
                    >
                        <Text className={`font-medium ${type === 'out' ? 'text-white font-bold' : 'text-text-secondary'}`}
                            style={{ color: type === 'out' ? '#ffffff' : colors.textSecondary }}>
                            Cash Out (-)
                        </Text>
                    </TouchableOpacity>
                </View>

                <Card>
                    <CardHeader title="Details" />
                    <CardBody>
                        <Input
                            label="Amount"
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            placeholder="0.00"
                            style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}
                            autoFocus={!isEditing}
                        />
                        <DateInput
                            label="Date"
                            value={date}
                            onChange={setDate}
                        />
                        <Input
                            label="Description"
                            value={description}
                            onChangeText={setDescription}
                            placeholder="e.g. Sales, Office Supplies"
                        />
                        <Input
                            label="Category (Optional)"
                            value={category}
                            onChangeText={setCategory}
                            placeholder="e.g. Food, Transport"
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
                            <Text className="font-semibold text-danger" style={{ color: colors.danger }}>Delete Transaction</Text>
                        </View>
                    </Button>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
