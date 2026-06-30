"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OfferPreview } from "./offer-preview";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Star, Loader2, Eye } from "lucide-react";

interface PendingOffersProps {
  offers: Array<{
    seller: `0x${string}`;
    link: string;
    index: number;
    fileName?: string;
    mimeType?: string;
  }>;
  bountyId: number;
  fileName: string;
  mimeType: string;
  encryptionKeys: Record<string, string>;
  isOwner: boolean;
  onAccept: (offerIndex: number, rating: number) => Promise<void>;
  isAccepted: boolean;
  sellerReputations: Record<string, { reputation: number; completedTasks: number; average: number }>;
}

export function PendingOffers({
  offers,
  bountyId,
  fileName,
  mimeType,
  encryptionKeys,
  isOwner,
  onAccept,
  isAccepted,
  sellerReputations,
}: PendingOffersProps) {
  const isMobile = useIsMobile();
  const [selectedOffer, setSelectedOffer] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [showRating, setShowRating] = useState(false);
  const [accepting, setAccepting] = useState(false);

  if (offers.length === 0) {
    return (
      <div className="p-4 border rounded-lg text-center">
        <p className="text-sm text-muted-foreground">
          No hay ofertas todavia para este pedido.
        </p>
      </div>
    );
  }

  const handleAccept = async () => {
    if (selectedOffer === null) return;
    setAccepting(true);
    try {
      await onAccept(selectedOffer, rating);
      setShowRating(false);
    } catch (err) {
      console.error("Error aceptando oferta:", err);
    } finally {
      setAccepting(false);
    }
  };

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (isMobile) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Ofertas recibidas ({offers.length})
        </h3>

        {offers.map((offer) => {
          const rep = sellerReputations[offer.seller.toLowerCase()];
          return (
          <Card key={offer.index}>
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Oferta #{offer.index + 1}
                </CardTitle>
                <span className="text-xs font-mono text-muted-foreground">
                  {truncate(offer.seller)}
                </span>
              </div>
              {rep && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{rep.average}</span>
                  <span className="ml-1">({rep.completedTasks} ventas)</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {selectedOffer === offer.index ? (
                <div className="space-y-3">
                  <OfferPreview
                    ipfsCID={offer.link}
                    fileName={offer.fileName || fileName}
                    mimeType={offer.mimeType || mimeType}
                    keyBase64={encryptionKeys[offer.index.toString()] || ""}
                    isOwner={isOwner}
                    isDecrypted={isAccepted}
                    onAccept={
                      isOwner && !isAccepted
                        ? () => setShowRating(true)
                        : undefined
                    }
                  />

                  {showRating && (
                    <div className="p-4 border rounded-lg space-y-3">
                      <p className="text-sm font-medium">
                        Califica este apunte (1-5 estrellas)
                      </p>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="p-1"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                star <= rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleAccept}
                          disabled={accepting}
                        >
                          {accepting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            `Aceptar y pagar (${rating} estrellas)`
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowRating(false)}
                          disabled={accepting}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOffer(offer.index)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver oferta
                </Button>
              )}
            </CardContent>
          </Card>
        )
      })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Ofertas recibidas ({offers.length})
      </h3>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Oferta</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead>Archivo</TableHead>
            <TableHead>Reputación</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offers.map((offer) => {
            const rep = sellerReputations[offer.seller.toLowerCase()];
            return (
            <TableRow key={offer.index}>
              <TableCell className="font-medium">
                #{offer.index + 1}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {truncate(offer.seller)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {offer.fileName || fileName || "Documento"}
              </TableCell>
              <TableCell className="text-sm">
                {rep ? (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {rep.average}
                    <span className="text-muted-foreground ml-1">
                      ({rep.completedTasks})
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOffer(offer.index)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Vista previa
                  </Button>
                  {isOwner && !isAccepted && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedOffer(offer.index);
                        setShowRating(true);
                      }}
                    >
                      Aceptar
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>

      {selectedOffer !== null && (
        <Card>
          <CardContent className="p-4">
            {(() => {
              const sel = offers.find(o => o.index === selectedOffer);
              return (
            <OfferPreview
              ipfsCID={sel?.link || ""}
              fileName={sel?.fileName || fileName}
              mimeType={sel?.mimeType || mimeType}
              keyBase64={encryptionKeys[selectedOffer.toString()] || ""}
              isOwner={isOwner}
              isDecrypted={isAccepted}
            />
              );
            })()}
            {showRating && (
              <div className="mt-4 p-4 border rounded-lg space-y-3">
                <p className="text-sm font-medium">
                  Califica este apunte (1-5 estrellas)
                </p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAccept}
                    disabled={accepting}
                  >
                    {accepting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      `Aceptar y pagar (${rating} estrellas)`
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowRating(false);
                      setSelectedOffer(null);
                    }}
                    disabled={accepting}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
