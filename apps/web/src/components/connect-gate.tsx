"use client";

import { useEffect, useState } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Wallet, Shield, BookOpen, Zap, Loader2 } from "lucide-react";

export function ConnectGate() {
  const { openConnectModal } = useConnectModal();
  const [isMinipay, setIsMinipay] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum?.isMiniPay) {
      setIsMinipay(true);
      setShowLoader(true);
      const timer = setTimeout(() => setShowLoader(false), 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (isMinipay && showLoader) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Conectando con MiniPay...</p>
        <p className="text-sm text-muted-foreground mt-2">
          Aceptá la conexión en tu wallet
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-medium bg-primary/10 text-primary rounded-full border border-primary/20">
        <Zap className="h-3 w-3" />
        Built on Celo
      </div>

      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
        Apuntacelo
      </h1>

      <p className="text-base md:text-lg text-muted-foreground max-w-md mb-10">
        Marketplace descentralizado de apuntes universitarios.
        Conectá tu wallet para comprar y vender apuntes con stablecoins.
      </p>

      <div className="grid gap-3 mb-10 text-left max-w-sm w-full">
        <div className="flex items-start gap-3 p-3 border rounded-lg">
          <Wallet className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Creá pedidos con recompensa</p>
            <p className="text-xs text-muted-foreground">
              Depositá cUSD, USDC o USDT como bounty por los apuntes que necesitás
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 border rounded-lg">
          <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Ofrecé tus apuntes</p>
            <p className="text-xs text-muted-foreground">
              Subí tus apuntes cifrados y recibí pagos automáticos al ser aceptados
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 border rounded-lg">
          <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Seguro y descentralizado</p>
            <p className="text-xs text-muted-foreground">
              Pagos on-chain sobre Celo, cifrado extremo a extremo, intercambio de claves por XMTP
            </p>
          </div>
        </div>
      </div>

      <Button size="lg" className="gap-2 px-8" onClick={openConnectModal}>
        <Wallet className="h-5 w-5" />
        Conectar Wallet
      </Button>
    </div>
  );
}
