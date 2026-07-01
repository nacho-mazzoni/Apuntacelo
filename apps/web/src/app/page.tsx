"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
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
import { Zap, Upload, FileText, Plus } from "lucide-react";
import { useXmtp } from "@/hooks/useXmtp";
import { useContract } from "@/hooks/useContract";
import { useAccount, useChainId } from "wagmi";
import { OfferSheet } from "@/components/offer-sheet";
import { PendingOffers } from "@/components/pending-offers";
import { ConnectGate } from "@/components/connect-gate";
import { CreateRequestForm } from "@/components/create-request-form";
import { RequestCard } from "@/components/request-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useBalance } from "wagmi";
import { formatUnits } from "viem";
import { getTokenByAddress } from "@/lib/tokens";
import { clearIPFSCache } from "@/lib/ipfs";
import type { BountyRequest, Offer } from "@/lib/contract";

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { requestCount, createRequest, getRequests, getOffers, approveToken, offerNote, acceptOffer, isWriting, waitForTx } = useContract();
  const isMobile = useIsMobile();

  const [showForm, setShowForm] = useState(false);
  const [requests, setRequests] = useState<BountyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [offeringBounty, setOfferingBounty] = useState<BountyRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<bigint | null>(null);
  const [selectedOffers, setSelectedOffers] = useState<Offer[]>([]);
  const [encryptionKeys, setEncryptionKeys] = useState<Record<string, string>>({});
  const [fileInfo, setFileInfo] = useState<Record<string, { fileName: string; mimeType: string }>>({});

  const { addToast } = useToast();
  const { client, initializeXmtp } = useXmtp(selectedRequest !== null);
  const { data: celoBalance } = useBalance({ address, chainId, query: { enabled: showForm, staleTime: 30_000 } });
  const insufficientGas = !!address && celoBalance !== undefined && celoBalance.value === 0n;

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

  const handleFormSubmit = async (
    title: string,
    description: string,
    tokenAddress: `0x${string}`,
    amount: bigint
  ) => {
    if (!address) return;
    try {
      const approveHash = await approveToken(tokenAddress, amount);
      await waitForTx(approveHash);
      const createHash = await createRequest(title, description, tokenAddress, amount);
      await waitForTx(createHash);
      setShowForm(false);
      loadRequests();
      addToast("Pedido creado exitosamente", "success");
    } catch {
      addToast("Error al crear el pedido", "error");
    }
  };

  const onRequestNotes = async () => {
    try {
      if (!client) {
        await initializeXmtp();
        addToast("XMTP inicializado correctamente", "success");
      }
    } catch {
      addToast("No se pudo inicializar XMTP", "error");
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
    const hash = await offerNote(bountyId, ipfsCID);
    await waitForTx(hash);
    setOfferingBounty(null);
    loadRequests();
  };

  const handleViewOffers = async (requestId: bigint) => {
    try {
      const data = await getOffers(requestId);
      setSelectedOffers(data);
      setSelectedRequest(requestId);
    } catch {
      addToast("Error al cargar ofertas", "error");
    }
  };

  const handleLoadOfferKey = useCallback(async (offerIndex: number, sellerAddress: `0x${string}`) => {
    if (!client || selectedRequest === null) return;
    try {
      const convs = await client.conversations.list();
      const conv = convs.find(
        (c: any) => c.peerAddress.toLowerCase() === sellerAddress.toLowerCase()
      );
      if (!conv) {
        addToast("No se encontró conversación XMTP con ese vendedor", "error");
        return;
      }
      const messages = await conv.messages();
      const prefix = `OFFER_KEY:${Number(selectedRequest)}:`;
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
        setEncryptionKeys(prev => ({ ...prev, [offerIndex.toString()]: keyBase64 }));
        setFileInfo(prev => ({ ...prev, [offerIndex.toString()]: { fileName, mimeType } }));
        return;
      }
      addToast("No se encontró la clave de cifrado para esta oferta", "error");
    } catch (err) {
      console.error("Error loading offer key from XMTP:", err);
      addToast("Error al cargar clave de la oferta", "error");
    }
  }, [client, selectedRequest, addToast]);

  const handleAcceptOffer = async (offerIndex: number, rating: number) => {
    if (selectedRequest === null) return;
    try {
      const hash = await acceptOffer(selectedRequest, BigInt(offerIndex), rating);
      await waitForTx(hash);
      loadRequests();
    } catch {
      addToast("Error al aceptar oferta", "error");
    }
  };

  const formatReward = useCallback((req: BountyRequest) => {
    const token = getTokenByAddress(chainId, req.token);
    if (!token) return `${formatUnits(req.reward, 18)} tokens`;
    return `${formatUnits(req.reward, token.decimals)} ${token.symbol}`;
  }, [chainId]);

  const truncateAddress = useCallback((addr: `0x${string}`) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`, []);

  const requestCountText = useMemo(() =>
    `${requests.length} pedido${requests.length !== 1 ? "s" : ""} abierto${requests.length !== 1 ? "s" : ""}`,
  [requests.length]);

  const requestsMap = useMemo(() => new Map(requests.map((r) => [r.id, r])), [requests]);

  const mappedOffers = useMemo(
    () => selectedOffers.map((o, i) => ({
      ...o,
      index: i,
      fileName: fileInfo[i]?.fileName || "",
      mimeType: fileInfo[i]?.mimeType || "",
    })),
    [selectedOffers, fileInfo]
  );

  const isSelectedRequestOwner = useMemo(() => {
    if (selectedRequest === null) return false;
    const req = requestsMap.get(selectedRequest);
    return req?.requester === address;
  }, [selectedRequest, requestsMap, address]);

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
              chainId={chainId}
              isWriting={isWriting}
              insufficientGas={insufficientGas}
              onSubmit={handleFormSubmit}
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
              chainId={chainId}
              isWriting={isWriting}
              insufficientGas={insufficientGas}
              onSubmit={handleFormSubmit}
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
                {requestCountText}
              </span>
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="flex flex-col justify-between">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-10 shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 flex flex-col gap-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex items-center gap-2 mt-auto pt-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-4 w-10" />
                      </div>
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-9 w-full mt-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Todavía no hay pedidos. ¡Creá el primero!</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {requests.map((req) => (
                  <RequestCard
                    key={req.id.toString()}
                    req={req}
                    token={getTokenByAddress(chainId, req.token)}
                    formatReward={formatReward}
                    truncateAddress={truncateAddress}
                    isConnected={isConnected}
                    isOwner={address === req.requester}
                    onOfferClick={handleOfferClick}
                    onViewOffers={handleViewOffers}
                  />
                ))}
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
            clearIPFSCache();
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ofertas recibidas</DialogTitle>
          </DialogHeader>
          <PendingOffers
            offers={mappedOffers}
            bountyId={Number(selectedRequest)}
            encryptionKeys={encryptionKeys}
            isOwner={isSelectedRequestOwner}
            onAccept={handleAcceptOffer}
            onLoadOfferKey={handleLoadOfferKey}
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
