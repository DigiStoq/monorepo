import { useState } from "react";
import { PageHeader } from "@/components/layout";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from "@/components/ui";
import { Spinner } from "@/components/common";
import { Settings2 } from "lucide-react";
import { CashTransactionList, CashAdjustmentForm } from "./components";
import {
  useCashTransactions,
  useCashBalance,
  useCashTransactionMutations,
} from "@/hooks/useCashTransactions";
import type { CashAdjustmentFormData } from "./types";

export function CashInHandPage() {
  // Data from PowerSync
  const { transactions, isLoading, error } = useCashTransactions();
  const { balance: currentBalance } = useCashBalance();
  const { createTransaction } = useCashTransactionMutations();

  // State
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);

  // Handlers
  const handleOpenAdjustment = () => {
    setIsAdjustmentOpen(true);
  };

  const handleCloseAdjustment = () => {
    setIsAdjustmentOpen(false);
  };

  const handleSubmitAdjustment = async (data: CashAdjustmentFormData) => {
    try {
      await createTransaction({
        date: data.date,
        type: "adjustment",
        amount: data.amount,
        description: data.description || "Cash balance adjustment",
      });
      setIsAdjustmentOpen(false);
    } catch (err) {
      console.error("Failed to create adjustment:", err);
    }
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load cash transactions</p>
          <p className="text-slate-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Cash in Hand"
        description="Track your physical cash balance and transactions"
        actions={
          <Button
            variant="outline"
            leftIcon={<Settings2 className="h-4 w-4" />}
            onClick={handleOpenAdjustment}
          >
            Adjust Balance
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <CashTransactionList
              transactions={transactions}
              currentBalance={currentBalance}
            />
          )}
        </div>
      </div>

      {/* Adjustment Form Modal */}
      <Modal
        isOpen={isAdjustmentOpen}
        onClose={handleCloseAdjustment}
        size="md"
      >
        <ModalContent>
          <ModalHeader onClose={handleCloseAdjustment}>
            Adjust Cash Balance
          </ModalHeader>
          <ModalBody>
            <CashAdjustmentForm
              currentBalance={currentBalance}
              onSubmit={(data) => {
                void handleSubmitAdjustment(data);
              }}
              onCancel={handleCloseAdjustment}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
