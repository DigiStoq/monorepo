import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../contexts/ThemeContext";
import { useLoanPaymentMutations } from "../hooks/useLoanPayments";
import { CustomHeader } from "../components/CustomHeader";
import { Input, DateInput, Card, CardHeader, CardBody } from "../components/ui";
import { SaveIcon } from "../components/ui/UntitledIcons";

export function LoanPaymentFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as {
    loanId: string;
    loanName: string;
    outstandingAmount: number;
    emiAmount?: number;
  };
  const { colors } = useTheme();
  const { createPayment } = useLoanPaymentMutations();

  const suggestedEmi = params.emiAmount || 0;

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [principalAmount, setPrincipalAmount] = useState(
    suggestedEmi ? String(Math.round(suggestedEmi * 0.7)) : ""
  );
  const [interestAmount, setInterestAmount] = useState(
    suggestedEmi ? String(Math.round(suggestedEmi * 0.3)) : ""
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "bank" | "cheque"
  >("bank");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const totalAmount =
    (parseFloat(principalAmount) || 0) + (parseFloat(interestAmount) || 0);

  async function handleSave() {
    if (!principalAmount || parseFloat(principalAmount) <= 0) {
      Alert.alert("Error", "Principal amount is required");
      return;
    }

    if (totalAmount <= 0) {
      Alert.alert("Error", "Total payment must be greater than zero");
      return;
    }

    try {
      setLoading(true);
      await createPayment({
        loanId: params.loanId,
        date,
        principalAmount: parseFloat(principalAmount),
        interestAmount: parseFloat(interestAmount) || 0,
        totalAmount,
        paymentMethod,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
      });
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to record payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <CustomHeader
        title="Record Payment"
        showBack
        rightAction={
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            className="p-1.5"
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <SaveIcon color={colors.primary} size={24} />
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Loan Summary */}
        <View
          className="rounded-lg p-4 mb-4"
          style={{ backgroundColor: colors.primary + "15" }}
        >
          <Text
            className="text-sm font-medium mb-1"
            style={{ color: colors.primary }}
          >
            Loan: {params.loanName}
          </Text>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>
            Outstanding: ${params.outstandingAmount.toFixed(2)}
          </Text>
          {suggestedEmi > 0 && (
            <Text
              className="text-sm mt-1"
              style={{ color: colors.textSecondary }}
            >
              EMI Amount: ${suggestedEmi.toFixed(2)}
            </Text>
          )}
        </View>

        <Card>
          <CardHeader title="Payment Details" />
          <CardBody>
            <DateInput
              label="Payment Date"
              value={date}
              onChange={setDate}
            />

            <View className="flex-row gap-2">
              <Input
                label="Principal Amount"
                value={principalAmount}
                onChangeText={setPrincipalAmount}
                keyboardType="numeric"
                placeholder="0.00"
                containerStyle={{ flex: 1 }}
              />
              <Input
                label="Interest Amount"
                value={interestAmount}
                onChangeText={setInterestAmount}
                keyboardType="numeric"
                placeholder="0.00"
                containerStyle={{ flex: 1 }}
              />
            </View>

            {/* Total display */}
            <View
              className="rounded-lg p-3 mb-4"
              style={{ backgroundColor: colors.surface }}
            >
              <Text
                className="text-sm"
                style={{ color: colors.textSecondary }}
              >
                Total Payment
              </Text>
              <Text
                className="text-xl font-bold"
                style={{ color: colors.text }}
              >
                ${totalAmount.toFixed(2)}
              </Text>
            </View>

            {/* Payment Method */}
            <View className="mb-4">
              <Text
                className="text-sm font-medium mb-2"
                style={{ color: colors.textSecondary }}
              >
                Payment Method
              </Text>
              <View className="flex-row gap-2">
                {(["bank", "cash", "cheque"] as const).map((method) => (
                  <TouchableOpacity
                    key={method}
                    className="flex-1 py-2.5 items-center border rounded-lg"
                    style={{
                      backgroundColor:
                        paymentMethod === method
                          ? colors.primary
                          : colors.surface,
                      borderColor:
                        paymentMethod === method
                          ? colors.primary
                          : colors.border,
                    }}
                    onPress={() => {
                      setPaymentMethod(method);
                    }}
                  >
                    <Text
                      className="text-sm font-medium capitalize"
                      style={{
                        color:
                          paymentMethod === method
                            ? "#ffffff"
                            : colors.textSecondary,
                      }}
                    >
                      {method === "bank" ? "Bank Transfer" : method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Input
              label="Reference Number"
              value={referenceNumber}
              onChangeText={setReferenceNumber}
              placeholder="Transaction ID, cheque no., etc."
            />

            <Input
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
              placeholder="Optional notes"
            />
          </CardBody>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
