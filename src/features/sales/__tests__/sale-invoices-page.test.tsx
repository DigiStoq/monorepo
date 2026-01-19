import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SaleInvoicesPage } from "../sale-invoices-page";

// Hook Mocks
const mockInvoices = [
  {
    id: "1",
    invoiceNumber: "INV-001",
    customerName: "Customer A",
    date: "2023-01-01",
    total: 100,
    amountPaid: 100,
    amountDue: 0,
    status: "paid",
  },
  {
    id: "2",
    invoiceNumber: "INV-002",
    customerName: "Customer B",
    date: "2023-01-02",
    total: 200,
    amountPaid: 0,
    amountDue: 200,
    status: "unpaid",
  },
];

const mockCreateInvoice = vi.fn();
const mockUpdateInvoice = vi.fn();
const mockDeleteInvoice = vi.fn();

vi.mock("@/hooks/useSaleInvoices", () => ({
  useSaleInvoices: vi.fn(() => ({
    invoices: mockInvoices,
    isLoading: false,
    error: null,
  })),
  useSaleInvoiceMutations: () => ({
    createInvoice: mockCreateInvoice,
    updateInvoice: mockUpdateInvoice,
    updateInvoiceStatus: vi.fn(),
    deleteInvoice: mockDeleteInvoice,
  }),
  useSaleInvoiceById: vi.fn(() => ({
    invoice: null,
    items: [],
    isLoading: false,
  })),
  useSaleInvoiceLinkedItems: () => [],
}));

vi.mock("@/hooks/useCustomers", () => ({
  useCustomers: () => ({ customers: [{ id: "c1", name: "Customer A" }] }),
}));

vi.mock("@/hooks/useItems", () => ({
  useItems: () => ({ items: [], isLoading: false }),
  useItemMutations: () => ({ adjustStock: vi.fn() }),
}));

vi.mock("@/hooks/useBankAccounts", () => ({
  useBankAccounts: () => ({ accounts: [] }),
  useBankAccountMutations: () => ({ createAccount: vi.fn() }),
}));

vi.mock("@/hooks/usePaymentIns", () => ({
  usePaymentInMutations: () => ({ createPayment: vi.fn() }),
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
    downloadSaleInvoice: vi.fn(),
    printSaleInvoice: vi.fn(),
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
  InvoiceList: ({ invoices, onInvoiceClick }: any) => (
    <div data-testid="invoice-list">
      {invoices.map((inv: any) => (
        <div key={inv.id} onClick={() => onInvoiceClick(inv)}>
          {inv.invoiceNumber}
        </div>
      ))}
    </div>
  ),
  InvoiceDetail: ({ invoice, onClose }: any) => (
    <div data-testid="invoice-detail">
      Details for {invoice?.invoiceNumber ?? "N/A"}
      <button onClick={onClose}>Close</button>
    </div>
  ),
  InvoiceForm: ({ onCancel, onSubmit }: any) => (
    <div data-testid="invoice-form">
      <button
        onClick={() =>
          onSubmit({ customerId: "c1", date: "2023-01-01", items: [] })
        }
      >
        Submit Form
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
  SearchInput: ({ value, onChange }: any) => (
    <input data-testid="search-input" value={value} onChange={onChange} />
  ),
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

describe("SaleInvoicesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders invoice list and stats", () => {
    render(<SaleInvoicesPage />);

    expect(screen.getByTestId("page-header")).toHaveTextContent(
      "Sale Invoices"
    );
    expect(screen.getByTestId("invoice-list")).toBeInTheDocument();

    // Check stats rendering (Total Revenue: 300, Paid: 100, Unpaid: 200)
    expect(screen.getByText("$300.00")).toBeInTheDocument(); // Total
    expect(screen.getByText("$100.00")).toBeInTheDocument(); // Paid
    expect(screen.getByText("$200.00")).toBeInTheDocument(); // Unpaid
  });

  it("opens create invoice form on button click", () => {
    render(<SaleInvoicesPage />);

    fireEvent.click(screen.getByText("New Invoice"));

    expect(screen.getByTestId("invoice-form")).toBeInTheDocument();
  });

  it("opens invoice details when an invoice is selected", async () => {
    const { useSaleInvoiceById } =
      await import("../../../hooks/useSaleInvoices");
    (useSaleInvoiceById as ReturnType<typeof vi.fn>).mockReturnValue({
      invoice: mockInvoices[0],
      items: [],
      isLoading: false,
    });

    render(<SaleInvoicesPage />);

    // Click on INV-001 in list
    fireEvent.click(screen.getByText("INV-001"));

    expect(screen.getByTestId("invoice-detail")).toBeInTheDocument();
    expect(screen.getByText("Details for INV-001")).toBeInTheDocument();
  });

  it("filters invoices by search", () => {
    render(<SaleInvoicesPage />);

    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "INV-002" } });

    // Logic is in the component, so filtered list should update.
    // Our mock InvoiceList renders the list it receives.
    // INV-001 should disappear if filter works (logic is inside useMemo in component).

    expect(screen.getByText("INV-002")).toBeInTheDocument();
    expect(screen.queryByText("INV-001")).not.toBeInTheDocument();
  });
});
