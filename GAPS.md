# Apuntacelo — User Flow Gaps

> Checklist de funcionalidades faltantes. A medida que completemos cada item, se elimina de esta lista hasta que quede vacía.

---

## Fase 1: Seller — Ofrecer Apuntes

- [ ] **Importar `OfferSheet` en `page.tsx`** — agregar `import { OfferSheet } from "@/components/offer-sheet"`
- [ ] **Agregar estado `offeringBounty`** — `useState<BountyRequest | null>(null)` para trackear en qué pedido se está ofertando
- [ ] **Agregar handler `handleOfferClick(req)`** — setea `offeringBounty` y abre el sheet
- [ ] **Conectar botón "Ofrecer mis Apuntes"** — la card debe tener `onClick={() => handleOfferClick(req)}` en vez de estar deshabilitada sin handler
- [ ] **Agregar handler `handleOfferSubmit`** — recibe `(bountyId, file, ipfsCID, key)` y llama a `offerNote(bountyId, ipfsCID)` del hook
- [ ] **Renderizar `<OfferSheet>`** — pasarle `offeringBounty`, `onSubmit`, `xmtpClient`, y controlar `open/onOpenChange`

## Fase 2: Requester — Ver Ofertas

- [ ] **Importar `PendingOffers` en `page.tsx`** — `import { PendingOffers } from "@/components/pending-offers"`
- [ ] **Agregar estado `selectedRequest`** — `useState<bigint | null>(null)` para saber qué pedido se está inspeccionando
- [ ] **Agregar estado `offers`** — `useState<Offer[]>([])` para guardar las ofertas del pedido seleccionado
- [ ] **Agregar handler `handleViewOffers(requestId)`** — llama a `getOffers(requestId)` y setea `selectedRequest` + `offers`
- [ ] **Mostrar botón "Ver ofertas" en cards del requester** — si `address === req.requester`, renderizar botón que llama a `handleViewOffers(req.id)`
- [ ] **Renderizar `PendingOffers` en un Dialog** — modal que muestra las ofertas del pedido seleccionado

## Fase 3: Requester — Obtener Encryption Keys de XMTP

- [ ] **Agregar estado `encryptionKeys`** — `useState<Record<string, string>>({})` mapea offerIndex → keyBase64
- [ ] **Agregar función `loadEncryptionKeys(bountyId)`** — recorre conversaciones XMTP, filtra mensajes `OFFER_KEY:{bountyId}:...`, parsea keyBase64
- [ ] **Llamar `loadEncryptionKeys` al abrir PendingOffers** — para que el requester pueda descifrar las vistas previas
- [ ] **Pasar `encryptionKeys` como prop a `<PendingOffers>`**

## Fase 4: Requester — Aceptar Oferta

- [ ] **Agregar handler `handleAcceptOffer(offerIndex, rating)`** — llama a `acceptOffer(requestId, offerIndex, rating)` del hook
- [ ] **Pasar `handleAcceptOffer` como `onAccept` a `<PendingOffers>`**
- [ ] **Recargar pedidos después de aceptar** — llamar `loadRequests()` para que el pedido desaparezca del muro (status Closed)
- [ ] **Parsear `fileName` y `mimeType` del mensaje XMTP** — el formato es `OFFER_KEY:{id}:{key}:{fileName}:{mimeType}`, extraer para el preview

## Fase 5: UI Post-Aceptación

- [ ] **Botón "Descargar" después de aceptar** — OfferPreview ya lo tiene cuando `isDecrypted=true`, solo pasarlo bien
- [ ] **Mostrar reputación del seller en la UI** — el contrato tiene `reputation[address]` y `completedTasks[address]`, se puede leer y mostrar
- [ ] **Badge "Closed" en pedidos cerrados** — actualmente el muro solo filtra `status === 0 (Open)`, pero podría mostrar los cerrados con otro badge

---

## Resumen de archivos a tocar

| Archivo | Cambios |
|---|---|
| `app/page.tsx` | Todos los imports, estados, handlers, renders |
| `hooks/useXmtp.ts` | (opcional) helper para parsear mensajes |
| `components/pending-offers.tsx` | (opcional) si hay que ajustar props |
| `components/offer-preview.tsx` | (opcional) si hay que ajustar props |
