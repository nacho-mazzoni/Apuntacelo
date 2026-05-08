"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ConnectButton } from "@/components/connect-button";
import { UserBalance } from "@/components/user-balance";
import { Zap, Upload, FileText } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// -----------------------------------------------------------------------------
// Mock de datos de bounty (para demostrar UI). En producción se leerá del contrato.
// -----------------------------------------------------------------------------
const mockBounties = [
  {
    id: 1,
    title: "Final de Física II UTN",
    reward: 2.5, // CELO
    description: "Necesito apuntes del último parcial.",
  },
  {
    id: 2,
    title: "Apuntes de Álgebra Lineal",
    reward: 1.8,
    description: "Busco material completo para el examen.",
  },
  {
    id: 3,
    title: "Tema de Redes Blockchain",
    reward: 3,
    description: "Quiero una guía práctica para la entrega.",
  },
];

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    reward: "",
  });

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
              Intercambio de apuntes basado en recompensas (Bounties).
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
                <Card key={bounty.id} className="flex flex-col justify-between">
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg font-bold">{bounty.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">{bounty.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">{bounty.reward} CELO</span>
                    </div>
                    <Button variant="secondary" className="mt-2 self-start">
                      Ofrecer mis Apuntes
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
        <div className="container max-w-md mx-auto flex">
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
        </div>
      </footer>
    </div>
  );
}
