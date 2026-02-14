import { Search, Scan, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import { useItems, useItemMutations } from "@/hooks/useItems";
import { ItemFormData } from "@/features/inventory/types";
import { usePosStore } from "../stores/pos-store";
import _ from "lodash";
import { ItemFormModal } from "@/features/inventory/components/item-form-modal";
import { Button } from "@/components/ui";
import { toast } from "sonner";

export function PosItemSearch() {
    const [searchTerm, setSearchTerm] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const { addItem, isSearchOpen, setSearchOpen } = usePosStore();
    const [showAddItemModal, setShowAddItemModal] = useState(false);

    // Use existing hook for now, will optimize later
    const { items, isLoading } = useItems({ search: searchTerm, isActive: true });
    const { createItem } = useItemMutations();

    // Debounce search to avoid rapid DB queries
    const debouncedSearch = _.debounce((val) => setSearchTerm(val), 300);

    // Auto-focus on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSelect = (item: any) => {
        addItem(item);
        setSearchTerm("");
        if (inputRef.current) {
            inputRef.current.value = "";
            inputRef.current.focus();
        }
        setSearchOpen(false);
    };

    const handleCreateItem = async (data: ItemFormData) => {
        try {
            const newItemId = await createItem(data);
            toast.success("Item created successfully");
            setShowAddItemModal(false);
            // Ideally we should select it or add it to cart.
            // Since we don't have the full item object returned with all fields from createItem (it returns ID),
            // We can construct it partially or search for it.
            // Let's just reset search to the item name so it appears in the list
            if (inputRef.current) {
                inputRef.current.value = data.name;
                setSearchTerm(data.name);
                inputRef.current.focus();
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to create item");
        }
    };

    // Detect Enter key for quick add if only 1 result
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && items.length === 1) {
            handleSelect(items[0]);
        }
    };

    return (
        <div className="relative w-full max-w-2xl mx-auto">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Scan barcode or search item (F1)"
                    className="pl-10 h-12 text-lg bg-slate-100 border-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    onChange={(e) => debouncedSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-200/50 px-2 py-1 rounded">
                        <Scan className="h-3 w-3" />
                        <span>Barcode Ready</span>
                    </div>
                </div>
            </div>

            {/* Dropdown Results */}
            {searchTerm.length > 0 && !showAddItemModal && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 max-h-[60vh] overflow-y-auto z-50">
                    {isLoading ? (
                        <div className="p-4 text-center text-slate-500">Searching...</div>
                    ) : items.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 flex flex-col items-center">
                            <p className="mb-3">No items found matching "{searchTerm}"</p>
                            <Button variant="outline" onClick={() => setShowAddItemModal(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add New Item
                            </Button>
                        </div>
                    ) : (
                        <div className="py-2">
                            <div className="px-3 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Search Results ({items.length})
                            </div>
                            {items.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelect(item)}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between group transition-colors border-b border-slate-50 last:border-0"
                                >
                                    <div>
                                        <div className="font-medium text-slate-900 group-hover:text-primary transition-colors">
                                            {item.name}
                                        </div>
                                        <div className="text-sm text-slate-500 flex items-center gap-2">
                                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono">{item.sku || "NO SKU"}</span>
                                            {item.stockQuantity <= (item.lowStockAlert || 0) && (
                                                <span className="text-red-500 text-xs font-medium">Low Stock: {item.stockQuantity}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-slate-900">${item.salePrice.toFixed(2)}</div>
                                        <div className="text-xs text-slate-400">Stock: {item.stockQuantity}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {showAddItemModal && (
                <ItemFormModal
                    isOpen={showAddItemModal}
                    onClose={() => setShowAddItemModal(false)}
                    onSubmit={handleCreateItem}
                    categories={[]} // Or fetch categories if needed, but [] is safe
                />
            )}
        </div>
    );
}
