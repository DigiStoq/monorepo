import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getPowerSyncDatabase } from "../lib/powersync";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardBody,
  Select,
} from "../components/ui";
import { Save, X } from "lucide-react-native";
import { wp, hp } from "../lib/responsive";

export function CustomerFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = (route.params as { id?: string }) || {};
  const isEditing = !!id;

  const db = getPowerSyncDatabase();

  const [name, setName] = useState("");
  const [type, setType] = useState("customer");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [taxId, setTaxId] = useState("");
  const [address, setAddress] = useState(""); // Treating as Street Address
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [creditDays, setCreditDays] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      db.execute("SELECT * FROM customers WHERE id = ?", [id])
        .then((result) => {
          if (result.rows?.length > 0) {
            const data = result.rows.item(0);
            setName(data.name);
            setType(data.type);
            setPhone(data.phone || "");
            setEmail(data.email || "");
            setTaxId(data.tax_id || "");
            setAddress(data.address || "");
            setCity(data.city || "");
            setState(data.state || "");
            setZipCode(data.zip_code || "");
            setOpeningBalance(
              data.opening_balance ? String(data.opening_balance) : ""
            );
            setCreditLimit(data.credit_limit ? String(data.credit_limit) : "");
            setCreditDays(data.credit_days ? String(data.credit_days) : "");
            setNotes(data.notes || "");
          }
        })
        .catch(console.error);
    }
  }, [id]);

  const handleSubmit = async () => {
    if (!name) {
      Alert.alert("Error", "Name is required");
      return;
    }

    setIsLoading(true);
    try {
      const customerId = id || crypto.randomUUID();
      const now = new Date().toISOString();

      // Stats
      const opBal = parseFloat(openingBalance) || 0;
      const cLimit = parseFloat(creditLimit) || 0;
      const cDays = parseInt(creditDays) || 0;

      if (isEditing) {
        await db.execute(
          `
                    UPDATE customers 
                    SET name = ?, type = ?, phone = ?, email = ?, tax_id = ?, 
                        address = ?, city = ?, state = ?, zip_code = ?,
                        opening_balance = ?, credit_limit = ?, credit_days = ?, notes = ?,
                        updated_at = ?
                    WHERE id = ?
                `,
          [
            name,
            type,
            phone,
            email,
            taxId,
            address,
            city,
            state,
            zipCode,
            opBal,
            cLimit,
            cDays,
            notes,
            now,
            customerId,
          ]
        );
      } else {
        await db.execute(
          `
                    INSERT INTO customers (
                        id, name, type, phone, email, tax_id, 
                        address, city, state, zip_code,
                        opening_balance, credit_limit, credit_days, notes,
                        created_at, updated_at, is_active
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                `,
          [
            customerId,
            name,
            type,
            phone,
            email,
            taxId,
            address,
            city,
            state,
            zipCode,
            opBal,
            cLimit,
            cDays,
            notes,
            now,
            now,
          ]
        );
      }

      Alert.alert("Success", "Customer saved");
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save customer");
    } finally {
      setIsLoading(false);
    }
  };

  const typeOptions = [
    { label: "Customer", value: "customer" },
    { label: "Supplier", value: "supplier" },
    { label: "Both", value: "both" },
  ];

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
          <X size={24} color="#0f172a" />
        </Button>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {isEditing ? "Edit Contact" : "New Contact"}
          </Text>
        </View>
        <Button
          variant="ghost"
          size="icon"
          onPress={handleSubmit}
          isLoading={isLoading}
        >
          <Save size={24} color="#6366f1" />
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <CardHeader title="Basic Details" />
          <CardBody>
            <Input
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Full Name / Company Name"
            />
            <Select
              label="Type"
              options={typeOptions}
              value={type}
              onChange={setType}
            />
            <Input
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 234 567 8900"
              keyboardType="phone-pad"
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Tax ID / EIN"
              value={taxId}
              onChangeText={setTaxId}
              placeholder="Optional"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Address" />
          <CardBody>
            <Input
              label="Street Address"
              value={address}
              onChangeText={setAddress}
              multiline
            />
            <View style={styles.row}>
              <Input
                label="City"
                value={city}
                onChangeText={setCity}
                containerStyle={{ flex: 1, marginRight: 8 }}
              />
              <Input
                label="State"
                value={state}
                onChangeText={setState}
                containerStyle={{ flex: 1 }}
              />
            </View>
            <Input
              label="Zip Code"
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="numeric"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Financial Settings" />
          <CardBody>
            {!isEditing && (
              <Input
                label="Opening Balance"
                value={openingBalance}
                onChangeText={setOpeningBalance}
                keyboardType="numeric"
                placeholder="0.00"
                helperText="Positive = To Receive, Negative = To Pay"
              />
            )}
            <View style={styles.row}>
              <Input
                label="Credit Limit"
                value={creditLimit}
                onChangeText={setCreditLimit}
                keyboardType="numeric"
                containerStyle={{ flex: 1, marginRight: 8 }}
              />
              <Input
                label="Credit Days"
                value={creditDays}
                onChangeText={setCreditDays}
                keyboardType="numeric"
                containerStyle={{ flex: 1 }}
              />
            </View>
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
          Save Contact
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginTop: Platform.OS === "android" ? 24 : 0,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  content: {
    padding: wp(4),
    paddingBottom: hp(5),
  },
  row: {
    flexDirection: "row",
  },
  submitButton: {
    marginTop: 24,
  },
});
