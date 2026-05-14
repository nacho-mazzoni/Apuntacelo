import { useEffect, useState, useRef } from "react";
import { Client } from "@xmtp/xmtp-js";
import { useWalletClient, useAccount } from "wagmi";

export function useXmtp() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [client, setClient] = useState<Client | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);

  /**
   * Bloqueo estricto que impide iniciar varias veces el proceso
   * de creación del cliente XMTP. Se reinicia al terminar
   * (tanto en caso de éxito como de error) para que sea posible
   * re‑intentar después de una desconexión o de un fallo.
   */
  const isInitializing = useRef(false);

  useEffect(() => {
    // Sólo intentar inicializar una vez que haya wallet conectada y dirección.
    if (!isConnected || !address) return;

    // Si ya tenemos cliente o ya estamos inicializando, no hacer nada.
    if (client || isInitializing.current) return;

    // Necesitamos un walletClient válido; si no lo hay, esperamos al próximo render.
    if (!walletClient) return;

    // Marcar que estamos en proceso de inicialización.
    isInitializing.current = true;

    const initXmtp = async () => {
      try {
        console.log("Iniciando XMTP… solicita firma una sola vez.");

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
      } catch (error) {
        console.error("Error al crear cliente XMTP:", error);
        // En caso de error dejamos que pueda volver a intentarse.
      } finally {
        // Liberar el bloqueo sin importar el resultado.
        isInitializing.current = false;
      }
    };

    initXmtp();
    // Dependencias mínimas según requerimiento: solo address e isConnected.
  }, [address, isConnected]);

  return { client, conversations };
}
