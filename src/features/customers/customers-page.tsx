import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui";
import { Spinner } from "@/components/common";
import { Plus } from "lucide-react";
import { CustomerList, CustomerDetail, CustomerFormModal } from "./components";
import { useCustomers, useCustomerMutations } from "@/hooks/useCustomers";
import type { Customer, CustomerTransaction, CustomerFormData } from "./types";

export function CustomersPage() {
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

  // Update selected customer when data changes
  const currentSelectedCustomer = useMemo(() => {
    if (!selectedCustomer) return null;
    return customers.find((c) => c.id === selectedCustomer.id) ?? null;
  }, [customers, selectedCustomer]);

  // TODO: Fetch transactions for selected customer from PowerSync
  // For now, return empty array until transactions hook is connected
  const selectedCustomerTransactions: CustomerTransaction[] = useMemo(() => {
    // This will be replaced with a useCustomerTransactions hook
    return [];
  }, [currentSelectedCustomer]);

  // Handlers
  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsFormModalOpen(true);
  };

  const handleEditCustomer = () => {
    if (currentSelectedCustomer) {
      setEditingCustomer(currentSelectedCustomer);
      setIsFormModalOpen(true);
    }
  };

  const handleDeleteCustomer = () => {
    if (currentSelectedCustomer) {
      setCustomerToDelete(currentSelectedCustomer);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (customerToDelete) {
      setIsSubmitting(true);
      try {
        await deleteCustomer(customerToDelete.id);
        setIsDeleteModalOpen(false);
        setCustomerToDelete(null);
        setSelectedCustomer(null);
      } catch (err) {
        console.error("Failed to delete customer:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleFormSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, data);
      } else {
        await createCustomer(data);
      }
      setIsFormModalOpen(false);
      setEditingCustomer(null);
    } catch (err) {
      console.error("Failed to save customer:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTransaction = (type: "payment-in" | "payment-out") => {
    // TODO: Open transaction modal - will navigate to payment forms
    console.log(
      "Add transaction:",
      type,
      "for customer:",
      currentSelectedCustomer?.id
    );
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

      {/* Content - Master-Detail Layout */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Customer List (Master) */}
        <div className="w-[400px] shrink-0 overflow-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <CustomerList
              customers={customers}
              onCustomerClick={setSelectedCustomer}
              onAddCustomer={handleAddCustomer}
              className="h-full"
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCustomerToDelete(null);
        }}
        size="sm"
      >
        <ModalContent>
          <ModalHeader title="Delete Customer" />
          <ModalBody>
            <p className="text-slate-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900">
                {customerToDelete?.name}
              </span>
              ? This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setCustomerToDelete(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                void handleConfirmDelete();
              }}
              isLoading={isSubmitting}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
