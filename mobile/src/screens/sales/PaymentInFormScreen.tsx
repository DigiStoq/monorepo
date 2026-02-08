import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Text,
  ActivityIndicator
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getPowerSyncDatabase } from "../../lib/powersync";
import { useQuery } from "@powersync/react-native";
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
import { CustomHeader } from "../../components/CustomHeader";
import { TouchableOpacity } from "react-native";

interface CustomerData {
  id: string;
  name: string;
}

export function PaymentInFormScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const route = useRoute();
  const { id } = (route.params as { id?: string }) || {};
  const isEditing = !!id;

  const db = getPowerSyncDatabase();

  // Data Fetching
  const { data: customers } = useQuery<CustomerData>(
    "SELECT id, name FROM customers ORDER BY name ASC"
  );

  // Form State
  const [customerId, setCustomerId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Initial Load
  useEffect(() => {
    if (id) {
      db.execute("SELECT * FROM payment_ins WHERE id = ?", [id]).then((res) => {
        if (res.rows?.length > 0) {
          const data = res.rows.item(0);
          setCustomerId(data.customer_id);
          setDate(data.date);
          setAmount(String(data.amount || ""));
          setPaymentMode(data.payment_mode || "cash");
          setReference(data.reference_number || "");
          setNotes(data.notes || "");
        }
      });
    }
  }, [id]);

  const customerOptions = useMemo(
    () => customers.map((c) => ({ label: c.name, value: c.id })),
    [customers]
  );

  const modeOptions = [
    { label: "Cash", value: "cash" },
    { label: "Bank Transfer", value: "bank" },
    { label: "Cheque", value: "cheque" },
    { label: "UPI / Card", value: "online" },
    { label: "Other", value: "other" },
  ];

  const handleSubmit = async () => {
    if (!customerId || !amount) {
      Alert.alert("Error", "Customer and Amount are required");
      return;
    }

    setIsLoading(true);
    try {
      const paymentId = id || generateUUID();
      const numAmount = parseFloat(amount) || 0;
      // Find customer name for denormalization (optional but good for lists)
      const customerName =
        customers.find((c) => c.id === customerId)?.name || "";

      if (isEditing) {
        await db.execute(
          `
                    UPDATE payment_ins SET 
                    customer_id=?, customer_name=?, date=?, amount=?, 
                    payment_mode=?, reference_number=?, notes=?, updated_at=?
                    WHERE id=?
                `,
          [
            customerId,
            customerName,
            date,
            numAmount,
            paymentMode,
            reference,
            notes,
            new Date().toISOString(),
            paymentId,
          ]
        );
      } else {
        await db.execute(
          `
                    INSERT INTO payment_ins (
                        id, customer_id, customer_name, date, amount, 
                        payment_mode, reference_number, notes, created_at, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
          [
            paymentId,
            customerId,
            customerName,
            date,
            numAmount,
            paymentMode,
            reference,
            notes,
            new Date().toISOString(),
            new Date().toISOString(),
          ]
        );
      }

      Alert.alert("Success", "Payment saved successfully");
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save payment");
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
        title={isEditing ? "Edit Payment" : "Record Payment"}
        showBack
        rightAction={
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className="p-2"
          >
            {isLoading ? <ActivityIndicator size="small" color={colors.primary} /> : <SaveIcon size={24} color={colors.primary} />}
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card>
          <CardHeader title="Payment Details" />
          <CardBody>
            <Select
              label="Customer"
              options={customerOptions}
              value={customerId}
              onChange={setCustomerId}
              placeholder="Select Customer"
            />
            <Input
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
            />
            <View className="flex-row gap-2">
              <Input
                label="Date"
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                containerStyle={{ flex: 1 }}
              />
              <Select
                label="Mode"
                options={modeOptions}
                value={paymentMode}
                onChange={setPaymentMode}
                containerStyle={{ flex: 1 }}
              />
            </View>
            <Input
              label="Reference / Cheque No."
              value={reference}
              onChangeText={setReference}
              placeholder="Optional"
            />
            <Input
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholder="Internal notes..."
            />
          </CardBody>
        </Card>

        <Button
          fullWidth
          onPress={handleSubmit}
          isLoading={isLoading}
          className="mt-6"
        >
          Save Payment
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
