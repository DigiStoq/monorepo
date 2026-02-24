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
  DateInput,
  Card,
  CardHeader,
  CardBody,
  Select,
} from "../../components/ui";
import { PlusIcon, TrashIcon, SaveIcon, XCloseIcon } from "../../components/ui/UntitledIcons";
import { generateUUID } from "../../lib/utils";
import { useTheme } from "../../contexts/ThemeContext";
import { CustomHeader } from "../../components/CustomHeader";
import { useSequenceMutations } from "../../hooks/useSequence";

// Inline Types (mirrors schema)
interface CustomerData {
  id: string;
  name: string;
  type: string;
  phone?: string;
}

interface ItemData {
  id: string;
  name: string;
  purchase_price: number;
  is_active: number;
  batch_number?: string;
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
  discountPercent: number;
  amount: number;
  batchNumber: string;
}

export function PurchaseInvoiceFormScreen() {
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

  const { getNextNumber } = useSequenceMutations();
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Temp Item State for Modal
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
    batchNumber: "",
  });

  // Auto-fill purchase invoice number on create
  useEffect(() => {
    if (!isEditing) {
      getNextNumber("purchase_invoice").then(setInvoiceNumber).catch(console.error);
    }
  }, [isEditing]);

  // Load Data if Editing
  useEffect(() => {
    if (id) {
      db.execute("SELECT * FROM purchase_invoices WHERE id = ?", [id]).then(
        (res) => {
          if (res.rows?.length > 0) {
            const data = res.rows.item(0);
            setInvoiceNumber(data.invoice_number || "");
            setSupplierId(data.customer_id);
            setSupplierInvoiceNumber(data.supplier_invoice_number || "");
            setDate(data.date);
            setDueDate(data.due_date || "");
            setDiscountPercent(
              data.discount_amount ? String(data.discount_amount) : ""
            );
            setNotes(data.notes || "");
          }
        }
      );

      db.execute("SELECT * FROM purchase_invoice_items WHERE invoice_id = ?", [id]).then(
        (res) => {
          const loadedItems: LineItem[] = [];
          if (res.rows?.length > 0) {
            for (let i = 0; i < res.rows.length; i++) {
              const item = res.rows.item(i);
              loadedItems.push({
                id: item.id,
                itemId: item.item_id,
                itemName: item.item_name,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unit_price,
                taxPercent: item.tax_percent,
                discountPercent: item.discount_percent,
                amount: item.amount,
                batchNumber: "" // Not in schema example but good to have
              });
            }
            setLineItems(loadedItems);
          }
        }
      )
    }
  }, [id]);

  const supplierOptions = useMemo(
    () => suppliers.map((s) => ({ label: s.name, value: s.id })),
    [suppliers]
  );

  const itemOptions = useMemo(
    () =>
      items.map((i) => ({
        label: `${i.name} ($${i.purchase_price})`,
        value: i.id,
      })),
    [items]
  );

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

    const globalDiscountRate = parseFloat(discountPercent) || 0;
    const invoiceDiscount =
      (subtotal - itemDiscounts) * (globalDiscountRate / 100);
    const totalDiscount = itemDiscounts + invoiceDiscount;

    const taxable = subtotal - totalDiscount;
    const totalTax = lineItems.reduce((sum, item) => {
      // Simplified tax calc: (Item Amount - Item Discount) * Tax %
      const base =
        item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
      return sum + base * (item.taxPercent / 100);
    }, 0);

    return {
      subtotal,
      discount: totalDiscount,
      tax: totalTax,
      total: taxable + totalTax,
    };
  }, [lineItems, discountPercent]);

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
        batchNumber: "",
      });
    }
    setModalVisible(true);
  };

  const saveItem = () => {
    // Calculate amount
    const base = tempItem.quantity * tempItem.unitPrice;
    const afterDisc = base * (1 - tempItem.discountPercent / 100);
    const total = afterDisc * (1 + tempItem.taxPercent / 100);

    const FinalItem = { ...tempItem, amount: total };

    if (editingItemId) {
      setLineItems((prev) =>
        prev.map((i) => (i.id === editingItemId ? FinalItem : i))
      );
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
        batchNumber: selected.batch_number || "", // Pre-fill batch if available
        taxPercent: selected.tax_rate || 0,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!supplierId) {
      Alert.alert("Missing Supplier", "Please select a supplier.");
      return;
    }
    if (lineItems.length === 0) {
      Alert.alert("No Items", "Please add at least one item to the invoice.");
      return;
    }
    if (!invoiceNumber.trim()) {
      Alert.alert("Missing Invoice Number", "Purchase invoice number is required.");
      return;
    }
    if (dueDate && date && dueDate < date) {
      Alert.alert("Invalid Due Date", "Due date cannot be before the invoice date.");
      return;
    }

    setIsLoading(true);
    try {
      const invoiceId = id || generateUUID();
      const supplier = suppliers.find((s) => s.id === supplierId);

      await db.writeTransaction(async (tx) => {
        if (isEditing) {
          await tx.execute(
            "DELETE FROM purchase_invoice_items WHERE invoice_id = ?",
            [invoiceId]
          );
          // Update main invoice logic would go here
        }

        await tx.execute(
          `
                    INSERT OR REPLACE INTO purchase_invoices
                    (id, invoice_number, customer_id, customer_name, supplier_invoice_number, date, due_date, status, total, notes, discount_amount, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 `,
          [
            invoiceId,
            invoiceNumber,
            supplierId,
            supplier?.name || "",
            supplierInvoiceNumber,
            date,
            dueDate,
            "draft",
            totals.total,
            notes,
            totals.discount, // Storing amount, not percent.
            new Date().toISOString(),
            new Date().toISOString(),
          ]
        );

        for (const item of lineItems) {
          await tx.execute(
            `
                        INSERT INTO purchase_invoice_items 
                        (id, invoice_id, item_id, item_name, quantity, unit, unit_price, tax_percent, discount_percent, amount)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
            [
              generateUUID(),
              invoiceId,
              item.itemId,
              item.itemName,
              item.quantity,
              item.unit,
              item.unitPrice,
              item.taxPercent,
              item.discountPercent,
              item.amount,
            ]
          );
        }
      });

      Alert.alert("Success", "Purchase invoice saved");
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save purchase invoice");
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
        title={isEditing ? "Edit Purchase" : "New Purchase Invoice"}
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

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Card>
          <CardHeader title="Supplier Details" />
          <CardBody>
            <Input
              label="Purchase #"
              value={invoiceNumber}
              onChangeText={setInvoiceNumber}
              placeholder="PUR-0001"
            />
            <Select
              label="Supplier"
              options={supplierOptions}
              value={supplierId}
              onChange={setSupplierId}
              placeholder="Select Supplier"
            />
            <Input
              label="Supplier Invoice #"
              value={supplierInvoiceNumber}
              onChangeText={setSupplierInvoiceNumber}
              placeholder="e.g. INV-2024-001"
            />
            <View className="flex-row gap-2">
              <DateInput
                label="Date"
                value={date}
                onChange={setDate}
                containerStyle={{ flex: 1 }}
              />
              <DateInput
                label="Due Date"
                value={dueDate}
                onChange={setDueDate}
                containerStyle={{ flex: 1 }}
              />
            </View>
          </CardBody>
        </Card>

        <View className="flex-row justify-between items-center mb-3 mt-4">
          <Text className="text-md font-semibold text-text">Items</Text>
          <Button
            size="sm"
            variant="outline"
            onPress={() => {
              openItemModal();
            }}
            className="flex-row items-center gap-1"
          >
            <PlusIcon size={16} color={colors.text} />
            <Text className="text-sm text-text ml-1">Add Item</Text>
          </Button>
        </View>

        {lineItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => {
              openItemModal(item);
            }}
          >
            <Card>
              <CardBody>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm font-semibold text-text">
                    #{index + 1} - {item.itemName}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-bold text-text">
                      ${item.amount.toFixed(2)}
                    </Text>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setLineItems((p) => p.filter((i) => i.id !== item.id));
                      }}
                      className="ml-2"
                    >
                      <TrashIcon size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text className="text-xs text-text-secondary">
                  {item.quantity} {item.unit} x ${item.unitPrice}
                </Text>
                {item.batchNumber ? (
                  <Text className="text-xs text-text-secondary">Batch: {item.batchNumber}</Text>
                ) : null}
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
              placeholder="Internal notes..."
            />
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-text-secondary">Subtotal</Text>
              <Text className="text-sm font-medium text-text">
                ${totals.subtotal.toFixed(2)}
              </Text>
            </View>

            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm text-text-secondary">Discount %</Text>
              <View className="flex-row items-center">
                <Input
                  value={discountPercent}
                  onChangeText={setDiscountPercent}
                  placeholder="0"
                  keyboardType="numeric"
                  className="text-right h-9 w-16"
                  containerStyle={{ marginBottom: 0, marginRight: 8 }}
                />
                <Text className="text-sm font-medium text-text">
                  -${totals.discount.toFixed(2)}
                </Text>
              </View>
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
      </ScrollView>

      {/* Item Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-surface rounded-t-2xl max-h-[90%]">
            <View className="flex-row justify-between items-center p-4 border-b border-border">
              <Text className="text-lg font-semibold text-text">
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
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
              <Select
                label="Item"
                options={itemOptions}
                value={tempItem.itemId}
                onChange={handleItemSelect}
              />

              <View className="flex-row gap-2">
                <Input
                  label="Batch Number"
                  value={tempItem.batchNumber}
                  onChangeText={(v) => {
                    setTempItem((prev) => ({ ...prev, batchNumber: v }));
                  }}
                  placeholder="Optional"
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <View className="flex-row gap-2">
                <Input
                  label="Quantity"
                  value={String(tempItem.quantity)}
                  onChangeText={(v) => {
                    setTempItem((prev) => ({
                      ...prev,
                      quantity: parseFloat(v) || 0,
                    }));
                  }}
                  keyboardType="numeric"
                  containerStyle={{ flex: 1 }}
                />
                <Input
                  label="Unit"
                  value={tempItem.unit}
                  editable={false} // Read only for now
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <View className="flex-row gap-2">
                <Input
                  label="Cost Price"
                  value={String(tempItem.unitPrice)}
                  onChangeText={(v) => {
                    setTempItem((prev) => ({
                      ...prev,
                      unitPrice: parseFloat(v) || 0,
                    }));
                  }}
                  keyboardType="numeric"
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <View className="flex-row gap-2">
                <Input
                  label="Discount %"
                  value={String(tempItem.discountPercent)}
                  onChangeText={(v) => {
                    setTempItem((prev) => ({
                      ...prev,
                      discountPercent: parseFloat(v) || 0,
                    }));
                  }}
                  keyboardType="numeric"
                  containerStyle={{ flex: 1 }}
                />
                <Input
                  label="Tax %"
                  value={String(tempItem.taxPercent)}
                  onChangeText={(v) => {
                    setTempItem((prev) => ({
                      ...prev,
                      taxPercent: parseFloat(v) || 0,
                    }));
                  }}
                  keyboardType="numeric"
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <Button fullWidth onPress={saveItem} className="mt-4">
                {editingItemId ? "Update Item" : "Add Item"}
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
