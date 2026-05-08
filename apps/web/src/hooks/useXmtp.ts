import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Client, Conversation } from "@xmtp/xmtp-js";
import { useEthersSigner } from "./useEthersSigner";

/**
 * Hook que inicializa el cliente XMTP usando un Signer de ethers.js.
 * El Signer se obtiene a través del adaptador oficial de Wagmi a ethers.
 *
 * Este hook **solo** debe usarse dentro del árbol de componentes envuelto por
 * `WalletProvider`.
 */
export function useXmtp() {
  const { address, isConnected } = useAccount();
  const signer = useEthersSigner();

  const [client, setClient] = useState<Client | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  // Inicializar cliente XMTP cuando la wallet está conectada y hay signer
  useEffect(() => {
    async function init() {
      if (!isConnected || !signer) {
        setClient(null);
        setConversations([]);
        return;
      }

      setLoading(true);
      try {
        // XMTP descubrirá el entorno (dev o prod) según la red configurada.
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
  }, [isConnected, signer]);

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
