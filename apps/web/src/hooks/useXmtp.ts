import { useEffect, useState, useRef } from "react";
import { Client } from "@xmtp/xmtp-js";
import { useWalletClient, useAccount } from "wagmi";

export function useXmtp() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [client, setClient] = useState<Client | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);

  // EL CANDADO: Esta referencia no se resetea entre renders
  const initializingRef = useRef(false);

  useEffect(() => {
    const initXmtp = async () => {
      // Si ya hay un cliente, o ya se está inicializando, o no hay wallet: SALIR.
      if (
        client ||
        initializingRef.current ||
        !isConnected ||
        !address ||
        !walletClient
      ) {
        return;
      }

      try {
        initializingRef.current = true; // Bloqueamos la entrada
        console.log("Iniciando XMTP... Prepará la firma.");

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
        console.error("Error en XMTP:", error);
        initializingRef.current = false; // Solo si falla permitimos reintentar
      }
    };

    initXmtp();
  }, [address, isConnected, !!walletClient]); // Usamos booleanos para estabilizar las dependencias

  return { client, conversations };
}
