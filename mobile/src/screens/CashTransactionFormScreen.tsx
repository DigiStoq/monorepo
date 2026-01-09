import React, { useState, useEffect } from "react";
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  Text,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { usePowerSync } from "@powersync/react-native";
import { generateUUID } from "../lib/utils";
import { X, Save, Trash2 } from "lucide-react-native";
import { 
    Button, 
    Input,
    Card,
    CardHeader,
    CardBody
} from "../components/ui";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../lib/theme";
import { wp, hp } from "../lib/responsive";

export function CashTransactionFormScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const db = usePowerSync();
    const params = route.params as { id?: string } | undefined;
    const id = params?.id;
    const isEditing = !!id;

    const [type, setType] = useState<'in'|'out'>('out'); 
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (id) {
            loadTransaction();
        }
    }, [id]);

    async function loadTransaction() {
        const res = await db.getAll("SELECT * FROM cash_transactions WHERE id = ?", [id]);
        if (res.length > 0) {
            const tx = res[0] as any;
            setType(tx.type);
            setAmount(String(tx.amount));
            setDate(tx.date);
            setDescription(tx.description || "");
            setCategory(tx.category || "");
        }
    }

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
            const now = new Date().toISOString();
            
            if (isEditing) {
                await db.execute(
                    `UPDATE cash_transactions SET
                     type=?, amount=?, date=?, description=?, category=?, updated_at=?
                     WHERE id=?`,
                    [type, amt, date, description, category, now, id]
                );
            } else {
                await db.execute(
                    `INSERT INTO cash_transactions 
                    (id, user_id, type, amount, date, description, category, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [generateUUID(), 'user', type, amt, date, description, category, now, now]
                );
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
        Alert.alert("Delete", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => {
                await db.execute("DELETE FROM cash_transactions WHERE id = ?", [id]);
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
                    <Text style={styles.title}>{isEditing ? "Edit Transaction" : "New Cash Transaction"}</Text>
                </View>
                <Button variant="ghost" size="icon" onPress={handleSave} disabled={loading}>
                    {loading ? <ActivityIndicator color={colors.primary} /> : <Save color={colors.primary} size={24} />}
                </Button>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.switchContainer}>
                    <TouchableOpacity 
                        style={[styles.switchOption, type === 'in' && styles.switchActiveIn]}
                        onPress={() => setType('in')}
                    >
                        <Text style={[styles.switchText, type === 'in' && styles.switchTextActive]}>Cash In (+)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.switchOption, type === 'out' && styles.switchActiveOut]}
                        onPress={() => setType('out')}
                    >
                        <Text style={[styles.switchText, type === 'out' && styles.switchTextActive]}>Cash Out (-)</Text>
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
                            style={styles.inputBig}
                            autoFocus={!isEditing}
                        />
                        <Input 
                            label="Date"
                            value={date}
                            onChangeText={setDate}
                            placeholder="YYYY-MM-DD"
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
                        variant="outline"
                        style={{ marginTop: 24, borderColor: colors.danger }}
                        onPress={handleDelete}
                        leftIcon={<Trash2 size={18} color={colors.danger} />}
                     >
                        <Text style={{ color: colors.danger }}>Delete Transaction</Text>
                     </Button>
                )}
            </ScrollView>
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
    switchActiveIn: { backgroundColor: colors.success },
    switchActiveOut: { backgroundColor: colors.danger },
    switchText: { fontWeight: fontWeight.medium, color: colors.textSecondary },
    switchTextActive: { color: "#fff", fontWeight: fontWeight.bold },
    inputBig: { fontSize: 24, fontWeight: "bold", textAlign: "center" },
});
