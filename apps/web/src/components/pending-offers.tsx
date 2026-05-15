"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OfferPreview } from "./offer-preview";
import { Star, Loader2 } from "lucide-react";

interface PendingOffersProps {
  offers: Array<{
    seller: `0x${string}`;
    link: string;
    index: number;
  }>;
  bountyId: number;
  fileName: string;
  mimeType: string;
  encryptionKeys: Record<string, string>;
  isOwner: boolean;
  onAccept: (offerIndex: number, rating: number) => Promise<void>;
  isAccepted: boolean;
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
}: PendingOffersProps) {
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
      setSelectedOffer(null);
    } catch (err) {
      console.error("Error aceptando oferta:", err);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Ofertas recibidas ({offers.length})
      </h3>

      {offers.map((offer) => (
        <Card key={offer.index}>
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Oferta #{offer.index + 1}
              </CardTitle>
              <span className="text-xs font-mono text-muted-foreground">
                {offer.seller.slice(0, 6)}...{offer.seller.slice(-4)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {selectedOffer === offer.index ? (
              <div className="space-y-3">
                <OfferPreview
                  ipfsCID={offer.link}
                  fileName={fileName}
                  mimeType={mimeType}
                  keyBase64={encryptionKeys[offer.index.toString()] || ""}
                  isOwner={isOwner}
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
                Ver oferta
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
