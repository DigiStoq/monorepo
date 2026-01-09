import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Text,
  ActivityIndicator,
  TouchableOpacity
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { usePowerSync } from "@powersync/react-native";
import { generateUUID } from "../lib/utils";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardBody,
  Select,
} from "../components/ui";
import { Save, X, Trash2 } from "lucide-react-native";
import { wp, hp } from "../lib/responsive";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../lib/theme";

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
    current_balance: "", 
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
            balance, 
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

  const accountTypeOptions = [
    { label: "Savings", value: "savings" },
    { label: "Checking", value: "checking" },
    { label: "Credit", value: "credit" },
    { label: "Other", value: "other" },
  ];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.header}>
        <Button
          variant="ghost"
          size="icon"
          onPress={() => navigation.goBack()}
        >
          <X size={24} color={colors.text} />
        </Button>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{isEditing ? "Edit Bank Account" : "New Bank Account"}</Text>
        </View>
        <Button
          variant="ghost"
          size="icon"
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color={colors.primary} /> : <Save size={24} color={colors.primary} />}
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card>
            <CardHeader title="Account Details" />
            <CardBody>
                <Input
                    label="Account Name"
                    value={formData.name}
                    onChangeText={(t) => setFormData({ ...formData, name: t })}
                    placeholder="e.g. Main Business Account"
                />
                <Input
                    label="Bank Name"
                    value={formData.bank_name}
                    onChangeText={(t) => setFormData({ ...formData, bank_name: t })}
                    placeholder="e.g. Chase, Wells Fargo"
                />
                <Input
                    label="Account Number"
                    value={formData.account_number}
                    onChangeText={(t) => setFormData({ ...formData, account_number: t })}
                    placeholder="Account Number"
                    keyboardType="numeric"
                />
                 <Input
                    label="Opening Balance"
                    value={formData.opening_balance}
                    onChangeText={(t) => setFormData({ ...formData, opening_balance: t })}
                    placeholder="0.00"
                    keyboardType="numeric"
                />
                <Select
                    label="Account Type"
                    options={accountTypeOptions}
                    value={formData.account_type}
                    onChange={(val) => setFormData({...formData, account_type: val})}
                />
                 <Input
                    label="Notes"
                    value={formData.notes}
                    onChangeText={(t) => setFormData({ ...formData, notes: t })}
                    placeholder="Additional notes..."
                    multiline
                    numberOfLines={4}
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
                <Text style={{ color: colors.danger }}>Delete Bank Account</Text>
             </Button>
        )}
        
        <View style={{ height: 40 }} /> 
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  content: {
    padding: wp(4),
  },
});
