# PLAN: Mobile App Enhancement & TanStack Migration

## 🎯 Goal

Enhance the existing DigiStoq Mobile (Expo/React Native) app by:

1. Adding **TanStack Query** to unify data-fetching patterns with the Desktop app.
2. Migrating shared hooks from `src/hooks` to the mobile app.
3. Ensuring **100% feature parity** (the mobile UI is largely complete; focus is on data layer).

---

## 📊 Current State Analysis

### Mobile App (Expo 54 + React Native 0.81)

The mobile app is **highly mature** with:

- **68 screens** across Sales, Purchases, Reports, Settings, and Cash/Bank modules.
- **React Navigation** (Drawer + Stack + Tabs) is fully configured.
- **PowerSync** for local-first sync (`@powersync/react-native`, `@powersync/op-sqlite`).
- **Theme/Dark Mode** support via `ThemeContext`.

### Key Gap: Data Layer

| Aspect               | Desktop (`src/`)                                           | Mobile (`mobile/src/`)                                | Gap                                                                |
| -------------------- | ---------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------ |
| **Custom Hooks**     | 32 (e.g., `useCustomers`, `useSaleInvoices`, `useReports`) | 3 (`useReports`, `useSettings`, `useUserPreferences`) | 🔴 **29 hooks missing** - logic is inline in screens               |
| **Data Fetching**    | `@tanstack/react-query`                                    | `@powersync/react-native` `useQuery` (raw SQL)        | 🟡 Inconsistent - Mobile uses raw SQL, Desktop uses TanStack Query |
| **State Management** | `zustand`                                                  | None                                                  | 🟡 Add `zustand` for global state like `useSettings`               |
| **Form Validation**  | `react-hook-form` + `zod`                                  | Inline validation                                     | 🟡 Consider adding for complex forms if needed                     |

### What's Working Well (DO NOT CHANGE)

- ✅ Navigation structure (`AppNavigator`, `SalesNavigator`, `PurchasesNavigator`)
- ✅ All screen UI components (68 screens)
- ✅ Theme system (`lib/theme.ts`, `ThemeContext`)
- ✅ PowerSync local database integration
- ✅ Authentication flow (`AuthContext`, `LoginScreen`, `SplashScreen`)

---

## 🛠 Implementation Strategy

### Strategy A: Port Hooks Query-by-Query (Recommended)

**Approach**: Keep mobile screens as-is. Add TanStack Query. Create mobile-specific versions of hooks that wrap the raw `useQuery` from PowerSync.

**Pros**:

- No risk to existing UI.
- Can be done incrementally.
- Mobile hooks can be optimized for PowerSync SQL.

**Cons**:

- Hooks are not 100% shared (slight duplication).

### Strategy B: Configure Metro to Import from `../src`

**Approach**: Make Mobile use Desktop hooks directly.

**Pros**:

- True code sharing.

**Cons**:

- Desktop hooks use TanStack Query which expects a `QueryClient`. Mobile uses PowerSync's `useQuery` which is SQL-based. **These are fundamentally incompatible.**
- **HIGH RISK**: Could break Desktop app.

---

## 📅 Implementation Phases

### Phase 1: Add TanStack Query & Zustand (Infrastructure)

**Goal**: Add dependencies without changing any screens.

- [ ] Install `@tanstack/react-query`, `zustand` in `mobile/`.
- [ ] Create `mobile/src/lib/queryClient.ts`.
- [ ] Wrap `<AppContent />` in `<QueryClientProvider>`.
- [ ] **Verify**: App still works exactly as before.

---

### Phase 2: Create Mobile Hooks Layer (`mobile/src/hooks/`)

**Goal**: Abstract raw SQL queries into reusable hooks that mirror Desktop patterns.

Priority order (based on screen complexity):

| Hook                     | Desktop Size | Status  |
| ------------------------ | ------------ | ------- |
| `useCustomers.ts`        | ~12KB        | ✅ Done |
| `useItems.ts`            | ~21KB        | ✅ Done |
| `useSaleInvoices.ts`     | ~35KB        | ✅ Done |
| `usePurchaseInvoices.ts` | ~36KB        | ✅ Done |
| `useEstimates.ts`        | ~19KB        | ✅ Done |
| `useCreditNotes.ts`      | ~14KB        | ✅ Done |
| `usePaymentIns.ts`       | ~10KB        | ✅ Done |
| `usePaymentOuts.ts`      | ~10KB        | ✅ Done |
| `useExpenses.ts`         | ~9KB         | ✅ Done |
| `useBankAccounts.ts`     | ~7KB         | ✅ Done |
| `useCashTransactions.ts` | ~7KB         | ✅ Done |
| `useCheques.ts`          | ~7KB         | ✅ Done |
| `useLoans.ts`            | ~10KB        | ✅ Done |
| `useDashboard.ts`        | ~8KB         | ✅ Done |
| `usePDFGenerator.ts`     | ~15KB        | ✅ Done |

---

### Phase 3: Refactor Screens to Use Hooks

**Goal**: Replace inline `useQuery` calls in screens with custom hooks.

Example (`CustomersScreen.tsx`):

```diff
- import { useQuery } from "@powersync/react-native";
+ import { useCustomers } from "../hooks/useCustomers";

- const { data: customers, isLoading } = useQuery<CustomerRecord>(
-   `SELECT * FROM customers WHERE ($1 IS NULL OR name LIKE $1) ORDER BY name ASC`,
-   [search ? `%${search}%` : null]
- );
+ const { customers, isLoading } = useCustomers({ search });
```

---

### Phase 4: PDF Generation

**Goal**: Enable invoice/estimate PDF export on mobile.

- [x] Install `expo-print`, `expo-sharing`.
- [x] Port `usePDFGenerator.ts` logic to use `expo-print` instead of `pdfmake`.

---

### Phase 5: Verification & Polish

- [ ] **Offline Test**: Verify app works in Airplane mode.
- [ ] **Sync Test**: Create invoice on Mobile → appears on Desktop.
- [ ] **Performance**: Ensure no unnecessary re-renders from TanStack Query.

---

## 🚫 Out of Scope (No changes needed)

- ⛔ Navigation structure
- ⛔ Theme/styling
- ⛔ Screen layouts
- ⛔ Authentication flow
- ⛔ PowerSync configuration

---

## � Immediate Next Steps

1. **User Approval**: Confirm Strategy A (Port Hooks).
2. **Install Dependencies** (`@tanstack/react-query`, `zustand`).
3. **Create `useCustomers.ts`** hook as a proof-of-concept.
4. **Refactor `CustomersScreen.tsx`** to use the new hook.

---

## ❓ Questions for User

1. Do you want to proceed with **Strategy A** (Port hooks incrementally)?
2. Should we add **NativeWind** for Tailwind-like styling, or keep the current `StyleSheet.create` approach?
3. Are there any specific screens or features you want prioritized?
