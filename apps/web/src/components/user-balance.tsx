"use client";

import { useAccount, useBalance } from "wagmi";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Wallet, ChevronDown } from "lucide-react";

const cUSD_ADDRESS = "0x765de816845861e75a25fca122bb6898b8b1282a";
const USDC_ADDRESS = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
const USDT_ADDRESS = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";

function BalanceDisplay({ address, token, symbol }: { address: `0x${string}`, token?: `0x${string}`, symbol: string }) {
  const { data, isLoading } = useBalance({
    address,
    token,
  });

  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{symbol}</span>
      <span className="font-medium">
        {isLoading ? "..." : `${parseFloat(data?.formatted || '0').toFixed(4)}`}
      </span>
    </div>
  );
}

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function WalletPopover({ address }: { address: `0x${string}` }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 font-mono text-xs h-8"
        >
          <Wallet className="h-3.5 w-3.5" />
          {truncateAddress(address)}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Connected Wallet
            </p>
            <p className="text-sm font-mono truncate mt-0.5">
              {address}
            </p>
          </div>
          <div className="space-y-1.5 pt-2 border-t">
            <BalanceDisplay address={address} token={cUSD_ADDRESS} symbol="cUSD" />
            <BalanceDisplay address={address} token={USDC_ADDRESS} symbol="USDC" />
            <BalanceDisplay address={address} token={USDT_ADDRESS} symbol="USDT" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function UserBalance() {
  const { address, isConnected } = useAccount();
  const isMobile = useIsMobile();

  if (!isConnected || !address) {
    return null;
  }

  if (isMobile) {
    return (
      <Card className="w-full max-w-md mx-auto mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Connected Wallet</CardTitle>
          <p className="text-sm text-muted-foreground truncate pt-1 font-mono">
            {truncateAddress(address)}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 pt-2 border-t">
            <BalanceDisplay address={address} token={cUSD_ADDRESS} symbol="cUSD" />
            <BalanceDisplay address={address} token={USDC_ADDRESS} symbol="USDC" />
            <BalanceDisplay address={address} token={USDT_ADDRESS} symbol="USDT" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return <WalletPopover address={address} />;
}
