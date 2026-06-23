export type TokenSymbol = "cUSD" | "USDC" | "USDT";

export interface TokenInfo {
  address: `0x${string}`;
  symbol: TokenSymbol;
  decimals: number;
  name: string;
  logoUrl?: string;
}

export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  tokens: TokenInfo[];
  explorerUrl: string;
}
