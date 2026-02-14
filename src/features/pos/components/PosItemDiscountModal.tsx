import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { usePosStore } from "../stores/pos-store";
import { toast } from "sonner";

interface PosItemDiscountModalProps {
    open: boolean;
    onClose: () => void;
}

export function PosItemDiscountModal({ open, onClose }: PosItemDiscountModalProps) {
    const { selectedItemId, cart, updateItemDiscount } = usePosStore();
    const [discount, setDiscount] = useState("");
    const [type, setType] = useState<"percentage" | "fixed">("percentage");
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedItem = cart.find((i) => i.id === selectedItemId);

    useEffect(() => {
        if (open && selectedItem) {
            setDiscount(selectedItem.discount.toString());
            setType(selectedItem.discountType);
            // Focus input after a short delay to ensure modal is rendered
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open, selectedItem]);

    const handleSave = () => {
        if (!selectedItemId) return;

        const val = parseFloat(discount);
        if (isNaN(val) || val < 0) {
            toast.error("Invalid discount value");
            return;
        }

        if (type === "percentage" && val > 100) {
            toast.error("Percentage cannot be more than 100%");
            return;
        }

        updateItemDiscount(selectedItemId, val, type);
        toast.success("Discount updated");
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") onClose();
    };

    if (!selectedItem) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Discount: {selectedItem.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex gap-2">
                        <Button
                            variant={type === "percentage" ? "primary" : "outline"}
                            onClick={() => setType("percentage")}
                            className="flex-1"
                        >
                            Percentage (%)
                        </Button>
                        <Button
                            variant={type === "fixed" ? "primary" : "outline"}
                            onClick={() => setType("fixed")}
                            className="flex-1"
                        >
                            Fixed Amount ($)
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            ref={inputRef}
                            value={discount}
                            onChange={(e) => setDiscount(e.target.value)}
                            onKeyDown={handleKeyDown}
                            type="number"
                            placeholder="0"
                            className="text-right text-lg"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave}>Apply (Enter)</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
