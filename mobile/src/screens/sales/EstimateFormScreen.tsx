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
import { Plus, Trash2, Save, X, FileCheck2 } from "lucide-react-native";
import { wp, hp } from "../../lib/responsive";
import { generateUUID } from "../../lib/utils";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../../lib/theme";

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

  const statusOptions = [
    { label: "Draft", value: "draft" },
    { label: "Sent", value: "sent" },
    { label: "Accepted", value: "accepted" },
    { label: "Declined", value: "declined" },
    { label: "Converted", value: "converted" },
  ];

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
        setTempItem({...item});
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
                'INV-' + Math.floor(Math.random() * 100000), 
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
            for(const item of lineItems) {
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
            { text: "View Invoice", onPress: () => {
                navigation.goBack(); // Close estimate
                setTimeout(() => (navigation as any).navigate('SaleInvoiceForm', { id: newInvoiceId }), 100);
            }},
            { text: "OK", onPress: () => navigation.goBack() }
        ]);

    } catch(e) {
        console.error(e);
        Alert.alert("Error", "Conversion failed");
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
            {isEditing ? "Edit Estimate" : "New Estimate"}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
            {isEditing && status !== 'converted' && (
                <Button variant="ghost" size="icon" onPress={handleConvertToInvoice} disabled={isLoading}>
                     <FileCheck2 size={24} color={colors.success} />
                </Button>
            )}
            <Button
            variant="ghost"
            size="icon"
            onPress={handleSubmit}
            disabled={isLoading}
            >
            {isLoading ? <ActivityIndicator color={colors.primary} /> : <Save size={24} color={colors.primary} />}
            </Button>
        </View>
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
