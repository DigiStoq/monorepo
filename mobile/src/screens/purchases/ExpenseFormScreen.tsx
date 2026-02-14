import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { CustomHeader } from "../../components/CustomHeader";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getPowerSyncDatabase } from "../../lib/powersync";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardBody,
  Select,
} from "../../components/ui";
import { SaveIcon, XCloseIcon } from "../../components/ui/UntitledIcons";
import { generateUUID } from "../../lib/utils";
import { useTheme } from "../../contexts/ThemeContext";

export function ExpenseFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = (route.params as { id?: string }) || {};
  const isEditing = !!id;
  const { colors } = useTheme();

  const db = getPowerSyncDatabase();

  // Form State
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paidTo, setPaidTo] = useState(""); // paid_to_name
  const [paidToDetails, setPaidToDetails] = useState(""); // paid_to_details
  const [description, setDescription] = useState(""); // description
  const [paymentMode, setPaymentMode] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Initial Load
  useEffect(() => {
    if (id) {
      db.execute("SELECT * FROM expenses WHERE id = ?", [id]).then((res) => {
        if (res.rows?.length > 0) {
          const data = res.rows.item(0);
          setCategory(data.category);
          setDate(data.date);
          setAmount(String(data.amount || ""));
          setPaidTo(data.paid_to_name || "");
          setPaidToDetails(data.paid_to_details || "");
          setDescription(data.description || "");
          setPaymentMode(data.payment_mode || "cash");
          setReference(data.reference_number || "");
          setNotes(data.notes || "");
        }
      });
    }
  }, [id]);

  const categoryOptions = [
    { label: "Rent", value: "rent" },
    { label: "Utilities", value: "utilities" },
    { label: "Salaries", value: "salaries" },
    { label: "Office Supplies", value: "office" },
    { label: "Travel", value: "travel" },
    { label: "Marketing", value: "marketing" },
    { label: "Maintenance", value: "maintenance" },
    { label: "Insurance", value: "insurance" },
    { label: "Taxes", value: "taxes" },
    { label: "Other", value: "other" },
  ];

  const modeOptions = [
    { label: "Cash", value: "cash" },
    { label: "Bank Transfer", value: "bank" },
    { label: "Card", value: "card" },
    { label: "ACH Transfer", value: "ach" },
    { label: "Cheque", value: "cheque" },
    { label: "Other", value: "other" },
  ];

  const handleSubmit = async () => {
    if (!category || !amount) {
      Alert.alert("Error", "Category and Amount are required");
      return;
    }

    setIsLoading(true);
    try {
      const expenseId = id || generateUUID();
      const numAmount = parseFloat(amount) || 0;

      if (isEditing) {
        await db.execute(
          `
                    UPDATE expenses SET 
                    category=?, date=?, amount=?, paid_to_name=?, paid_to_details=?, 
                    description=?, payment_mode=?, reference_number=?, notes=?, updated_at=?
                    WHERE id=?
                `,
          [
            category,
            date,
            numAmount,
            paidTo,
            paidToDetails,
            description,
            paymentMode,
            reference,
            notes,
            new Date().toISOString(),
            expenseId,
          ]
        );
      } else {
        await db.execute(
          `
                    INSERT INTO expenses (
                        id, category, date, amount, paid_to_name, paid_to_details, 
                        description, payment_mode, reference_number, notes, created_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
          [
            expenseId,
            category,
            date,
            numAmount,
            paidTo,
            paidToDetails,
            description,
            paymentMode,
            reference,
            notes,
            new Date().toISOString(),
            new Date().toISOString(),
          ]
        );
      }

      Alert.alert("Success", "Expense saved");
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save expense");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <CustomHeader
        title={isEditing ? "Edit Expense" : "New Expense"}
        showBack
        rightAction={
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className="p-1.5"
          >
            {isLoading ? <ActivityIndicator size="small" color={colors.primary} /> : <SaveIcon size={24} color={colors.primary} />}
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Card>
          <CardHeader title="Expense Details" />
          <CardBody>
            <Select
              label="Category"
              options={categoryOptions}
              value={category}
              onChange={setCategory}
              placeholder="Select Category"
            />
            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="What was this expense for?"
            />
            <Input
              label="Date"
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />
            <Input
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Payment Details" />
          <CardBody>
            <Select
              label="Payment Mode"
              options={modeOptions}
              value={paymentMode}
              onChange={setPaymentMode}
            />
            <Input
              label="Paid To Name"
              value={paidTo}
              onChangeText={setPaidTo}
              placeholder="Person or company name"
            />
            <Input
              label="Paid To Details"
              value={paidToDetails}
              onChangeText={setPaidToDetails}
              placeholder="Contact, address, etc."
            />
            <Input
              label="Reference No."
              value={reference}
              onChangeText={setReference}
              placeholder="Receipt ID, Cheque No."
            />
            <Input
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholder="Additional notes..."
            />
          </CardBody>
        </Card>

        <Button
          fullWidth
          onPress={handleSubmit}
          isLoading={isLoading}
          className="mt-6"
        >
          Save Expense
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
