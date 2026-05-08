"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { ConnectButton } from "@/components/connect-button";
import { UserBalance } from "@/components/user-balance";
import {
  Zap,
  Upload,
  ShoppingCart,
  FileText,
  Star,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { truncateAddress } from "@/lib/app-utils";

// -----------------------------------------------------------------------------
// Mock de datos de bounty (para demostrar UI). En producción se leerá del contrato.
// Cada bounty incluye información simulada de reputación y dirección del ofertante.
// -----------------------------------------------------------------------------
type Bounty = {
  id: number;
  title: string;
  reward: number; // CELO
  description: string;
  seller: `0x${string}`; // dirección simulada del ofertante
  reputation: number; // puntaje total acumulado
  completed: number; // tareas completadas
};

const mockBounties: Bounty[] = [
  {
    id: 1,
    title: "Final de Física II UTN",
    reward: 2.5,
    description: "Necesito apuntes del último parcial.",
    seller: "0xAbc1230000000000000000000000000000000001",
    reputation: 12,
    completed: 3,
  },
  {
    id: 2,
    title: "Apuntes de Álgebra Lineal",
    reward: 1.8,
    description: "Busco material completo para el examen.",
    seller: "0xDef4560000000000000000000000000000000002",
    reputation: 5,
    completed: 1,
  },
  {
    id: 3,
    title: "Tema de Redes Blockchain",
    reward: 3,
    description: "Quiero una guía práctica para la entrega.",
    seller: "0x9876543210abcdef9876543210abcdef98765432",
    reputation: 0,
    completed: 0,
  },
];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
/**
 * Calcula el promedio de reputación (total / tareas completadas).
 * Si no hay tareas completadas devuelve null.
 */
const getAverage = (rep: number, completed: number): string | null => {
  if (completed === 0) return null;
  const avg = rep / completed;
  return avg.toFixed(2);
};

export default function Home() {
  // ---------- Estado del formulario de "Crear Pedido" ----------
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    reward: "",
  });

  // ---------- Estado del selector de rating al aceptar una oferta ----------
  const [ratingFormOpen, setRatingFormOpen] = useState(false);
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
  const [rating, setRating] = useState(5);

  // ---------- Handlers ----------
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica de wagmi para ejecutar `createRequest`
    console.log("Crear bounty:", formData);
    setFormData({ title: "", description: "", reward: "" });
    setShowForm(false);
  };

  const openRatingSheet = (bounty: Bounty) => {
    setSelectedBounty(bounty);
    setRating(5);
    setRatingFormOpen(true);
  };

  const submitRating = (e: React.FormEvent) => {
    e.preventDefault();
    // En producción se llamaría a `acceptOffer(requestId, offerIndex, rating)`
    console.log(
      "Rating submitted",
      selectedBounty?.id,
      rating,
      "(simulado)"
    );
    setRatingFormOpen(false);
    setSelectedBounty(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* ---------- Header (sticky) ---------- */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Left side: ConnectButton + UserBalance */}
          <div className="flex items-center gap-4">
            <ConnectButton />
            <UserBalance />
          </div>

          {/* Right side: botón principal "Pedir Apunte" */}
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Pedir Apunte</span>
          </Button>
        </div>
      </header>

      {/* ---------- Main content ---------- */}
      <main className="flex-1">
        {/* Hero minimalista */}
        <section className="py-8 text-center border-b bg-primary/5">
          <div className="container px-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-medium bg-primary/10 text-primary rounded-full border border-primary/20">
              <Zap className="h-3 w-3" />
              Built on Celo
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Apuntacelo</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Intercambio de apuntes basado en recompensas (Bounties) con
              reputación.
            </p>
          </div>
        </section>

        {/* Muro de Pedidos (Bounties Feed) */}
        <section className="py-12">
          <div className="container px-4">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Muro de Pedidos
            </h2>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {mockBounties.map((bounty) => (
                <Card
                  key={bounty.id}
                  className="flex flex-col justify-between"
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg font-bold">
                      {bounty.title}
                    </CardTitle>

                    {/* Karma y dirección del ofertante */}
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <span className="font-mono">
                        {truncateAddress(bounty.seller)}
                      </span>
                      <Star className="h-4 w-4 text-yellow-400" />
                      {bounty.completed > 0 ? (
                        <span>{getAverage(bounty.reputation, bounty.completed)} / 5</span>
                      ) : (
                        <span className="italic text-gray-500">Nuevo</span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="px-4 pb-4 flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">
                      {bounty.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">
                        {bounty.reward} CELO
                      </span>
                    </div>
                    <Button variant="secondary" className="self-start">
                      Ofrecer mis Apuntes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="self-start"
                      onClick={() => openRatingSheet(bounty)}
                    >
                      Aceptar Oferta
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ---------- Footer (sticky, móvil) ---------- */}
      <footer className="sticky bottom-0 w-full border-t bg-background p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="container max-w-md mx-auto flex gap-4">
          {/* Botón "Crear Pedido" abre un Sheet con formulario */}
          <Sheet open={showForm} onOpenChange={setShowForm}>
            <SheetTrigger asChild>
              <Button className="flex-1 gap-2 h-12 text-lg">
                <Upload className="h-5 w-5" />
                Crear Pedido
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-3/4">
              <SheetHeader className="mb-4">
                <SheetTitle>Nuevo Pedido de Apunte</SheetTitle>
              </SheetHeader>
              <form onSubmit={handleSubmit} className="space-y-4 px-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium">Título</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium">Descripción</label>
                  <textarea
                    name="description"
                    required
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium">Recompensa (CELO)</label>
                  <input
                    type="number"
                    name="reward"
                    required
                    min="0"
                    step="0.01"
                    value={formData.reward}
                    onChange={handleInputChange}
                    className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Crear Pedido
                </Button>
              </form>
            </SheetContent>
          </Sheet>

          {/* Botón secundario opcional (mantener para compatibilidad) */}
          <Button variant="secondary" className="flex-1 gap-2 h-12 text-lg">
            <ShoppingCart className="h-5 w-5" />
            Comprar
          </Button>
        </div>
      </footer>

      {/* ---------- Sheet para calificar al aceptar una oferta ---------- */}
      <Sheet open={ratingFormOpen} onOpenChange={setRatingFormOpen}>
        <SheetContent side="bottom" className="h-3/4">
          <SheetHeader className="mb-4">
            <SheetTitle>Calificar al Vendedor</SheetTitle>
          </SheetHeader>
          <form onSubmit={submitRating} className="space-y-4 px-4">
            <p className="text-sm text-muted-foreground">
              Seleccioná una calificación de 1 a 5 estrellas para el vendedor del
              bounty {selectedBounty?.title}
            </p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <label key={i} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    value={i}
                    checked={rating === i}
                    onChange={() => setRating(i)}
                    className="sr-only"
                  />
                  <Star
                    className={`h-6 w-6 ${
                      rating >= i
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                </label>
              ))}
            </div>
            <Button type="submit" className="w-full">
              Enviar Calificación
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
