import { useEffect, useState, useRef } from "react";
import { Client } from "@xmtp/xmtp-js";
import { useWalletClient, useAccount } from "wagmi";

/**
 * Hook que inicializa el cliente XMTP una única vez por sesión de wallet.
 * Implementa un control estricto mediante un semáforo (`isInitializing`) y
 * estabiliza las dependencias del `useEffect` para evitar bucles infinitos de
 * solicitud de firma.
 */
export function useXmtp() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [client, setClient] = useState<Client | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);

  /** Semáforo que impide iniciar varias veces en paralelo */
  const isInitializing = useRef(false);

  // -------------------------------------------------------------------------
  // Inicialización del cliente XMTP
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Bloqueos iniciales: si ya hay cliente, ya estamos inicializando,
    // o no tenemos los datos necesarios, salimos.
    if (client || isInitializing.current) return;
    if (!isConnected || !address || !walletClient) return;

    // Marcamos el inicio del proceso de inicialización.
    isInitializing.current = true;

    const initXmtp = async () => {
      try {
        // Adapter del signer requerido por XMTP.
        const signer = {
          getAddress: async () => address,
          signMessage: async (message: string | Uint8Array) => {
            return await walletClient.signMessage({
              message: typeof message === "string" ? message : { raw: message },
            });
          },
        };

        // Creamos el cliente XMTP (solo una petición de firma).
        const xmtpClient = await Client.create(signer as any, {
          env: "production",
        });

        // Guardamos el cliente y marcamos que la inicialización tuvo éxito.
        setClient(xmtpClient);

        // Cargamos las conversaciones iniciales.
        const convs = await xmtpClient.conversations.list();
        setConversations(convs);
      } catch (error) {
        console.error("Error al crear cliente XMTP:", error);
        // En caso de error, permitimos reintentar sin refrescar la página.
      } finally {
        // Liberamos el semáforo sin importar el resultado.
        isInitializing.current = false;
      }
    };

    initXmtp();
    // Dependencias estabilizadas: solo address e isConnected.
    // walletClient no se incluye para evitar re‑ejecuciones innecesarias.
  }, [address, isConnected]);

  // -------------------------------------------------------------------------
  // Refresco periódico de conversaciones (opcional)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!client) return;
    const interval = setInterval(async () => {
      const convs = await client.conversations.list();
      setConversations(convs);
    }, 10_000);
    return () => clearInterval(interval);
  }, [client]);

  return { client, conversations };
}
