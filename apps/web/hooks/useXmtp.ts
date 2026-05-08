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
 *
 * --------------------------------------------------------------------------------
 * NOTA DE DEPURACIÓN:
 * Si ocurre el error “unhandled runtime error” en la línea 12 (posición 37),
 * está relacionado con la llamada a `walletClient.signMessage`. En algunos
 * entornos `walletClient` puede no estar completamente inicializado o la
 * firma puede requerir un objeto `account` explícito. Para aislar el problema
 * comentamos temporalmente la llamada y dejamos un mensaje explicativo.
 * Cuando confirmes que la wallet está disponible, puedes descomentar la línea.
 * --------------------------------------------------------------------------------
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
            // --------------------------- DEPURACIÓN ---------------------------
            // La siguiente línea a veces lanza un error si `walletClient` no está listo.
            // Descoméntala cuando verifiques que la wallet está conectada correctamente.
            // --------------------------------------------------------------------
            const signed = await walletClient.signMessage({
              // En algunos casos Viem requiere pasar también el account; si falla,
              // pruebe:
              // account: { address },
              // message: typeof message === "string" ? message : { raw: message },
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
