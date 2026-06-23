# UI Components

## Árbol de componentes

```
page.tsx (Home)
├── ConnectGate          (wallet no conectada)
│   └── Hero / FeatureCards
├── [Wallet Conectada]
│   ├── Navbar           (siempre visible)
│   │   ├── Logo / Title
│   │   ├── NavLinks (Muro, Docs)
│   │   ├── UserBalance (Popover)
│   │   └── ConnectButton (avatar + disconnect)
│   ├── Hero Banner
│   │   ├── Crear Pedido (Dialog/Sheet)
│   │   │   └── CreateRequestForm
│   │   └── Pedir Apunte
│   └── RequestWall
│       └── RequestCard[]
│           ├── Ofrecer mis Apuntes (si no es owner)
│           │   └── OfferSheet
│           │       └── FileUpload + Términos
│           ├── Ver Ofertas (si es owner)
│           │   └── PendingOffers (Dialog)
│           │       ├── OfferRow / OfferCard[]
│           │       └── OfferPreview
│           │           └── PDFWatermark + Download
│           └── Badge (Tuyo / Cerrado / Abierto)
```

## Especificación de props por componente

### `ConnectGate`
- **Props:** ninguna
- **Estados:** solo rendering estático

### `Navbar`
- **Props:** ninguna (lee `useAccount` internamente)
- **Subcomponentes:** `ConnectButton`, `UserBalance`

### `UserBalance`
- **Props:** ninguna (lee balances vía wagmi)
- **Estados:** loading, connected, empty (sin fondos)

### `CreateRequestForm`
- **Props:**
  - `onSubmit: (title, description, token, amount) => Promise<void>`
  - `onSuccess: () => void`
  - `tokens: TokenInfo[]`
  - `insufficientGas: boolean`
- **Estados:** idle, approving, submitting, success, error

### `OfferSheet`
- **Props:**
  - `bountyId: bigint`
  - `onSubmit: (bountyId, file, ipfsCID, key) => Promise<void>`
  - `xmtpClient: XmtpClient | null`
  - `open: boolean`
  - `onOpenChange: (open) => void`
- **Estados:** idle, encrypting, uploading, sending-key, submitting, success, error

### `PendingOffers`
- **Props:**
  - `offers: Offer[]`
  - `encryptionKeys: Record<string, string>` (offerIndex → key)
  - `onAccept: (offerIndex, rating) => Promise<void>`
  - `isLoading: boolean`
- **Estados:** loading, empty, list, accepting, accepted

### `OfferPreview`
- **Props:**
  - `cid: string`
  - `key: string` (base64)
  - `fileName: string`
  - `mimeType: string`
  - `isDecrypted: boolean`
- **Estados:** loading, preview (watermarked), decrypted (download disponible), error
