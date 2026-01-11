import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
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
import { Save, X } from "lucide-react-native";
import { wp, hp } from "../../lib/responsive";
import { generateUUID } from "../../lib/utils";
import { spacing, borderRadius, fontSize, fontWeight, ThemeColors } from "../../lib/theme";
import { useTheme } from "../../contexts/ThemeContext";

interface CustomerData {
  id: string;
  name: string;
}

export function PaymentInFormScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      style={styles.container}
    >
      <View style={styles.header}>
        <Button
          variant="ghost"
          size="icon"
          onPress={() => {
            navigation.goBack();
          }}
        >
          <X size={24} color={colors.text} />
        </Button>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {isEditing ? "Edit Payment" : "Record Payment"}
          </Text>
        </View>
        <Button
          variant="ghost"
          size="icon"
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color={colors.primary} /> : <Save size={24} color={colors.primary} />}
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
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
            <View style={styles.row}>
              <Input
                label="Date"
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                containerStyle={{ flex: 1, marginRight: 8 }}
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
          style={styles.submitButton}
        >
          Save Payment
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
    paddingBottom: hp(5),
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  submitButton: {
    marginTop: spacing.xl,
  },
});
