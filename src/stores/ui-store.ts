import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================================
// TYPES
// ============================================================================

export interface DateRange {
  from: Date;
  to: Date;
}

export interface UIState {
  // Sidebar
  sidebarCollapsed: boolean;
  sidebarExpandedIds: Set<string>;

  // Theme
  theme: "light" | "dark" | "system";

  // Global Filters
  dateRange: DateRange | null;
  searchQuery: string;

  // Modal states (generic)
  activeModal: string | null;
  modalData: Record<string, unknown>;

  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarSection: (id: string) => void;
  setSidebarExpandedIds: (ids: Set<string>) => void;

  // Theme actions
  setTheme: (theme: "light" | "dark" | "system") => void;

  // Filter actions
  setDateRange: (range: DateRange | null) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;

  // Modal actions
  openModal: (modalId: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
}

// ============================================================================
// DEFAULT DATE RANGE (Current month)
// ============================================================================

function getDefaultDateRange(): DateRange {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from, to };
}

// ============================================================================
// STORE
// ============================================================================

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarCollapsed: false,
      sidebarExpandedIds: new Set<string>(),
      theme: "light",
      dateRange: getDefaultDateRange(),
      searchQuery: "",
      activeModal: null,
      modalData: {},

      // Sidebar actions
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      toggleSidebarSection: (id) =>
        set((state) => {
          const newIds = new Set(state.sidebarExpandedIds);
          if (newIds.has(id)) {
            newIds.delete(id);
          } else {
            newIds.add(id);
          }
          return { sidebarExpandedIds: newIds };
        }),

      setSidebarExpandedIds: (ids) =>
        set({ sidebarExpandedIds: ids }),

      // Theme actions
      setTheme: (theme) =>
        set({ theme }),

      // Filter actions
      setDateRange: (range) =>
        set({ dateRange: range }),

      setSearchQuery: (query) =>
        set({ searchQuery: query }),

      clearFilters: () =>
        set({
          dateRange: getDefaultDateRange(),
          searchQuery: "",
        }),

      // Modal actions
      openModal: (modalId, data = {}) =>
        set({ activeModal: modalId, modalData: data }),

      closeModal: () =>
        set({ activeModal: null, modalData: {} }),
    }),
    {
      name: "digistoq-ui",
      // Custom serialization for Set
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          // Restore Set from array
          if (parsed.state?.sidebarExpandedIds) {
            parsed.state.sidebarExpandedIds = new Set(
              parsed.state.sidebarExpandedIds
            );
          }
          // Restore Date objects
          if (parsed.state?.dateRange) {
            parsed.state.dateRange = {
              from: new Date(parsed.state.dateRange.from),
              to: new Date(parsed.state.dateRange.to),
            };
          }
          return parsed;
        },
        setItem: (name, value) => {
          // Convert Set to array for serialization
          const toStore = {
            ...value,
            state: {
              ...value.state,
              sidebarExpandedIds: Array.from(
                value.state.sidebarExpandedIds || []
              ),
            },
          };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
