# Mobile App Gap Analysis

Comparison between Desktop (`src/features`) and Mobile (`mobile/src/screens`).

## 1. Critical UX/Feature Gaps (Sales & Purchases)

**Core Issue:** Mobile uses **Edit Forms** as the primary view for entities, whereas Desktop has dedicated **Detail Views** (Read-Only) with Action Buttons. This creates a risk of accidental edits and clutters the interface.

| Feature               | Desktop Implementation                                                      | Mobile Status                                                        | Gap                                                                                        |
| :-------------------- | :-------------------------------------------------------------------------- | :------------------------------------------------------------------- | :----------------------------------------------------------------------------------------- |
| **Estimates**         | `EstimateDetail` page with actions: _Convert, Email, Print, Status Change_. | `EstimateFormScreen` (Edit Mode). Actions buried in form or missing. | **Missing `EstimateDetailScreen`**. Workflow to "View" and "Action" is merged with "Edit". |
| **Credit Notes**      | `CreditNoteDetail` page.                                                    | `CreditNoteFormScreen` only.                                         | **Missing `CreditNoteDetailScreen`**.                                                      |
| **Payments (In/Out)** | Dedicated Detail pages.                                                     | Forms only.                                                          | **Missing Detail Screens**.                                                                |
| **Expenses**          | `ExpenseDetail` page.                                                       | `ExpenseFormScreen` only.                                            | **Missing `ExpenseDetailScreen`**.                                                         |

**Missing Actions in Mobile:**

- **Email/Share**: Mobile has PDF Generation, but lacks specific "Mark Sent" or "Email" workflows visible in the main UI flow.
- **Status Change**: Desktop allows changing status (Accepted/Rejected) from Detail view. Mobile form allows changing dropdown, but it's manual.

## 2. Inventory Gaps

| Feature              | Desktop Implementation                      | Mobile Status                                                 | Gap                                                  |
| :------------------- | :------------------------------------------ | :------------------------------------------------------------ | :--------------------------------------------------- |
| **Stock Adjustment** | `StockAdjustmentModal` (Manual Add/Reduce). | Missing. `ItemDetailScreen` shows stock but no adjust action. | **Critical Missing Feature**.                        |
| **Audit Log**        | `ItemHistory` (User actions, timestamps).   | `RecentTransactions` (Invoices only).                         | **Missing Audit Log** (Who changed stock and when?). |

## 3. Report Gaps

- **Purchase By Item Report**: Present in Desktop (`purchase-by-item-report.tsx`). Missing in Mobile.

## 4. UI/UX Differences

- **Dashboard**: Mobile has good widgets (Stock Status) but lacks **Quick Actions** found in Desktop.
- **Navigation**: Mobile relies on List -> Form. Desktop uses List -> Detail -> Form.

## 5. Anomalies

- **Purchase Orders**: Mobile has `PurchaseOrderFormScreen` and `PurchaseOrdersScreen`. These were **NOT** found in Desktop's `src/features/purchases`. Mobile might be ahead here, or Desktop manages Orders differently.

## Recommendation

1.  **High Priority**: Implement **Detail Screens** for Estimates, Credit Notes, Expenses, and Payments to separate "View/Action" from "Edit".
2.  **High Priority**: Implement **Stock Adjustment** and **Item History** in `ItemDetailScreen`.
3.  **Medium Priority**: Implement missing Reports.
