import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout";
import { Button, ConfirmDeleteDialog } from "@/components/ui";
import { Spinner } from "@/components/common";
import { Plus } from "lucide-react";
import { CustomerList, CustomerDetail, CustomerFormModal } from "./components";
import {
  useCustomers,
  useCustomerMutations,
  useCustomerTransactions,
} from "@/hooks/useCustomers";
import type {
  Customer,
  CustomerFormData,
  CustomerFilters,
  CustomerType,
  CustomerTransaction,
} from "./types";
import { SearchInput, Select, type SelectOption } from "@/components/ui";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

export function CustomersPage(): React.ReactNode {
  const navigate = useNavigate();

  // Data from PowerSync
  const { customers, isLoading, error } = useCustomers();
  const { createCustomer, updateCustomer, deleteCustomer } =
    useCustomerMutations();

  // State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteRelated, setDeleteRelated] = useState(false);
  const [restoreStock, setRestoreStock] = useState(false);

  // Filter State
  const [filters, setFilters] = useState<CustomerFilters>({
    search: "",
    type: "all",
    balanceType: "all",
    sortBy: "name",
    sortOrder: "asc",
  });

  const typeOptions: SelectOption[] = [
    { value: "all", label: "All Customers" },
    { value: "customer", label: "Customers" },
    { value: "supplier", label: "Suppliers" },
    { value: "both", label: "Both" },
  ];

  const balanceOptions: SelectOption[] = [
    { value: "all", label: "All Balances" },
    { value: "receivable", label: "To Receive" },
    { value: "payable", label: "To Pay" },
  ];

  // Filter Logic
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((customer) => {
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesName = customer.name.toLowerCase().includes(searchLower);
          const matchesPhone = customer.phone?.includes(filters.search);
          const matchesEmail = customer.email
            ?.toLowerCase()
            .includes(searchLower);
          if (!matchesName && !matchesPhone && !matchesEmail) return false;
        }

        // Type filter
        if (filters.type !== "all" && customer.type !== filters.type) {
          return false;
        }

        // Balance filter
        if (
          filters.balanceType === "receivable" &&
          customer.currentBalance <= 0
        ) {
          return false;
        }
        if (filters.balanceType === "payable" && customer.currentBalance >= 0) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;

        switch (filters.sortBy) {
          case "name":
            comparison = a.name.localeCompare(b.name);
            break;
          case "balance":
            comparison =
              Math.abs(b.currentBalance) - Math.abs(a.currentBalance);
            break;
          case "recent":
            comparison =
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            break;
        }

        return filters.sortOrder === "desc" ? -comparison : comparison;
      });
  }, [customers, filters]);

  // Totals Calculation
  const totals = useMemo(() => {
    if (!filteredCustomers.length) return { receivable: 0, payable: 0 };

    return filteredCustomers.reduce(
      (acc, customer) => {
        if (customer.currentBalance > 0) {
          acc.receivable += customer.currentBalance;
        } else {
          acc.payable += Math.abs(customer.currentBalance);
        }
        return acc;
      },
      { receivable: 0, payable: 0 }
    );
  }, [filteredCustomers]);

  const { formatCurrency } = useCurrency();

  // Update selected customer when data changes
  const currentSelectedCustomer = useMemo(() => {
    if (!selectedCustomer) return null;
    return customers.find((c) => c.id === selectedCustomer.id) ?? null;
  }, [customers, selectedCustomer]);

  // Fetch transactions for selected customer from PowerSync
  const { transactions: selectedCustomerTransactions } =
    useCustomerTransactions(currentSelectedCustomer?.id ?? null);

  // Handlers
  const handleAddCustomer = (): void => {
    setEditingCustomer(null);
    setIsFormModalOpen(true);
  };

  const handleEditCustomer = (): void => {
    if (currentSelectedCustomer) {
      setEditingCustomer(currentSelectedCustomer);
      setIsFormModalOpen(true);
    }
  };

  const handleDeleteCustomer = (): void => {
    if (currentSelectedCustomer) {
      setCustomerToDelete(currentSelectedCustomer);
      setDeleteRelated(false);
      setRestoreStock(false);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (customerToDelete) {
      setIsSubmitting(true);
      try {
        await deleteCustomer(customerToDelete.id, deleteRelated, restoreStock);
        toast.success("Customer deleted successfully");
        setIsDeleteModalOpen(false);
        setCustomerToDelete(null);
        setSelectedCustomer(null);
      } catch (err) {
        console.error("Failed to delete customer:", err);
        toast.error("Failed to delete customer");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleFormSubmit = async (data: CustomerFormData): Promise<void> => {
    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, data);
        toast.success("Customer updated successfully");
      } else {
        await createCustomer(data);
        toast.success("Customer created successfully");
      }
      setIsFormModalOpen(false);
      setEditingCustomer(null);
    } catch (err) {
      console.error("Failed to save customer:", err);
      toast.error("Failed to save customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTransaction = (type: "payment-in" | "payment-out"): void => {
    // Navigate to payment forms
    if (type === "payment-in") {
      void navigate({ to: "/sale/payment-in" });
    } else {
      void navigate({ to: "/purchase/payment-out" });
    }
  };

  const handleTransactionClick = (transaction: CustomerTransaction): void => {
    if (transaction.type === "sale") {
      void navigate({
        to: "/sale/invoices",
        search: { invoiceId: transaction.id },
      });
    } else if (transaction.type === "credit-note") {
      void navigate({
        to: "/sale/credit-notes",
        search: { id: transaction.id },
      });
    }
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load customers</p>
          <p className="text-slate-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <PageHeader
        title="Customers"
        description="Manage your customers and suppliers"
        actions={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={handleAddCustomer}
          >
            Add Customer
          </Button>
        }
      />

      {/* Filters Header - Full Width */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <SearchInput
              placeholder="Search customers..."
              value={filters.search}
              onChange={(e) => {
                setFilters((f) => ({ ...f, search: e.target.value }));
              }}
              className="w-full sm:w-72"
            />

            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <Select
                options={typeOptions}
                value={filters.type}
                onChange={(value) => {
                  setFilters((f) => ({
                    ...f,
                    type: value as CustomerType | "all",
                  }));
                }}
                size="md"
                className="min-w-[140px]"
              />

              <Select
                options={balanceOptions}
                value={filters.balanceType}
                onChange={(value) => {
                  setFilters((f) => ({
                    ...f,
                    balanceType: value as "all" | "receivable" | "payable",
                  }));
                }}
                size="md"
                className="min-w-[140px]"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0 border-t xl:border-t-0 pt-4 xl:pt-0 border-slate-100">
            <div className="flex items-center gap-3 px-4 py-2 bg-success-light rounded-lg border border-success/20 whitespace-nowrap">
              <div className="p-1.5 bg-white rounded-md shadow-sm">
                <ArrowDownLeft className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-success-dark font-medium uppercase tracking-wider">
                  To Receive
                </p>
                <p className="text-lg font-bold text-success leading-none">
                  {formatCurrency(totals.receivable)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-error-light rounded-lg border border-error/20 whitespace-nowrap">
              <div className="p-1.5 bg-white rounded-md shadow-sm">
                <ArrowUpRight className="h-4 w-4 text-error" />
              </div>
              <div>
                <p className="text-xs text-error-dark font-medium uppercase tracking-wider">
                  To Pay
                </p>
                <p className="text-lg font-bold text-error leading-none">
                  {formatCurrency(totals.payable)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Master-Detail Layout */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden bg-slate-50">
        {/* Customer List (Master) */}
        <div className="w-full max-w-[400px] shrink-0 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <CustomerList
              customers={filteredCustomers}
              onCustomerClick={setSelectedCustomer}
              onAddCustomer={handleAddCustomer}
              className="h-full overflow-auto pr-1"
              hasActiveFilters={
                !!filters.search ||
                filters.type !== "all" ||
                filters.balanceType !== "all"
              }
            />
          )}
        </div>

        {/* Customer Detail (Detail) */}
        <div className="flex-1 overflow-auto">
          <CustomerDetail
            customer={currentSelectedCustomer}
            transactions={selectedCustomerTransactions}
            onEdit={handleEditCustomer}
            onDelete={handleDeleteCustomer}
            onAddTransaction={handleAddTransaction}
            onTransactionClick={handleTransactionClick}
          />
        </div>
      </div>

      {/* Add/Edit Customer Modal */}
      <CustomerFormModal
        isOpen={isFormModalOpen}
        customer={editingCustomer}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingCustomer(null);
        }}
        onSubmit={(data) => {
          void handleFormSubmit(data);
        }}
        isLoading={isSubmitting}
      />

      <ConfirmDeleteDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCustomerToDelete(null);
        }}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        title="Delete Customer"
        itemName={customerToDelete?.name ?? ""}
        itemType={
          customerToDelete?.type === "supplier"
            ? "Supplier"
            : customerToDelete?.type === "both"
              ? "Customer/Supplier"
              : "Customer"
        }
        warningMessage={
          (customerToDelete?.currentBalance ?? 0) !== 0
            ? `This customer has a balance of ${(customerToDelete?.currentBalance ?? 0) > 0 ? "+" : ""}$${Math.abs(customerToDelete?.currentBalance ?? 0).toFixed(2)}. Deleting will remove all their transaction history.`
            : "This will permanently delete this customer and all their transaction history."
        }
        linkedItems={
          selectedCustomerTransactions.length > 0
            ? [
                {
                  type: "Transaction",
                  count: selectedCustomerTransactions.length,
                  description: "Will be deleted",
                },
              ]
            : []
        }
        isLoading={isSubmitting}
      >
        <div className="flex flex-col gap-3 p-3 border border-slate-200 rounded-lg mt-2">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="deleteRelated"
              checked={deleteRelated}
              onChange={(e) => {
                setDeleteRelated(e.target.checked);
              }}
              className="h-4 w-4 rounded border-slate-300 text-error focus:ring-error cursor-pointer"
            />
            <label
              htmlFor="deleteRelated"
              className="text-sm text-slate-700 font-medium cursor-pointer select-none"
            >
              Also delete associated invoices and payments
            </label>
          </div>

          {deleteRelated && (
            <div className="flex items-center gap-3 ml-7">
              <input
                type="checkbox"
                id="restoreStock"
                checked={restoreStock}
                onChange={(e) => {
                  setRestoreStock(e.target.checked);
                }}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label
                htmlFor="restoreStock"
                className="text-sm text-slate-700 font-medium cursor-pointer select-none"
              >
                {customerToDelete?.type === "supplier"
                  ? "Remove items from stock (Reverse Purchase)"
                  : customerToDelete?.type === "both"
                    ? "Reverse stock adjustments (Sales & Purchases)"
                    : "Return items to stock (Reverse Sale)"}
              </label>
            </div>
          )}
        </div>
      </ConfirmDeleteDialog>
    </div>
  );
}
