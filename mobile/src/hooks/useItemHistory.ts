import { useQuery } from "@powersync/react-native";

export type ItemHistoryAction =
  | "created"
  | "updated"
  | "stock_adjusted"
  | "activated"
  | "deactivated"
  | "deleted";

export interface ItemHistory {
  id: string;
  itemId: string;
  action: ItemHistoryAction;
  description: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  userId?: string;
  userName?: string;
  createdAt: string;
}

interface ItemHistoryRow {
  id: string;
  item_id: string;
  action: string;
  description: string;
  old_values: string | null;
  new_values: string | null;
  user_id: string | null;
  user_name: string | null;
  created_at: string;
}

function parseJsonValue(
  value: string | object | null
): Record<string, unknown> | null {
  if (!value) return null;

  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (typeof parsed === "string") {
        return JSON.parse(parsed) as Record<string, unknown>;
      }
      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  return null;
}

function mapRowToHistory(row: ItemHistoryRow): ItemHistory {
  const history: ItemHistory = {
    id: row.id,
    itemId: row.item_id,
    action: row.action as ItemHistoryAction,
    description: row.description,
    createdAt: row.created_at,
  };

  const oldVals = parseJsonValue(row.old_values as string | object | null);
  const newVals = parseJsonValue(row.new_values as string | object | null);

  if (oldVals && Object.keys(oldVals).length > 0) history.oldValues = oldVals;
  if (newVals && Object.keys(newVals).length > 0) history.newValues = newVals;
  if (row.user_id) history.userId = row.user_id;
  if (row.user_name) history.userName = row.user_name;

  return history;
}

export function useItemHistory(itemId: string | null): {
  history: ItemHistory[];
  isLoading: boolean;
  error: Error | undefined;
} {
  const { data, isLoading, error } = useQuery<ItemHistoryRow>(
    itemId
      ? `SELECT * FROM item_history WHERE item_id = ? ORDER BY created_at DESC`
      : `SELECT * FROM item_history WHERE 1 = 0`,
    itemId ? [itemId] : []
  );

  const history = data.map(mapRowToHistory);

  return { history, isLoading, error };
}
