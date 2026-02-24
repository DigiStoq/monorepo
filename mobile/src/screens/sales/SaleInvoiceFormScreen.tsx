import { useState, useMemo, useEffect } from "react";
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
import { usePDFGenerator } from "../../hooks/usePDFGenerator";
import type { PDFInvoiceData } from "../../lib/pdf/htmlTemplates";
import { round } from "../../lib/utils";
import { useTheme } from "../../contexts/ThemeContext";
import {
  PlusIcon,
  TrashIcon,
  SaveIcon,
  XCloseIcon,
  ReceiptIcon
} from "../../components/ui/UntitledIcons";
import { CustomHeader } from "../../components/CustomHeader";
import { useSequenceMutations } from "../../hooks/useSequence";

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
  stock_quantity: number;
  type: string;
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
  const { colors } = useTheme();
  const route = useRoute();
  const { id } = (route.params as { id?: string }) || {};
  const isEditing = !!id;

  const db = getPowerSyncDatabase();

  // Data Fetching
  const { data: customers } = useQuery<CustomerData>(
    "SELECT * FROM customers WHERE type IN ('customer', 'both') AND is_active = 1 ORDER BY name ASC"
  );
  const { data: items } = useQuery<ItemData>(
    "SELECT * FROM items WHERE is_active = 1 ORDER BY name ASC"
  );

  const { getNextNumber } = useSequenceMutations();

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState("");
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

  const { generateInvoicePDF, isGenerating: isGeneratingPDF } = usePDFGenerator();

  const handleGeneratePDF = async () => {
    if (!customerId || lineItems.length === 0) {
      Alert.alert("Error", "Invoice is incomplete");
      return;
    }

    const customer = customers.find(c => c.id === customerId);

    const pdfData: PDFInvoiceData = {
      documentTitle: "INVOICE",
      documentNumber: id ? id.slice(0, 8).toUpperCase() : "DRAFT",
      date: date,
      dueDate: dueDate,
      companyName: "DigiStoq",
      companyAddress: "123 Business St, Tech City",
      companyEmail: "support@digistoq.com",
      customerName: customer?.name || "Unknown",
      customerAddress: customer?.address,
      customerPhone: customer?.phone,
      customerEmail: customer?.email,
      items: lineItems.map(item => ({
        description: item.itemName,
        quantity: item.quantity,
        rate: item.unitPrice,
        amount: item.amount
      })),
      subtotal: totals.subtotal,
      taxTotal: totals.tax,
      discountTotal: totals.discount,
      total: totals.total,
      balanceDue: totals.total,
      currencySymbol: "$",
      notes: notes,
      terms: terms
    };

    await generateInvoicePDF(pdfData);
  };

  // Auto-fill invoice number on create
  useEffect(() => {
    if (!isEditing) {
      getNextNumber("sale_invoice").then(setInvoiceNumber).catch(console.error);
    }
  }, [isEditing]);

  // Initial Data Load (if editing)
  useEffect(() => {
    if (id) {
      db.execute("SELECT * FROM sale_invoices WHERE id = ?", [id]).then(
        (res) => {
          if (res.rows?.length > 0) {
            const inv = res.rows.item(0);
            setInvoiceNumber(inv.invoice_number || "");
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
  }, [id, db]);

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
      const base = round(item.quantity * item.unitPrice);
      const disc = round(base * (item.discountPercent / 100));
      const taxable = round(base - disc);
      const tax = round(taxable * (item.taxPercent / 100));

      subVal = round(subVal + base);
      totalDisc = round(totalDisc + disc);
      totalTax = round(totalTax + tax);
      totalVal = round(totalVal + taxable + tax);
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

    const selectedItem = items.find(i => i.id === currentItem.itemId);
    const qty = currentItem.quantity || 0;

    // Stock Validation
    if (selectedItem && selectedItem.type !== 'service') {
      const otherLines = lineItems.filter(i => i.itemId === currentItem.itemId && i.id !== editingItemId);
      const totalOtherQty = otherLines.reduce((acc, i) => acc + i.quantity, 0);

      if (totalOtherQty + qty > selectedItem.stock_quantity) {
        Alert.alert("Insufficient Stock", `You only have ${selectedItem.stock_quantity} quantity available for ${selectedItem.name}.`);
        return;
      }
    }
    const rate = currentItem.unitPrice || 0;
    const disc = currentItem.discountPercent || 0;
    const tax = currentItem.taxPercent || 0;

    const base = round(qty * rate);
    const discAmt = round(base * (disc / 100));
    const taxable = round(base - discAmt);
    const taxAmt = round(taxable * (tax / 100));
    const finalAmt = round(taxable + taxAmt);

    const newItem: LineItem = {
      id: editingItemId || crypto.randomUUID(),
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
    if (!customerId) {
      Alert.alert("Missing Customer", "Please select a customer.");
      return;
    }
    if (lineItems.length === 0) {
      Alert.alert("No Items", "Please add at least one item to the invoice.");
      return;
    }
    if (!invoiceNumber.trim()) {
      Alert.alert("Missing Invoice Number", "Invoice number is required.");
      return;
    }
    if (dueDate && date && dueDate < date) {
      Alert.alert("Invalid Due Date", "Due date cannot be before the invoice date.");
      return;
    }

    setIsLoading(true);
    try {
      // Check if crypto.randomUUID is available, strictly calling it or falling back if needed (should be polyfilled)
      const invoiceId = id || (global.crypto?.randomUUID ? global.crypto.randomUUID() : Math.random().toString(36).substring(2));

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
                        INSERT INTO sale_invoices (id, invoice_number, customer_id, date, due_date, transport_name, delivery_date, delivery_location, notes, terms, status, total, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                     `,
            [
              invoiceId,
              invoiceNumber,
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
              (global.crypto?.randomUUID ? global.crypto.randomUUID() : Math.random().toString(36).substring(2)),
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
      className="flex-1 bg-background"
    >
      <CustomHeader
        title={isEditing ? "Edit Sale Invoice" : "New Sale Invoice"}
        showBack
        rightAction={
          <View className="flex-row gap-2">
            {isEditing && (
              <TouchableOpacity
                onPress={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="p-2"
              >
                {isGeneratingPDF ? <ActivityIndicator size="small" color={colors.text} /> : <ReceiptIcon size={24} color={colors.text} />}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              className="p-2"
            >
              {isLoading ? <ActivityIndicator size="small" color={colors.primary} /> : <SaveIcon size={24} color={colors.primary} />}
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Customer Section */}
        <Card>
          <CardHeader title="Customer Details" />
          <CardBody>
            <Input
              label="Invoice #"
              value={invoiceNumber}
              onChangeText={setInvoiceNumber}
              placeholder="INV-0001"
            />
            <Select
              label="Customer"
              options={customerOptions}
              value={customerId}
              onChange={setCustomerId}
              placeholder="Select Customer"
            />
            <View className="flex-row gap-2">
              <DateInput
                label="Invoice Date"
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
            <View className="flex-row gap-2">
              <DateInput
                label="Delivery Date"
                value={deliveryDate}
                onChange={setDeliveryDate}
                containerStyle={{ flex: 1 }}
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

        {lineItems.map((item) => (
          <Card key={item.id} style={{ marginBottom: 12 }}>
            <TouchableOpacity
              onPress={() => {
                openItemModal(item);
              }}
            >
              <CardBody>
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-md font-semibold text-text">{item.itemName}</Text>
                  <View className="flex-row items-center">
                    <Text className="text-md font-bold text-text">
                      ${item.amount.toFixed(2)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        handleRemoveItem(item.id);
                      }}
                      style={{ marginLeft: 8 }}
                    >
                      <TrashIcon size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-text-muted">
                    {item.quantity} x ${item.unitPrice}
                  </Text>
                  {item.batchNumber ? (
                    <Text className="text-sm text-text-muted">
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
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-text-secondary">Subtotal</Text>
              <Text className="text-md font-semibold text-text">
                ${totals.subtotal.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-text-secondary">Discount</Text>
              <Text className="text-md font-semibold text-danger">
                -${totals.discount.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-text-secondary">Tax</Text>
              <Text className="text-md font-semibold text-text">${totals.tax.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between pt-2 border-t border-border mt-2">
              <Text className="text-lg font-bold text-text">Total</Text>
              <Text className="text-lg font-bold text-primary">${totals.total.toFixed(2)}</Text>
            </View>
          </CardBody>
        </Card>

        <Button
          fullWidth
          onPress={handleSubmit}
          isLoading={isLoading}
          className="mt-6"
        >
          {isEditing ? "Save Changes" : "Create"}
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
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-xl h-[85%] w-full">
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
                label="Select Item"
                options={itemOptions}
                value={currentItem.itemId}
                onChange={handleItemSelect}
                placeholder="Choose..."
              />

              <View className="flex-row gap-2">
                <Input
                  label="Batch Number"
                  value={currentItem.batchNumber}
                  onChangeText={(v) => {
                    setCurrentItem((p) => ({ ...p, batchNumber: v }));
                  }}
                  containerStyle={{ flex: 1 }}
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

              <View className="flex-row gap-2">
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
                  containerStyle={{ flex: 1 }}
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

              <View className="flex-row gap-2">
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
                  containerStyle={{ flex: 1 }}
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

              <Button fullWidth onPress={saveItem} className="mt-4">
                {editingItemId ? "Update Item" : "Add to Invoice"}
              </Button>

              <View className="h-10" />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
