import { useEffect, useState, useRef } from "react";
import { useWalletClient, useAccount } from "wagmi";

type XmtpClient = any;

export function useXmtp(pollEnabled = true) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [client, setClient] = useState<XmtpClient | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);

  const isInitializing = useRef(false);

  const initializeXmtp = async (): Promise<void> => {
    if (client) return;
    if (isInitializing.current) return;

    if (!isConnected || !address || !walletClient) {
      throw new Error("Wallet no conectada o datos insuficientes para inicializar XMTP");
    }

    isInitializing.current = true;
    try {
      const { Client } = await import("@xmtp/xmtp-js");

      const signer = {
        getAddress: async () => address,
        signMessage: async (message: string | Uint8Array) => {
          return await walletClient.signMessage({
            message: typeof message === "string" ? message : { raw: message },
          });
        },
      };

      const xmtpClient = await Client.create(signer as any, {
        env: "production",
      });

      setClient(xmtpClient);

      const convs = await xmtpClient.conversations.list();
      setConversations(convs);
    } catch (error) {
      console.error("Error al crear cliente XMTP:", error);
    } finally {
      isInitializing.current = false;
    }
  };

  useEffect(() => {
    if (!client || !pollEnabled) return;
    const interval = setInterval(async () => {
      try {
        const convs = await client.conversations.list();
        setConversations(convs);
      } catch (err) {
        console.error("Error polling XMTP conversations:", err);
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, [client, pollEnabled]);

  return { client, conversations, initializeXmtp };
}
