import { useEffect, useState, useRef } from "react";
import { Client } from "@xmtp/xmtp-js";
import { useWalletClient, useAccount } from "wagmi";

/**
 * Hook que inicializa el cliente XMTP una única vez por sesión de wallet.
 * Evita bucles infinitos de solicitud de firma mediante dos referencias:
 *  - `isInitializing` evita lanzar varias inicializaciones en paralelo.
 *  - `hasInitialized` evita volver a iniciar después de una creación exitosa,
 *    a menos que la wallet se desconecte o que haya un error.
 */
export function useXmtp() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [client, setClient] = useState<Client | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);

  /** Evita iniciar varias veces simultáneamente */
  const isInitializing = useRef(false);
  /** Marca si ya se ha creado el cliente con éxito */
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Sólo iniciar si la wallet está conectada y disponemos de dirección y cliente viem.
    if (!isConnected || !address || !walletClient) return;

    // Si ya hemos inicializado con éxito, no volver a intentar.
    if (hasInitialized.current) return;

    // Si ya hay una inicialización en curso, salir.
    if (isInitializing.current) return;

    // Marcar que estamos comenzando la inicialización.
    isInitializing.current = true;

    const initXmtp = async () => {
      try {
        // Signer adaptado a la interfaz mínima requerida por XMTP.
        const signer = {
          getAddress: async () => address,
          signMessage: async (message: string | Uint8Array) => {
            return await walletClient.signMessage({
              message: typeof message === "string" ? message : { raw: message },
            });
          },
        };

        // Crear el cliente XMTP (una sola petición de firma).
        const xmtpClient = await Client.create(signer as any, {
          env: "production",
        });

        // Guardar cliente y marcar como inicializado.
        setClient(xmtpClient);
        hasInitialized.current = true;

        // Cargar conversaciones iniciales.
        const convs = await xmtpClient.conversations.list();
        setConversations(convs);
      } catch (error) {
        console.error("Error al crear cliente XMTP:", error);
        // En caso de error permitimos reintentar la próxima vez.
        hasInitialized.current = false;
      } finally {
        // Liberar el bloqueo sin importar el resultado.
        isInitializing.current = false;
      }
    };

    initXmtp();
    // Dependencias mínimas: solo los valores que realmente pueden cambiar y que
    // son necesarios para iniciar una única vez.
  }, [address, isConnected, walletClient]);

  // Opcional: refrescar conversaciones cada cierto tiempo cuando hay cliente.
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
