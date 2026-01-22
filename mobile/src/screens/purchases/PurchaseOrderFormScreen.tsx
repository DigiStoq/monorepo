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
import { Plus, Trash2, Save, X, Send } from "lucide-react-native";
import { wp, hp } from "../../lib/responsive";
import { generateUUID } from "../../lib/utils";
import { spacing, borderRadius, fontSize, fontWeight, ThemeColors } from "../../lib/theme";
import { useTheme } from "../../contexts/ThemeContext";

// Inline Types
interface CustomerData {
  id: string;
  name: string;
  type: string;
}

interface ItemData {
  id: string;
  name: string;
  purchase_price: number;
  is_active: number;
  unit?: string;
  tax_rate?: number;
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

export function PurchaseOrderFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = (route.params as { id?: string }) || {};
  const isEditing = !!id;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const db = getPowerSyncDatabase();

  // Fetch Suppliers and Items
  const { data: suppliers } = useQuery<CustomerData>(
    "SELECT * FROM customers WHERE type IN ('supplier', 'both') ORDER BY name ASC"
  );
  const { data: items } = useQuery<ItemData>(
    "SELECT * FROM items WHERE is_active = 1 ORDER BY name ASC"
  );

  const [supplierId, setSupplierId] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [expectedDate, setExpectedDate] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("draft");
  const [isLoading, setIsLoading] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Temp Item State
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

  // Load Data if Editing
  useEffect(() => {
    async function loadData() {
      if (!id) return;

      try {
        const res = await db.execute("SELECT * FROM purchase_orders WHERE id = ?", [id]);
        if (res.rows?.length > 0) {
          const data = res.rows.item(0);
          setSupplierId(data.supplier_id);
          setPoNumber(data.po_number || "");
          setDate(data.date);
          setExpectedDate(data.expected_date || "");
          setNotes(data.notes || "");
          setStatus(data.status || "draft");
        }

        const itemsRes = await db.execute("SELECT * FROM purchase_order_items WHERE po_id = ?", [id]);
        const loadedItems: LineItem[] = [];
        for (let i = 0; i < itemsRes.rows.length; i++) {
          const row = itemsRes.rows.item(i);
          loadedItems.push({
            id: row.id,
            itemId: row.item_id,
            itemName: row.item_name,
            quantity: row.quantity,
            unit: row.unit,
            unitPrice: row.unit_price,
            taxPercent: row.tax_percent,
            amount: row.amount
          });
        }
        setLineItems(loadedItems);
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "Failed to load Purchase Order");
      }
    }
    loadData();
  }, [id]);

  const supplierOptions = useMemo(
    () => suppliers.map((s) => ({ label: s.name, value: s.id })),
    [suppliers]
  );

  const statusOptions = [
    { label: "Draft", value: "draft" },
    { label: "Sent", value: "sent" },
    { label: "Received", value: "received" },
    { label: "Cancelled", value: "cancelled" },
  ];

  const itemOptions = useMemo(
    () =>
      items.map((i) => ({
        label: `${i.name} ($${i.purchase_price})`,
        value: i.id,
      })),
    [items]
  );

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = lineItems.reduce((sum, item) => {
      const base = item.quantity * item.unitPrice;
      return sum + (base * (item.taxPercent / 100));
    }, 0);
    return {
      subtotal,
      tax,
      total: subtotal + tax,
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
        amount: 0,
      });
    }
    setModalVisible(true);
  };

  const saveItem = () => {
    const base = tempItem.quantity * tempItem.unitPrice;
    const total = base * (1 + tempItem.taxPercent / 100);
    const FinalItem = { ...tempItem, amount: total };

    if (editingItemId) {
      setLineItems((prev) => prev.map((i) => (i.id === editingItemId ? FinalItem : i)));
    } else {
      setLineItems((prev) => [...prev, FinalItem]);
    }
    setModalVisible(false);
  };

  const handleItemSelect = (val: string) => {
    const selected = items.find((i) => i.id === val);
    if (selected) {
      setTempItem((prev) => ({
        ...prev,
        itemId: val,
        itemName: selected.name,
        unitPrice: selected.purchase_price || 0,
        unit: selected.unit || "pcs",
        taxPercent: selected.tax_rate || 0,
      }));
    }
  };

  const handleSubmit = async (newStatus?: string) => {
    const finalStatus = newStatus || status;
    if (!supplierId || lineItems.length === 0) {
      Alert.alert("Error", "Please select a supplier and add at least one item.");
      return;
    }

    setIsLoading(true);
    try {
      const poId = id || generateUUID();
      const supplier = suppliers.find((s) => s.id === supplierId);

      await db.writeTransaction(async (tx) => {
        if (isEditing) {
          await tx.execute("DELETE FROM purchase_order_items WHERE po_id = ?", [poId]);
        }

        await tx.execute(
          `INSERT OR REPLACE INTO purchase_orders 
           (id, supplier_id, supplier_name, po_number, date, expected_date, status, subtotal, tax_amount, total, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            poId,
            supplierId,
            supplier?.name || "",
            poNumber, // If empty, backend might auto-generate or we allow empty
            date,
            expectedDate,
            finalStatus,
            totals.subtotal,
            totals.tax,
            totals.total,
            notes,
            new Date().toISOString(),
            new Date().toISOString(),
          ]
        );

        for (const item of lineItems) {
          await tx.execute(
            `INSERT INTO purchase_order_items 
             (id, po_id, item_id, item_name, quantity, unit, unit_price, tax_percent, amount)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              generateUUID(),
              poId,
              item.itemId,
              item.itemName,
              item.quantity,
              item.unit,
              item.unitPrice,
              item.taxPercent,
              item.amount,
            ]
          );
        }
      });

      Alert.alert("Success", "Purchase Order saved");
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save Purchase Order");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigation.goBack()}>
          <X size={24} color={colors.text} />
        </Button>
        <Text style={styles.title}>{isEditing ? "Edit Order" : "New Purchase Order"}</Text>
        <Button variant="ghost" size="icon" onPress={() => handleSubmit()} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color={colors.primary} /> : <Save size={24} color={colors.primary} />}
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <CardHeader title="Order Details" />
          <CardBody>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Select label="Supplier" options={supplierOptions} value={supplierId} onChange={setSupplierId} placeholder="Select Supplier" />
              </View>
              <View style={{ width: 120 }}>
                <Select label="Status" options={statusOptions} value={status} onChange={setStatus} />
              </View>
            </View>

            <Input label="PO Number" value={poNumber} onChangeText={setPoNumber} placeholder="Auto-generated if empty" />

            <View style={styles.row}>
              <Input label="Order Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" containerStyle={{ flex: 1, marginRight: 8 }} />
              <Input label="Expected Date" value={expectedDate} onChangeText={setExpectedDate} placeholder="YYYY-MM-DD" containerStyle={{ flex: 1 }} />
            </View>
          </CardBody>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Items</Text>
          <Button size="sm" variant="outline" onPress={() => openItemModal()} leftIcon={<Plus size={16} color={colors.text} />}>Add Item</Button>
        </View>

        {lineItems.map((item, index) => (
          <TouchableOpacity key={item.id} onPress={() => openItemModal(item)}>
            <Card style={styles.itemCard}>
              <CardBody>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemNumber}>#{index + 1} - {item.itemName}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.itemSummary}>${item.amount.toFixed(2)}</Text>
                    <TouchableOpacity onPress={(e) => { e.stopPropagation(); setLineItems((p) => p.filter((i) => i.id !== item.id)); }} style={{ marginLeft: 8 }}>
                      <Trash2 size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.itemMeta}>{item.quantity} {item.unit} x ${item.unitPrice}</Text>
              </CardBody>
            </Card>
          </TouchableOpacity>
        ))}

        <Card>
          <CardBody>
            <Input label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={2} placeholder="Instructions for supplier..." />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${totals.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>${totals.tax.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${totals.total.toFixed(2)}</Text>
            </View>
          </CardBody>
        </Card>

        {/* Helper Actions */}
        {isEditing && status === 'draft' && (
          <Button fullWidth style={{ marginTop: 16 }} onPress={() => handleSubmit('sent')} leftIcon={<Send size={18} color="white" />}>
            Save & Mark Sent
          </Button>
        )}
      </ScrollView>

      {/* Item Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItemId ? "Edit Item" : "Add Item"}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <Select label="Item" options={itemOptions} value={tempItem.itemId} onChange={handleItemSelect} />
              <View style={styles.row}>
                <Input label="Quantity" value={String(tempItem.quantity)} onChangeText={(v) => setTempItem(p => ({ ...p, quantity: parseFloat(v) || 0 }))} keyboardType="numeric" containerStyle={{ flex: 1, marginRight: 8 }} />
                <Input label="Unit" value={tempItem.unit} editable={false} containerStyle={{ flex: 1 }} />
              </View>
              <View style={styles.row}>
                <Input label="Unit Price" value={String(tempItem.unitPrice)} onChangeText={(v) => setTempItem(p => ({ ...p, unitPrice: parseFloat(v) || 0 }))} keyboardType="numeric" containerStyle={{ flex: 1, marginRight: 8 }} />
                <Input label="Tax %" value={String(tempItem.taxPercent)} onChangeText={(v) => setTempItem(p => ({ ...p, taxPercent: parseFloat(v) || 0 }))} keyboardType="numeric" containerStyle={{ flex: 1 }} />
              </View>
              <Button fullWidth onPress={saveItem} style={{ marginTop: 16 }}>{editingItemId ? "Update Item" : "Add Item"}</Button>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: wp(4), paddingVertical: hp(1.5), backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, marginTop: Platform.OS === "android" ? 24 : 0 },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text },
  content: { padding: wp(4), paddingBottom: hp(5) },
  row: { flexDirection: "row", marginBottom: 8 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  itemCard: { marginBottom: 8, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, backgroundColor: colors.surface },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  itemNumber: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  itemSummary: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text },
  itemMeta: { fontSize: fontSize.xs, color: colors.textSecondary },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  summaryValue: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.text },
  totalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  totalLabel: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  totalValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.primary },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text },
  modalBody: { padding: 16, paddingBottom: 40 },
});
