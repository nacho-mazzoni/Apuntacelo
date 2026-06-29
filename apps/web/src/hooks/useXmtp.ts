import { useEffect, useState, useRef } from "react";
import { useWalletClient, useAccount } from "wagmi";
import { Client, IdentifierKind } from "@xmtp/browser-sdk";
import type { Dm } from "@xmtp/browser-sdk";

function getDbEncryptionKey(): Uint8Array {
  const stored = localStorage.getItem("xmtp-db-key");
  if (stored) {
    return new Uint8Array(JSON.parse(stored));
  }
  const key = crypto.getRandomValues(new Uint8Array(32));
  localStorage.setItem("xmtp-db-key", JSON.stringify(Array.from(key)));
  return key;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function useXmtp() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [client, setClient] = useState<Client | null>(null);
  const [dms, setDms] = useState<Dm[]>([]);

  const isInitializing = useRef(false);

  const initializeXmtp = async (): Promise<void> => {
    if (client) return;
    if (isInitializing.current) return;

    if (!isConnected || !address || !walletClient) {
      throw new Error("Wallet no conectada o datos insuficientes para inicializar XMTP");
    }

    isInitializing.current = true;
    try {
      const signer = {
        type: "EOA" as const,
        getIdentifier: async () => ({
          identifier: address,
          identifierKind: IdentifierKind.Ethereum,
        }),
        signMessage: async (message: string): Promise<Uint8Array> => {
          const sig = await walletClient.signMessage({ message });
          return hexToBytes(sig);
        },
      };

      const opts = {
        env: "production" as const,
        dbEncryptionKey: getDbEncryptionKey(),
      };
      const xmtpClient = await Client.create(signer, opts as any);

      setClient(xmtpClient);

      const allDms = await xmtpClient.conversations.listDms();
      setDms(allDms);
    } catch (error) {
      console.error("Error al crear cliente XMTP:", error);
      throw error;
    } finally {
      isInitializing.current = false;
    }
  };

  useEffect(() => {
    if (!client) return;
    const interval = setInterval(async () => {
      const allDms = await client.conversations.listDms();
      setDms(allDms);
    }, 10_000);
    return () => clearInterval(interval);
  }, [client]);

  useEffect(() => {
    if (!isConnected || !address || !walletClient || client || isInitializing.current) return;
    initializeXmtp();
  }, [isConnected, address, walletClient, client]);

  return { client, dms, initializeXmtp };
}
