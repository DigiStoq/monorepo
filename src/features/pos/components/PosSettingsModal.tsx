import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Settings, Printer, Save } from "lucide-react";

interface PosSettingsModalProps {
    open: boolean;
    onClose: () => void;
}

export function PosSettingsModal({ open, onClose }: PosSettingsModalProps) {
    const [settings, setSettings] = useState({
        autoPrint: false,
        taxRate: 0,
        showDiscount: true,
        showTax: true,
        defaultPaymentMode: "cash",
        printerName: "Default Printer"
    });

    useEffect(() => {
        // Load from localStorage
        const saved = localStorage.getItem("pos-settings");
        if (saved) {
            try {
                setSettings(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse settings", e);
            }
        }
    }, [open]);

    const handleSave = () => {
        localStorage.setItem("pos-settings", JSON.stringify(settings));
        toast.success("Settings saved");
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        POS Settings
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="auto-print" className="flex flex-col space-y-1">
                            <span>Auto Print Receipt</span>
                            <span className="font-normal text-xs text-muted-foreground">
                                Automatically print receipt after checkout
                            </span>
                        </Label>
                        <Switch
                            id="auto-print"
                            checked={settings.autoPrint}
                            onCheckedChange={(c: boolean) => setSettings({ ...settings, autoPrint: c })}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="show-discount" className="flex flex-col space-y-1">
                            <span>Show Discount Column</span>
                            <span className="font-normal text-xs text-muted-foreground">
                                Display discount per item in cart
                            </span>
                        </Label>
                        <Switch
                            id="show-discount"
                            checked={settings.showDiscount}
                            onCheckedChange={(c: boolean) => setSettings({ ...settings, showDiscount: c })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="printer-name">Printer Name (for receipt generation)</Label>
                        <div className="flex gap-2">
                            <Input
                                id="printer-name"
                                value={settings.printerName}
                                onChange={(e) => setSettings({ ...settings, printerName: e.target.value })}
                                placeholder="Enter printer name"
                            />
                            <Button variant="outline" size="icon">
                                <Printer className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="default-tax">Default Tax Rate (%)</Label>
                        <Input
                            id="default-tax"
                            type="number"
                            value={settings.taxRate}
                            onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
