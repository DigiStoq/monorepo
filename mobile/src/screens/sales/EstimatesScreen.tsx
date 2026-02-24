import { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useEstimates } from "../../hooks/useEstimates";
import { SearchIcon, PlusIcon, FilterIcon, ChevronRightIcon } from "../../components/ui/UntitledIcons";
import { CalculatorIcon } from "../../components/ui/Icons";
import { useTheme } from "../../contexts/ThemeContext";
import type { ThemeColors } from "../../lib/theme";

function EstimateCard({ estimate, styles, colors }: { estimate: any, styles: any, colors: ThemeColors }) {
  const navigation = useNavigation();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    draft: { bg: colors.surfaceHover, text: colors.textMuted, border: colors.border },
    sent: { bg: colors.infoMuted, text: colors.info, border: colors.info + "20" },
    accepted: { bg: colors.successMuted, text: colors.success, border: colors.success + "20" },
    rejected: { bg: colors.dangerMuted, text: colors.danger, border: colors.danger + "20" },
    converted: { bg: colors.primaryMuted, text: colors.primary, border: colors.primary + "20" },
    expired: { bg: colors.warningMuted, text: colors.warning, border: colors.warning + "20" },
  };

  const statusStyle = statusColors[estimate.status] || statusColors.draft;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() =>
        (navigation as any).navigate("EstimateDetail", { id: estimate.id })
      }
    >
      <View style={styles.cardMain}>
        <View style={styles.estimateIconBox}>
          <CalculatorIcon size={20} color={colors.primary} />
        </View>
        <View style={styles.estimateMainInfo}>
          <View style={styles.estimateHeaderRow}>
            <Text style={styles.estimateNumber}>#{estimate.estimateNumber}</Text>
            <Text style={styles.totalValue}>
              ${estimate.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <Text style={styles.customerName}>{estimate.customerName || "Unknown Customer"}</Text>
          <View style={styles.estimateFooterRow}>
            <Text style={styles.dateValue}>{formatDate(estimate.date)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {estimate.status}
              </Text>
            </View>
          </View>
        </View>
        <ChevronRightIcon size={18} color={colors.textMuted} style={{ marginLeft: 8 }} />
      </View>
    </TouchableOpacity >
  );
}

export function EstimatesScreen() {
  const navigation = useNavigation();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { estimates } = useEstimates({ search });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <SearchIcon size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search estimates..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <FilterIcon size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={estimates || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EstimateCard estimate={item} styles={styles} colors={colors} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconContainer}>
              <CalculatorIcon size={48} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyText}>No estimates yet</Text>
            <Text style={styles.emptySubtext}>
              Send professional quotes to your clients and win more business.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => (navigation as any).navigate("EstimateForm")}
            >
              <Text style={styles.emptyAddButtonText}>Create New Estimate</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => (navigation as any).navigate("EstimateForm")}
      >
        <PlusIcon size={24} color="#fff" strokeWidth={3} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    alignItems: "center",
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  estimateIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary + "10",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  estimateMainInfo: {
    flex: 1,
  },
  estimateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  estimateNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
  },
  customerName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  estimateFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateValue: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  emptyAddButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyAddButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  }
});
