import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../contexts/ThemeContext";
import {
  useCategories,
  useCategoryMutations,
} from "../hooks/useCategories";
import { CustomHeader } from "../components/CustomHeader";
import { Input, Card, CardHeader, CardBody } from "../components/ui";
import { SaveIcon } from "../components/ui/UntitledIcons";

export function CategoryFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as { id?: string } | undefined;
  const id = params?.id;
  const isEditing = !!id;
  const { colors } = useTheme();

  const { categories } = useCategories();
  const { createCategory, updateCategory } = useCategoryMutations();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing && categories.length > 0) {
      const category = categories.find((c) => c.id === id);
      if (category) {
        setName(category.name);
        setDescription(category.description || "");
      }
    }
  }, [id, categories]);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Error", "Category name is required");
      return;
    }

    try {
      setLoading(true);
      if (isEditing && id) {
        await updateCategory(id, {
          name: name.trim(),
          description: description.trim() || undefined,
        });
      } else {
        await createCategory({
          name: name.trim(),
          description: description.trim() || undefined,
        });
      }
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save category");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <CustomHeader
        title={isEditing ? "Edit Category" : "New Category"}
        showBack
        rightAction={
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            className="p-1.5"
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <SaveIcon color={colors.primary} size={24} />
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card>
          <CardHeader title="Category Details" />
          <CardBody>
            <Input
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g., Electronics, Clothing"
            />
            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              placeholder="Optional description"
            />
          </CardBody>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
