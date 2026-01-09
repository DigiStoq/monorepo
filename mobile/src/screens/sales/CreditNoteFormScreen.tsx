import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
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
import { Plus, Trash2, Save, X } from "lucide-react-native";
import { wp, hp } from "../../lib/responsive";
import { generateUUID } from "../../lib/utils";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../../lib/theme";

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
  const [invoiceId, setInvoiceId] = useState(""); // Not hooked up to invoice selection yet for MVP
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
            {isEditing ? "Edit Credit Note" : "New Credit Note"}
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
          <CardHeader title="Details" />
          <CardBody>
            <Select
              label="Customer"
              options={customerOptions}
              value={customerId}
              onChange={setCustomerId}
            />
            <View style={styles.row}>
              <Input
                label="CN #"
                value={noteNumber}
                onChangeText={setNoteNumber}
                placeholder="CN-001"
                containerStyle={{ flex: 1, marginRight: 8 }}
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
            />
          </CardBody>
        </Card>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Items</Text>
          <Button
            size="sm"
            variant="outline"
            onPress={() => {
              openItemModal();
            }}
            leftIcon={<Plus size={16} color={colors.text} />}
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
            <Card style={styles.itemCard}>
              <CardBody>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemNumber}>
                    #{index + 1} - {item.itemName}
                  </Text>
                  <Text style={styles.itemSummary}>
                    ${item.amount.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.itemMeta}>
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
            />
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Refund</Text>
              <Text style={styles.totalValue}>${totals.total.toFixed(2)}</Text>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItemId ? "Edit Item" : "Add Item"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                }}
              >
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <Select
                label="Item"
                options={itemOptions}
                value={tempItem.itemId}
                onChange={handleItemSelect}
              />
              <View style={styles.row}>
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
                  containerStyle={{ flex: 1, marginRight: 8 }}
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
              <Button fullWidth onPress={saveItem} style={{ marginTop: 16 }}>
                Save Item
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  titleContainer: { flex: 1, alignItems: "center" },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text },
  content: { padding: wp(4), paddingBottom: hp(5) },
  row: { flexDirection: "row", marginBottom: 8 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  itemCard: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  itemNumber: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  itemSummary: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  itemMeta: { fontSize: 13, color: colors.textSecondary },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  totalValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.primary },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text },
  modalBody: { padding: 16, paddingBottom: 40 },
});
