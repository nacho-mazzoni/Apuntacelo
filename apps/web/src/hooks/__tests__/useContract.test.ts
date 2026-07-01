import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useContract } from "../useContract";

vi.mock("wagmi", () => ({
  useAccount: vi.fn(() => ({ address: "0xmock" })),
  useChainId: vi.fn(() => 42220),
  useWalletClient: vi.fn(() => ({ data: null })),
  useWriteContract: vi.fn(() => ({
    writeContractAsync: vi.fn(),
    isPending: false,
  })),
  usePublicClient: vi.fn(() => ({
    readContract: vi.fn(),
    waitForTransactionReceipt: vi.fn(),
  })),
  useReadContract: vi.fn(() => ({
    data: 0n,
    refetch: vi.fn(),
  })),
}));

vi.mock("@/lib/contract", () => ({
  CONTRACT_ADDRESS: "0xmockcontract",
  NOTES_MARKETPLACE_ABI: [],
}));

describe("useContract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns isWriting as false by default", () => {
    const { result } = renderHook(() => useContract());
    expect(result.current.isWriting).toBe(false);
  });

  it("provides contract functions", () => {
    const { result } = renderHook(() => useContract());
    expect(result.current.createRequest).toBeDefined();
    expect(result.current.offerNote).toBeDefined();
    expect(result.current.acceptOffer).toBeDefined();
    expect(result.current.approveToken).toBeDefined();
    expect(result.current.getRequests).toBeDefined();
    expect(result.current.getRequest).toBeDefined();
    expect(result.current.getOffers).toBeDefined();
    expect(result.current.waitForTx).toBeDefined();
  });

  it("reads requestCount from contract", () => {
    const { result } = renderHook(() => useContract());
    expect(result.current.requestCount).toBe(0n);
  });
});
