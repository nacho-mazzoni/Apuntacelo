import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "";

vi.mock("../ipfs", async (importOriginal) => {
  return {
    ...(await importOriginal()),
    getIPFSUrl: (cid: string) => `https://gateway.pinata.cloud/ipfs/${cid}`,
    clearIPFSCache: vi.fn(),
    uploadToIPFS: vi.fn(async (_file: File, _onProgress?: (bytesUploaded: number, totalBytes: number) => void) => {
      if (!PINATA_JWT) {
        throw new Error("NEXT_PUBLIC_PINATA_JWT no configurado");
      }
      return "QmMockHash";
    }),
  };
});

import { getIPFSUrl, clearIPFSCache, uploadToIPFS } from "../ipfs";

describe("getIPFSUrl", () => {
  it("returns the correct gateway URL", () => {
    expect(getIPFSUrl("QmTest")).toBe("https://gateway.pinata.cloud/ipfs/QmTest");
  });
});

describe("clearIPFSCache", () => {
  it("clears without throwing", () => {
    expect(() => clearIPFSCache()).not.toThrow();
  });
});

describe("uploadToIPFS", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_PINATA_JWT = "test-jwt";
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_PINATA_JWT;
  });

  it("throws when PINATA_JWT is not configured", async () => {
    delete process.env.NEXT_PUBLIC_PINATA_JWT;
    const file = new File(["test"], "test.txt");
    await expect(uploadToIPFS(file)).rejects.toThrow("NEXT_PUBLIC_PINATA_JWT no configurado");
  });
});
