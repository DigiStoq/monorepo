import * as XLSX from "xlsx";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { toast } from "sonner";

// Try to import Tauri plugins (will fail in non-Tauri envs, so we use dynamic imports or just global checks ideally)
// However, since we are in a Vite module, we can import them. If they are not available at runtime, we handle it.
// To be safe against build errors if deps are missing, we usually do this. But since they are in package.json...
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

// Initialize vfs for pdfmake
// Initialize vfs for pdfmake
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fontModule = pdfFonts as any;
pdfMake.vfs = fontModule.pdfMake?.vfs ?? fontModule.vfs ?? fontModule;

export interface ExportColumn<T> {
  key: keyof T;
  label: string;
  format?: (value: T[keyof T], item: T) => string;
}

// Helper to save file via Tauri or Browser
const saveFile = async (
  filename: string,
  content: Blob | Uint8Array,
  extension: string
): Promise<void> => {
  // Check if running in Tauri
  const isTauri =
    typeof window !== "undefined" &&
    ((window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ !==
      undefined ||
      (window as unknown as Record<string, unknown>).__TAURI_IPC__ !==
        undefined);

  if (isTauri) {
    try {
      const filePath = await save({
        defaultPath: `${filename}.${extension}`,
        filters: [
          {
            name: extension.toUpperCase(),
            extensions: [extension],
          },
        ],
      });

      if (filePath) {
        // Convert Blob to Uint8Array if needed
        let data: Uint8Array;
        if (content instanceof Blob) {
          data = new Uint8Array(await content.arrayBuffer());
        } else {
          data = content;
        }

        await writeFile(filePath, data);
      }
    } catch (e: unknown) {
      const errorMsg = String(e);
      if (
        errorMsg.includes("os error 32") ||
        errorMsg.includes("used by another process")
      ) {
        toast.error(
          "File is currently open in another application. Please close the file and try again."
        );
        return;
      }
      console.error("Tauri save failed, falling back to browser download", e);
      downloadInBrowser(filename, content, extension);
    }
  } else {
    downloadInBrowser(filename, content, extension);
  }
};

const downloadInBrowser = (
  filename: string,
  content: Blob | Uint8Array,
  extension: string
): void => {
  const blob =
    content instanceof Blob
      ? content
      : new Blob([content as unknown as BlobPart]);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.${extension}`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
};

export const exportToCsv = async <T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): Promise<void> => {
  const headers = columns.map((col) => col.label).join(",");
  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = col.format
          ? col.format(item[col.key], item)
          : item[col.key];
        // Handle commas and quotes in CSV
        const strValue = String(value ?? "");
        if (strValue.includes(",") || strValue.includes('"')) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      })
      .join(",")
  );

  const csvContent = [headers, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  await saveFile(filename, blob, "csv");
};

export const exportToExcel = async <T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): Promise<void> => {
  const formattedData = data.map((item) => {
    const row: Record<string, unknown> = {};
    columns.forEach((col) => {
      row[col.label] = col.format
        ? col.format(item[col.key], item)
        : item[col.key];
    });
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(formattedData);

  // Auto-size columns
  const colWidths = columns.map((col) => {
    const headerLength = col.label.length;
    const maxDataLength = Math.max(
      ...formattedData.map((row) => {
        const val = row[col.label];
        if (val === null || val === undefined) return 0;
        return String(val as string | number | boolean).length;
      }),
      0
    );
    // Add some padding
    return { wch: Math.max(headerLength, maxDataLength) + 2 };
  });
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  const wbout = XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
  }) as ArrayBuffer;
  await saveFile(filename, new Uint8Array(wbout), "xlsx");
};

export const exportToPdf = async <T>(
  data: T[],
  columns: ExportColumn<T>[],
  title: string,
  filename: string,
  orientation: "portrait" | "landscape" = "landscape"
): Promise<void> => {
  const tableBody = [];

  // Headers
  tableBody.push(
    columns.map((col) => ({
      text: col.label,
      style: "tableHeader",
      bold: true,
      fillColor: "#f3f4f6", // gray-100
      alignment: "center",
    }))
  );

  // Rows
  data.forEach((item) => {
    tableBody.push(
      columns.map((col) => {
        const value = col.format
          ? col.format(item[col.key], item)
          : item[col.key];
        return {
          text: String(value ?? ""),
          style: "tableCell",
        };
      })
    );
  });

  const docDefinition = {
    pageOrientation: orientation,
    pageSize: "A3" as const, // Use A3 for better width capacity
    pageMargins: [20, 20, 20, 20] as [number, number, number, number],
    content: [
      { text: title, style: "header", margin: [0, 0, 0, 10] },
      {
        table: {
          headerRows: 1,
          widths: Array(columns.length).fill("*"),
          body: tableBody,
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => "#e5e7eb",
          vLineColor: () => "#e5e7eb",
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
      },
      {
        text: `Generated on ${new Date().toLocaleDateString()}`,
        style: "footer",
        margin: [0, 10, 0, 0],
        alignment: "right",
        fontSize: 7,
        color: "#6b7280",
      },
    ],
    styles: {
      header: {
        fontSize: 16,
        bold: true,
      },
      tableHeader: {
        fontSize: 9,
        color: "black",
      },
      tableCell: {
        fontSize: 8, // Smaller font for data
      },
    },
    defaultStyle: {
      fontSize: 8,
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfDocGenerator = pdfMake.createPdf(docDefinition as unknown as any);

  return new Promise<void>((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pdfDocGenerator.getBuffer((buffer: any) => {
      void saveFile(filename, new Uint8Array(buffer), "pdf").then(resolve);
    });
  });
};

export const printReport = <T>(
  data: T[],
  columns: ExportColumn<T>[],
  title: string
): void => {
  // We will open a new window to print
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const headers = columns
    .map(
      (c) =>
        `<th style="text-align: left; padding: 8px; border-bottom: 2px solid #e2e8f0;">${c.label}</th>`
    )
    .join("");

  const rows = data
    .map((item) => {
      const cells = columns
        .map((col) => {
          const val = col.format
            ? col.format(item[col.key], item)
            : item[col.key];
          const displayVal =
            typeof val === "object" && val !== null
              ? JSON.stringify(val)
              : String(val ?? "");
          return `<td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${displayVal}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${title}</title>
        <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            h1 { font-size: 20px; margin-bottom: 20px; }
            @media print {
                @page { margin: 1cm; size: landscape; }
                th { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; }
            }
        </style>
    </head>
    <body>
        <h1>${title}</h1>
        <table>
            <thead><tr>${headers}</tr></thead>
            <tbody>${rows}</tbody>
        </table>
        <script>
            window.onload = () => {
                window.print();
                window.onafterprint = () => window.close();
            }
        </script>
    </body>
    </html>
   `;

  printWindow.document.write(html);
  printWindow.document.close();
};
