import { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Text,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardBody,
  Select,
} from "../components/ui";
import { SaveIcon, XCloseIcon, TrashIcon } from "../components/ui/UntitledIcons";
import { useTheme } from "../contexts/ThemeContext";
import { CustomHeader } from "../components/CustomHeader";
import { TouchableOpacity } from "react-native";
import { useBankAccountMutations, useBankAccountById } from "../hooks/useBankAccounts";

export function BankAccountFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as { id?: string } | undefined;
  const id = params?.id;
  const { colors } = useTheme();

  const { createAccount, updateAccount, deleteAccount } = useBankAccountMutations();
  const { account, isLoading: loadingData } = useBankAccountById(id || null);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bank_name: "",
    account_number: "",
    account_type: "savings", // default
    opening_balance: "",
    notes: "",
  });

  const isEditing = !!id;

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        bank_name: account.bankName,
        account_number: account.accountNumber,
        account_type: account.accountType,
        opening_balance: String(account.openingBalance || 0),
        notes: account.notes || "",
      });
    }
  }, [account]);

  async function handleSave() {
    if (!formData.name || !formData.bank_name) {
      Alert.alert("Error", "Please fill in Name and Bank Name");
      return;
    }

    try {
      setLoading(true);
      const balance = parseFloat(formData.opening_balance) || 0;

      if (isEditing && id) {
        await updateAccount(id, {
          name: formData.name,
          bankName: formData.bank_name,
          accountNumber: formData.account_number,
          accountType: formData.account_type,
          openingBalance: balance,
          notes: formData.notes
        });
      } else {
        await createAccount({
          name: formData.name,
          bankName: formData.bank_name,
          accountNumber: formData.account_number,
          accountType: formData.account_type,
          openingBalance: balance,
          notes: formData.notes
        });
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
    if (!id) return;
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
              await deleteAccount(id);
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
        title={isEditing ? "Edit Bank Account" : "New Bank Account"}
        showBack
        rightAction={
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            className="p-1.5"
          >
            {loading ? <ActivityIndicator size="small" color={colors.primary} /> : <SaveIcon size={24} color={colors.primary} />}
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card>
          <CardHeader title="Account Details" />
          <CardBody>
            <Input
              label="Account Name"
              value={formData.name}
              onChangeText={(t) => { setFormData({ ...formData, name: t }); }}
              placeholder="e.g. Main Business Account"
            />
            <Input
              label="Bank Name"
              value={formData.bank_name}
              onChangeText={(t) => { setFormData({ ...formData, bank_name: t }); }}
              placeholder="e.g. Chase, Wells Fargo"
            />
            <Input
              label="Account Number"
              value={formData.account_number}
              onChangeText={(t) => { setFormData({ ...formData, account_number: t }); }}
              placeholder="Account Number"
              keyboardType="numeric"
            />
            <Input
              label="Opening Balance"
              value={formData.opening_balance}
              onChangeText={(t) => { setFormData({ ...formData, opening_balance: t }); }}
              placeholder="0.00"
              keyboardType="numeric"
            />
            <Select
              label="Account Type"
              options={accountTypeOptions}
              value={formData.account_type}
              onChange={(val) => { setFormData({ ...formData, account_type: val }); }}
            />
            <Input
              label="Notes"
              value={formData.notes}
              onChangeText={(t) => { setFormData({ ...formData, notes: t }); }}
              placeholder="Additional notes..."
              multiline
              numberOfLines={4}
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
              <Text className="font-semibold text-danger" style={{ color: colors.danger }}>Delete Bank Account</Text>
            </View>
          </Button>
        )}

        <View className="h-10" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
