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
import { PlusIcon, TrashIcon, SaveIcon, XCloseIcon, SendIcon } from "../../components/ui/UntitledIcons";
import { generateUUID } from "../../lib/utils";
import { useTheme } from "../../contexts/ThemeContext";
import { CustomHeader } from "../../components/CustomHeader";

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
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
      <CustomHeader
        title={isEditing ? "Edit Order" : "New Purchase Order"}
        showBack
        rightAction={
          <TouchableOpacity
            onPress={() => handleSubmit()}
            disabled={isLoading}
            className="p-1.5"
          >
            {isLoading ? <ActivityIndicator size="small" color={colors.primary} /> : <SaveIcon size={24} color={colors.primary} />}
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Card>
          <CardHeader title="Order Details" />
          <CardBody>
            <View className="flex-row gap-2">
              <View style={{ flex: 1 }}>
                <Select label="Supplier" options={supplierOptions} value={supplierId} onChange={setSupplierId} placeholder="Select Supplier" />
              </View>
              <View style={{ width: 120 }}>
                <Select label="Status" options={statusOptions} value={status} onChange={setStatus} />
              </View>
            </View>

            <Input label="PO Number" value={poNumber} onChangeText={setPoNumber} placeholder="Auto-generated if empty" />

            <View className="flex-row gap-2">
              <Input label="Order Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" containerStyle={{ flex: 1 }} />
              <Input label="Expected Date" value={expectedDate} onChangeText={setExpectedDate} placeholder="YYYY-MM-DD" containerStyle={{ flex: 1 }} />
            </View>
          </CardBody>
        </Card>

        <View className="flex-row justify-between items-center mb-3 mt-4">
          <Text className="text-md font-semibold text-text">Items</Text>
          <Button size="sm" variant="outline" onPress={() => { openItemModal(); }} className="flex-row items-center gap-1">
            <PlusIcon size={16} color={colors.text} />
            <Text className="ml-1 text-sm text-text">Add Item</Text>
          </Button>
        </View>

        {lineItems.map((item, index) => (
          <TouchableOpacity key={item.id} onPress={() => { openItemModal(item); }}>
            <Card>
              <CardBody>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm font-semibold text-text">#{index + 1} - {item.itemName}</Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-bold text-text">${item.amount.toFixed(2)}</Text>
                    <TouchableOpacity onPress={(e) => { e.stopPropagation(); setLineItems((p) => p.filter((i) => i.id !== item.id)); }} className="ml-2">
                      <TrashIcon size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text className="text-xs text-text-secondary">{item.quantity} {item.unit} x ${item.unitPrice}</Text>
              </CardBody>
            </Card>
          </TouchableOpacity>
        ))}

        <Card>
          <CardBody>
            <Input label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={2} placeholder="Instructions for supplier..." />
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-text-secondary">Subtotal</Text>
              <Text className="text-sm font-medium text-text">${totals.subtotal.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-text-secondary">Tax</Text>
              <Text className="text-sm font-medium text-text">${totals.tax.toFixed(2)}</Text>
            </View>
            <View className="mt-2 pt-2 border-t border-border flex-row justify-between">
              <Text className="text-lg font-bold text-text">Total</Text>
              <Text className="text-lg font-bold text-primary">${totals.total.toFixed(2)}</Text>
            </View>
          </CardBody>
        </Card>

        {/* Helper Actions */}
        {isEditing && status === 'draft' && (
          <Button fullWidth className="mt-4" onPress={() => handleSubmit('sent')}>
            <View className="flex-row items-center gap-2">
              <SendIcon size={18} color="white" />
              <Text className="text-white font-semibold">Save & Mark Sent</Text>
            </View>
          </Button>
        )}
      </ScrollView>

      {/* Item Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => { setModalVisible(false); }}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-surface rounded-t-2xl max-h-[90%]">
            <View className="flex-row justify-between items-center p-4 border-b border-border">
              <Text className="text-lg font-semibold text-text">{editingItemId ? "Edit Item" : "Add Item"}</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); }}>
                <XCloseIcon size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
              <Select label="Item" options={itemOptions} value={tempItem.itemId} onChange={handleItemSelect} />
              <View className="flex-row gap-2">
                <Input label="Quantity" value={String(tempItem.quantity)} onChangeText={(v) => { setTempItem(p => ({ ...p, quantity: parseFloat(v) || 0 })); }} keyboardType="numeric" containerStyle={{ flex: 1 }} />
                <Input label="Unit" value={tempItem.unit} editable={false} containerStyle={{ flex: 1 }} />
              </View>
              <View className="flex-row gap-2">
                <Input label="Unit Price" value={String(tempItem.unitPrice)} onChangeText={(v) => { setTempItem(p => ({ ...p, unitPrice: parseFloat(v) || 0 })); }} keyboardType="numeric" containerStyle={{ flex: 1 }} />
                <Input label="Tax %" value={String(tempItem.taxPercent)} onChangeText={(v) => { setTempItem(p => ({ ...p, taxPercent: parseFloat(v) || 0 })); }} keyboardType="numeric" containerStyle={{ flex: 1 }} />
              </View>
              <Button fullWidth onPress={saveItem} className="mt-4">{editingItemId ? "Update Item" : "Add Item"}</Button>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
