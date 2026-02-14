import { describe, test, expect } from "vitest";
import { cn } from "../cn";

describe("cn", () => {
  test("should merge class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  test("should handle conditional classes", () => {
    expect(cn("base", true && "active", false && "disabled")).toBe(
      "base active"
    );
  });

  test("should merge tailwind classes correctly", () => {
    // Later classes should override earlier ones for the same property
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  test("should handle arrays", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  test("should handle objects", () => {
    expect(cn({ foo: true, bar: false })).toBe("foo");
  });

  test("should handle undefined and null", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  test("should handle empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
  });

  test("should handle complex tailwind combinations", () => {
    expect(cn("bg-red-500 hover:bg-red-600", "bg-blue-500")).toBe(
      "hover:bg-red-600 bg-blue-500"
    );
  });

  test("should handle mixed input types", () => {
    expect(cn("base", ["array-class"], { "object-class": true })).toBe(
      "base array-class object-class"
    );
  });
});
