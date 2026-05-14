import { useEffect, useState, useRef } from "react";
import { Client } from "@xmtp/xmtp-js";
import { useWalletClient, useAccount } from "wagmi";

/**
 * Hook que inicializa el cliente XMTP una única vez por sesión de wallet.
 * Implementa un control estricto mediante un semáforo (`isInitializing`) y
 * estabiliza las dependencias del `useEffect` para evitar bucles infinitos de
 * solicitud de firma, especialmente en entornos como MiniPay.
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
    // Guard clauses: si ya existe cliente o ya estamos inicializando,
    // salimos inmediatamente.
    if (client || isInitializing.current) return;
    // Necesitamos conexión, dirección y cliente de wallet para continuar.
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

        // Guardamos el cliente y, al existir uno, el semáforo puede permanecer true.
        setClient(xmtpClient);

        // Cargamos conversaciones iniciales.
        const convs = await xmtpClient.conversations.list();
        setConversations(convs);
      } catch (error) {
        console.error("Error al crear cliente XMTP:", error);
        // Si ocurre un error (p.ej. usuario cancela la firma), permitimos re‑intento.
        isInitializing.current = false;
      }
      // Nota: no se resetea el semáforo en el flujo exitoso; el guard clause
      // `if (client || isInitializing.current) return;` evita re‑ejecuciones.
    };

    initXmtp();
    // Dependencias estabilizadas: solo address e isConnected.
    // walletClient no se incluye para evitar bucles innecesarios.
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
