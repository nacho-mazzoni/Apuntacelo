"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BountyRequest } from "@/lib/contract";
import type { TokenInfo } from "@/lib/tokens";

interface RequestCardProps {
  req: BountyRequest;
  token: TokenInfo | undefined;
  formatReward: (req: BountyRequest) => string;
  truncateAddress: (addr: `0x${string}`) => string;
  isConnected: boolean;
  isOwner: boolean;
  onOfferClick: (req: BountyRequest) => void;
  onViewOffers: (requestId: bigint) => void;
}

export const RequestCard = memo(function RequestCard({
  req,
  token,
  formatReward,
  truncateAddress,
  isConnected,
  isOwner,
  onOfferClick,
  onViewOffers,
}: RequestCardProps) {
  return (
    <Card className="flex flex-col justify-between">
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
          onClick={() => onOfferClick(req)}
          disabled={!isConnected}
        >
          Ofrecer mis Apuntes
        </Button>
        {isOwner && (
          <Button
            variant="outline"
            size="sm"
            className="mt-1 w-full"
            onClick={() => onViewOffers(req.id)}
          >
            Ver ofertas
          </Button>
        )}
      </CardContent>
    </Card>
  );
});
