import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Text,
  ActivityIndicator,
  TouchableOpacity
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getPowerSyncDatabase } from "../../lib/powersync";
import { useQuery } from "@powersync/react-native";
import {
  Button,
  Input,
  DateInput,
  Card,
  CardHeader,
  CardBody,
  Select,
} from "../../components/ui";
import { SaveIcon, XCloseIcon } from "../../components/ui/UntitledIcons";
import { generateUUID } from "../../lib/utils";
import { useTheme } from "../../contexts/ThemeContext";
import { CustomHeader } from "../../components/CustomHeader";
import { usePaymentOutMutations } from "../../hooks/usePaymentOuts";
import { usePurchaseInvoices } from "../../hooks/usePurchaseInvoices";
import { useSequenceMutations } from "../../hooks/useSequence";

interface CustomerData {
  id: string;
  name: string;
}

export function PaymentOutFormScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const route = useRoute();
  const { id } = (route.params as { id?: string }) || {};
  const isEditing = !!id;

  const db = getPowerSyncDatabase();
  const { createPayment, deletePayment } = usePaymentOutMutations();
  const { getNextNumber } = useSequenceMutations();

  // Data Fetching
  const { data: customers } = useQuery<CustomerData>(
    "SELECT id, name FROM customers WHERE type IN ('supplier', 'both') AND is_active = 1 ORDER BY name ASC"
  );

  // Form State
  const [paymentNumber, setPaymentNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Unpaid Purchase Invoices (Bills)
  const { data: unpaidInvoices } = useQuery(
    supplierId
      ? `SELECT id, supplier_invoice_number, total, amount_due FROM purchase_invoices 
         WHERE customer_id = ? AND status != 'paid' 
         ORDER BY date DESC`
      : "SELECT 1 WHERE 0",
    [supplierId]
  );

  // Auto-fill payment number on create
  useEffect(() => {
    if (!isEditing) {
      getNextNumber("payment_out").then(setPaymentNumber).catch(console.error);
    }
  }, [isEditing]);

  // Initial Load
  useEffect(() => {
    if (id) {
      db.execute("SELECT * FROM payment_outs WHERE id = ?", [id]).then((res) => {
        if (res.rows?.length > 0) {
          const data = res.rows.item(0);
          setPaymentNumber(data.payment_number || "");
          setSupplierId(data.customer_id);
          setDate(data.date);
          setAmount(String(data.amount || ""));
          setPaymentMode(data.payment_mode || "cash");
          setReference(data.reference_number || "");
          setNotes(data.notes || "");
          setInvoiceId(data.invoice_id || "");
        }
      });
    }
  }, [id]);

  const supplierOptions = useMemo(
    () => customers.map((c) => ({ label: c.name, value: c.id })),
    [customers]
  );

  const invoiceOptions = useMemo(() => {
    const options = (unpaidInvoices || []).map((inv: any) => ({
      label: `#${inv.supplier_invoice_number || 'Bill'} (Due: $${inv.amount_due.toFixed(2)})`,
      value: inv.id,
    }));
    return [{ label: "None (On Account)", value: "" }, ...options];
  }, [unpaidInvoices]);

  const modeOptions = [
    { label: "Cash", value: "cash" },
    { label: "Bank Transfer", value: "bank" },
    { label: "Cheque", value: "cheque" },
    { label: "UPI / Card", value: "online" },
    { label: "Other", value: "other" },
  ];

  const handleDelete = () => {
    Alert.alert(
      "Delete Payment",
      "Are you sure you want to delete this payment? This will reverse the balance update.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              await deletePayment(id!);
              Alert.alert("Success", "Payment deleted");
              navigation.goBack();
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to delete");
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSubmit = async () => {
    if (!supplierId) {
      Alert.alert("Missing Supplier", "Please select a supplier.");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount greater than zero.");
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing) {
        // Update (Inline SQL - Metadata only for now)
        await db.execute(
          `UPDATE payment_outs SET 
             customer_id=?, customer_name=?, date=?, amount=?, 
             payment_mode=?, reference_number=?, notes=?, invoice_id=?, updated_at=?
             WHERE id=?`,
          [
            supplierId,
            customers.find((c) => c.id === supplierId)?.name || "",
            date,
            parseFloat(amount) || 0,
            paymentMode,
            reference,
            notes,
            invoiceId || null,
            new Date().toISOString(),
            id,
          ]
        );
      } else {
        // Create (Use Hook)
        await createPayment({
          paymentNumber: paymentNumber || reference || generateUUID().slice(0, 8),
          supplierId,
          supplierName: customers.find((c) => c.id === supplierId)?.name || "",
          date,
          amount: parseFloat(amount) || 0,
          paymentMode,
          referenceNumber: reference,
          invoiceId: invoiceId || undefined,
          invoiceNumber: unpaidInvoices?.find((i: any) => i.id === invoiceId)?.supplier_invoice_number,
          notes
        });
      }

      Alert.alert("Success", "Payment recorded successfully");
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
        title={isEditing ? "Edit Payment Out" : "Record Payment Out"}
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
            <Input
              label="Payment #"
              value={paymentNumber}
              onChangeText={setPaymentNumber}
              placeholder="PAY-0001"
            />
            <Select
              label="Supplier"
              options={supplierOptions}
              value={supplierId}
              onChange={(val) => {
                setSupplierId(val);
                setInvoiceId("");
              }}
              placeholder="Select Supplier"
            />

            <Select
              label="Link to Bill (Optional)"
              options={invoiceOptions}
              value={invoiceId}
              onChange={setInvoiceId}
              placeholder="Select Bill"
              containerStyle={{ marginTop: 8 }}
            />

            <Input
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
            />
            <View className="flex-row gap-2">
              <DateInput
                label="Date"
                value={date}
                onChange={setDate}
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

        {isEditing && (
          <Button
            fullWidth
            variant="danger"
            onPress={handleDelete}
            isLoading={isLoading}
            className="mt-4 bg-red-500"
          >
            Delete Payment
          </Button>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
