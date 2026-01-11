import { useState, useMemo } from "react";
import { Card, CardBody, Select, type SelectOption } from "@/components/ui";
import { ReportLayout, DateRangeFilter } from "../components";
import { User, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DateRange, CustomerStatement, CustomerLedgerEntry } from "../types";

// ============================================================================
// MOCK DATA
// ============================================================================

const mockCustomers = [
  { id: "1", name: "Acme Electronics", type: "customer" },
  { id: "2", name: "Global Traders Inc", type: "customer" },
  { id: "3", name: "Metro Supplies Co", type: "customer" },
  { id: "s1", name: "Global Supply Co", type: "supplier" },
  { id: "s2", name: "Metro Distributors", type: "supplier" },
];

const mockStatement: CustomerStatement = {
  customerId: "1",
  customerName: "Acme Electronics",
  customerType: "customer",
  openingBalance: 5000,
  totalDebit: 28500,
  totalCredit: 22000,
  closingBalance: 11500,
  entries: [
    { id: "1", date: "2024-01-01", type: "opening", referenceNumber: "-", description: "Opening Balance", debit: 5000, credit: 0, balance: 5000 },
    { id: "2", date: "2024-01-05", type: "invoice", referenceNumber: "INV-1001", description: "Sale - Laptop Pro x5", debit: 6000, credit: 0, balance: 11000 },
    { id: "3", date: "2024-01-08", type: "payment", referenceNumber: "REC-001", description: "Payment Received - Cash", debit: 0, credit: 4000, balance: 7000 },
    { id: "4", date: "2024-01-12", type: "invoice", referenceNumber: "INV-1015", description: "Sale - Office Chairs x10", debit: 3500, credit: 0, balance: 10500 },
    { id: "5", date: "2024-01-15", type: "payment", referenceNumber: "REC-008", description: "Payment Received - Bank Transfer", debit: 0, credit: 5000, balance: 5500 },
    { id: "6", date: "2024-01-18", type: "invoice", referenceNumber: "INV-1022", description: "Sale - Wireless Mouse x50", debit: 1250, credit: 0, balance: 6750 },
    { id: "7", date: "2024-01-20", type: "credit_note", referenceNumber: "CN-003", description: "Return - Defective items", debit: 0, credit: 250, balance: 6500 },
    { id: "8", date: "2024-01-22", type: "invoice", referenceNumber: "INV-1028", description: "Sale - Desk Lamps x20", debit: 900, credit: 0, balance: 7400 },
    { id: "9", date: "2024-01-25", type: "payment", referenceNumber: "REC-015", description: "Payment Received - Cheque", debit: 0, credit: 3000, balance: 4400 },
    { id: "10", date: "2024-01-28", type: "invoice", referenceNumber: "INV-1035", description: "Sale - Tool Kits x15", debit: 2700, credit: 0, balance: 7100 },
    { id: "11", date: "2024-01-30", type: "payment", referenceNumber: "REC-018", description: "Payment Received - UPI", debit: 0, credit: 2500, balance: 4600 },
    { id: "12", date: "2024-02-02", type: "invoice", referenceNumber: "INV-1042", description: "Sale - Storage Bins x100", debit: 1500, credit: 0, balance: 6100 },
  ],
};

// ============================================================================
// COMPONENT
// ============================================================================

export function CustomerStatementReport() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth() - 2, 1);

  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("1");

  const customerOptions: SelectOption[] = useMemo(() => [
    { value: "", label: "Select a customer..." },
    ...mockCustomers.map((c) => ({
      value: c.id,
      label: `${c.name} (${c.type})`,
    })),
  ], []);

  const statement = mockStatement;

  // Format currency
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  // Entry type badge styles
  const getEntryTypeStyle = (type: CustomerLedgerEntry["type"]) => {
    switch (type) {
      case "invoice":
        return "bg-blue-100 text-blue-700";
      case "payment":
        return "bg-green-100 text-green-700";
      case "credit_note":
        return "bg-orange-100 text-orange-700";
      case "opening":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getEntryTypeLabel = (type: CustomerLedgerEntry["type"]) => {
    switch (type) {
      case "invoice":
        return "Invoice";
      case "payment":
        return "Payment";
      case "credit_note":
        return "Credit Note";
      case "opening":
        return "Opening";
      default:
        return type;
    }
  };

  return (
    <ReportLayout
      title="Customer Statement"
      subtitle="Detailed ledger for customer or supplier"
      onRefresh={() => console.log("Refresh")}
      onExport={() => console.log("Export")}
      onPrint={() => window.print()}
      filters={
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Customer:</span>
            <Select
              options={customerOptions}
              value={selectedCustomerId}
              onChange={setSelectedCustomerId}
              className="w-64"
            />
          </div>
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
      }
    >
      {selectedCustomerId ? (
        <>
          {/* Customer Info & Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Customer Details */}
            <Card>
              <CardBody className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary-100">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{statement.customerName}</h3>
                    <span className={cn(
                      "inline-block px-2 py-0.5 text-xs rounded-full mt-1",
                      statement.customerType === "customer" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                    )}>
                      {statement.customerType === "customer" ? "Customer" : "Supplier"}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Debits */}
            <Card>
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Total Debit</p>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(statement.totalDebit)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-100">
                    <ArrowUpCircle className="h-5 w-5 text-blue-700" />
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Credits */}
            <Card>
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Total Credit</p>
                    <p className="text-2xl font-bold text-slate-900">{formatCurrency(statement.totalCredit)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-100">
                    <ArrowDownCircle className="h-5 w-5 text-green-700" />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Statement Table */}
          <Card>
            <CardBody className="p-0">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Type</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Reference</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Description</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Debit</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Credit</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statement.entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(entry.date)}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 text-xs rounded-full", getEntryTypeStyle(entry.type))}>
                          {getEntryTypeLabel(entry.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-600">{entry.referenceNumber}</td>
                      <td className="px-4 py-3 text-sm text-slate-900">{entry.description}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        {entry.debit > 0 && (
                          <span className="text-blue-600 font-medium">{formatCurrency(entry.debit)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {entry.credit > 0 && (
                          <span className="text-green-600 font-medium">{formatCurrency(entry.credit)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">
                        {formatCurrency(entry.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-slate-900">
                      Closing Balance
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">
                      {formatCurrency(statement.totalDebit)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                      {formatCurrency(statement.totalCredit)}
                    </td>
                    <td className={cn(
                      "px-4 py-3 text-sm text-right font-bold",
                      statement.closingBalance >= 0 ? "text-blue-600" : "text-green-600"
                    )}>
                      {formatCurrency(Math.abs(statement.closingBalance))}
                      <span className="text-xs ml-1">
                        {statement.closingBalance >= 0 ? "Dr" : "Cr"}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </CardBody>
          </Card>
        </>
      ) : (
        <Card>
          <CardBody className="py-12 text-center">
            <User className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">Select a Customer</h3>
            <p className="text-slate-500">Choose a customer or supplier to view their statement</p>
          </CardBody>
        </Card>
      )}
    </ReportLayout>
  );
}
