# MiniPay Intake — Apuntacelo (Stage 1 Prep)

> Formulario: https://minipay.to/mini-apps

---

## Developer / Company Name

- **Apuntacelo** (Nacho Mazzoni)

## Email

- (Poner tu email acá)

## App URL

- Demo actual: `http://localhost:3000` (al deployar en producción se actualiza)

## Category

- **Social & Communities** (o **Payments** — es marketplace de apuntes con pagos)

## Short Description

> **Apuntacelo** es un marketplace de apuntes universitarios donde los estudiantes crean bounties en stablecoins (USDC/USDT/cUSD) y otros estudiantes ofrecen su material a cambio de la recompensa.

## Does your App already support MiniPay?

- **Yes** ✅
  - `window.ethereum.isMiniPay` detection + auto-connect
  - No "Connect Wallet" button dentro de MiniPay
  - No `personal_sign`
  - Direcciones 0x truncadas (no raw)

## Smart Contract Address

- **Celo Sepolia:** `0x70b4107443F7A255D7A3c3dC2Bd25eFd4ecD3937`
- (Pendiente deploy a mainnet)

## Is the smart contract audited?

- **No** (pero es un contrato simple y se puede auditar)

## Do you have social media?

- (Poner Twitter/Farcaster si tenés)

---

## Checklist pre-submission (todo OK)

| Item | Estado |
|------|--------|
| Zero-click connect | ✅ `wallet-provider.tsx` detecta `isMiniPay` y auto-conecta |
| No `personal_sign` | ✅ usa wagmi `useWalletClient().signMessage()` solo en XMTP |
| No raw 0x addresses | ✅ `user-balance.tsx` trunca: `0x1234...5678` |
| UI copy: "Gas" → "Network fee" | ✅ no aparece en UI |
| UI copy: "Deposit" / "Withdraw" | ✅ usa "Pedir Apunte", "Crear Pedido" |
| Stablecoins only (USDC/USDT/USDm) | ✅ contrato migrado a ERC-20 |
| Contract verified on Celoscan | ⏳ pendiente (necesita Etherscan API key) |
| Sample tx hashes for every method | ⏳ pendiente (cuando deploye mainnet) |
| Tested at 360×640 | ⏳ pendiente (probar en mobile) |
| Images SVG or WebP | ⏳ pendiente (logo + screenshots) |
| PageSpeed Insights | ⏳ pendiente (cuando esté en producción) |
| Redirect to Deposit deeplink | ⏳ pendiente |
| App name + logo | ⏳ pendiente (logo actual?) |
| ToS + Privacy Policy | ⏳ pendiente |
| In-app support link | ⏳ pendiente |

---

## Recommended: grabar un demo corto (max 4 min)

1. Abrir Apuntacelo en el browser
2. Conectar wallet
3. Crear un bounty (pedido de apunte)
4. Mostrar el pedido en el muro
5. (Si se puede) ofrecer y aceptar un apunte

---

## Tips para el intake

- **No submitees si el app no está en buen estado** — MiniPay prioriza calidad, si mandás algo medio roto te van a ignorar
- Si no tenés el deploy a mainnet todavía, mejor **esperar** a tener mainnet funcionando
- Una vez que te acepten el intake, te van a contactar para un call → ahí recién pasás a Stage 2
