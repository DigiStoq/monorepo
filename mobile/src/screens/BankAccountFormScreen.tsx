import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { usePowerSync } from "@powersync/react-native";
import { generateUUID } from "../lib/utils";

export function BankAccountFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const db = usePowerSync();
  const params = route.params as { id?: string } | undefined;
  const id = params?.id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bank_name: "",
    account_number: "",
    account_type: "savings", // default
    opening_balance: "",
    current_balance: "", // Usually calculated, but for simplicity we sync them for now or let user edit if manual
    notes: "",
  });

  const isEditing = !!id;

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      const result = await db.getAll(
        "SELECT * FROM bank_accounts WHERE id = ?",
        [id]
      );
      if (result.length > 0) {
        const data = result[0] as any;
        setFormData({
          name: data.name || "",
          bank_name: data.bank_name || "",
          account_number: data.account_number || "",
          account_type: data.account_type || "savings",
          opening_balance: data.opening_balance?.toString() || "",
          current_balance: data.current_balance?.toString() || "",
          notes: data.notes || "",
        });
      }
    } catch (error) {
      console.error("Error loading bank account:", error);
      Alert.alert("Error", "Failed to load bank account details");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!formData.name || !formData.bank_name) {
      Alert.alert("Error", "Please fill in Name and Bank Name");
      return;
    }

    try {
      setLoading(true);
      const now = new Date().toISOString();
      const balance = parseFloat(formData.opening_balance) || 0;

      if (isEditing) {
        await db.execute(
          `UPDATE bank_accounts 
           SET name = ?, bank_name = ?, account_number = ?, account_type = ?, 
               opening_balance = ?, current_balance = ?, notes = ?, updated_at = ?
           WHERE id = ?`,
          [
            formData.name,
            formData.bank_name,
            formData.account_number,
            formData.account_type,
            balance,
            balance, // Reset current to opening, ideally current is transaction derived but for setup it's opening
            formData.notes,
            now,
            id,
          ]
        );
      } else {
        await db.execute(
          `INSERT INTO bank_accounts 
           (id, name, bank_name, account_number, account_type, opening_balance, current_balance, is_active, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            generateUUID(),
            formData.name,
            formData.bank_name,
            formData.account_number,
            formData.account_type,
            balance,
            balance,
            1, // is_active
            formData.notes,
            now,
            now,
          ]
        );
      }
      navigation.goBack();
    } catch (error) {
      console.error("Error saving bank account:", error);
      Alert.alert("Error", "Failed to save bank account");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete this bank account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
             // In a real app we might soft delete or check for transactions first
            try {
              await db.execute("DELETE FROM bank_accounts WHERE id = ?", [id]);
              navigation.goBack();
            } catch (error) {
              console.error("Error deleting account:", error);
              Alert.alert("Error", "Failed to delete account");
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? "Edit Bank Account" : "New Bank Account"}
        </Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.label}>Account Name</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(t) => setFormData({ ...formData, name: t })}
            placeholder="e.g. Main Business Account"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Bank Name</Text>
          <TextInput
            style={styles.input}
            value={formData.bank_name}
            onChangeText={(t) => setFormData({ ...formData, bank_name: t })}
            placeholder="e.g. Chase, Wells Fargo"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Account Number</Text>
          <TextInput
            style={styles.input}
            value={formData.account_number}
            onChangeText={(t) => setFormData({ ...formData, account_number: t })}
            placeholder="Account Number"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Opening Balance</Text>
          <TextInput
            style={styles.input}
            value={formData.opening_balance}
            onChangeText={(t) => setFormData({ ...formData, opening_balance: t })}
            placeholder="0.00"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Account Type</Text>
          <View style={styles.typeContainer}>
            {["savings", "checking", "credit", "other"].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  formData.account_type === type && styles.typeButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, account_type: type })}
              >
                <Text
                  style={[
                    styles.typeText,
                    formData.account_type === type && styles.typeTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(t) => setFormData({ ...formData, notes: t })}
            placeholder="Additional notes..."
            multiline
            numberOfLines={4}
          />
        </View>

        {isEditing && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete Bank Account</Text>
          </TouchableOpacity>
        )}
        
        <View style={{ height: 40 }} /> 
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#64748b",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  saveButton: {
    padding: 8,
    backgroundColor: "#6366f1",
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  form: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#475569",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#0f172a",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  typeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  typeButtonActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  typeText: {
    fontSize: 14,
    color: "#64748b",
  },
  typeTextActive: {
    color: "#fff",
    fontWeight: "500",
  },
  deleteButton: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "600",
  },
});
