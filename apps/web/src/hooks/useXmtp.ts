import { useEffect, useState, useRef } from "react";
import { Client } from "@xmtp/xmtp-js";
import { useWalletClient, useAccount } from "wagmi";

/**
 * Hook que permite cargar el cliente XMTP bajo demanda (lazy loading).
 *
 * - `initializeXmtp` lleva a cabo la firma y creación del cliente, usando un
 *   semáforo (`isInitializing`) para evitar llamadas concurrentes.
 * - El hook sigue exponiendo `client` y `conversations` para que el resto de la UI
 *   pueda utilizarlos una vez estén listos.
 * - La lógica de refresco periódico de conversaciones se mantiene.
 */
export function useXmtp() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [client, setClient] = useState<Client | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);

  /** Semáforo que impide iniciar varias veces en paralelo */
  const isInitializing = useRef(false);

  /**
   * Inicializa XMTP bajo demanda.
   * - Si ya existe `client` o ya está en proceso, no hace nada.
   * - Si falta la wallet o la dirección, lanza un error.
   */
  const initializeXmtp = async (): Promise<void> => {
    if (client) return; // ya está listo
    if (isInitializing.current) return; // ya hay una inicialización en curso

    if (!isConnected || !address || !walletClient) {
      throw new Error("Wallet no conectada o datos insuficientes para inicializar XMTP");
    }

    isInitializing.current = true;
    try {
      const signer = {
        getAddress: async () => address,
        signMessage: async (message: string | Uint8Array) => {
          return await walletClient.signMessage({
            message: typeof message === "string" ? message : { raw: message },
          });
        },
      };

      // Crear el cliente XMTP (solo una petición de firma)
      const xmtpClient = await Client.create(signer as any, {
        env: "production",
      });

      setClient(xmtpClient);

      // Cargar conversaciones iniciales
      const convs = await xmtpClient.conversations.list();
      setConversations(convs);
    } catch (error) {
      console.error("Error al crear cliente XMTP:", error);
      // Permitir nuevo intento si el usuario cancela la firma u ocurre otro error
    } finally {
      // Liberar el semáforo en cualquier caso
      isInitializing.current = false;
    }
  };

  // -------------------------------------------------------------------------
  // Refresco periódico de conversaciones (solo cuando el cliente existe)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!client) return;
    const interval = setInterval(async () => {
      const convs = await client.conversations.list();
      setConversations(convs);
    }, 10_000);
    return () => clearInterval(interval);
  }, [client]);

  return { client, conversations, initializeXmtp };
}
