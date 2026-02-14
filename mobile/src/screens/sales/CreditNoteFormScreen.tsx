import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery } from "@powersync/react-native";
import { getPowerSyncDatabase } from "../../lib/powersync";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardBody,
  Select,
} from "../../components/ui";
import { PlusIcon, TrashIcon, SaveIcon, XCloseIcon } from "../../components/ui/UntitledIcons";
import { generateUUID } from "../../lib/utils";
import { useTheme } from "../../contexts/ThemeContext";
import { CustomHeader } from "../../components/CustomHeader";

interface CustomerData {
  id: string;
  name: string;
}
interface ItemData {
  id: string;
  name: string;
  sale_price: number;
  unit: string;
  tax_rate: number;
}
interface LineItem {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxPercent: number;
  amount: number;
}

export function CreditNoteFormScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const route = useRoute();
  const { id } = (route.params as { id?: string }) || {};
  const isEditing = !!id;
  const db = getPowerSyncDatabase();

  const { data: customers } = useQuery<CustomerData>(
    "SELECT * FROM customers ORDER BY name ASC"
  );
  const { data: items } = useQuery<ItemData>(
    "SELECT * FROM items ORDER BY name ASC"
  );

  const [customerId, setCustomerId] = useState("");
  const [noteNumber, setNoteNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("return");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [tempItem, setTempItem] = useState<LineItem>({
    id: "",
    itemId: "",
    itemName: "",
    quantity: 1,
    unit: "pcs",
    unitPrice: 0,
    taxPercent: 0,
    amount: 0,
  });

  useEffect(() => {
    if (id) {
      db.execute("SELECT * FROM credit_notes WHERE id = ?", [id]).then(
        (res) => {
          if (res.rows?.length > 0) {
            const data = res.rows.item(0);
            setCustomerId(data.customer_id);
            setNoteNumber(data.credit_note_number || "");
            setDate(data.date);
            setReason(data.reason || "return");
            setNotes(data.notes || "");
          }
        }
      );
    }
  }, [id]);

  const customerOptions = useMemo(
    () => customers.map((c) => ({ label: c.name, value: c.id })),
    [customers]
  );
  const itemOptions = useMemo(
    () =>
      items.map((i) => ({
        label: `${i.name} ($${i.sale_price})`,
        value: i.id,
      })),
    [items]
  );
  const reasonOptions = [
    { label: "Return", value: "return" },
    { label: "Discount", value: "discount" },
    { label: "Error Correction", value: "error" },
    { label: "Other", value: "other" },
  ];

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const totalTax = lineItems.reduce(
      (sum, item) =>
        sum + item.quantity * item.unitPrice * (item.taxPercent / 100),
      0
    );
    return { subtotal, tax: totalTax, total: subtotal + totalTax };
  }, [lineItems]);

  const openItemModal = (item?: LineItem) => {
    if (item) {
      setEditingItemId(item.id);
      setTempItem({ ...item });
    } else {
      setEditingItemId(null);
      setTempItem({
        id: generateUUID(),
        itemId: "",
        itemName: "",
        quantity: 1,
        unit: "pcs",
        unitPrice: 0,
        taxPercent: 0,
        amount: 0,
      });
    }
    setModalVisible(true);
  };

  const saveItem = () => {
    const total =
      tempItem.quantity * tempItem.unitPrice * (1 + tempItem.taxPercent / 100);
    const FinalItem = { ...tempItem, amount: total };
    if (editingItemId)
      setLineItems((prev) =>
        prev.map((i) => (i.id === editingItemId ? FinalItem : i))
      );
    else setLineItems((prev) => [...prev, FinalItem]);
    setModalVisible(false);
  };

  const handleItemSelect = (val: string) => {
    const selected = items.find((i) => i.id === val);
    if (selected)
      setTempItem((prev) => ({
        ...prev,
        itemId: val,
        itemName: selected.name,
        unitPrice: selected.sale_price || 0,
        unit: selected.unit || "pcs",
        taxPercent: selected.tax_rate || 0,
      }));
  };

  const handleSubmit = async () => {
    if (!customerId || lineItems.length === 0) {
      Alert.alert("Error", "Please select customer and items");
      return;
    }
    setIsLoading(true);
    try {
      const noteId = id || generateUUID();
      const customer = customers.find((c) => c.id === customerId);
      await db.writeTransaction(async (tx) => {
        await tx.execute(
          `
                    INSERT OR REPLACE INTO credit_notes 
                    (id, customer_id, customer_name, credit_note_number, date, reason, subtotal, tax_amount, total, notes, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
          [
            noteId,
            customerId,
            customer?.name || "",
            noteNumber,
            date,
            reason,
            totals.subtotal,
            totals.tax,
            totals.total,
            notes,
            new Date().toISOString(),
            new Date().toISOString(),
          ]
        );
      });
      Alert.alert("Success", "Credit Note saved");
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save");
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
        title={isEditing ? "Edit Credit Note" : "New Credit Note"}
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
          <CardHeader title="Details" />
          <CardBody>
            <Select
              label="Customer"
              options={customerOptions}
              value={customerId}
              onChange={setCustomerId}
              placeholder="Select Customer"
            />
            <View className="flex-row gap-2">
              <Input
                label="CN #"
                value={noteNumber}
                onChangeText={setNoteNumber}
                placeholder="CN-001"
                containerStyle={{ flex: 1 }}
              />
              <Input
                label="Date"
                value={date}
                onChangeText={setDate}
                containerStyle={{ flex: 1 }}
              />
            </View>
            <Select
              label="Reason"
              options={reasonOptions}
              value={reason}
              onChange={setReason}
              placeholder="Select Reason"
            />
          </CardBody>
        </Card>
        <View className="flex-row justify-between items-center mb-3 mt-2">
          <Text className="text-md font-semibold text-text">Items</Text>
          <Button
            size="sm"
            variant="outline"
            onPress={() => {
              openItemModal();
            }}
            leftIcon={<PlusIcon size={16} color={colors.text} />}
          >
            Add Item
          </Button>
        </View>
        {lineItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => {
              openItemModal(item);
            }}
          >
            <Card style={{ marginBottom: 8 }}>
              <CardBody>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm font-semibold text-text">
                    #{index + 1} - {item.itemName}
                  </Text>
                  <Text className="text-sm font-semibold text-text">
                    ${item.amount.toFixed(2)}
                  </Text>
                </View>
                <Text className="text-xs text-text-muted">
                  {item.quantity} {item.unit} x ${item.unitPrice}
                </Text>
              </CardBody>
            </Card>
          </TouchableOpacity>
        ))}
        <Card>
          <CardBody>
            <Input
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
              placeholder="Notes..."
            />
            <View className="flex-row justify-between pt-2 border-t border-border mt-2">
              <Text className="text-lg font-bold text-text">Total Refund</Text>
              <Text className="text-lg font-bold text-primary">${totals.total.toFixed(2)}</Text>
            </View>
          </CardBody>
        </Card>
      </ScrollView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-xl h-[80%] w-full">
            <View className="flex-row justify-between items-center p-4 border-b border-border bg-surface rounded-t-xl">
              <Text className="text-lg font-bold text-text">
                {editingItemId ? "Edit Item" : "Add Item"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                }}
              >
                <XCloseIcon size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Select
                label="Item"
                options={itemOptions}
                value={tempItem.itemId}
                onChange={handleItemSelect}
                placeholder="Choose Item"
              />
              <View className="flex-row gap-2">
                <Input
                  label="Quantity"
                  value={String(tempItem.quantity)}
                  onChangeText={(v) => {
                    setTempItem((p) => ({
                      ...p,
                      quantity: parseFloat(v) || 0,
                    }));
                  }}
                  keyboardType="numeric"
                  containerStyle={{ flex: 1 }}
                />
                <Input
                  label="Rate"
                  value={String(tempItem.unitPrice)}
                  onChangeText={(v) => {
                    setTempItem((p) => ({
                      ...p,
                      unitPrice: parseFloat(v) || 0,
                    }));
                  }}
                  keyboardType="numeric"
                  containerStyle={{ flex: 1 }}
                />
              </View>
              <Button fullWidth onPress={saveItem} className="mt-4">
                Save Item
              </Button>
              <View className="h-10" />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
