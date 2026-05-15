"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ConnectButton } from "@/components/connect-button";
import { UserBalance } from "@/components/user-balance";
import {
  Zap,
  Upload,
  FileText,
  MessageSquare,
  Send,
  Loader2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useXmtp } from "../hooks/useXmtp";
import { useContract } from "@/hooks/useContract";
import { OfferSheet } from "@/components/offer-sheet";
import { PendingOffers } from "@/components/pending-offers";
import type { BountyRequest, Offer as ContractOffer } from "@/lib/contract";
import { formatEther } from "viem";

const getAverage = (rep: number, completed: number): string | null => {
  if (completed === 0) return null;
  return (rep / completed).toFixed(2);
};

interface OfferData {
  seller: `0x${string}`;
  link: string;
  index: number;
}

interface EncryptionKeyData {
  [key: string]: string;
}

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    reward: "",
  });

  const [activeTab, setActiveTab] = useState<"feed" | "inbox">("feed");
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);

  const [offeringBounty, setOfferingBounty] = useState<any>(null);
  const [bounties, setBounties] = useState<BountyRequest[]>([]);
  const [offersByBounty, setOffersByBounty] = useState<
    Record<string, OfferData[]>
  >({});
  const [encryptionKeys, setEncryptionKeys] = useState<
    Record<string, EncryptionKeyData>
  >({});
  const [loadingBounties, setLoadingBounties] = useState(true);

  const { client, conversations, loading: xmtpLoading, address, initializeXmtp } = useXmtp();
  const {
    createRequest,
    offerNote,
    acceptOffer,
    getRequests,
    getOffers,
    isWriting,
  } = useContract();

  const loadBounties = useCallback(async () => {
    try {
      setLoadingBounties(true);
      const requests = await getRequests();
      setBounties(requests);

      const offersMap: Record<string, OfferData[]> = {};
      for (const req of requests) {
        const offers = await getOffers(req.id);
        offersMap[req.id.toString()] = offers.map((o: ContractOffer, i: number) => ({
          seller: o.seller,
          link: o.link,
          index: i,
        }));
      }
      setOffersByBounty(offersMap);
    } catch (err) {
      console.error("Error cargando bounties:", err);
    } finally {
      setLoadingBounties(false);
    }
  }, [getRequests, getOffers]);

  useEffect(() => {
    loadBounties();
  }, [loadBounties]);

  useEffect(() => {
    if (!client) return;

    const xmtpClient = client;

    async function listenForMessages() {
      const convs = await xmtpClient.conversations.list();
      for (const conv of convs) {
        const msgs = await conv.messages();
        for (const msg of msgs) {
          if (
            typeof msg.content === "string" &&
            msg.content.startsWith("OFFER_KEY:")
          ) {
            const parts = msg.content.split(":");
            const bountyId = parts[1];
            const keyBase64 = parts[2];
            const fileName = parts[3];
            const mimeType = parts[4];

            setEncryptionKeys((prev) => ({
              ...prev,
              [bountyId]: {
                ...(prev[bountyId] || {}),
                [msg.senderAddress]: keyBase64,
              },
            }));
          }
        }
      }
    }

    listenForMessages();

    const interval = setInterval(listenForMessages, 15000);
    return () => clearInterval(interval);
  }, [client]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRequest(formData.title, formData.description, formData.reward);
      setFormData({ title: "", description: "", reward: "" });
      setShowForm(false);
      await loadBounties();
    } catch (err) {
      console.error("Error creando bounty:", err);
      alert("Error al crear el pedido. Verifica tu wallet y saldo.");
    }
  };

  const openChatWith = async (peerAddress: string) => {
    if (!client) return;
    const conv = await client.conversations.newConversation(peerAddress);
    setSelectedConversation(conv);
    setActiveTab("inbox");
  };

  const handleOfferNotes = async (bounty: BountyRequest) => {
    try {
      const xmtpClient = await initializeXmtp();
      if (!xmtpClient) {
        alert("Se necesita conectar la wallet para ofrecer apuntes");
        return;
      }
      setOfferingBounty({
        id: Number(bounty.id),
        title: bounty.title,
        reward: Number(formatEther(bounty.reward)),
        requester: bounty.requester,
      });
    } catch (err) {
      console.error("Error al ofrecer apuntes:", err);
    }
  };

  const handleOfferSubmit = async (
    bountyId: number,
    file: File,
    ipfsCID: string,
    encryptedKey: string
  ) => {
    try {
      await offerNote(BigInt(bountyId), ipfsCID);
      await loadBounties();
    } catch (err) {
      console.error("Error enviando oferta al contrato:", err);
      throw err;
    }
  };

  const handleAcceptOffer = async (
    bountyId: number,
    offerIndex: number,
    rating: number
  ) => {
    try {
      await acceptOffer(BigInt(bountyId), BigInt(offerIndex), rating);
      await loadBounties();
    } catch (err) {
      console.error("Error aceptando oferta:", err);
      alert("Error al aceptar la oferta. Intenta de nuevo.");
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !messageInput.trim()) return;
    await selectedConversation.send(messageInput.trim());
    setMessageInput("");
    const msgs = await selectedConversation.messages();
    setMessages(msgs);
  };

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

  const openBounties = bounties.filter((b) => b.status === 0);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <ConnectButton />
            <UserBalance />
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowForm(true)}
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Pedir Apunte</span>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-8 text-center border-b bg-primary/5">
          <div className="container px-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-medium bg-primary/10 text-primary rounded-full border border-primary/20">
              <Zap className="h-3 w-3" />
              Built on Celo
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Apuntacelo</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Intercambio de apuntes basado en recompensas (Bounties) con
              reputacion.
            </p>
          </div>
        </section>

        {activeTab === "feed" ? (
          <section className="py-12">
            <div className="container px-4">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Muro de Pedidos
              </h2>

              {loadingBounties ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : openBounties.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No hay pedidos activos. ¡Crea el primero!
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {openBounties.map((bounty) => {
                    const bountyOffers =
                      offersByBounty[bounty.id.toString()] || [];
                    const isOwner =
                      address?.toLowerCase() ===
                      bounty.requester.toLowerCase();

                    return (
                      <Card
                        key={bounty.id.toString()}
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
                              {formatEther(bounty.reward)} CELO
                            </span>
                          </div>

                          {isOwner && bountyOffers.length > 0 && (
                            <PendingOffers
                              offers={bountyOffers}
                              bountyId={Number(bounty.id)}
                              fileName="documento.pdf"
                              mimeType="application/pdf"
                              encryptionKeys={
                                encryptionKeys[bounty.id.toString()] || {}
                              }
                              isOwner={isOwner}
                              onAccept={(offerIndex, rating) =>
                                handleAcceptOffer(
                                  Number(bounty.id),
                                  offerIndex,
                                  rating
                                )
                              }
                              isAccepted={false}
                            />
                          )}

                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              className="flex-1"
                              onClick={() => handleOfferNotes(bounty)}
                              disabled={xmtpLoading}
                            >
                              {xmtpLoading
                                ? "Conectando..."
                                : "Ofrecer mis Apuntes"}
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openChatWith(bounty.requester)}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="py-12">
            <div className="container px-4">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                Chats
              </h2>

              {xmtpLoading && (
                <p className="text-muted-foreground">Cargando chats...</p>
              )}

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
                          {typeof msg.content === "string"
                            ? msg.content.startsWith("OFFER_KEY:")
                              ? "📄 Ofrecio un apunte"
                              : msg.content
                            : msg.content}
                        </div>
                      </div>
                    ))}
                  </div>

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

      <footer className="sticky bottom-0 w-full border-t bg-background p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="container max-w-md mx-auto flex gap-4">
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
                  <label className="text-sm font-medium">Titulo</label>
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
                  <label className="text-sm font-medium">Descripcion</label>
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
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isWriting}
                >
                  {isWriting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Pedido"
                  )}
                </Button>
              </form>
            </SheetContent>
          </Sheet>

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

      {offeringBounty && (
        <OfferSheet
          open={!!offeringBounty}
          onOpenChange={(open) => {
            if (!open) setOfferingBounty(null);
          }}
          bounty={offeringBounty}
          onSubmit={handleOfferSubmit}
          xmtpClient={client}
        />
      )}
    </div>
  );
}
