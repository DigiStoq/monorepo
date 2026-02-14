import { describe, it, expect } from "vitest";
import { parseCSV } from "../csv-parser";

describe("parseCSV", () => {
  it("should parse simple CSV content", () => {
    const csv = `name,age,city
John,30,New York
Jane,25,Los Angeles`;

    const result = parseCSV(csv);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: "John", age: "30", city: "New York" });
    expect(result[1]).toEqual({ name: "Jane", age: "25", city: "Los Angeles" });
  });

  it("should handle quoted values with commas", () => {
    const csv = `name,address
"John Doe","123 Main St, Suite 100"`;

    const result = parseCSV(csv);

    expect(result).toHaveLength(1);
    expect(result[0].address).toBe("123 Main St, Suite 100");
  });

  it("should return empty array for empty content", () => {
    expect(parseCSV("")).toEqual([]);
  });

  it("should return empty array for header-only content", () => {
    expect(parseCSV("name,age,city")).toEqual([]);
  });

  it("should handle Windows line endings", () => {
    const csv = "name,age\r\nJohn,30\r\nJane,25";
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
  });

  it("should trim whitespace from values", () => {
    const csv = `name, age
 John , 30 `;

    const result = parseCSV(csv);

    expect(result[0].name).toBe("John");
    expect(result[0].age).toBe("30");
  });

  it("should handle multiple data rows", () => {
    const csv = `id,product,price
1,Widget,9.99
2,Gadget,19.99
3,Gizmo,29.99`;

    const result = parseCSV(csv);

    expect(result).toHaveLength(3);
    expect(result[0].product).toBe("Widget");
    expect(result[2].price).toBe("29.99");
  });
});
