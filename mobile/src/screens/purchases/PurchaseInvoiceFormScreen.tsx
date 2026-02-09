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
import { spacing, borderRadius, fontSize, fontWeight, ThemeColors } from "../../lib/theme";
import { useTheme } from "../../contexts/ThemeContext";

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

  // Load Data if Editing
  useEffect(() => {
    if (id) {
      db.execute("SELECT * FROM purchase_invoices WHERE id = ?", [id]).then(
        (res) => {
          if (res.rows?.length > 0) {
            const data = res.rows.item(0);
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
      // Load items... (omitted for brevity in this update, focusing on fields)
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
    if (!supplierId || lineItems.length === 0) {
      Alert.alert(
        "Error",
        "Please select a supplier and add at least one item."
      );
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
                    (id, customer_id, customer_name, supplier_invoice_number, date, due_date, status, total, notes, discount_amount, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 `,
          [
            invoiceId,
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
            {isEditing ? "Edit Purchase" : "New Purchase Invoice"}
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
          <CardHeader title="Supplier Details" />
          <CardBody>
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
            <View style={styles.row}>
              <Input
                label="Date"
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                containerStyle={{ flex: 1, marginRight: 8 }}
              />
              <Input
                label="Due Date"
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="YYYY-MM-DD"
                containerStyle={{ flex: 1 }}
              />
            </View>
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
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.itemSummary}>
                      ${item.amount.toFixed(2)}
                    </Text>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setLineItems((p) => p.filter((i) => i.id !== item.id));
                      }}
                      style={{ marginLeft: 8 }}
                    >
                      <Trash2 size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.itemMeta}>
                  {item.quantity} {item.unit} x ${item.unitPrice}
                </Text>
                {item.batchNumber ? (
                  <Text style={styles.itemMeta}>Batch: {item.batchNumber}</Text>
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
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                ${totals.subtotal.toFixed(2)}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text style={styles.summaryLabel}>Discount %</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Input
                  value={discountPercent}
                  onChangeText={setDiscountPercent}
                  placeholder="0"
                  keyboardType="numeric"
                  style={{
                    width: 60,
                    height: 36,
                    textAlign: "right",
                    marginRight: 8,
                  }}
                  containerStyle={{ marginBottom: 0 }}
                />
                <Text style={styles.summaryValue}>
                  -${totals.discount.toFixed(2)}
                </Text>
              </View>
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
                  label="Batch Number"
                  value={tempItem.batchNumber}
                  onChangeText={(v) => {
                    setTempItem((prev) => ({ ...prev, batchNumber: v }));
                  }}
                  placeholder="Optional"
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <View style={styles.row}>
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
                  containerStyle={{ flex: 1, marginRight: 8 }}
                />
                <Input
                  label="Unit"
                  value={tempItem.unit}
                  editable={false} // Read only for now
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <View style={styles.row}>
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

              <View style={styles.row}>
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
                  containerStyle={{ flex: 1, marginRight: 8 }}
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

              <Button fullWidth onPress={saveItem} style={{ marginTop: 16 }}>
                {editingItemId ? "Update Item" : "Add Item"}
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  itemCard: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  itemNumber: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  itemSummary: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  itemMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  totalValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
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
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  modalBody: {
    padding: 16,
    paddingBottom: 40,
  },
});
