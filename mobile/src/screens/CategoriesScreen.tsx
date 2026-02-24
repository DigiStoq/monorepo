import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";
import { useCategories, useCategoryMutations } from "../hooks/useCategories";
import { CustomHeader } from "../components/CustomHeader";
import {
  TrashIcon,
  LayersThree01Icon,
} from "../components/ui/UntitledIcons";

export function CategoriesScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { categories, isLoading } = useCategories();
  const { deleteCategory } = useCategoryMutations();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${name}"? Items in this category will become uncategorized.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCategory(id);
            } catch (e) {
              console.error(e);
              Alert.alert("Error", "Failed to delete category");
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-background-light">
      <CustomHeader title="Categories" showBack />

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 100,
          gap: 10,
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-surface rounded-lg p-4 shadow-sm"
            onPress={() =>
              (navigation as any).navigate("CategoryForm", { id: item.id })
            }
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primary + "20" }}
              >
                <LayersThree01Icon size={18} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-md font-semibold text-text">
                  {item.name}
                </Text>
                {item.description ? (
                  <Text
                    className="text-sm text-text-muted mt-0.5"
                    numberOfLines={1}
                  >
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <View
                className="px-2.5 py-1 rounded-full"
                style={{ backgroundColor: colors.surface }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: colors.textSecondary }}
                >
                  {item.itemCount} {item.itemCount === 1 ? "item" : "items"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(item.id, item.name)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <TrashIcon size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center p-10">
            <Text className="text-text-muted text-md">
              No categories yet
            </Text>
            <Text className="text-text-muted text-sm mt-1">
              Tap + to create your first category
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        className="absolute right-5 bg-primary px-5 py-3 rounded-full shadow-md"
        style={{
          bottom: insets.bottom + 80,
          backgroundColor: colors.primary,
        }}
        onPress={() => (navigation as any).navigate("CategoryForm")}
      >
        <Text className="text-white font-semibold text-md bg-transparent">
          + Add
        </Text>
      </TouchableOpacity>
    </View>
  );
}
