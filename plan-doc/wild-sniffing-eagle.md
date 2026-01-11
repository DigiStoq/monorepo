# Delete Validation & Cascade Fix Plan

## Current Issues Found

### 1. Incomplete Delete Cascades

| Entity           | Deletes Related | Reverses Balance | Reverses Stock | Deletes Linked Payments   |
| ---------------- | --------------- | ---------------- | -------------- | ------------------------- |
| Sale Invoice     | Items only      | YES              | YES            | NO                        |
| Purchase Invoice | Items only      | NO               | NO             | NO                        |
| Expense          | None            | N/A              | N/A            | N/A                       |
| Payment In       | None            | YES (customer)   | N/A            | N/A (but updates invoice) |
| Payment Out      | None            | YES (supplier)   | N/A            | N/A (but updates invoice) |

**Critical:** When deleting an invoice, linked payments remain orphaned with invalid `invoice_id` references.

### 2. Missing Confirmation Dialogs

- **Has confirmation:** Sale Invoices only
- **No confirmation:** Purchase Invoices, Expenses, Payment In, Payment Out, Bank Accounts, Customers, Items

### 3. User Requirement

User wants to type "delete" to confirm deletion (more secure than just a button click).

---

## Implementation Plan

### Part 1: Create TypeToConfirm Delete Dialog Component

**File:** `src/components/ui/confirm-delete-dialog.tsx`

Create a reusable component that:

- Shows a modal with warning message
- Requires user to type "delete" in an input field
- Only enables the delete button when input matches "delete"
- Shows entity-specific information (invoice number, customer name, etc.)
- Has loading state during deletion

```tsx
interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string; // e.g., "INV-001" or "John Doe"
  itemType: string; // e.g., "invoice", "customer", "expense"
  warningMessage?: string;
  isLoading?: boolean;
}
```

### Part 2: Fix Purchase Invoice Delete (Missing Reversals)

**File:** `src/hooks/usePurchaseInvoices.ts`

Update `deleteInvoice` to match sale invoice pattern:

1. Get invoice details (supplier_id, total)
2. Get items (item_id, quantity)
3. Reverse stock for each item (`stock_quantity + quantity`)
4. Reverse supplier balance (`current_balance + total`)
5. Delete invoice items
6. Delete invoice

### Part 3: Handle Orphaned Payments on Invoice Delete

**Decision needed:** When deleting an invoice, should we:

- **Option A:** Delete all linked payments (and reverse their transactions)
- **Option B:** Unlink payments (set invoice_id to null) but keep them
- **Option C:** Block deletion if payments exist (require deleting payments first)

**Recommendation:** Option C - Block deletion if payments exist. This is safest for accounting integrity.

### Part 4: Add Confirmation Dialogs to All Delete Operations

**Files to update:**

1. **Purchase Invoices** - `src/features/purchases/purchase-invoices-page.tsx`
2. **Expenses** - `src/features/purchases/expenses-page.tsx`
3. **Payment In** - `src/features/sales/payment-in-page.tsx`
4. **Payment Out** - `src/features/purchases/payment-out-page.tsx`
5. **Bank Accounts** - `src/features/cash-bank/bank-accounts-page.tsx`
6. **Customers** - `src/features/customers/customers-page.tsx`
7. **Items** - `src/features/items/items-page.tsx`
8. **Sale Invoices** - Update existing modal to use new component

For each:

- Add state for delete modal and item to delete
- Replace direct delete with modal trigger
- Use new `ConfirmDeleteDialog` component

### Part 5: Export Component from UI Index

**File:** `src/components/ui/index.ts`

Add export for new component.

---

## Files to Modify

1. `src/components/ui/confirm-delete-dialog.tsx` (NEW)
2. `src/components/ui/index.ts`
3. `src/hooks/usePurchaseInvoices.ts`
4. `src/features/purchases/purchase-invoices-page.tsx`
5. `src/features/purchases/expenses-page.tsx`
6. `src/features/sales/payment-in-page.tsx`
7. `src/features/purchases/payment-out-page.tsx`
8. `src/features/cash-bank/bank-accounts-page.tsx`
9. `src/features/customers/customers-page.tsx`
10. `src/features/items/items-page.tsx`
11. `src/features/sales/sale-invoices-page.tsx`

---

## Questions for User

1. When deleting an invoice that has payments recorded against it, should we:
   - A) Block deletion (require deleting payments first)
   - B) Delete the linked payments too
   - C) Unlink payments but keep them as standalone records

2. Should the confirmation word be "delete" or the item name (e.g., type "INV-001" to delete invoice INV-001)?
