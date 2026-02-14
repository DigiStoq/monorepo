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
import { usePDFGenerator } from "../../hooks/usePDFGenerator";
import type { PDFInvoiceData } from "../../lib/pdf/htmlTemplates";
import { generateUUID } from "../../lib/utils";
import { useTheme } from "../../contexts/ThemeContext";
import {
  PlusIcon,
  TrashIcon,
  SaveIcon,
  XCloseIcon,
  FileCheck02Icon,
  FileTextIcon
} from "../../components/ui/UntitledIcons";
import { CustomHeader } from "../../components/CustomHeader";

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

  const { generateEstimatePDF, isGenerating: isGeneratingPDF } = usePDFGenerator();

  const handleGeneratePDF = async () => {
    if (!customerId || lineItems.length === 0) {
      Alert.alert("Error", "Estimate is incomplete");
      return;
    }

    const customer = customers.find(c => c.id === customerId);

    const pdfData: PDFInvoiceData = {
      documentTitle: "ESTIMATE",
      documentNumber: estimateNumber || "DRAFT",
      date: date,
      dueDate: validUntil,
      companyName: "DigiStoq",
      companyAddress: "123 Business St, Tech City",
      companyEmail: "support@digistoq.com",
      customerName: customer?.name || "Unknown",
      customerAddress: "",
      customerPhone: customer?.phone,
      items: lineItems.map(item => ({
        description: item.itemName,
        quantity: item.quantity,
        rate: item.unitPrice,
        amount: item.amount
      })),
      subtotal: totals.subtotal,
      taxTotal: totals.tax,
      total: totals.total,
      currencySymbol: "$",
      notes: notes,
      terms: terms
    };

    await generateEstimatePDF(pdfData);
  };

  const statusOptions = [
    { label: "Draft", value: "draft" },
    { label: "Sent", value: "sent" },
    { label: "Accepted", value: "accepted" },
    { label: "Declined", value: "declined" },
    { label: "Converted", value: "converted" },
  ];

  const customerOptions = useMemo(
    () => customers.map((c) => ({ label: c.name, value: c.id })),
    [customers]
  );

  const itemOptions = useMemo(
    () => items.map((i) => ({ label: i.name, value: i.id })),
    [items]
  );

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    let total = 0;
    lineItems.forEach(i => {
      subtotal += i.quantity * i.unitPrice;
      tax += i.quantity * i.unitPrice * (i.taxPercent / 100);
      total += i.amount;
    });
    return { subtotal, tax, total };
  }, [lineItems]);

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

      db.execute("SELECT * FROM estimate_items WHERE estimate_id = ?", [id]).then((res) => {
        const items: LineItem[] = [];
        for (let i = 0; i < res.rows.length; i++) {
          const item = res.rows.item(i);
          items.push({
            id: item.id,
            itemId: item.item_id,
            itemName: item.item_name,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unit_price,
            taxPercent: item.tax_percent,
            discountPercent: item.discount_percent,
            amount: item.amount,
          });
        }
        setLineItems(items);
      });
    }
  }, [id]);

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
    const disc = base * (tempItem.discountPercent / 100);
    const taxable = base - disc;
    const tax = taxable * (tempItem.taxPercent / 100);
    const total = taxable + tax;

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
      Alert.alert("Error", "Please select a customer and add items.");
      return;
    }
    setIsLoading(true);
    try {
      const estimateId = id || generateUUID();
      const customer = customers.find((c) => c.id === customerId);

      await db.writeTransaction(async (tx) => {
        // Updated Fields
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

        // Delete existing items for update to avoid orphans
        await tx.execute("DELETE FROM estimate_items WHERE estimate_id = ?", [estimateId]);

        // Insert new items
        for (const item of lineItems) {
          await tx.execute(
            `INSERT INTO estimate_items 
                (id, estimate_id, item_id, item_name, description, quantity, unit, unit_price, discount_percent, tax_percent, amount)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              generateUUID(),
              estimateId,
              item.itemId,
              item.itemName,
              "", // description not in LineItem interface yet, defaulting empty
              item.quantity,
              item.unit,
              item.unitPrice,
              item.discountPercent,
              item.taxPercent,
              item.amount
            ]
          );
        }
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

  const handleConvertToInvoice = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const newInvoiceId = generateUUID();
      const customer = customers.find(c => c.id === customerId);

      await db.writeTransaction(async tx => {
        // 1. Invoice
        await tx.execute(`
                INSERT INTO sale_invoices 
                (id, customer_id, customer_name, invoice_number, date, due_date, status, total, amount_due, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
          newInvoiceId,
          customerId,
          customer?.name || '',
          `INV-${Math.floor(Math.random() * 100000)}`,
          new Date().toISOString().split('T')[0], // Today
          // Default due date = valid until or today + 7 days
          validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          'draft',
          totals.total,
          totals.total, // Amount due
          new Date().toISOString(),
          new Date().toISOString()
        ]);

        // 2. Items
        for (const item of lineItems) {
          await tx.execute(`
                    INSERT INTO sale_invoice_items
                    (id, invoice_id, item_id, item_name, quantity, unit, unit_price, discount_percent, tax_percent, amount)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
            generateUUID(),
            newInvoiceId,
            item.itemId,
            item.itemName,
            item.quantity,
            item.unit,
            item.unitPrice,
            item.discountPercent,
            item.taxPercent,
            item.amount
          ]);
        }

        // 3. Update Estimate
        await tx.execute(`UPDATE estimates SET status = 'converted', converted_to_invoice_id = ? WHERE id = ?`, [newInvoiceId, id]);
      });

      Alert.alert("Success", "Converted to Invoice", [
        {
          text: "View Invoice", onPress: () => {
            navigation.goBack(); // Close estimate
            setTimeout(() => (navigation as any).navigate('SaleInvoiceForm', { id: newInvoiceId }), 100);
          }
        },
        { text: "OK", onPress: () => { navigation.goBack(); } }
      ]);

    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Conversion failed");
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
        title={isEditing ? "Edit Estimate" : "New Estimate"}
        showBack
        rightAction={
          <View className="flex-row gap-2">
            {isEditing && (
              <TouchableOpacity
                onPress={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="p-2"
              >
                {isGeneratingPDF ? <ActivityIndicator size="small" color={colors.text} /> : <FileTextIcon size={24} color={colors.text} />}
              </TouchableOpacity>
            )}
            {isEditing && status !== 'converted' && (
              <TouchableOpacity
                onPress={handleConvertToInvoice}
                disabled={isLoading}
                className="p-2"
              >
                <FileCheck02Icon size={24} color={colors.success} />
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
        <Card>
          <CardHeader title="Estimate Details" />
          <CardBody>
            <Select
              label="Customer"
              options={customerOptions}
              value={customerId}
              onChange={setCustomerId}
              placeholder="Select Customer"
            />
            <Input
              label="Estimate #"
              value={estimateNumber}
              onChangeText={setEstimateNumber}
              placeholder="EST-001"
            />
            <View className="flex-row gap-2">
              <Input
                label="Date"
                value={date}
                onChangeText={setDate}
                containerStyle={{ flex: 1 }}
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
              placeholder="Draft"
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
            <Input
              label="Terms"
              value={terms}
              onChangeText={setTerms}
              multiline
              numberOfLines={2}
              placeholder="Terms..."
            />
            <View className="flex-row justify-between pt-2 border-t border-border mt-2">
              <Text className="text-lg font-bold text-text">Total</Text>
              <Text className="text-lg font-bold text-primary">${totals.total.toFixed(2)}</Text>
            </View>
          </CardBody>
        </Card>

        <View className="h-20" />
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
