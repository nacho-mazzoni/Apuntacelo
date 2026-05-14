import { useEffect, useState, useRef, useMemo } from "react";
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
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  /**
   * Memoizamos el signer para que su referencia sea estable y no provoque
   * re‑ejecuciones innecesarias del efecto de inicialización.
   */
  const signer = useMemo(() => {
    if (walletClient && address) {
      return {
        getAddress: async () => address,
        signMessage: async (message: string | Uint8Array) => {
          // Viem acepta tanto string como { raw: Uint8Array }
          const signed = await walletClient.signMessage({
            message: typeof message === "string" ? message : { raw: message },
          });
          // El método devuelve una firma en formato hex (string)
          return signed;
        },
      };
    }
    return null;
  }, [walletClient, address]);

  const [client, setClient] = useState<Client | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Referencia que indica si ya hay una inicialización en curso.
   * Evita lanzar dos procesos de firma simultáneos.
   */
  const isInitializing = useRef(false);

  // Inicializar XMTP cuando exista un signer válido y el cliente aún no exista.
  useEffect(() => {
    // Bloqueo estricto: si ya estamos inicializando o ya hay cliente, salir.
    if (isInitializing.current || client) return;

    // Si no hay signer disponible, limpiar estado y salir.
    if (!signer) {
      setClient(null);
      setConversations([]);
      return;
    }

    // Marcar inicio del proceso de inicialización.
    isInitializing.current = true;

    const init = async () => {
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
        // Permitir reintento si falla la firma o la creación.
        isInitializing.current = false;
      } finally {
        setLoading(false);
        // Si no se había resetado en el catch, liberar el lock.
        if (isInitializing.current) {
          isInitializing.current = false;
        }
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected]); // dependencias estables según requerimiento

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
