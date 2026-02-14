export function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, ""));

  const result: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple regex to handle quoted values containing commas
    // Simple regex to handle quoted values containing commas
    const regex = /(?:^|,)(?:"([^"]*)"|([^",]*))/g;

    // Reset lastIndex because we are using global flag
    regex.lastIndex = 0;

    // Note: The simple split(',') doesn't handle quoted commas.
    // A slightly more robust approach is needed without a library.
    // For this implementation, we will assume standard CSV without complex nesting.

    // Alternative: simple split if we assume no commas in values for MVP,
    // but better to try to handle quotes.

    const currentLine = line;
    const row: Record<string, string> = {};

    // Basic parser for quoted strings
    let inQuote = false;
    let currentValue = "";
    let colIndex = 0;

    for (const char of currentLine) {
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === "," && !inQuote) {
        if (headers[colIndex]) {
          row[headers[colIndex]] = currentValue.trim();
        }
        currentValue = "";
        colIndex++;
      } else {
        currentValue += char;
      }
    }
    // Last value
    if (headers[colIndex]) {
      row[headers[colIndex]] = currentValue.trim();
    }

    // Only add if we parsed something
    if (Object.keys(row).length > 0) {
      result.push(row);
    }
  }

  return result;
}
