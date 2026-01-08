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
import { Plus, Trash2, Save, X, Truck, Calendar } from "lucide-react-native";
import { wp, hp } from "../../lib/responsive";
import { generateUUID } from "../../lib/utils";

// Types
interface CustomerData {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface ItemData {
  id: string;
  name: string;
  sale_price: number;
  unit: string;
  tax_rate: number;
  sku: string;
  is_active: number;
  batch_number?: string;
}

interface LineItem {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number; // Rate
  mrp: number;
  batchNumber: string;
  taxPercent: number;
  discountPercent: number;
  amount: number;
}

export function SaleInvoiceFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = (route.params as { id?: string }) || {};
  const isEditing = !!id;

  const db = getPowerSyncDatabase();

  // Data Fetching
  const { data: customers } = useQuery<CustomerData>(
    "SELECT * FROM customers ORDER BY name ASC"
  );
  const { data: items } = useQuery<ItemData>(
    "SELECT * FROM items WHERE is_active = 1 ORDER BY name ASC"
  );

  // Form State
  const [customerId, setCustomerId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");

  // Transport Details
  const [transportName, setTransportName] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Item Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<LineItem>>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Initial Data Load (if editing)
  useEffect(() => {
    if (id) {
      db.execute("SELECT * FROM sale_invoices WHERE id = ?", [id]).then(
        (res) => {
          if (res.rows?.length > 0) {
            const inv = res.rows.item(0);
            setCustomerId(inv.customer_id);
            setDate(inv.date);
            setDueDate(inv.due_date || "");
            setTransportName(inv.transport_name || "");
            setDeliveryDate(inv.delivery_date || "");
            setDeliveryLocation(inv.delivery_location || "");
            setNotes(inv.notes || "");
            setTerms(inv.terms || "");

            // Load Items
            db.execute(
              "SELECT * FROM sale_invoice_items WHERE invoice_id = ?",
              [id]
            ).then((itemRes) => {
              const loadedItems: LineItem[] = [];
              for (let i = 0; i < itemRes.rows.length; i++) {
                const it = itemRes.rows.item(i);
                loadedItems.push({
                  id: it.id,
                  itemId: it.item_id,
                  itemName: it.item_name || "Unknown",
                  quantity: it.quantity || 1,
                  unitPrice: it.unit_price || 0,
                  mrp: it.mrp || 0,
                  batchNumber: it.batch_number || "",
                  taxPercent: it.tax_percent || 0,
                  discountPercent: it.discount_percent || 0,
                  amount: it.amount || 0,
                });
              }
              setLineItems(loadedItems);
            });
          }
        }
      );
    }
  }, [id]);

  // Options for Select
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

  // Calculations
  const totals = useMemo(() => {
    let totalVal = 0;
    let totalTax = 0;
    let totalDisc = 0;
    let subVal = 0;

    lineItems.forEach((item) => {
      const base = item.quantity * item.unitPrice;
      const disc = base * (item.discountPercent / 100);
      const taxable = base - disc;
      const tax = taxable * (item.taxPercent / 100);

      subVal += base;
      totalDisc += disc;
      totalTax += tax;
      totalVal += taxable + tax;
    });

    return {
      subtotal: subVal,
      discount: totalDisc,
      tax: totalTax,
      total: totalVal,
    };
  }, [lineItems]);

  // Handlers
  const openItemModal = (item?: LineItem) => {
    if (item) {
      setEditingItemId(item.id);
      setCurrentItem(item);
    } else {
      setEditingItemId(null);
      setCurrentItem({
        quantity: 1,
        unitPrice: 0,
        mrp: 0,
        batchNumber: "",
        taxPercent: 0,
        discountPercent: 0,
      });
    }
    setModalVisible(true);
  };

  const handleItemSelect = (itemId: string) => {
    const selected = items.find((i) => i.id === itemId);
    if (selected) {
      setCurrentItem((prev) => ({
        ...prev,
        itemId: selected.id,
        itemName: selected.name,
        unitPrice: selected.sale_price,
        taxPercent: selected.tax_rate || 0,
        batchNumber: selected.batch_number || "",
        mrp: selected.sale_price, // Default MRP to sale price
      }));
    } else {
      setCurrentItem((prev) => ({ ...prev, itemId }));
    }
  };

  const saveItem = () => {
    if (!currentItem.itemId) {
      Alert.alert("Error", "Please select an item");
      return;
    }

    const qty = currentItem.quantity || 0;
    const rate = currentItem.unitPrice || 0;
    const disc = currentItem.discountPercent || 0;
    const tax = currentItem.taxPercent || 0;

    const base = qty * rate;
    const discAmt = base * (disc / 100);
    const taxable = base - discAmt;
    const taxAmt = taxable * (tax / 100);
    const finalAmt = taxable + taxAmt;

    const newItem: LineItem = {
      id: editingItemId || generateUUID(),
      itemId: currentItem.itemId,
      itemName: currentItem.itemName || "",
      quantity: qty,
      unitPrice: rate,
      mrp: currentItem.mrp || 0,
      batchNumber: currentItem.batchNumber || "",
      taxPercent: tax,
      discountPercent: disc,
      amount: finalAmt,
    };

    if (editingItemId) {
      setLineItems((prev) =>
        prev.map((i) => (i.id === editingItemId ? newItem : i))
      );
    } else {
      setLineItems((prev) => [...prev, newItem]);
    }
    setModalVisible(false);
  };

  const handleRemoveItem = (id: string) => {
    setLineItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSubmit = async () => {
    if (!customerId || lineItems.length === 0) {
      Alert.alert(
        "Error",
        "Please select a customer and add at least one item."
      );
      return;
    }

    setIsLoading(true);
    try {
      const invoiceId = id || generateUUID();

      await db.writeTransaction(async (tx) => {
        // 1. Insert/Update Invoice
        if (isEditing) {
          await tx.execute(
            `
                        UPDATE sale_invoices SET 
                        customer_id=?, date=?, due_date=?, 
                        transport_name=?, delivery_date=?, delivery_location=?,
                        notes=?, terms=?,
                        total=?, updated_at=?
                        WHERE id=?
                    `,
            [
              customerId,
              date,
              dueDate,
              transportName,
              deliveryDate,
              deliveryLocation,
              notes,
              terms,
              totals.total,
              new Date().toISOString(),
              invoiceId,
            ]
          );
        } else {
          await tx.execute(
            `
                        INSERT INTO sale_invoices (id, customer_id, date, due_date, transport_name, delivery_date, delivery_location, notes, terms, status, total, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                     `,
            [
              invoiceId,
              customerId,
              date,
              dueDate,
              transportName,
              deliveryDate,
              deliveryLocation,
              notes,
              terms,
              "draft",
              totals.total,
              new Date().toISOString(),
              new Date().toISOString(),
            ]
          );
        }

        // 2. Insert Items (Delete all and re-insert for simplicity in update)
        if (isEditing) {
          await tx.execute(
            "DELETE FROM sale_invoice_items WHERE invoice_id = ?",
            [invoiceId]
          );
        }

        for (const item of lineItems) {
          await tx.execute(
            `
                        INSERT INTO sale_invoice_items (id, invoice_id, item_id, item_name, quantity, unit_price, mrp, batch_number, tax_percent, discount_percent, amount)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                     `,
            [
              generateUUID(),
              invoiceId,
              item.itemId,
              item.itemName,
              item.quantity,
              item.unitPrice,
              item.mrp || 0,
              item.batchNumber || null,
              item.taxPercent,
              item.discountPercent,
              item.amount,
            ]
          );
        }
      });

      Alert.alert("Success", "Invoice saved successfully");
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save invoice");
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
            {isEditing ? "Edit Sale Invoice" : "New Sale Invoice"}
          </Text>
        </View>
        <Button
          variant="ghost"
          size="icon"
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Save size={24} color="#6366f1" />
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Customer Section */}
        <Card>
          <CardHeader title="Customer Details" />
          <CardBody>
            <Select
              label="Customer"
              options={customerOptions}
              value={customerId}
              onChange={setCustomerId}
              placeholder="Select Customer"
            />
            <View style={styles.row}>
              <Input
                label="Invoice Date"
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

        {/* Transport Section */}
        <Card>
          <CardHeader title="Transport Details" />
          <CardBody>
            <Input
              label="Transport Name"
              value={transportName}
              onChangeText={setTransportName}
              placeholder="e.g. FedEx"
            />
            <View style={styles.row}>
              <Input
                label="Delivery Date"
                value={deliveryDate}
                onChangeText={setDeliveryDate}
                placeholder="YYYY-MM-DD"
                containerStyle={{ flex: 1, marginRight: 8 }}
              />
              <Input
                label="Delivery Location"
                value={deliveryLocation}
                onChangeText={setDeliveryLocation}
                placeholder="City"
                containerStyle={{ flex: 1 }}
              />
            </View>
          </CardBody>
        </Card>

        {/* Items Section */}
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
          <Card key={item.id} style={styles.itemCard}>
            <TouchableOpacity
              onPress={() => {
                openItemModal(item);
              }}
            >
              <CardBody>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.itemName}</Text>
                  <View style={styles.itemActions}>
                    <Text style={styles.itemAmount}>
                      ${item.amount.toFixed(2)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        handleRemoveItem(item.id);
                      }}
                      style={{ marginLeft: 8 }}
                    >
                      <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.itemMeta}>
                  <Text style={styles.metaText}>
                    {item.quantity} x ${item.unitPrice}
                  </Text>
                  {item.batchNumber ? (
                    <Text style={styles.metaText}>
                      Batch: {item.batchNumber}
                    </Text>
                  ) : null}
                </View>
              </CardBody>
            </TouchableOpacity>
          </Card>
        ))}

        {/* Notes & Terms Section */}
        <Card>
          <CardHeader title="Terms & Notes" />
          <CardBody>
            <Input
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
              placeholder="Public notes..."
            />
            <Input
              label="Terms & Conditions"
              value={terms}
              onChangeText={setTerms}
              multiline
              numberOfLines={2}
              placeholder="Payment terms..."
            />
          </CardBody>
        </Card>

        {/* Summary Section */}
        <Card>
          <CardBody>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                ${totals.subtotal.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.summaryValue}>
                -${totals.discount.toFixed(2)}
              </Text>
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

        <Button
          fullWidth
          onPress={handleSubmit}
          isLoading={isLoading}
          style={styles.submitButton}
        >
          {isEditing ? "Save Changes" : "Create & Send"}
        </Button>
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
                label="Select Item"
                options={itemOptions}
                value={currentItem.itemId}
                onChange={handleItemSelect}
                placeholder="Choose..."
              />

              <View style={styles.row}>
                <Input
                  label="Batch Number"
                  value={currentItem.batchNumber}
                  onChangeText={(v) => {
                    setCurrentItem((p) => ({ ...p, batchNumber: v }));
                  }}
                  containerStyle={{ flex: 1, marginRight: 8 }}
                  placeholder="Opt"
                />
                <Input
                  label="MRP"
                  value={String(currentItem.mrp || "")}
                  onChangeText={(v) => {
                    setCurrentItem((p) => ({ ...p, mrp: parseFloat(v) || 0 }));
                  }}
                  keyboardType="numeric"
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <View style={styles.row}>
                <Input
                  label="Rate"
                  value={String(currentItem.unitPrice || "")}
                  onChangeText={(v) => {
                    setCurrentItem((p) => ({
                      ...p,
                      unitPrice: parseFloat(v) || 0,
                    }));
                  }}
                  keyboardType="numeric"
                  containerStyle={{ flex: 1, marginRight: 8 }}
                />
                <Input
                  label="Quantity"
                  value={String(currentItem.quantity || "")}
                  onChangeText={(v) => {
                    setCurrentItem((p) => ({
                      ...p,
                      quantity: parseFloat(v) || 0,
                    }));
                  }}
                  keyboardType="numeric"
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <View style={styles.row}>
                <Input
                  label="Discount %"
                  value={String(currentItem.discountPercent || "")}
                  onChangeText={(v) => {
                    setCurrentItem((p) => ({
                      ...p,
                      discountPercent: parseFloat(v) || 0,
                    }));
                  }}
                  keyboardType="numeric"
                  containerStyle={{ flex: 1, marginRight: 8 }}
                />
                <Input
                  label="Tax %"
                  value={String(currentItem.taxPercent || "")}
                  onChangeText={(v) => {
                    setCurrentItem((p) => ({
                      ...p,
                      taxPercent: parseFloat(v) || 0,
                    }));
                  }}
                  keyboardType="numeric"
                  containerStyle={{ flex: 1 }}
                />
              </View>

              <Button fullWidth onPress={saveItem} style={{ marginTop: 16 }}>
                {editingItemId ? "Update Item" : "Add to Invoice"}
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
  },
  itemCard: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemMeta: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  metaText: {
    fontSize: 14,
    color: "#64748b",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#64748b",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0f172a",
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6366f1",
  },
  submitButton: {
    marginTop: 24,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  modalBody: {
    padding: 16,
    paddingBottom: 40,
  },
});
