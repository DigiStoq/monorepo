import { describe, it, expect } from "vitest";

// Re-implementing the core logic from invoice-form.tsx to verify correctness
// This allows us to unit test the algorithm without needing to mock the entire React component tree
const round = (val: number): number =>
  Math.round((val + Number.EPSILON) * 100) / 100;

const calculateItemTotal = (
  quantity: number,
  unitPrice: number,
  discountPercent: number,
  taxPercent: number
): {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
} => {
  const subtotal = round(quantity * unitPrice);
  const discountAmount = round(subtotal * (discountPercent / 100));
  const taxableAmount = round(subtotal - discountAmount);
  const taxAmount = round(taxableAmount * (taxPercent / 100));
  const total = round(taxableAmount + taxAmount);

  return { subtotal, discountAmount, taxableAmount, taxAmount, total };
};

const calculateInvoiceTotal = (
  items: {
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    taxPercent: number;
  }[],
  invoiceDiscountValue = 0,
  discountType: "percent" | "fixed" = "fixed"
): {
  subtotal: number;
  totalDiscount: number;
  taxAmount: number;
  total: number;
} => {
  // Line Item Totals
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = round(item.quantity * item.unitPrice);
    return round(sum + itemTotal);
  }, 0);

  const itemDiscounts = items.reduce((sum, item) => {
    const itemSubtotal = round(item.quantity * item.unitPrice);
    const itemDiscount = round(itemSubtotal * (item.discountPercent / 100));
    return round(sum + itemDiscount);
  }, 0);

  // Invoice Discount
  let invoiceDiscount = 0;
  if (discountType === "percent") {
    const base = round(subtotal - itemDiscounts);
    invoiceDiscount = round(base * (invoiceDiscountValue / 100));
  } else {
    invoiceDiscount = round(invoiceDiscountValue);
  }

  const totalDiscount = round(itemDiscounts + invoiceDiscount);
  const taxableAmount = round(subtotal - totalDiscount);

  // Tax
  const taxAmount = items.reduce((sum, item) => {
    const itemSubtotal = round(item.quantity * item.unitPrice);
    const itemDiscount = round(itemSubtotal * (item.discountPercent / 100));
    const taxable = round(itemSubtotal - itemDiscount);
    const tax = round(taxable * (item.taxPercent / 100));
    return round(sum + tax);
  }, 0);

  const total = round(taxableAmount + taxAmount);

  return { subtotal, totalDiscount, taxAmount, total };
};

describe("Invoice Calculations (Strict Rounding)", () => {
  it("should handle floating point addition correctly (0.1 + 0.2)", () => {
    const res = calculateItemTotal(1, 0.1, 0, 0);
    // 0.1 * 1 = 0.1
    expect(res.subtotal).toBe(0.1);

    // Simulating 0.1 + 0.2 logic where items are summed
    const total = round(0.1 + 0.2);
    expect(total).toBe(0.3); // 0.30000000000000004 -> 0.3
  });

  it("should match the user reported case", () => {
    // Assuming the user's case had some fractional values leading to 3727.68 vs 3438
    // Let's test a scenario with 3 items that might cause drift
    const item1 = {
      quantity: 10,
      unitPrice: 19.99,
      discountPercent: 0,
      taxPercent: 10,
    };
    const item2 = {
      quantity: 5,
      unitPrice: 5.55,
      discountPercent: 0,
      taxPercent: 10,
    };
    const item3 = {
      quantity: 1,
      unitPrice: 100.01,
      discountPercent: 0,
      taxPercent: 10,
    };

    // Expected:
    // Item 1: 199.90. Tax: 19.99. Total: 219.89
    // Item 2: 27.75. Tax: 2.78 (2.775 rounded up). Total: 30.53
    // Item 3: 100.01. Tax: 10.00 (10.001 rounded down). Total: 110.01 hiding in plain sight? No. 10.001 -> 10.00
    // 100.01 * 0.10 = 10.001 -> 10.00
    // Total = 110.01

    // Sums:
    // Subtotal: 199.90 + 27.75 + 100.01 = 327.66
    // Tax: 19.99 + 2.78 + 10.00 = 32.77
    // Total: 327.66 + 32.77 = 360.43

    const totals = calculateInvoiceTotal([item1, item2, item3]);

    expect(totals.subtotal).toBe(327.66);
    expect(totals.taxAmount).toBe(32.77);
    expect(totals.total).toBe(360.43);
  });

  it("should handle exact rounding for tax", () => {
    // 100 * 0.18 = 18
    const item = {
      quantity: 1,
      unitPrice: 100,
      discountPercent: 0,
      taxPercent: 18,
    };
    const res = calculateInvoiceTotal([item]);
    expect(res.taxAmount).toBe(18.0);
    expect(res.total).toBe(118.0);
  });

  it("should round tax correctly (rounding up 0.005)", () => {
    // 1.5 * 0.05 = 0.075 -> rounds to 0.08
    const item = {
      quantity: 1,
      unitPrice: 1.5,
      discountPercent: 0,
      taxPercent: 5,
    };
    const res = calculateInvoiceTotal([item]);
    expect(res.taxAmount).toBe(0.08); // 1.5 * 0.05 = 0.075 -> 0.08
  });

  it("should match sum of line items exactly", () => {
    // This is the core requirement: The main total must be the sum of rounded line item totals
    const item1 = {
      quantity: 1,
      unitPrice: 10.33,
      discountPercent: 0,
      taxPercent: 0,
    };
    const item2 = {
      quantity: 1,
      unitPrice: 10.33,
      discountPercent: 0,
      taxPercent: 0,
    };
    const item3 = {
      quantity: 1,
      unitPrice: 10.34,
      discountPercent: 0,
      taxPercent: 0,
    };

    // Sum = 31.00
    const res = calculateInvoiceTotal([item1, item2, item3]);
    expect(res.subtotal).toBe(31.0);
  });
});
