import { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TextInput,
} from "react-native";
import { ChevronDownIcon, XIcon, CheckIcon, SearchIcon } from "./Icons";
import type { ThemeColors } from "../../lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "../../lib/theme";
import { useTheme } from "../../contexts/ThemeContext";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  containerStyle?: any;
  searchable?: boolean;
}

export function Select({
  options,
  value,
  onChange,
  placeholder,
  label,
  disabled,
  containerStyle,
  searchable,
}: SelectProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (val: string) => {
    onChange(val);
    setModalVisible(false);
    setSearchQuery("");
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.trigger, disabled && styles.disabled]}
        onPress={() => {
          if (!disabled) setModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.valueText, !selectedOption && styles.placeholder]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDownIcon size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          setSearchQuery("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || placeholder}</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setSearchQuery("");
                }}
              >
                <XIcon size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {searchable && (
              <View style={styles.searchContainer}>
                <SearchIcon size={20} color={colors.textMuted} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                />
              </View>
            )}

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    item.value === value && styles.optionSelected,
                  ]}
                  onPress={() => {
                    handleSelect(item.value);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && styles.optionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && <CheckIcon size={20} color={colors.primary} />}
                </TouchableOpacity>
              )}
              style={styles.list}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  trigger: {
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  disabled: {
    backgroundColor: colors.surfaceHover,
    opacity: 0.7,
  },
  valueText: {
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
  },
  placeholder: {
    color: colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: "80%",
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  list: {
    padding: spacing.sm,
  },
  optionItem: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionSelected: {
    backgroundColor: colors.surfaceHover,
  },
  optionText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceHover,
    margin: spacing.md,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    height: 48,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: fontSize.md,
    color: colors.text,
  },
});
