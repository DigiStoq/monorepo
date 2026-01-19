import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PurchaseInvoicesPage } from "../purchase-invoices-page";

// Data Mocks
const mockInvoices = [
  {
    id: "1",
    invoiceNumber: "PUR-001",
    customerName: "Supplier A",
    date: "2023-01-01",
    total: 500,
    amountPaid: 500,
    amountDue: 0,
    status: "paid",
  },
  {
    id: "2",
    invoiceNumber: "PUR-002",
    customerName: "Supplier B",
    date: "2023-01-02",
    total: 1000,
    amountPaid: 0,
    amountDue: 1000,
    status: "ordered",
  },
];

const mockCreateInvoice = vi.fn();

vi.mock("@/hooks/usePurchaseInvoices", () => ({
  usePurchaseInvoices: () => ({
    invoices: mockInvoices,
    isLoading: false,
    error: null,
  }),
  usePurchaseInvoiceMutations: () => ({
    createInvoice: mockCreateInvoice,
    deleteInvoice: vi.fn(),
    updateInvoiceStatus: vi.fn(),
  }),
  usePurchaseInvoiceLinkedItems: () => [],
}));

vi.mock("@/hooks/useCustomers", () => ({
  useCustomers: () => ({ customers: [] }),
}));

vi.mock("@/hooks/useItems", () => ({
  useItems: () => ({ items: [] }),
}));

vi.mock("@/hooks/useBankAccounts", () => ({
  useBankAccounts: () => ({ accounts: [] }),
  useBankAccountMutations: () => ({ createAccount: vi.fn() }),
}));

vi.mock("@/hooks/usePaymentOuts", () => ({
  usePaymentOutMutations: () => ({ createPayment: vi.fn() }),
}));

vi.mock("@/hooks/useCashTransactions", () => ({
  useCashTransactionMutations: () => ({ createTransaction: vi.fn() }),
}));

vi.mock("@/hooks/useBankTransactions", () => ({
  useBankTransactionMutations: () => ({ createTransaction: vi.fn() }),
}));

vi.mock("@/hooks/useCheques", () => ({
  useChequeMutations: () => ({ createCheque: vi.fn() }),
}));

vi.mock("@/hooks/usePDFGenerator", () => ({
  usePDFGenerator: () => ({
    printPurchaseInvoice: vi.fn(),
    downloadPurchaseInvoice: vi.fn(),
    isReady: true,
  }),
}));

vi.mock("@/hooks/useCurrency", () => ({
  useCurrency: () => ({
    formatCurrency: (val: number) => `$${val.toFixed(2)}`,
  }),
}));

// Component Mocks
vi.mock("../components", () => ({
  PurchaseInvoiceList: ({ invoices, onInvoiceClick }: any) => (
    <div data-testid="purchase-list">
      {invoices.map((inv: any) => (
        <div key={inv.id} onClick={() => onInvoiceClick(inv)}>
          {inv.invoiceNumber}
        </div>
      ))}
    </div>
  ),
  PurchaseInvoiceDetail: ({ invoice, onClose }: any) => (
    <div data-testid="purchase-detail">
      Details for {invoice?.invoiceNumber ?? "N/A"}
      <button onClick={onClose}>Close</button>
    </div>
  ),
  PurchaseInvoiceForm: ({ onCancel, onSubmit }: any) => (
    <div data-testid="purchase-form">
      <button
        onClick={() =>
          onSubmit({ customerId: "s1", date: "2023-01-01", items: [] })
        }
      >
        Submit Purchase
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock("@/components/ui", () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
  Input: (props: any) => <input {...props} />,
  Select: () => <div>Select</div>,
  Modal: ({ isOpen, children }: any) => (isOpen ? <div>{children}</div> : null),
  ModalContent: ({ children }: any) => <div>{children}</div>,
  ModalHeader: ({ children }: any) => <div>{children}</div>,
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
  ConfirmDeleteDialog: () => <div>Delete Dialog</div>,
}));

vi.mock("@/components/layout", () => ({
  PageHeader: ({ title, actions }: any) => (
    <div data-testid="page-header">
      {title}
      {actions}
    </div>
  ),
}));

vi.mock("@/components/common", () => ({
  Spinner: () => <div>Loading...</div>,
}));

describe("PurchaseInvoicesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders purchase list and stats", () => {
    render(<PurchaseInvoicesPage />);

    expect(screen.getByTestId("page-header")).toHaveTextContent(
      "Purchase Invoices"
    );
    expect(screen.getByTestId("purchase-list")).toBeInTheDocument();

    // Check stats (Total: 1500, Paid: 500, Pending: 1000)
    expect(screen.getByText("$1500.00")).toBeInTheDocument();
    expect(screen.getByText("$500.00")).toBeInTheDocument();
    expect(screen.getByText("$1000.00")).toBeInTheDocument();
  });

  it("opens create purchase form", () => {
    render(<PurchaseInvoicesPage />);

    fireEvent.click(screen.getByText("New Purchase"));

    expect(screen.getByTestId("purchase-form")).toBeInTheDocument();
  });

  it("opens purchase details", () => {
    render(<PurchaseInvoicesPage />);

    fireEvent.click(screen.getByText("PUR-001"));

    expect(screen.getByTestId("purchase-detail")).toBeInTheDocument();
    expect(screen.getByText("Details for PUR-001")).toBeInTheDocument();
  });

  it("filters purchases", () => {
    render(<PurchaseInvoicesPage />);

    const searchInput = screen.getByPlaceholderText("Search purchases...");
    fireEvent.change(searchInput, { target: { value: "PUR-002" } });

    expect(screen.getByText("PUR-002")).toBeInTheDocument();
    expect(screen.queryByText("PUR-001")).not.toBeInTheDocument();
  });
});
