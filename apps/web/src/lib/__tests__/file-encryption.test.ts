import { describe, it, expect } from "vitest";
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  decryptKeyFromXMTP,
} from "../file-encryption";

describe("arrayBufferToBase64 / base64ToArrayBuffer", () => {
  it("round-trips a known buffer", () => {
    const original = new Uint8Array([72, 101, 108, 108, 111]);
    const base64 = arrayBufferToBase64(original.buffer);
    const decoded = base64ToArrayBuffer(base64);
    expect(new Uint8Array(decoded)).toEqual(original);
  });

  it("round-trips an empty buffer", () => {
    const original = new Uint8Array([]);
    const base64 = arrayBufferToBase64(original.buffer);
    const decoded = base64ToArrayBuffer(base64);
    expect(new Uint8Array(decoded)).toEqual(original);
  });

  it("round-trips binary data", () => {
    const original = new Uint8Array([0, 255, 128, 64, 32]);
    const base64 = arrayBufferToBase64(original.buffer);
    const decoded = base64ToArrayBuffer(base64);
    expect(new Uint8Array(decoded)).toEqual(original);
  });
});

describe("decryptKeyFromXMTP", () => {
  it("parses a valid ENCRYPTION_KEY message", async () => {
    const testKey = new Uint8Array([1, 2, 3, 4]);
    const base64 = arrayBufferToBase64(testKey.buffer);
    const result = await decryptKeyFromXMTP(`ENCRYPTION_KEY:${base64}`);
    expect(result).not.toBeNull();
    expect(new Uint8Array(result!)).toEqual(testKey);
  });

  it("returns null for message without prefix", async () => {
    const result = await decryptKeyFromXMTP("random message");
    expect(result).toBeNull();
  });

  it("returns null for empty string", async () => {
    const result = await decryptKeyFromXMTP("");
    expect(result).toBeNull();
  });
});
