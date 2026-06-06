"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Zap, Upload, FileText, Loader2, Plus } from "lucide-react";
import { useXmtp } from "@/hooks/useXmtp";
import { useContract } from "@/hooks/useContract";
import { useAccount, useChainId } from "wagmi";
import { OfferSheet } from "@/components/offer-sheet";
import { PendingOffers } from "@/components/pending-offers";
import { ConnectGate } from "@/components/connect-gate";
import { CreateRequestForm } from "@/components/create-request-form";
import { useBalance } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { getTokensForChain, getTokenByAddress } from "@/lib/tokens";
import type { TokenInfo } from "@/lib/tokens";
import type { BountyRequest, Offer } from "@/lib/contract";

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { requestCount, createRequest, getRequests, getOffers, approveToken, offerNote, acceptOffer, isWriting } = useContract();
  const { client, initializeXmtp } = useXmtp();
  const isMobile = useIsMobile();

  const [showForm, setShowForm] = useState(false);
  const { data: celoBalance } = useBalance({ address, chainId, query: { enabled: showForm } });
  const insufficientGas = !!address && celoBalance !== undefined && celoBalance.value === 0n;
  const [requests, setRequests] = useState<BountyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    reward: "",
  });

  const tokens = getTokensForChain(chainId);

  useEffect(() => {
    if (tokens.length > 0 && !selectedToken) {
      setSelectedToken(tokens[0]);
    }
  }, [chainId, tokens, selectedToken]);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRequests();
      setRequests(data);
    } catch (err) {
      console.error("Error loading requests:", err);
    } finally {
      setLoading(false);
    }
  }, [getRequests]);

  useEffect(() => {
    if (requestCount !== undefined) {
      loadRequests();
    }
  }, [requestCount, loadRequests]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToken || !address) return;

    try {
      const amount = parseUnits(formData.reward, selectedToken.decimals);

      await approveToken(selectedToken.address as `0x${string}`, amount);

      await createRequest(
        formData.title,
        formData.description,
        selectedToken.address as `0x${string}`,
        amount
      );

      setFormData({ title: "", description: "", reward: "" });
      setShowForm(false);
      setTimeout(loadRequests, 2000);
    } catch (err) {
      console.error("Error creating request:", err);
    }
  };

  const [offeringBounty, setOfferingBounty] = useState<BountyRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<bigint | null>(null);
  const [selectedOffers, setSelectedOffers] = useState<Offer[]>([]);
  const [encryptionKeys, setEncryptionKeys] = useState<Record<string, string>>({});
  const [fileInfo, setFileInfo] = useState<Record<string, { fileName: string; mimeType: string }>>({});

  const onRequestNotes = async () => {
    try {
      if (!client) {
        await initializeXmtp();
      }
    } catch (err) {
      console.error("No se pudo inicializar XMTP:", err);
    }
  };

  const handleOfferClick = (req: BountyRequest) => {
    setOfferingBounty(req);
  };

  const handleOfferSubmit = async (
    bountyId: bigint,
    _file: File,
    ipfsCID: string,
    _encryptedKey: string
  ) => {
    await offerNote(bountyId, ipfsCID);
    setOfferingBounty(null);
    loadRequests();
  };

  const handleViewOffers = async (requestId: bigint) => {
    try {
      const data = await getOffers(requestId);
      setSelectedOffers(data);
      setSelectedRequest(requestId);
      loadOfferKeys(Number(requestId), data);
    } catch (err) {
      console.error("Error loading offers:", err);
    }
  };

  const loadOfferKeys = useCallback(async (bountyId: number, offers: Offer[]) => {
    if (!client || !offers.length) return;
    const keys: Record<string, string> = {};
    const files: Record<string, { fileName: string; mimeType: string }> = {};
    try {
      const convs = await client.conversations.list();
      for (const conv of convs) {
        const peerAddress = conv.peerAddress.toLowerCase();
        const offerIndex = offers.findIndex(
          (o) => o.seller.toLowerCase() === peerAddress
        );
        if (offerIndex === -1) continue;
        const messages = await conv.messages();
        const prefix = `OFFER_KEY:${bountyId}:`;
        for (const msg of messages) {
          const content = msg.content;
          if (typeof content !== "string" || !content.startsWith(prefix)) continue;
          const rest = content.slice(prefix.length);
          const keyEnd = rest.indexOf(":");
          if (keyEnd === -1) continue;
          const keyBase64 = rest.slice(0, keyEnd);
          const rest2 = rest.slice(keyEnd + 1);
          const lastColon = rest2.lastIndexOf(":");
          if (lastColon === -1) continue;
          const fileName = rest2.slice(0, lastColon);
          const mimeType = rest2.slice(lastColon + 1);
          keys[offerIndex.toString()] = keyBase64;
          files[offerIndex.toString()] = { fileName, mimeType };
        }
      }
    } catch (err) {
      console.error("Error loading offer keys from XMTP:", err);
    }
    setEncryptionKeys(keys);
    setFileInfo(files);
  }, [client]);

  const handleAcceptOffer = async (offerIndex: number, rating: number) => {
    if (selectedRequest === null) return;
    try {
      await acceptOffer(selectedRequest, BigInt(offerIndex), rating);
      loadRequests();
    } catch (err) {
      console.error("Error accepting offer:", err);
    }
  };

  const formatReward = (req: BountyRequest) => {
    const token = getTokenByAddress(chainId, req.token);
    if (!token) return `${formatUnits(req.reward, 18)} tokens`;
    return `${formatUnits(req.reward, token.decimals)} ${token.symbol}`;
  };

  const truncateAddress = (addr: `0x${string}`) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {isConnected ? (
        <>
      <main className="flex-1">
        <section className="py-8 md:py-12 text-center border-b bg-primary/5">
          <div className="container px-4 max-w-7xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 text-xs font-medium bg-primary/10 text-primary rounded-full border border-primary/20">
              <Zap className="h-3 w-3" />
              Built on Celo
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Apuntacelo</h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base max-w-xl mx-auto">
              Marketplace descentralizado de apuntes universitarios. Creá bounties en stablecoins y recibí ofertas de otros estudiantes.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
              {isMobile ? (
                <Sheet open={showForm} onOpenChange={setShowForm}>
                  <SheetTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Crear Pedido
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-3/4">
                    <SheetHeader className="mb-4">
                      <SheetTitle>Nuevo Pedido de Apunte</SheetTitle>
                    </SheetHeader>
                    <CreateRequestForm
              formData={formData}
              selectedToken={selectedToken}
              tokens={tokens}
              isWriting={isWriting}
              insufficientGas={insufficientGas}
              onSubmit={handleSubmit}
              onInputChange={handleInputChange}
              onTokenChange={setSelectedToken}
            />
                  </SheetContent>
                </Sheet>
              ) : (
                <Dialog open={showForm} onOpenChange={setShowForm}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Crear Pedido
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Nuevo Pedido de Apunte</DialogTitle>
                    </DialogHeader>
                    <CreateRequestForm
              formData={formData}
              selectedToken={selectedToken}
              tokens={tokens}
              isWriting={isWriting}
              insufficientGas={insufficientGas}
              onSubmit={handleSubmit}
              onInputChange={handleInputChange}
              onTokenChange={setSelectedToken}
            />
                  </DialogContent>
                </Dialog>
              )}
              <Button variant="outline" className="gap-2" onClick={onRequestNotes}>
                <Upload className="h-4 w-4" />
                Pedir Apunte
              </Button>
            </div>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="container px-4 max-w-7xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Muro de Pedidos
              </h2>
              <span className="text-sm text-muted-foreground">
                {requests.length} pedido{requests.length !== 1 ? "s" : ""} abierto{requests.length !== 1 ? "s" : ""}
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Todavía no hay pedidos. ¡Creá el primero!</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {requests.map((req) => {
                  const token = getTokenByAddress(chainId, req.token);
                  return (
                    <Card key={req.id.toString()} className="flex flex-col justify-between">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base font-bold leading-tight">
                            {req.title}
                          </CardTitle>
                          <Badge variant="success" className="shrink-0 text-[10px] px-1.5 py-0">
                            Open
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 flex flex-col gap-2 flex-1">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {req.description}
                        </p>
                        <div className="flex items-center gap-2 mt-auto pt-2">
                          <span className="font-mono font-bold text-primary text-sm">
                            {formatReward(req)}
                          </span>
                          {token && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {token.symbol}
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          por {truncateAddress(req.requester)}
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() => handleOfferClick(req)}
                          disabled={!isConnected}
                        >
                          Ofrecer mis Apuntes
                        </Button>
                        {address === req.requester && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-1 w-full"
                            onClick={() => handleViewOffers(req.id)}
                          >
                            Ver ofertas
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <OfferSheet
        open={offeringBounty !== null}
        onOpenChange={(open) => !open && setOfferingBounty(null)}
        bounty={offeringBounty}
        onSubmit={handleOfferSubmit}
        xmtpClient={client}
        chainId={chainId}
      />

      <Dialog
        open={selectedRequest !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null);
            setSelectedOffers([]);
            setEncryptionKeys({});
            setFileInfo({});
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ofertas recibidas</DialogTitle>
          </DialogHeader>
          <PendingOffers
            offers={selectedOffers.map((o, i) => ({
              ...o,
              index: i,
              fileName: fileInfo[i]?.fileName || "",
              mimeType: fileInfo[i]?.mimeType || "",
            }))}
            bountyId={Number(selectedRequest)}
            fileName=""
            mimeType=""
            encryptionKeys={encryptionKeys}
            isOwner={
              address ===
              requests.find((r) => r.id === selectedRequest)?.requester
            }
            onAccept={handleAcceptOffer}
            isAccepted={false}
          />
        </DialogContent>
      </Dialog>

      <footer className="border-t bg-background py-4 md:py-6">
        <div className="container px-4 max-w-7xl flex items-center justify-between text-xs text-muted-foreground">
          <span>Apuntacelo &mdash; Built on Celo</span>
          {requests.length > 0 && <span>{requests.length} pedidos activos</span>}
        </div>
      </footer>
        </>
      ) : (
        <ConnectGate />
      )}
    </div>
  );
}
