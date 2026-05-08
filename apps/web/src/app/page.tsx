import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@/components/connect-button";
import { UserBalance } from "@/components/user-balance";
import { Zap, Upload, ShoppingCart, FileText } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* 1. SECCIÓN DE ARRIBA: Billeteras, Saldo y Cargar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <ConnectButton />
            <UserBalance />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Cargar Apunte</span>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero simplificado de Apuntacelo */}
        <section className="py-8 text-center border-b bg-primary/5">
          <div className="container px-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-medium bg-primary/10 text-primary rounded-full border border-primary/20">
              <Zap className="h-3 w-3" />
              Built on Celo
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Apuntacelo</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Intercambio de apuntes P2P para la facu.
            </p>
          </div>
        </section>

        {/* 2. SECCIÓN DEL CENTRO: Lista de Apuntes */}
        <section className="py-12">
          <div className="container px-4">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Apuntes Disponibles
            </h2>

            {/* Aquí iría el map de los apuntes del contrato en el futuro */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg">
                      Apunte de Sistemas {i}
                    </h3>
                    <span className="text-primary font-mono font-bold">
                      1.5 CELO
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Resumen completo de la unidad {i}. Ideal para el final.
                  </p>
                  <Button variant="secondary" className="w-full">
                    Ver Detalles
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* 3. SECCIÓN DE ABAJO: Botones fijos de acción */}
      <footer className="sticky bottom-0 border-t bg-background p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="container max-w-md mx-auto flex gap-4">
          <Button className="flex-1 gap-2 h-12 text-lg">
            <ShoppingCart className="h-5 w-5" />
            Comprar
          </Button>
          <Button variant="secondary" className="flex-1 gap-2 h-12 text-lg">
            <Upload className="h-5 w-5" />
            Cargar
          </Button>
        </div>
      </footer>
    </div>
  );
}
