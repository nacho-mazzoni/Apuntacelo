"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Client } from "@xmtp/browser-sdk";

const SEEN_OFFERS_KEY = "xmtp-seen-offers";
const OFFER_PREFIX = "OFFER_KEY:";
const REFRESH_INTERVAL = 30_000;

function getSeenOfferIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_OFFERS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeenOfferIds(ids: Set<string>) {
  localStorage.setItem(SEEN_OFFERS_KEY, JSON.stringify(Array.from(ids)));
}

function parseBountyFromOffer(content: unknown): number | null {
  if (typeof content !== "string" || !content.startsWith(OFFER_PREFIX))
    return null;
  const rest = content.slice(OFFER_PREFIX.length);
  const colonIdx = rest.indexOf(":");
  if (colonIdx === -1) return null;
  const id = Number(rest.slice(0, colonIdx));
  return isNaN(id) ? null : id;
}

export function useXmtpStream(client: Client | null) {
  const [newOffersCount, setNewOffersCount] = useState<Record<number, number>>(
    {}
  );
  const seenIdsRef = useRef<Set<string>>(getSeenOfferIds());
  const countsRef = useRef<Record<number, number>>({});

  const markAsSeen = useCallback((bountyId: number) => {
    setNewOffersCount((prev) => ({ ...prev, [bountyId]: 0 }));
    countsRef.current[bountyId] = 0;
  }, []);

  const processMessages = useCallback(
    (messages: { content: unknown; id: string }[]) => {
      let changed = false;
      for (const msg of messages) {
        const bountyId = parseBountyFromOffer(msg.content);
        if (bountyId === null) continue;
        if (seenIdsRef.current.has(msg.id)) continue;

        seenIdsRef.current.add(msg.id);
        saveSeenOfferIds(seenIdsRef.current);

        countsRef.current[bountyId] =
          (countsRef.current[bountyId] || 0) + 1;
        changed = true;
      }
      if (changed) {
        setNewOffersCount({ ...countsRef.current });
      }
    },
    []
  );

  const scanAllDms = useCallback(
    async (c: Client) => {
      const allDms = await c.conversations.listDms();
      for (const dm of allDms) {
        try {
          const messages = await dm.messages();
          processMessages(messages);
        } catch (err) {
          console.warn("Error leyendo mensajes de DM:", err);
        }
      }
    },
    [processMessages]
  );

  useEffect(() => {
    if (!client) return;

    let active = true;
    let msgStream: { end(): Promise<unknown> } | null = null;
    let dmStream: { end(): Promise<unknown> } | null = null;
    let refreshTimer: ReturnType<typeof setInterval> | null = null;

    (async () => {
      try {
        await client.conversations.syncAll();
        if (!active) return;

        await scanAllDms(client);
        if (!active) return;

        const [msg, dm] = await Promise.all([
          client.conversations.streamAllDmMessages(),
          client.conversations.streamDms(),
        ]);
        msgStream = msg;
        dmStream = dm;

        const runMsgStream = async () => {
          while (active) {
            const result = await msg.next();
            if (!active || result.done) break;
            processMessages([result.value]);
          }
        };

        const runDmStream = async () => {
          while (active) {
            const result = await dm.next();
            if (!active || result.done) break;
            try {
              const messages = await result.value.messages();
              processMessages(messages);
            } catch (err) {
              console.warn("Error leyendo mensajes de nuevo DM:", err);
            }
          }
        };

        await Promise.allSettled([runMsgStream(), runDmStream()]);
      } catch (err) {
        if (active) console.error("Error en stream XMTP:", err);
      }
    })();

    refreshTimer = setInterval(async () => {
      if (!active || !client) return;
      try {
        await client.conversations.syncAll();
        await scanAllDms(client);
      } catch (err) {
        console.warn("Error en refresh de ofertas:", err);
      }
    }, REFRESH_INTERVAL);

    return () => {
      active = false;
      if (refreshTimer) clearInterval(refreshTimer);
      msgStream?.end().catch((err) => console.warn("Error cerrando msgStream:", err));
      dmStream?.end().catch((err) => console.warn("Error cerrando dmStream:", err));
    };
  }, [client, scanAllDms, processMessages]);

  return { newOffersCount, markAsSeen };
}
