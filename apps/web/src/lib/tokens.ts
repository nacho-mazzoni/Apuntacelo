import { celo, celoSepolia } from "wagmi/chains";

export interface TokenInfo {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
}

export const NATIVE_CELO: TokenInfo = {
  address: "0x0000000000000000000000000000000000000000",
  symbol: "CELO",
  name: "Celo Native",
  decimals: 18,
};

export const TOKENS: Record<number, TokenInfo[]> = {
  [celo.id]: [
    NATIVE_CELO,
    {
      address: "0x765de816845861e75a25fca122bb6898b8b1282a",
      symbol: "cUSD",
      name: "Celo Dollar",
      decimals: 18,
    },
    {
      address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
    },
    {
      address: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
    },
  ],
  [celoSepolia.id]: [
    NATIVE_CELO,
    {
      address: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
      symbol: "cUSD",
      name: "Celo Dollar",
      decimals: 18,
    },
    {
      address: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
    },
  ],
};

export function getTokensForChain(chainId: number): TokenInfo[] {
  return TOKENS[chainId] || TOKENS[celo.id];
}

export function getTokenByAddress(
  chainId: number,
  address: `0x${string}`
): TokenInfo | undefined {
  const tokens = getTokensForChain(chainId);
  return tokens.find(
    (t) => t.address.toLowerCase() === address.toLowerCase()
  );
}
