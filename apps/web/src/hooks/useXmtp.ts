import { useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { Client, Conversation } from "@xmtp/xmtp-js";

/**
 * Hook que inicializa el cliente XMTP usando un Signer adaptado desde
 * la wallet de Viem provista por Wagmi v2.
 *
 * No se utiliza ethers.js; el adaptador traduce la API de Viem a la
 * interfaz mínima requerida por XMTP (getAddress y signMessage).
 *
 * Este hook **solo** debe ejecutarse dentro del árbol envuelto por
 * `WalletProvider`.
 */
export function useXmtp() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Adaptador que cumple la interfaz esperada por XMTP
  const signer =
    walletClient && address
      ? {
          getAddress: async () => address,
          signMessage: async (message: string | Uint8Array) => {
            // Viem acepta tanto string como { raw: Uint8Array }
            const signed = await walletClient.signMessage({
              message:
                typeof message === "string"
                  ? message
                  : { raw: message },
            });
            // El método devuelve una firma en formato hex (string)
            return signed;
          },
        }
      : null;

  const [client, setClient] = useState<Client | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  // Inicializar XMTP cuando exista un signer válido
  useEffect(() => {
    async function init() {
      if (!signer) {
        setClient(null);
        setConversations([]);
        return;
      }

      setLoading(true);
      try {
        const xmtp = await Client.create(signer);
        setClient(xmtp);
        const convs = await xmtp.conversations.list();
        setConversations(convs);
      } catch (e) {
        console.error("Error inicializando XMTP:", e);
        setClient(null);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [signer]);

  // Refrescar la lista de conversaciones cada 10 s
  useEffect(() => {
    if (!client) return;
    const interval = setInterval(async () => {
      const convs = await client.conversations.list();
      setConversations(convs);
    }, 10_000);
    return () => clearInterval(interval);
  }, [client]);

  return { client, conversations, loading, address };
}
