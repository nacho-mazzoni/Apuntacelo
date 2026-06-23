# Data Model

## Entidades

### BountyRequest (on-chain)

| Campo | Tipo Solidity | Descripción | Restricciones |
|-------|---------------|-------------|---------------|
| `id` | `uint256` | ID auto-incremental | PK, asignado por el contrato |
| `requester` | `address` | Dirección del creador | — |
| `title` | `string` | Título del pedido | ≤ 100 chars |
| `description` | `string` | Descripción detallada | ≤ 500 chars |
| `token` | `address` | Dirección del token ERC-20 | cUSD / USDC / USDT únicamente |
| `amount` | `uint256` | Monto de recompensa | > 0, en decimals del token |
| `status` | `Status` | Estado del pedido | Open(0) / Fulfilled(1) / Cancelled(2) |
| `createdAt` | `uint256` | Timestamp UNIX | block.timestamp |

### Offer (on-chain + off-chain)

| Campo | Almacenamiento | Descripción |
|-------|---------------|-------------|
| `seller` | on-chain | Dirección del vendedor |
| `ipfsCID` | on-chain | CID del archivo cifrado en IPFS |
| `fileName` | off-chain (XMTP) | Nombre original del archivo |
| `mimeType` | off-chain (XMTP) | Tipo MIME del archivo |
| `aesKey` | off-chain (XMTP) | Clave AES-GCM en base64 |
| `status` | on-chain | Pending(0) / Accepted(1) / Rejected(2) |

### User (on-chain, implícita)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `address` | `address` | Dirección de wallet |
| `reputation` | `uint256` | Suma acumulada de ratings recibidos |
| `completedTasks` | `uint256` | Cantidad de ofertas aceptadas |

### EncryptionKeyPayload (off-chain, XMTP)

```
Formato: OFFER_KEY:{bountyId}:{aesKeyBase64}:{fileName}:{mimeType}
```

| Campo | Descripción |
|-------|-------------|
| `OFFER_KEY` | Prefijo fijo para identificar el tipo de mensaje |
| `bountyId` | ID del bounty (uint256) |
| `aesKeyBase64` | Clave AES-GCM de 256 bits en base64 |
| `fileName` | Nombre original del archivo (URL-encoded) |
| `mimeType` | Tipo MIME (URL-encoded) |

## Relaciones

```
User (requester) ──1:N──▶ BountyRequest
User (seller)    ──1:N──▶ Offer
BountyRequest    ──1:N──▶ Offer
Offer            ──1:1──▶ EncryptionKeyPayload (via XMTP topic)
Offer            ──1:1──▶ IPFS File (via ipfsCID)
```

## Tipos compartidos (TypeScript)

Ver `packages/shared-types/src/` para las definiciones de tipos que deben coincidir 1:1 con este modelo.
