import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export interface ExportColumn<T> {
  key: keyof T | string;
  label: string;
  format?: (value: any, item: T) => string;
}

export async function exportToCSV<T extends object>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): Promise<void> {
  if (!data || data.length === 0) {
    throw new Error("No data to export");
  }

  // Generate Header Row
  const headers = columns.map((col) => `"${col.label}"`).join(",");

  // Generate Data Rows
  const rows = data.map((item) =>
    columns
      .map((col) => {
        let val: any;
        
        // Handle key access (simple or nested if needed, but keeping simple for now)
        if (typeof col.key === 'string' && col.key in item) {
             val = item[col.key as keyof T];
        }

        // Apply formatting
        if (col.format) {
            val = col.format(val, item);
        }

        // Handle null/undefined
        if (val === null || val === undefined) {
             val = "";
        }

        // Escape quotes
        const stringVal = String(val).replace(/"/g, '""');
        return `"${stringVal}"`;
      })
      .join(",")
  );

  const csvContent = [headers, ...rows].join("\n");

  // Save to file
  const fileUri = `${FileSystem.documentDirectory}${filename}.csv`;
  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // Share
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: `Export ${filename}`
    });
  } else {
      throw new Error("Sharing is not available on this device");
  }
}
