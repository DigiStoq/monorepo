-- ============================================================================
-- MIGRATION 017: Create Stock Ledger View
-- Created: 2026-01-30
-- Description: Creates a unified view of all stock-affecting transactions
--              (Purchases, Sales, Returns, Adjustments) for history tracking.
-- ============================================================================

CREATE OR REPLACE VIEW stock_ledger AS
-- Purchases (Incoming Stock)
SELECT
    pii.id as id,
    pi.date as transaction_date,
    'purchase' as transaction_type,
    pi.invoice_number as reference_number,
    c.name as party_name,
    pii.item_id,
    pii.item_name,
    pii.quantity as quantity_change, -- Positive
    pii.unit_price,
    pi.status as payment_status,
    pi.created_at
FROM purchase_invoice_items pii
JOIN purchase_invoices pi ON pii.invoice_id = pi.id
LEFT JOIN customers c ON pi.customer_id = c.id

UNION ALL

-- Sales (Outgoing Stock)
SELECT
    sii.id,
    si.date as transaction_date,
    'sale' as transaction_type,
    si.invoice_number as reference_number,
    c.name as party_name,
    sii.item_id,
    sii.item_name,
    -sii.quantity as quantity_change, -- Negative
    sii.unit_price,
    si.status as payment_status,
    si.created_at
FROM sale_invoice_items sii
JOIN sale_invoices si ON sii.invoice_id = si.id
LEFT JOIN customers c ON si.customer_id = c.id

UNION ALL

-- Credit Notes (Sales Returns - Incoming Stock)
SELECT
    cni.id,
    cn.date as transaction_date,
    'credit_note' as transaction_type,
    cn.credit_note_number as reference_number,
    c.name as party_name,
    cni.item_id,
    cni.item_name,
    cni.quantity as quantity_change, -- Positive
    cni.unit_price,
    'approved' as payment_status,
    cn.created_at
FROM credit_note_items cni
JOIN credit_notes cn ON cni.credit_note_id = cn.id
LEFT JOIN customers c ON cn.customer_id = c.id

UNION ALL

-- Manual Adjustments (Variable Stock)
SELECT
    ih.id::uuid,
    ih.created_at::date as transaction_date,
    'adjustment' as transaction_type,
    'MANUAL' as reference_number,
    ih.user_name as party_name,
    ih.item_id::uuid,
    i.name as item_name,
    -- Extract adjustment value from JSON. 
    -- JSON format: { "stockQuantity": X, "adjustment": Y }
    COALESCE(CAST(ih.new_values::json->>'adjustment' AS DECIMAL), 0) as quantity_change,
    0 as unit_price,
    'completed' as payment_status,
    ih.created_at::timestamptz
FROM item_history ih
LEFT JOIN items i ON ih.item_id::uuid = i.id
WHERE ih.action = 'stock_adjusted';

-- Note: This View is server-side only for now. 
-- To use in the app with PowerSync, we will likely replicate this logic 
-- in a client-side query since we sync the underlying tables.
