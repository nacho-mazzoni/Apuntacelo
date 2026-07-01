import { describe, it, expect } from "vitest";
import { formatCurrency, truncateAddress, isValidAddress, sleep } from "../app-utils";

describe("formatCurrency", () => {
  it("formats with default USD currency", () => {
    expect(formatCurrency(100)).toBe("$100.00");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats decimal amounts", () => {
    expect(formatCurrency(99.5)).toBe("$99.50");
  });

  it("formats with custom currency", () => {
    expect(formatCurrency(50, "EUR")).toContain("50");
  });
});

describe("truncateAddress", () => {
  it("truncates a long address with default lengths", () => {
    const addr = "0x1234567890abcdef1234567890abcdef12345678";
    expect(truncateAddress(addr)).toBe("0x1234...5678");
  });

  it("returns full address if shorter than start+end", () => {
    const short = "0x1234";
    expect(truncateAddress(short)).toBe(short);
  });

  it("uses custom start and end lengths", () => {
    const addr = "0x1234567890abcdef1234567890abcdef12345678";
    expect(truncateAddress(addr, 10, 6)).toBe("0x12345678...345678");
  });
});

describe("isValidAddress", () => {
  it("accepts a valid address", () => {
    expect(isValidAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe(true);
  });

  it("rejects missing 0x prefix", () => {
    expect(isValidAddress("1234567890abcdef1234567890abcdef12345678")).toBe(false);
  });

  it("rejects wrong length", () => {
    expect(isValidAddress("0x1234")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidAddress("")).toBe(false);
  });
});

describe("sleep", () => {
  it("resolves after the given time", async () => {
    const start = Date.now();
    await sleep(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(45);
  });

  it("resolves with 0ms", async () => {
    await expect(sleep(0)).resolves.toBeUndefined();
  });
});
