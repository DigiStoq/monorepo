import { Modal } from "@/components/ui/modal";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@powersync/react";
import { useMemo } from "react";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/cn";
import { ArrowDownLeft, ArrowUpRight, RotateCcw, User } from "lucide-react";

interface StockHistoryModalProps {
  itemId: string;
  itemName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface StockHistoryEntry {
  id: string;
  transaction_date: string;
  transaction_type: "purchase" | "sale" | "credit_note" | "adjustment";
  reference_number: string | null;
  party_name: string | null;
  quantity_change: number;
  unit_price: number;
  payment_status: string | null;
}

export function StockHistoryModal({
  itemId,
  itemName,
  isOpen,
  onClose,
}: StockHistoryModalProps): JSX.Element {
  const { formatCurrency } = useCurrency();

  const query = useMemo(() => {
    return `
      SELECT
        pii.id as id,
        pi.date as transaction_date,
        'purchase' as transaction_type,
        pi.invoice_number as reference_number,
        c.name as party_name,
        pii.quantity as quantity_change,
        pii.unit_price,
        pi.status as payment_status
      FROM purchase_invoice_items pii
      JOIN purchase_invoices pi ON pii.invoice_id = pi.id
      LEFT JOIN customers c ON pi.customer_id = c.id
      WHERE pii.item_id = ?

      UNION ALL

      SELECT
        sii.id,
        si.date as transaction_date,
        'sale' as transaction_type,
        si.invoice_number as reference_number,
        c.name as party_name,
        -sii.quantity as quantity_change,
        sii.unit_price,
        si.status as payment_status
      FROM sale_invoice_items sii
      JOIN sale_invoices si ON sii.invoice_id = si.id
      LEFT JOIN customers c ON si.customer_id = c.id
      WHERE sii.item_id = ?

      UNION ALL

      SELECT
        cni.id,
        cn.date as transaction_date,
        'credit_note' as transaction_type,
        cn.credit_note_number as reference_number,
        c.name as party_name,
        cni.quantity as quantity_change,
        cni.unit_price,
        'approved' as payment_status
      FROM credit_note_items cni
      JOIN credit_notes cn ON cni.credit_note_id = cn.id
      LEFT JOIN customers c ON cn.customer_id = c.id
      WHERE cni.item_id = ?

      UNION ALL

      SELECT
        ih.id,
        substr(ih.created_at, 1, 10) as transaction_date,
        'adjustment' as transaction_type,
        'Manual' as reference_number,
        ih.user_name as party_name,
        CAST(json_extract(ih.new_values, '$.adjustment') AS REAL) as quantity_change,
        0 as unit_price,
        'completed' as payment_status
      FROM item_history ih
      WHERE ih.action = 'stock_adjusted' AND ih.item_id = ?

      ORDER BY transaction_date DESC, id DESC
    `;
  }, []);

  const { data: history, isLoading } = useQuery<StockHistoryEntry>(query, [
    itemId,
    itemId,
    itemId,
    itemId,
  ]);

  const getStatusColor = (
    status: string | null
  ): "success" | "primary" | "error" | "secondary" => {
    switch (status) {
      case "paid":
      case "approved":
      case "completed":
        return "success";
      case "partial":
        return "primary"; // Pending/Partial
      case "overdue":
        return "error";
      case "draft":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getTransactionLabel = (type: string): string => {
    switch (type) {
      case "purchase":
        return "Purchase";
      case "sale":
        return "Sale";
      case "credit_note":
        return "Sales Return";
      case "adjustment":
        return "Stock Adj.";
      default:
        return type;
    }
  };

  const getTypeIcon = (type: string): JSX.Element => {
    switch (type) {
      case "purchase":
      case "credit_note":
        return <ArrowDownLeft className="h-4 w-4 text-success" />;
      case "sale":
        return <ArrowUpRight className="h-4 w-4 text-error" />;
      case "adjustment":
        return <RotateCcw className="h-4 w-4 text-warning" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={`Stock Ledger: ${itemName}`}
      className="max-h-[85vh]"
    >
      <div className="overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">Loading...</div>
        ) : history.length === 0 ? (
          <div className="text-center p-8 text-slate-500">
            No transactions found for this item.
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Party / User</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Payment Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {entry.transaction_date}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(entry.transaction_type)}
                      <span className="text-sm font-medium">
                        {getTransactionLabel(entry.transaction_type)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {entry.reference_number ?? "-"}
                  </TableCell>
                  <TableCell
                    className="text-sm truncate max-w-[150px]"
                    title={entry.party_name ?? ""}
                  >
                    {entry.party_name ?? "-"}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {entry.unit_price > 0
                      ? formatCurrency(entry.unit_price)
                      : "-"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-bold",
                      entry.quantity_change > 0 ? "text-success" : "text-error"
                    )}
                  >
                    {entry.quantity_change > 0 ? "+" : ""}
                    {entry.quantity_change}
                  </TableCell>
                  <TableCell>
                    {entry.payment_status && (
                      <Badge variant={getStatusColor(entry.payment_status)}>
                        {entry.payment_status}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </table>
        )}
      </div>
    </Modal>
  );
}
