import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ConfirmDeleteDialog,
} from "@/components/ui";
import { Spinner } from "@/components/common";
import { Plus } from "lucide-react";
import {
  BankAccountList,
  BankAccountDetail,
  BankAccountForm,
  BankTransactionForm,
  type BankTransactionFormData,
} from "./components";
import {
  useBankAccounts,
  useBankAccountMutations,
} from "@/hooks/useBankAccounts";
import {
  useBankTransactions,
  useBankTransactionMutations,
} from "@/hooks/useBankTransactions";
import type { BankAccount, BankAccountFormData } from "./types";

export function BankAccountsPage() {
  // Data from PowerSync
  const { accounts, isLoading, error } = useBankAccounts();
  const { createAccount, deleteAccount } = useBankAccountMutations();
  const { createTransaction } = useBankTransactionMutations();

  // State
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(
    null
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);

  // Update selected account when data changes
  const currentSelectedAccount = useMemo(() => {
    if (!selectedAccount) return null;
    return accounts.find((a) => a.id === selectedAccount.id) ?? null;
  }, [accounts, selectedAccount]);

  // Get transactions for selected account
  const { transactions: accountTransactions } = useBankTransactions(
    currentSelectedAccount
      ? { accountId: currentSelectedAccount.id }
      : undefined
  );

  // Build account options for transfer (exclude current account)
  const transferAccountOptions = currentSelectedAccount
    ? accounts
        .filter((a) => a.id !== currentSelectedAccount.id && a.isActive)
        .map((a) => ({ id: a.id, name: `${a.name} (${a.bankName})` }))
    : [];

  // Handlers
  const handleAccountClick = (account: BankAccount) => {
    setSelectedAccount(account);
  };

  const handleCloseDetail = () => {
    setSelectedAccount(null);
  };

  const handleCreateAccount = () => {
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleSubmitAccount = async (data: BankAccountFormData) => {
    try {
      await createAccount({
        name: data.name,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountType: data.accountType,
        openingBalance: data.openingBalance,
        notes: data.notes,
      });
      setIsFormOpen(false);
    } catch (err) {
      console.error("Failed to create account:", err);
    }
  };

  const handleDeleteClick = () => {
    if (currentSelectedAccount) {
      setAccountToDelete(currentSelectedAccount);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (accountToDelete) {
      setIsSubmitting(true);
      try {
        await deleteAccount(accountToDelete.id);
        setSelectedAccount(null);
        setIsDeleteModalOpen(false);
        setAccountToDelete(null);
      } catch (err) {
        console.error("Failed to delete account:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleOpenTransactionForm = () => {
    setIsTransactionFormOpen(true);
  };

  const handleCloseTransactionForm = () => {
    setIsTransactionFormOpen(false);
  };

  const handleSubmitTransaction = async (data: BankTransactionFormData) => {
    if (!currentSelectedAccount) return;

    try {
      await createTransaction({
        accountId: currentSelectedAccount.id,
        date: data.date,
        type: data.type,
        amount: data.amount,
        description: data.description,
        referenceNumber: data.referenceNumber,
        relatedCustomerId: data.relatedCustomerId,
      });
      setIsTransactionFormOpen(false);
    } catch (err) {
      console.error("Failed to create transaction:", err);
    }
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load bank accounts</p>
          <p className="text-slate-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Bank Accounts"
        description="Manage your bank accounts and track balances"
        actions={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={handleCreateAccount}
          >
            Add Account
          </Button>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Account List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <BankAccountList
              accounts={accounts}
              onAccountClick={handleAccountClick}
            />
          )}
        </div>

        {/* Account Detail Panel */}
        {currentSelectedAccount && (
          <div className="w-96 border-l border-slate-200 bg-white overflow-hidden">
            <BankAccountDetail
              account={currentSelectedAccount}
              transactions={accountTransactions}
              onClose={handleCloseDetail}
              onEdit={() => {
                setIsFormOpen(true);
              }}
              onDelete={handleDeleteClick}
              onAddTransaction={handleOpenTransactionForm}
            />
          </div>
        )}
      </div>

      {/* Account Form Modal */}
      <Modal isOpen={isFormOpen} onClose={handleCloseForm} size="xl">
        <ModalContent>
          <ModalHeader onClose={handleCloseForm}>Add Bank Account</ModalHeader>
          <ModalBody>
            <BankAccountForm
              onSubmit={(data) => {
                void handleSubmitAccount(data);
              }}
              onCancel={handleCloseForm}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Transaction Form Modal */}
      <Modal
        isOpen={isTransactionFormOpen}
        onClose={handleCloseTransactionForm}
        size="lg"
      >
        <ModalContent>
          <ModalHeader onClose={handleCloseTransactionForm}>
            Add Transaction - {currentSelectedAccount?.name}
          </ModalHeader>
          <ModalBody>
            <BankTransactionForm
              bankAccounts={transferAccountOptions}
              onSubmit={(data) => {
                void handleSubmitTransaction(data);
              }}
              onCancel={handleCloseTransactionForm}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setAccountToDelete(null);
        }}
        onConfirm={() => { void handleConfirmDelete(); }}
        title="Delete Bank Account"
        itemName={accountToDelete?.name ?? ""}
        itemType="Bank Account"
        warningMessage="This will permanently delete this bank account and all its transaction history."
        linkedItems={accountTransactions.length > 0 ? [
          { type: "Transaction", count: accountTransactions.length, description: "Will be deleted" },
        ] : []}
        isLoading={isSubmitting}
      />
    </div>
  );
}
