
import { useState, useEffect, useMemo } from "react";
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
} from "@/components/ui";
import { Table } from "@/components/ui/table";
import { Download, Printer, FileText, FileSpreadsheet } from "lucide-react";
import {
    exportToCsv,
    exportToExcel,
    exportToPdf,
    printReport,
    type ExportColumn,
} from "../utils/export";

interface ExportModalProps<T> {
    isOpen: boolean;
    onClose: () => void;
    data: T[];
    columns: ExportColumn<T>[];
    title?: string;
    filename?: string;
}

export function ExportModal<T>({
    isOpen,
    onClose,
    data,
    columns,
    title = "Export Data",
    filename = "export",
}: ExportModalProps<T>) {
    const [selectedKeys, setSelectedKeys] = useState<Set<keyof T>>(new Set());

    // Reset selected keys when columns change or modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedKeys(new Set(columns.map((c) => c.key)));
        }
    }, [isOpen, columns]);

    const toggleColumn = (key: keyof T) => {
        const newSet = new Set(selectedKeys);
        if (newSet.has(key)) {
            if (newSet.size > 1) {
                // Prevent deselecting all
                newSet.delete(key);
            }
        } else {
            newSet.add(key);
        }
        setSelectedKeys(newSet);
    };

    const selectedColumns = useMemo(
        () => columns.filter((c) => selectedKeys.has(c.key)),
        [columns, selectedKeys]
    );

    const previewData = data.slice(0, 5);

    const handleExportCsv = () => {
        exportToCsv(data, selectedColumns, filename);
        onClose();
    };

    const handleExportExcel = () => {
        exportToExcel(data, selectedColumns, filename);
        onClose();
    };

    const handleExportPdf = () => {
        exportToPdf(data, selectedColumns, title, filename);
        onClose();
    };

    const handlePrint = () => {
        printReport(data, selectedColumns, title);
        // We don't close on print usually as the user might want to export after
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalHeader>{title}</ModalHeader>
            <ModalBody>
                <div className="space-y-6">
                    {/* Column Selection */}
                    <div>
                        <h3 className="text-sm font-medium text-text-heading mb-3">
                            Visible Columns
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {columns.map((col) => (
                                <label
                                    key={String(col.key)}
                                    className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer hover:text-text-primary"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedKeys.has(col.key)}
                                        onChange={() => { toggleColumn(col.key); }}
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-colors"
                                    />
                                    {col.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Preview */}
                    <div>
                        <h3 className="text-sm font-medium text-text-heading mb-3">
                            Preview (First 5 Rows)
                        </h3>
                        <div className="border border-border-primary rounded-lg overflow-hidden bg-card">
                            <div className="overflow-x-auto">
                                <Table
                                    data={previewData}
                                    columns={selectedColumns.map((col) => ({
                                        key: String(col.key),
                                        header: col.label,
                                        cell: (row: T) => (
                                            <span className="whitespace-nowrap">
                                                {col.format
                                                    ? col.format((row as any)[col.key], row)
                                                    : String((row as any)[col.key] ?? "")}
                                            </span>
                                        ),
                                    }))}
                                    getRowKey={(_, i) => i}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </ModalBody>
            <ModalFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between">
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        onClick={handlePrint}
                        className="flex-1 sm:flex-none"
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </Button>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        onClick={handleExportCsv}
                        className="flex-1 sm:flex-none"
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        CSV
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExportExcel}
                        className="flex-1 sm:flex-none"
                    >
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Excel
                    </Button>
                    <Button onClick={handleExportPdf} className="flex-1 sm:flex-none">
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                    </Button>
                </div>
            </ModalFooter>
        </Modal>
    );
}
