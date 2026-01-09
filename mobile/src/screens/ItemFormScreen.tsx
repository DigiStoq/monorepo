import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getPowerSyncDatabase } from "../lib/powersync";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardBody,
  Select,
} from "../components/ui";
import { Save, X } from "lucide-react-native";
import { wp, hp } from "../lib/responsive";
import { generateUUID } from "../lib/utils";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "../lib/theme";

export function ItemFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = (route.params as { id?: string }) || {};
  const isEditing = !!id;

  const db = getPowerSyncDatabase();

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [type, setType] = useState("product"); // 'product' | 'service'
  const [categoryId, setCategoryId] = useState("");
  const [unit, setUnit] = useState("pcs");

  const [salePrice, setSalePrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [taxRate, setTaxRate] = useState("");

  const [stockQuantity, setStockQuantity] = useState("");
  const [lowStockAlert, setLowStockAlert] = useState("5");

  const [description, setDescription] = useState("");

  // Additional
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState(""); // Text for now
  const [barcode, setBarcode] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [location, setLocation] = useState("");
  const [brand, setBrand] = useState("");
  const [modelNumber, setModelNumber] = useState("");

  const [categories, setCategories] = useState<
    { label: string; value: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdditional, setShowAdditional] = useState(false);

  useEffect(() => {
    // Fetch categories
    db.execute("SELECT id, name FROM categories ORDER BY name ASC")
      .then((res) => {
        const cats: { label: string; value: string }[] = [];
        if (res.rows) {
          for (let i = 0; i < res.rows.length; i++) {
            const c = res.rows.item(i);
            cats.push({ label: c.name, value: c.id });
          }
        }
        setCategories(cats);
      })
      .catch(console.error);

    if (id) {
      db.execute("SELECT * FROM items WHERE id = ?", [id])
        .then((result) => {
          if (result.rows?.length > 0) {
            const data = result.rows.item(0);
            setName(data.name);
            setSku(data.sku || "");
            setType(data.type || "product");
            setCategoryId(data.category_id || "");
            setUnit(data.unit || "pcs");
            setSalePrice(String(data.sale_price || 0));
            setPurchasePrice(String(data.purchase_price || 0));
            setTaxRate(String(data.tax_rate || 0));
            setStockQuantity(String(data.stock_quantity || 0));
            setLowStockAlert(String(data.low_stock_alert || 5));
            setDescription(data.description || "");
            // Additional
            setBatchNumber(data.batch_number || "");
            setExpiryDate(data.expiry_date || "");
            setBarcode(data.barcode || "");
            setHsnCode(data.hsn_code || "");
            setLocation(data.location || "");
            setBrand(data.brand || "");
            setModelNumber(data.model_number || "");
          }
        })
        .catch(console.error);
    }
  }, [id]);

  const handleSubmit = async () => {
    if (!name) {
      Alert.alert("Error", "Name is required");
      return;
    }

    setIsLoading(true);
    try {
      const itemId = id || generateUUID();
      const now = new Date().toISOString();
      const sPrice = parseFloat(salePrice) || 0;
      const pPrice = parseFloat(purchasePrice) || 0;
      const tRate = parseFloat(taxRate) || 0;
      const stock = parseFloat(stockQuantity) || 0;
      const lStock = parseFloat(lowStockAlert) || 0;

      if (isEditing) {
        await db.execute(
          `
                    UPDATE items 
                    SET name = ?, sku = ?, type = ?, category_id = ?, unit = ?,
                        sale_price = ?, purchase_price = ?, tax_rate = ?, 
                        stock_quantity = ?, low_stock_alert = ?, description = ?,
                        batch_number = ?, expiry_date = ?, barcode = ?, hsn_code = ?,
                        location = ?, brand = ?, model_number = ?,
                        updated_at = ?
                    WHERE id = ?
                `,
          [
            name,
            sku,
            type,
            categoryId,
            unit,
            sPrice,
            pPrice,
            tRate,
            stock,
            lStock,
            description,
            batchNumber,
            expiryDate,
            barcode,
            hsnCode,
            location,
            brand,
            modelNumber,
            now,
            itemId,
          ]
        );
      } else {
        await db.execute(
          `
                    INSERT INTO items (
                        id, name, sku, type, category_id, unit,
                        sale_price, purchase_price, tax_rate,
                        stock_quantity, low_stock_alert, description,
                        batch_number, expiry_date, barcode, hsn_code,
                        location, brand, model_number,
                        created_at, updated_at, is_active
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                `,
          [
            itemId,
            name,
            sku,
            type,
            categoryId,
            unit,
            sPrice,
            pPrice,
            tRate,
            stock,
            lStock,
            description,
            batchNumber,
            expiryDate,
            barcode,
            hsnCode,
            location,
            brand,
            modelNumber,
            now,
            now,
          ]
        );
      }

      Alert.alert("Success", "Item saved");
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save item");
    } finally {
      setIsLoading(false);
    }
  };

  const typeOptions = [
    { label: "Product", value: "product" },
    { label: "Service", value: "service" },
  ];

  const unitOptions = [
    { value: "pcs", label: "Pieces (pcs)" },
    { value: "kg", label: "Kilograms (kg)" },
    { value: "lbs", label: "Pounds (lbs)" },
    { value: "box", label: "Box" },
    { value: "pack", label: "Pack" },
    { value: "unit", label: "Unit" },
    { value: "hr", label: "Hour (hr)" },
    { value: "day", label: "Day" },
  ];

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
            {isEditing ? "Edit Item" : "New Item"}
          </Text>
        </View>
        <Button
          variant="ghost"
          size="icon"
          onPress={handleSubmit}
          isLoading={isLoading}
        >
          <Save size={24} color={colors.primary} />
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <CardHeader title="Basic Details" />
          <CardBody>
            <Input
              label="Item Name"
              value={name}
              onChangeText={setName}
              placeholder="Product Name / Service Name"
            />
            <View style={styles.row}>
              <Select
                label="Type"
                options={typeOptions}
                value={type}
                onChange={setType}
                containerStyle={{ flex: 1, marginRight: 8 }}
              />
              <Input
                label="SKU"
                value={sku}
                onChangeText={setSku}
                placeholder="Optional"
                containerStyle={{ flex: 1 }}
              />
            </View>
            <Select
              label="Category"
              options={[{ label: "No Category", value: "" }, ...categories]}
              value={categoryId}
              onChange={setCategoryId}
            />
            <Select
              label="Unit"
              options={unitOptions}
              value={unit}
              onChange={setUnit}
            />
            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
              placeholder="Short description"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Pricing" />
          <CardBody>
            <View style={styles.row}>
              <Input
                label="Sale Price"
                value={salePrice}
                onChangeText={setSalePrice}
                keyboardType="numeric"
                placeholder="0.00"
                containerStyle={{ flex: 1, marginRight: 8 }}
              />
              <Input
                label="Cost Price"
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                keyboardType="numeric"
                placeholder="0.00"
                containerStyle={{ flex: 1 }}
              />
            </View>
            <Input
              label="Tax Rate (%)"
              value={taxRate}
              onChangeText={setTaxRate}
              keyboardType="numeric"
              placeholder="0"
            />
          </CardBody>
        </Card>

        {type === "product" && (
          <Card>
            <CardHeader title="Inventory" />
            <CardBody>
              <View style={styles.row}>
                <Input
                  label={isEditing ? "Current Stock" : "Opening Stock"}
                  value={stockQuantity}
                  onChangeText={setStockQuantity}
                  keyboardType="numeric"
                  placeholder="0"
                  containerStyle={{ flex: 1, marginRight: 8 }}
                />
                <Input
                  label="Low Stock Alert"
                  value={lowStockAlert}
                  onChangeText={setLowStockAlert}
                  keyboardType="numeric"
                  placeholder="5"
                  containerStyle={{ flex: 1 }}
                />
              </View>
            </CardBody>
          </Card>
        )}

        <View style={{ marginTop: 16 }}>
          <Button
            variant="outline"
            onPress={() => {
              setShowAdditional(!showAdditional);
            }}
          >
            {showAdditional
              ? "Hide Additional Details"
              : "Show Additional Details"}
          </Button>
        </View>

        {showAdditional && (
          <View style={{ marginTop: 16, gap: 16 }}>
            <Card>
              <CardHeader title="Tracking & Location" />
              <CardBody>
                <View style={styles.row}>
                  <Input
                    label="Batch Number"
                    value={batchNumber}
                    onChangeText={setBatchNumber}
                    containerStyle={{ flex: 1, marginRight: 8 }}
                  />
                  <Input
                    label="Expiry Date"
                    value={expiryDate}
                    onChangeText={setExpiryDate}
                    placeholder="YYYY-MM-DD"
                    containerStyle={{ flex: 1 }}
                  />
                </View>
                <View style={styles.row}>
                  <Input
                    label="Barcode"
                    value={barcode}
                    onChangeText={setBarcode}
                    containerStyle={{ flex: 1, marginRight: 8 }}
                  />
                  <Input
                    label="HSN Code"
                    value={hsnCode}
                    onChangeText={setHsnCode}
                    containerStyle={{ flex: 1 }}
                  />
                </View>
                <Input
                  label="Location"
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Warehouse/Shelf"
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Brand & Model" />
              <CardBody>
                <View style={styles.row}>
                  <Input
                    label="Brand"
                    value={brand}
                    onChangeText={setBrand}
                    containerStyle={{ flex: 1, marginRight: 8 }}
                  />
                  <Input
                    label="Model No"
                    value={modelNumber}
                    onChangeText={setModelNumber}
                    containerStyle={{ flex: 1 }}
                  />
                </View>
              </CardBody>
            </Card>
          </View>
        )}

        <Button
          fullWidth
          onPress={handleSubmit}
          isLoading={isLoading}
          style={styles.submitButton}
        >
          Save Item
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
    alignItems: "flex-start",
  },
  submitButton: {
    marginTop: spacing.xl,
  },
});
