import { useEffect, useState } from "react";
import { useAccount, useSigner } from "wagmi";
import { Client, Conversation } from "@xmtp/xmtp-js";

/**
 * Hook que inicializa el cliente XMTP a partir del `signer` de la wallet conectada.
 * - `client`  : instancia de XMTP una vez autenticada.
 * - `conversations` : lista de conversaciones activas.
 * - `loading` : indica si se está inicializando o refrescando.
 * - `address` : dirección de la cuenta conectada (para uso posterior).
 */
export function useXmtp() {
  const { address, isConnected } = useAccount();
  const { data: signer } = useSigner();

  const [client, setClient] = useState<Client | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  // Inicializar cliente XMTP cuando la wallet está conectada
  useEffect(() => {
    async function init() {
      if (!isConnected || !signer) {
        setClient(null);
        setConversations([]);
        return;
      }
      setLoading(true);
      try {
        // En entorno de producción cambiar a `prod`. Aquí usamos `dev` para pruebas.
        const xmtp = await Client.create(signer, { env: "dev" });
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

  // Refrescar la lista de conversaciones cada cierto tiempo (10s)
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
