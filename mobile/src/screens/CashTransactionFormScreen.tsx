import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { usePowerSync } from "@powersync/react-native";
import { generateUUID } from "../lib/utils";
import { X, Save } from "lucide-react-native";

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
                 <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <X color="#0f172a" size={24} />
                 </TouchableOpacity>
                 <Text style={styles.headerTitle}>{isEditing ? "Edit Transaction" : "New Cash Transaction"}</Text>
                 <TouchableOpacity onPress={handleSave} style={styles.iconBtn} disabled={loading}>
                    <Save color="#6366f1" size={24} />
                 </TouchableOpacity>
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

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Amount</Text>
                    <TextInput 
                        style={styles.inputBig}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        placeholder="0.00"
                        autoFocus={!isEditing}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Date</Text>
                    <TextInput 
                        style={styles.input}
                        value={date}
                        onChangeText={setDate}
                        placeholder="YYYY-MM-DD"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput 
                        style={styles.input}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="e.g. Sales, Office Supplies"
                    />
                </View>

                 <View style={styles.formGroup}>
                    <Text style={styles.label}>Category (Optional)</Text>
                    <TextInput 
                        style={styles.input}
                        value={category}
                        onChangeText={setCategory}
                        placeholder="e.g. Food, Transport"
                    />
                </View>

                {isEditing && (
                    <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                        <Text style={styles.deleteText}>Delete Transaction</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
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
    switchActiveIn: { backgroundColor: "#16a34a" },
    switchActiveOut: { backgroundColor: "#dc2626" },
    switchText: { fontWeight: "600", color: "#64748b" },
    switchTextActive: { color: "white" },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: "500", color: "#64748b", marginBottom: 8 },
    input: { backgroundColor: "white", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 14, fontSize: 16, color: "#0f172a" },
    inputBig: { backgroundColor: "white", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 16, fontSize: 32, fontWeight: "bold", color: "#0f172a", textAlign: "center" },
    deleteBtn: { marginTop: 24, backgroundColor: "#fee2e2", padding: 16, borderRadius: 12, alignItems: "center" },
    deleteText: { color: "#dc2626", fontWeight: "600", fontSize: 16 }
});
