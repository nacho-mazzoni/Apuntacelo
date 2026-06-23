# Architecture

## Descripción

Apuntacelo es un marketplace descentralizado de apuntes universitarios construido sobre Celo. Los estudiantes pueden crear bounties (pedidos de apuntes con recompensa en stablecoins) y recibir ofertas de otros estudiantes que suben archivos cifrados a IPFS y comparten la clave de desencriptación via XMTP.

## Diagrama de contexto (C4 Nivel 1)

```
┌─────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│  Estudiante  │────▶│   Apuntacelo Web    │────▶│  Smart Contract   │
│  (Browser)   │     │   (Next.js App)     │     │ (Celo Blockchain) │
└─────────────┘     └─────────────────────┘     └──────────────────┘
       │                      │                           │
       │                      │                           │
       ▼                      ▼                           ▼
┌─────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│   XMTP      │     │   IPFS (Pinata)     │     │   Wallet (Wagmi)  │
│  (Mensajes  │     │  (Almacenamiento)   │     │  (Conexión Web3)  │
│   E2EE)     │     │                     │     │                  │
└─────────────┘     └─────────────────────┘     └──────────────────┘
```

## Stack

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend | Next.js 14 (App Router) | SSR, SEO, App Router moderno |
| UI | shadcn/ui + Tailwind CSS | Componentes accesibles, tema customizable |
| Web3 | Wagmi v2 + Viem + RainbowKit | Estándar en el ecosistema, typesafety |
| Blockchain | Celo (42220 / 11142220) | Stablecoins nativas, gas bajo, MiniPay |
| Mensajería | XMTP | E2EE descentralizado, sin servidor propio |
| Storage | IPFS via Pinata | Contenido direccionable por hash, persistencia |
| Encripción | AES-GCM 256 (Web Crypto API) | Sin dependencias externas, nativo del browser |
| Monorepo | Turborepo + pnpm | Rápido, builds paralelos, workspace nativo |

## Constraints

- Sin backend propio — todo P2P + blockchain
- Sin base de datos relacional — estado en contrato + IPFS
- Archivos ≤ 50MB — límite de Pinata + experiencia de usuario
- Solo archivos PDF/DOC/DOCX — preview factible en browser
- Sin autenticación — la wallet es la identidad

## Decisiones arquitectónicas clave

| Decisión | Alternativa | Elegida |
|----------|-------------|---------|
| Mensajería descentralizada | Push notifications, WebSockets | XMTP (E2EE, sin servidor) |
| Almacenamiento de archivos | Arweave, AWS S3 | IPFS (contenido direccionable, descentralizado) |
| Cifrado | Lit Protocol, NuCypher | AES-GCM manual vía Web Crypto API |
| Wallet Connect | Web3Modal, ConnectKit | RainbowKit (soporte MiniPay nativo) |
