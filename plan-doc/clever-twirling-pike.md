# DigiStoq UI/UX Implementation Plan

## Overview

Build a distinctive, production-grade accounting application with **Professional/Enterprise aesthetic + Modern Vibrant elements** using a **Blue/Teal** color scheme. The UX flows will mirror Vyapar's proven patterns while the UI will be visually unique.

## Multi-Platform Strategy

This is a **monorepo** that will eventually support:

- **Desktop**: Tauri app (current)
- **Mobile**: React Native / Expo (future)
- **Web**: React web app (future)

### Component Architecture for Cross-Platform

```
src/
├── components/
│   └── ui/           # Platform-agnostic design tokens & types
│       ├── primitives/    # Base unstyled components (logic only)
│       └── styled/        # Tailwind-styled web components
├── packages/         # Future: shared packages
│   ├── ui-core/      # Shared component logic & types
│   └── ui-native/    # React Native implementations
```

**Strategy**: Build components with **separated logic and styling**:

1. Component logic/behavior → reusable across platforms
2. Styling → platform-specific (Tailwind for web, StyleSheet for native)
3. Types/interfaces → shared across all platforms

## Design Direction

### Visual Identity

- **Aesthetic**: Clean, data-dense layouts with bold accent moments
- **Color Palette**: Teal primary (#0d9488 / teal-600) with slate neutrals
- **Typography**: Sharp, professional - use `DM Sans` for headings, `Inter` for body
- **Cards**: Subtle glassmorphism with soft shadows, slight backdrop blur
- **Accents**: Vibrant teal CTAs, gradient highlights on key metrics
- **Dark sidebar** with light content area (like Vyapar but with teal accents)

### Key Differentiators from Vyapar

1. Rounded corners (12-16px) vs Vyapar's sharper edges
2. Gradient metric cards vs flat cards
3. Animated micro-interactions on hover/click
4. Modern iconography with consistent stroke weight
5. More whitespace and breathing room
6. Subtle background patterns/noise for depth

---

## Phase 1: Design System & Component Library

### 1.1 Design Tokens (`src/lib/design-tokens.ts`)

```
Colors: teal-50 to teal-950, slate palette, semantic colors
Spacing: 4px base unit scale
Radii: sm(6px), md(10px), lg(16px), xl(24px)
Shadows: soft, medium, heavy variants
Typography: display, heading, body, caption scales
```

### 1.2 Core Components (`src/components/ui/`)

| Component    | Priority | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `Button`     | P0       | Primary, secondary, ghost, danger variants |
| `Input`      | P0       | Text, number, search, with icons           |
| `Select`     | P0       | Dropdown with search capability            |
| `Modal`      | P0       | Dialog with backdrop, animations           |
| `Card`       | P0       | Container with header, body, footer        |
| `Table`      | P0       | Sortable, filterable data grid             |
| `Badge`      | P1       | Status indicators, tags                    |
| `Tabs`       | P1       | Navigation tabs                            |
| `DatePicker` | P1       | Date/range selection                       |
| `Toast`      | P1       | Notifications                              |
| `Sidebar`    | P0       | Navigation sidebar                         |
| `Dropdown`   | P1       | Action menus                               |

### 1.3 Layout Components (`src/components/layout/`)

- `AppShell` - Main app layout with sidebar
- `PageHeader` - Title + actions sticky header
- `MasterDetail` - List-detail split view pattern
- `EmptyState` - Empty data illustrations
- `LoadingState` - Skeleton loaders

---

## Phase 2: Navigation & Routing

### 2.1 Route Structure

```
/                     → Dashboard (Home)
/parties              → Party list + detail
/items                → Items/Inventory management
/sale                 → Sale submenu
  /sale/invoices      → Sale invoices
  /sale/estimates     → Estimates/Quotations
  /sale/payment-in    → Payment-in records
  /sale/credit-notes  → Credit notes
/purchase             → Purchase submenu
  /purchase/invoices  → Purchase invoices
  /purchase/payment-out → Payment-out records
  /purchase/expenses  → Expenses
/cash-bank            → Cash & Bank submenu
  /cash-bank/accounts → Bank accounts
  /cash-bank/cash     → Cash in hand
  /cash-bank/cheques  → Cheques
  /cash-bank/loans    → Loan accounts
/reports              → Reports hub
/settings             → App settings
/utilities            → Import/Export, Bulk updates
```

### 2.2 Files to Create

- `src/routes/__root.tsx` - Root layout
- `src/routes/index.tsx` - Dashboard
- `src/routes/parties/` - Party routes
- `src/routes/items/` - Items routes
- (etc. for each feature)

---

## Phase 3: Feature Modules

### 3.1 Dashboard (`src/features/dashboard/`)

- **Metrics cards**: Total Receivable, Total Payable (with gradients)
- **Sales graph**: Area chart with teal gradient fill
- **Quick reports**: Card links to common reports
- **Quick actions**: Floating "Add Sale" / "Add Purchase" buttons

### 3.2 Party Management (`src/features/parties/`)

- **PartyList**: Searchable list with amount badges
- **PartyDetail**: Contact info + transaction table
- **AddPartyModal**: Create/edit party form
- **Types**: Party, PartyTransaction interfaces

### 3.3 Items/Inventory (`src/features/inventory/`) - ENHANCE EXISTING

- **ItemList**: Enhanced with categories filter
- **ItemDetail**: Full item view with stock history
- **AddItemModal**: Multi-step form (Details → Pricing → Stock)
- **CategoryManager**: Category CRUD
- **UnitSelector**: Unit management

### 3.4 Sales Module (`src/features/sales/`)

- **SaleInvoiceList**: Invoice list with status badges
- **SaleInvoiceForm**: Full invoice creation form
- **EstimateList/Form**: Quotation management
- **PaymentInList/Form**: Payment recording
- **CreditNoteList/Form**: Returns/credit notes

### 3.5 Purchase Module (`src/features/purchases/`)

- **PurchaseInvoiceList/Form**: Purchase invoices
- **PaymentOutList/Form**: Payment recording
- **ExpenseList/Form**: Expense tracking with categories

### 3.6 Cash & Bank (`src/features/cash-bank/`)

- **BankAccountList**: Bank accounts management
- **CashInHand**: Cash tracking with adjustments
- **ChequeList**: Cheque management
- **LoanAccountList**: Loan tracking

### 3.7 Reports (`src/features/reports/`)

- **ReportHub**: Report type selector
- **SaleReport**: Filtered sales data
- **PurchaseReport**: Filtered purchase data
- **PartyStatement**: Party-wise statements
- **DaybookReport**: Daily transactions
- **ProfitLoss**: P&L statement

### 3.8 Utilities (`src/features/utilities/`)

- **ImportItems/Parties**: Excel import wizard
- **ExportModal**: Data export options
- **BulkUpdate**: Mass item updates
- **RecycleBin**: Deleted items recovery
- **GSTUpdate**: Tax rate management

### 3.9 Sync & Backup (`src/features/sync/`)

- **BackupManager**: Local/Drive backup
- **RestoreWizard**: Restore from backup
- **SyncStatus**: Sync indicator component

---

## Phase 4: State Management

### 4.1 Zustand Stores (`src/stores/`)

```typescript
useAuthStore     - User session, company info
useUIStore       - Sidebar state, modals, toasts
useFilterStore   - Global filters (date range, search)
useSyncStore     - Sync status, last backup
```

### 4.2 Data Hooks Pattern

Each feature will have hooks in `hooks/` folder:

- `useParties()`, `usePartyById()`, `useCreateParty()`
- `useSaleInvoices()`, `useCreateSaleInvoice()`
- etc.

---

## Phase 5: Database Schema Extensions

### 5.1 New Tables (PowerSync schema)

```
parties         - Customer/Vendor records
sale_invoices   - Sale invoice headers
sale_items      - Sale invoice line items
purchase_invoices - Purchase headers
purchase_items  - Purchase line items
payments        - Payment-in/out records
expenses        - Expense records
bank_accounts   - Bank account records
categories      - Item categories
units           - Measurement units
```

---

## Implementation Order

### Sprint 0: Setup & Dependencies (Day 1)

```bash
npm install framer-motion recharts react-hook-form @hookform/resolvers zod date-fns
npm install -D @types/node
```

### Sprint 1: Design System (Week 1)

1. **Design tokens** - Colors, typography, spacing, shadows
2. **Tailwind config update** - Custom theme with teal palette
3. **Base primitives** - Unstyled component logic (hooks, types)
4. **Core UI components**:
   - Button (primary, secondary, ghost, danger, loading states)
   - Input (text, number, search, with icons, validation states)
   - Select (single, searchable, with custom options)
   - Modal/Dialog (sizes, animations, backdrop)
   - Card (header, body, footer, hover states)
   - Badge (status colors, sizes)
   - Tabs (horizontal, with icons)
   - Toast notifications
5. **Form components**:
   - FormField wrapper with labels, errors
   - Checkbox, Radio, Switch
   - DatePicker, DateRangePicker
   - Textarea
6. **Data display**:
   - Table (sortable, filterable headers)
   - DataGrid (virtualized for large datasets)
   - EmptyState, LoadingState, ErrorState

### Sprint 2: Layout & Navigation (Week 2)

1. AppShell (sidebar + content layout)
2. Sidebar navigation component
3. PageHeader with breadcrumbs
4. MasterDetail split view
5. Routing setup with @tanstack/react-router
6. Zustand store setup (UI state, filters)

### Sprint 3: Core Features (Week 3-4)

1. Dashboard with metrics and graph
2. Party management (list, detail, CRUD)
3. Enhanced inventory management
4. Category & unit management

### Sprint 4: Transactions (Week 5-6)

1. Sale invoice creation flow
2. Purchase invoice flow
3. Payment-in/out recording
4. Expense tracking

### Sprint 5: Advanced Features (Week 7-8)

1. Cash & Bank management
2. Reports module
3. Estimates/Quotations
4. Credit/Debit notes

### Sprint 6: Utilities & Polish (Week 9-10)

1. Import/Export functionality
2. Backup/Restore
3. Bulk updates
4. GST management
5. Animation polish
6. Testing & bug fixes

---

## Files to Create (Initial)

### Components

- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/modal.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/index.ts`
- `src/components/layout/app-shell.tsx`
- `src/components/layout/sidebar.tsx`
- `src/components/layout/page-header.tsx`

### Design System

- `src/lib/design-tokens.ts`
- `tailwind.config.js` (update)
- `src/index.css` (update)

### Routing

- `src/routes/__root.tsx`
- `src/routes/index.tsx`
- `src/routeTree.gen.ts`

### Stores

- `src/stores/ui-store.ts`
- `src/stores/auth-store.ts`
- `src/stores/index.ts`

---

## Key Technical Decisions

1. **Component Architecture**: Compound components where appropriate (e.g., `<Table.Header>`, `<Table.Row>`)
2. **Form Handling**: React Hook Form for complex forms
3. **Animations**: Framer Motion for page transitions, CSS for micro-interactions
4. **Charts**: Recharts for dashboard graphs
5. **Date Handling**: date-fns for date manipulation
6. **Icons**: Lucide React (already installed)
7. **Virtualization**: TanStack Virtual for long lists (already installed)

---

## Success Criteria

- [ ] All Vyapar UX flows are replicated
- [ ] UI is visually distinct and modern
- [ ] Offline-first with PowerSync sync
- [ ] Sub-200ms interaction response times
- [ ] Accessible (WCAG 2.1 AA)
- [ ] TypeScript strict mode compliant
