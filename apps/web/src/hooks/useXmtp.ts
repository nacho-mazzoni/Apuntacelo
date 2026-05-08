import { useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { Client, Conversation } from "@xmtp/xmtp-js";

/**
 * Hook que inicializa el cliente XMTP a partir del wallet (viem) conectado.
 * En Wagmi v2 ya no existe `useSigner`; en su lugar usamos `useWalletClient`
 * y creamos un adaptador mínimo que cumpla la interfaz esperada por XMTP
 * (métodos `getAddress` y `signMessage`).
 *
 * Este hook **solo** debe usarse dentro del árbol de componentes envuelto por
 * `WalletProvider`.
 */
export function useXmtp() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Adaptador que actúa como un Signer compatible con XMTP
  const getSigner = () => {
    if (!walletClient || !walletClient.account) return null;

    return {
      // Devuelve la dirección del account actual
      getAddress: async () => walletClient.account.address,

      // Firma mensajes usando el método de viem
      signMessage: async (message: string | Uint8Array) => {
        const signed = await walletClient.signMessage({
          // viem acepta tanto string como Uint8Array; si es Uint8Array usamos la forma raw
          message: typeof message === "string" ? message : { raw: message },
          account: walletClient.account,
        });
        // XMTP acepta la firma como string (formato ethers). Viem ya devuelve un string.
        return signed;
      },
    };
  };

  const [client, setClient] = useState<Client | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  // Inicializar cliente XMTP cuando la wallet está conectada
  useEffect(() => {
    async function init() {
      if (!isConnected) {
        setClient(null);
        setConversations([]);
        return;
      }

      const signer = getSigner();
      if (!signer) {
        setClient(null);
        setConversations([]);
        return;
      }

      setLoading(true);
      try {
        // Usar entorno de desarrollo por ahora; cambiar a "production" en prod
        const xmtp = await Client.create(signer as any, { env: "dev" });
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
  }, [isConnected, walletClient]);

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
