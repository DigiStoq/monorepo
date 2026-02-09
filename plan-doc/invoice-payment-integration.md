# Invoice Payment Integration Plan

## Goal

Enable granular payment tracking for Sales and Purchase invoices, allowing users to record partial payments, specify payment dates, and view a complete payment history per invoice.

## Status: ✅ COMPLETE

## Changes Implemented

### Phase 1: Backend Hooks

- [x] Created `usePaymentsByInvoiceId` hook in `src/hooks/usePaymentIns.ts`
- [x] Created `usePaymentOutsByInvoiceId` hook in `src/hooks/usePaymentOuts.ts`
- _Note:_ Balance recalculation already handled by frontend mutation logic in `createPayment`.

### Phase 2: Sales Invoice Details (Frontend)

- [x] Added `PaymentHistoryCard` component (`src/components/common/payment-history-card.tsx`)
- [x] Integrated into `InvoiceDetail.tsx` (Sales)
- [x] Payment history section shows all payments with date, reference, mode, and amount.
- [x] "Record Payment" button already exists in the header.

### Phase 3: Purchase Invoice Details (Frontend)

- [x] Integrated into `PurchaseInvoiceDetail.tsx` (Purchases)
- [x] Payment history section shows all payments.
- [x] "Record Payment" button already exists.

### Phase 4: Payment Editing

- [N/A] Skipped for now. Editing payments would require an "Edit Payment Modal" which can be added later.

## Files Modified/Created

- `src/hooks/usePaymentIns.ts` - Added `usePaymentsByInvoiceId`
- `src/hooks/usePaymentOuts.ts` - Added `usePaymentOutsByInvoiceId`
- `src/components/common/payment-history-card.tsx` - **NEW**
- `src/components/common/index.ts` - Export `PaymentHistoryCard`
- `src/features/sales/components/invoice-detail.tsx` - Integrated `PaymentHistoryCard`
- `src/features/purchases/components/purchase-invoice-detail.tsx` - Integrated `PaymentHistoryCard`
