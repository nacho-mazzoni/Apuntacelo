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
  const { address } = useAccount();
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
  const initializingRef = useRef(false);

  // Inicializar XMTP cuando exista un signer válido y el cliente aún no exista.
  useEffect(() => {
    // Si ya tenemos un cliente, no volver a inicializar.
    if (client) return;

    // Si ya hay una inicialización en curso, salir.
    if (initializingRef.current) return;

    // Si no hay signer disponible, limpiar estado y salir.
    if (!signer) {
      setClient(null);
      setConversations([]);
      return;
    }

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
      } finally {
        setLoading(false);
      }
    };

    // Marcar como inicializando y lanzar el proceso.
    initializingRef.current = true;
    init().finally(() => {
      // Liberar la marca una vez terminado, sea éxito o error.
      initializingRef.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, signer]); // dependencias estables gracias a `useMemo`

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
