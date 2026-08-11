"use client";

import dynamic from "next/dynamic";
import { WalletProvider } from "./wallet-provider";

const WalletProviderDynamic = dynamic(
  () => import("./wallet-provider").then((m) => m.WalletProvider),
  { ssr: false }
);

export function WalletProviderClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WalletProviderDynamic>{children}</WalletProviderDynamic>;
}
