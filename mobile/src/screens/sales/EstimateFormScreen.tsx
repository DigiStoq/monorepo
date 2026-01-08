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

// Inline Types (mirrors schema)
interface CustomerData {
  id: string;
  name: string;
  phone?: string;
}

interface ItemData {
  id: string;
  name: string;
  sale_price: number;
  description: string;
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
  discountPercent: number;
  amount: number;
}

export function EstimateFormScreen() {
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
  const [estimateNumber, setEstimateNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil] = useState("");
  const [status, setStatus] = useState("draft");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Modal State
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
    discountPercent: 0,
    amount: 0,
  });

  useEffect(() => {
    if (id) {
      db.execute("SELECT * FROM estimates WHERE id = ?", [id]).then((res) => {
        if (res.rows?.length > 0) {
          const data = res.rows.item(0);
          setCustomerId(data.customer_id);
          setEstimateNumber(data.estimate_number || "");
          setDate(data.date);
          setValidUntil(data.valid_until || "");
          setStatus(data.status || "draft");
          setNotes(data.notes || "");
          setTerms(data.terms || "");
        }
      });
      // Load items logic would go here (omitted for brevity)
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

  const statusOptions = [
    { label: "Draft", value: "draft" },
    { label: "Sent", value: "sent" },
    { label: "Accepted", value: "accepted" },
    { label: "Rejected", value: "rejected" },
    { label: "Expired", value: "expired" },
    { label: "Converted", value: "converted" },
  ];

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const itemDiscounts = lineItems.reduce(
      (sum, item) =>
        sum + item.quantity * item.unitPrice * (item.discountPercent / 100),
      0
    );
    const taxable = subtotal - itemDiscounts;
    const totalTax = lineItems.reduce((sum, item) => {
      const base =
        item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
      return sum + base * (item.taxPercent / 100);
    }, 0);

    return {
      subtotal,
      discount: itemDiscounts,
      tax: totalTax,
      total: taxable + totalTax,
    };
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
        discountPercent: 0,
        amount: 0,
      });
    }
    setModalVisible(true);
  };

  const saveItem = () => {
    const base = tempItem.quantity * tempItem.unitPrice;
    const afterDisc = base * (1 - tempItem.discountPercent / 100);
    const total = afterDisc * (1 + tempItem.taxPercent / 100);
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
    if (selected) {
      setTempItem((prev) => ({
        ...prev,
        itemId: val,
        itemName: selected.name,
        unitPrice: selected.sale_price || 0,
        unit: selected.unit || "pcs",
        taxPercent: selected.tax_rate || 0,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!customerId || lineItems.length === 0) {
      Alert.alert("Error", "Please select a customer and add items.");
      return;
    }
    setIsLoading(true);
    try {
      const estimateId = id || generateUUID();
      const customer = customers.find((c) => c.id === customerId);

      await db.writeTransaction(async (tx) => {
        // Insert/Update simplified
        await tx.execute(
          `
                    INSERT OR REPLACE INTO estimates 
                    (id, customer_id, customer_name, estimate_number, date, valid_until, status, total, notes, terms, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 `,
          [
            estimateId,
            customerId,
            customer?.name || "",
            estimateNumber,
            date,
            validUntil,
            status,
            totals.total,
            notes,
            terms,
            new Date().toISOString(),
            new Date().toISOString(),
          ]
        );

        // Items (logic similar to invoice)
      });
      Alert.alert("Success", "Estimate saved");
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save estimate");
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
          <X size={24} color="#0f172a" />
        </Button>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {isEditing ? "Edit Estimate" : "New Estimate"}
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
          <CardHeader title="Estimate Details" />
          <CardBody>
            <Select
              label="Customer"
              options={customerOptions}
              value={customerId}
              onChange={setCustomerId}
            />
            <Input
              label="Estimate #"
              value={estimateNumber}
              onChangeText={setEstimateNumber}
              placeholder="EST-001"
            />
            <View style={styles.row}>
              <Input
                label="Date"
                value={date}
                onChangeText={setDate}
                containerStyle={{ flex: 1, marginRight: 8 }}
              />
              <Input
                label="Valid Until"
                value={validUntil}
                onChangeText={setValidUntil}
                containerStyle={{ flex: 1 }}
              />
            </View>
            <Select
              label="Status"
              options={statusOptions}
              value={status}
              onChange={setStatus}
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
            leftIcon={<Plus size={16} color="#0f172a" />}
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
            <Input
              label="Terms"
              value={terms}
              onChangeText={setTerms}
              multiline
              numberOfLines={2}
            />
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
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
                <X size={24} color="#64748b" />
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
  container: { flex: 1, backgroundColor: "#f8fafc" },
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
  titleContainer: { flex: 1, alignItems: "center" },
  title: { fontSize: 18, fontWeight: "600", color: "#0f172a" },
  content: { padding: wp(4), paddingBottom: hp(5) },
  row: { flexDirection: "row", marginBottom: 8 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  itemCard: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  itemNumber: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  itemSummary: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  itemMeta: { fontSize: 13, color: "#64748b" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  totalLabel: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  totalValue: { fontSize: 18, fontWeight: "bold", color: "#6366f1" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
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
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: { fontSize: 18, fontWeight: "600", color: "#0f172a" },
  modalBody: { padding: 16, paddingBottom: 40 },
});
