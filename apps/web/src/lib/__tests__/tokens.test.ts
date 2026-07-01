import { describe, it, expect } from "vitest";
import { getTokensForChain, getTokenByAddress, TOKENS } from "../tokens";
import { celo, celoSepolia } from "wagmi/chains";

describe("getTokensForChain", () => {
  it("returns Celo mainnet tokens for chain 42220", () => {
    const tokens = getTokensForChain(celo.id);
    expect(tokens).toHaveLength(3);
    expect(tokens.map((t) => t.symbol)).toEqual(["cUSD", "USDC", "USDT"]);
  });

  it("returns Celo Sepolia tokens for chain 11142220", () => {
    const tokens = getTokensForChain(celoSepolia.id);
    expect(tokens).toHaveLength(2);
    expect(tokens.map((t) => t.symbol)).toEqual(["cUSD", "USDC"]);
  });

  it("falls back to mainnet tokens for unknown chain", () => {
    const tokens = getTokensForChain(999999);
    expect(tokens).toEqual(TOKENS[celo.id]);
  });
});

describe("getTokenByAddress", () => {
  it("finds token by address (case-insensitive)", () => {
    const token = getTokenByAddress(
      celo.id,
      "0x765de816845861e75a25fca122bb6898b8b1282a"
    );
    expect(token?.symbol).toBe("cUSD");
  });

  it("finds token with uppercase address", () => {
    const token = getTokenByAddress(
      celo.id,
      "0x765DE816845861E75A25FCA122BB6898B8B1282A" as `0x${string}`
    );
    expect(token?.symbol).toBe("cUSD");
  });

  it("returns undefined for unknown address", () => {
    const token = getTokenByAddress(
      celo.id,
      "0x0000000000000000000000000000000000000000"
    );
    expect(token).toBeUndefined();
  });

  it("returns undefined for chain with no matching address", () => {
    const token = getTokenByAddress(
      celoSepolia.id,
      "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e"
    );
    expect(token).toBeUndefined();
  });
});
