import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, UserPlus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { usePosStore } from "../stores/pos-store";
import { useCustomers, useCustomerMutations } from "@/hooks/useCustomers";
import { toast } from "sonner";
import { Customer, CustomerFormData } from "@/features/customers/types";
import { CustomerFormModal } from "@/features/customers/components/customer-form-modal";
import { Button } from "@/components/ui";

interface PosCustomerModalProps {
    open: boolean;
    onClose: () => void;
}

export function PosCustomerModal({ open, onClose }: PosCustomerModalProps) {
    const { setCustomer } = usePosStore();
    const [searchTerm, setSearchTerm] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const [showAddCustomer, setShowAddCustomer] = useState(false);

    const { customers, isLoading } = useCustomers();
    const { createCustomer } = useCustomerMutations();

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        if (open && !showAddCustomer) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open, showAddCustomer]);

    const handleSelect = (customer: Customer) => {
        setCustomer(customer);
        toast.success(`Customer set to ${customer.name}`);
        onClose();
    };

    const handleCreateCustomer = async (data: CustomerFormData) => {
        try {
            const newId = await createCustomer(data);
            const newCustomer = customers.find(c => c.id === newId) || { ...data, id: newId } as unknown as Customer;

            // We need to wait for the customer to be synced/fetched or just trust the data we have.
            // Since createCustomer returns ID, we might need to fetch it or wait.
            // PowerSync is fast, but let's assume valid data for now.
            // For now, let's close modal and try to select. 
            // Better yet, just set it directly if we can construct the object, 
            // but we don't have the full object returned from createCustomer.
            // We will let the hook refresh and select it if we can find it.

            setShowAddCustomer(false);
            setSearchTerm(data.name); // Auto search for it
            toast.success("Customer created!");
            // select functionality might need the user to click it, which is safer.
        } catch (e) {
            console.error(e);
            toast.error("Failed to create customer");
        }
    };

    return (
        <>
            <Dialog open={open && !showAddCustomer} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex justify-between items-center">
                            <span>Select Customer</span>
                            <Button size="sm" variant="outline" onClick={() => setShowAddCustomer(true)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add New
                            </Button>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="relative mt-2">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                            ref={inputRef}
                            placeholder="Search by name or phone..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && filteredCustomers.length > 0) {
                                    handleSelect(filteredCustomers[0]);
                                }
                            }}
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-1 mt-2">
                        {isLoading ? (
                            <div className="text-center py-4 text-slate-500">Loading...</div>
                        ) : filteredCustomers.map((c, index) => (
                            <button
                                key={c.id}
                                onClick={() => handleSelect(c)}
                                className={`w-full text-left p-3 hover:bg-slate-50 rounded-lg flex justify-between items-center group transition-colors ${index === 0 && searchTerm ? 'bg-slate-50 ring-1 ring-slate-200' : ''}`}
                            >
                                <div>
                                    <div className="font-medium text-slate-900">{c.name}</div>
                                    <div className="text-xs text-slate-500">{c.phone || c.email}</div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 text-primary text-sm font-medium">
                                    Select
                                </div>
                            </button>
                        ))}
                        {!isLoading && filteredCustomers.length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                <p>No customers found.</p>
                                <Button variant="ghost" onClick={() => setShowAddCustomer(true)} className="mt-2 text-primary hover:text-primary/90 hover:bg-primary/5">
                                    Create New Customer
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {showAddCustomer && (
                <CustomerFormModal
                    isOpen={showAddCustomer}
                    onClose={() => setShowAddCustomer(false)}
                    onSubmit={handleCreateCustomer}
                />
            )}
        </>
    );
}
