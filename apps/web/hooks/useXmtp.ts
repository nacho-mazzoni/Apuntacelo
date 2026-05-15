import { useEffect, useState, useRef, useCallback } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { Client, Conversation } from "@xmtp/xmtp-js";

/**
 * Hook que inicializa el cliente XMTP bajo demanda (lazy loading).
 *
 * - NO pide firma digital al montar el componente
 * - Solo solicita firma cuando se llama explícitamente a `initializeXmtp()`
 * - Usa un semáforo para evitar inicializaciones concurrentes
 * - Ideal para Mini App: la wallet se conecta automáticamente, la firma se pide solo al accionar
 */
export function useXmtp() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [client, setClient] = useState<Client | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const isInitializing = useRef(false);

  const initializeXmtp = useCallback(async (): Promise<Client | null> => {
    if (client) return client;
    if (isInitializing.current) return null;
    if (!isConnected || !address || !walletClient) {
      throw new Error("Wallet no conectada");
    }

    isInitializing.current = true;
    setLoading(true);

    try {
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

      return xmtpClient;
    } catch (error) {
      console.error("Error inicializando XMTP:", error);
      return null;
    } finally {
      isInitializing.current = false;
      setLoading(false);
    }
  }, [client, isConnected, address, walletClient]);

  // Refrescar conversaciones cada 10s solo si el cliente existe
  useEffect(() => {
    if (!client) return;
    const interval = setInterval(async () => {
      const convs = await client.conversations.list();
      setConversations(convs);
    }, 10_000);
    return () => clearInterval(interval);
  }, [client]);

  return { client, conversations, loading, address, initializeXmtp };
}
