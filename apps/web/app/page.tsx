"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ConnectButton } from "@/components/connect-button";
import { UserBalance } from "@/components/user-balance";
import {
  Zap,
  Upload,
  ShoppingCart,
  FileText,
  MessageSquare,
  Send,
  Star,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useXmtp } from "../hooks/useXmtp";

// -----------------------------------------------------------------------------
// Mock de datos de bounty (para demostrar UI). En producción se leerá del contrato.
// -----------------------------------------------------------------------------
const mockBounties = [
  {
    id: 1,
    title: "Final de Física II UTN",
    reward: 2.5,
    description: "Necesito apuntes del último parcial.",
    requester: "0x1111111111111111111111111111111111111111",
  },
  {
    id: 2,
    title: "Apuntes de Álgebra Lineal",
    reward: 1.8,
    description: "Busco material completo para el examen.",
    requester: "0x2222222222222222222222222222222222222222",
  },
  {
    id: 3,
    title: "Tema de Redes Blockchain",
    reward: 3,
    description: "Quiero una guía práctica para la entrega.",
    requester: "0x3333333333333333333333333333333333333333",
  },
];

// -----------------------------------------------------------------------------
// Helper: cálculo de promedio de reputación
// -----------------------------------------------------------------------------
const getAverage = (rep: number, completed: number): string | null => {
  if (completed === 0) return null;
  return (rep / completed).toFixed(2);
};

export default function Home() {
  // -------- Estado del formulario de "Crear Pedido" ----------
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    reward: "",
  });

  // -------- Navegación entre Feed y Bandeja de Entrada ----------
  const [activeTab, setActiveTab] = useState<"feed" | "inbox">("feed");
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messageInput, setMessageInput] = useState("");

  // -------- Estado del selector de rating al aceptar una oferta ----------
  const [ratingFormOpen, setRatingFormOpen] = useState(false);
  const [selectedBounty, setSelectedBounty] = useState<any>(null);
  const [rating, setRating] = useState(5);

  // -------- Hook XMTP (solo se ejecuta después de que el provider de Wagmi está listo) ----------
  const { client, conversations, loading, address } = useXmtp();

  // -------- Handlers ----------
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Crear bounty:", formData);
    setFormData({ title: "", description: "", reward: "" });
    setShowForm(false);
  };

  const openChatWith = async (peerAddress: string) => {
    if (!client) return;
    const conv = await client.conversations.newConversation(peerAddress);
    setSelectedConversation(conv);
    setActiveTab("inbox");
  };

  const openRatingSheet = (bounty: any) => {
    setSelectedBounty(bounty);
    setRating(5);
    setRatingFormOpen(true);
  };

  const submitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !selectedBounty) return;
    // Aquí se llamaría al método `acceptOffer(requestId, offerIndex, rating)` del contrato
    console.log("Rating submitted", selectedBounty.id, rating, "(simulado)");
    setRatingFormOpen(false);
    setSelectedBounty(null);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !messageInput.trim()) return;
    await selectedConversation.send(messageInput.trim());
    setMessageInput("");
    // Recargar mensajes
    const msgs = await selectedConversation.messages();
    setMessages(msgs);
  };

  // Mensajes de la conversación seleccionada
  const [messages, setMessages] = useState<any[]>([]);
  useEffect(() => {
    async function loadMsgs() {
      if (!selectedConversation) {
        setMessages([]);
        return;
      }
      const msgs = await selectedConversation.messages();
      setMessages(msgs);
    }
    loadMsgs();
  }, [selectedConversation]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* ---------- Header (sticky) ---------- */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* izquierda */}
          <div className="flex items-center gap-4">
            <ConnectButton />
            <UserBalance />
          </div>

          {/* botón principal "Pedir Apunte" */}
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Pedir Apunte</span>
          </Button>
        </div>
      </header>

      {/* ---------- Main ---------- */}
      <main className="flex-1">
        {/* Hero */}
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

        {/* Contenido dinámico */}
        {activeTab === "feed" ? (
          // Muro de Pedidos
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

                      {/* Botón de oferta */}
                      <Button variant="secondary" className="self-start">
                        Ofrecer mis Apuntes
                      </Button>

                      {/* Botón de chat */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="self-start"
                        onClick={() => openChatWith(bounty.requester)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Chat
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        ) : (
          // Bandeja de Entrada (Inbox)
          <section className="py-12">
            <div className="container px-4">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                Chats
              </h2>

              {loading && (
                <p className="text-muted-foreground">Cargando chats...</p>
              )}

              {/* Lista de conversaciones */}
              {!selectedConversation && (
                <>
                  {conversations.length === 0 ? (
                    <p className="text-muted-foreground">
                      No tienes chats activos. ¡Haz una oferta por un apunte
                      para empezar!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {conversations.map((conv) => (
                        <Button
                          key={conv.peerAddress}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={async () => {
                            const fullConv =
                              await client!.conversations.newConversation(
                                conv.peerAddress
                              );
                            setSelectedConversation(fullConv);
                          }}
                        >
                          {conv.peerAddress}
                        </Button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Conversación activa */}
              {selectedConversation && (
                <div className="flex flex-col h-[60vh]">
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-2 border rounded-md">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${
                          msg.senderAddress === address
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`rounded-xl px-4 py-2 max-w-xs break-words ${
                            msg.senderAddress === address
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input de envío */}
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Escribe un mensaje..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="flex-1 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button type="submit" className="flex items-center gap-1">
                      <Send className="h-4 w-4" />
                      Enviar
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* ---------- Footer (sticky, móvil) ---------- */}
      <footer className="sticky bottom-0 w-full border-t bg-background p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="container max-w-md mx-auto flex gap-4">
          {/* Botón "Crear Pedido" */}
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
                  <label className="text-sm font-medium">
                    Recompensa (CELO)
                  </label>
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

          {/* Botón "Chats" */}
          <Button
            variant={activeTab === "inbox" ? "default" : "ghost"}
            className="flex-1 gap-2 h-12 text-lg"
            onClick={() => setActiveTab("inbox")}
          >
            <MessageSquare className="h-5 w-5" />
            Chats
          </Button>
        </div>
      </footer>
    </div>
  );
}
