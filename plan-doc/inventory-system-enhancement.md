# Inventory System Enhancement Plan

## Objective

Implement a robust persistent stock history system, ensure unique SKU enforcement with search capabilities, and allow flexible payment dating.

## Status

- [x] Phase 1: Backend - Stock History View (Migration Created)
- [x] Phase 2: Frontend - Stock History UI (Implemented Modal & Ledger Logic)
- [x] Phase 3: Frontend - Search & SKU (Validation Added)
- [x] Phase 4: Frontend - Payment Dates (Verified Existing Implementation)

## Phase 1: Backend - Stock History View

The goal is to provide a unified history of all stock movements for an item.
Instead of a separate table that might get out of sync, we will create a PostgreSQL View `item_stock_ledger` that aggregates data from all transaction tables.

### Tasks

1.  **Create Migration**: `017_create_stock_ledger_view.sql`
    - `UNION ALL` query combining:
      - `purchase_invoice_items` (Positive Quantity)
      - `sale_invoice_items` (Negative Quantity)
      - `credit_note_items` (Positive Quantity - Return from customer)
      - `item_history` (Variable Quantity - for manual 'stock_adjusted' events)
    - **Joins**: Link to `sale_invoices` and `purchase_invoices` to fetch `payment_status` / `status`.
    - Select columns: `transaction_id`, `transaction_number`, `transaction_date`, `transaction_type`, `item_id`, `quantity`, `unit_price`, `entity_name` (Customer/Supplier), `payment_status`.

## Phase 2: Frontend - Stock History UI

Allow users to view the history created in Phase 1.

### Tasks

1.  **Create `StockHistoryModal` Component**
    - Props: `itemId`, `open`, `onClose`.
    - Fetch data from `item_stock_ledger` (or via new RPC function if View direct access is restricted).
    - Display a clean, paginated table of transactions.
    - Show "Running Balance" (can be calculated client-side or window function in SQL).
2.  **Update `ItemsPage`**
    - Add a "History" action button to the Item row actions.
    - Connect it to the `StockHistoryModal`.

## Phase 3: Frontend - Search & SKU

Enhance finding products.

### Tasks

1.  **Verify `items` Table**: Schema already has `sku VARCHAR(100) UNIQUE`.
2.  **Update `ItemsPage` Search**
    - Ensure the local search/filter logic includes the `sku` field.
3.  **Update `ItemForm`**
    - Ensure `sku` field is prominent.
    - Add validation feedback if SKU already exists (handle `23505` unique_violation cleanly).

## Phase 4: Frontend - Payment Dates

Allow backdating/future-dating payments.

### Tasks

1.  **Update `PaymentInForm.tsx`**
    - Ensure the `date` field uses a Date Picker component.
    - Verify it defaults to `today` but allows selection.
2.  **Update `PaymentOutForm.tsx`**
    - Same as above.
