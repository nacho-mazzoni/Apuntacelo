# Apuntacelo

> Marketplace descentralizado de apuntes universitarios en Celo.
> Creá bounties en stablecoins y recibí ofertas de otros estudiantes.

Built with Next.js 14, TypeScript, Hardhat, and Turborepo.

---

## Arquitectura

```
Apuntacelo/
├── specs/                   # Especificaciones (SDD)
│   ├── 00-architecture.md   # Visión general del sistema
│   ├── 01-data-model.md     # Entidades, relaciones, tipos
│   ├── 02-user-flows.md     # Flujos de usuario (sequence diagrams)
│   ├── 03-smart-contract.md # Spec formal del contrato
│   ├── 04-xmtp-protocol.md  # Formato de mensajes XMTP
│   ├── 05-ipfs-storage.md   # Esquema de almacenamiento IPFS
│   ├── 06-ui-components.md  # Árbol de componentes y props
│   ├── 07-error-handling.md # Matriz de errores por capa
│   └── 08-glossary.md       # Lenguaje ubicuo
├── adrs/                    # Architecture Decision Records
│   ├── 001-usar-turborepo.md
│   ├── 002-encryption-aes-gcm.md
│   ├── 003-xmtp-vs-push.md
│   └── 004-single-page-vs-routes.md
├── packages/                # Código compartido
│   ├── shared-types/        # Tipos TypeScript compartidos
│   └── config/              # Configuraciones (tsconfig, eslint)
├── apps/
│   ├── web/                 # Frontend Next.js + UI components
│   │   └── src/
│   │       ├── app/         # App Router pages
│   │       ├── components/
│   │       │   ├── bounty/  # CreateRequestForm
│   │       │   ├── offer/   # OfferSheet, PendingOffers, OfferPreview
│   │       │   ├── user/    # UserBalance
│   │       │   ├── shared/  # Navbar, ConnectButton, ConnectGate, WalletProvider
│   │       │   └── ui/      # shadcn/ui primitives
│   │       ├── hooks/       # Custom hooks (useXmtp, useContract)
│   │       └── lib/         # Utils (IPFS, encryption, tokens, ABI)
│   └── contracts/           # Smart contracts (Hardhat + Solidity)
│       ├── contracts/       # Solidity source files
│       ├── ignition/        # Hardhat Ignition deployment modules
│       └── test/            # Contract tests
├── .agents/                 # opencode AI agent skills
├── GAPS.md                  # Feature roadmap
└── README.md                # Este archivo
```

### Smart Contracts

- **BountyBasedNotes** — Crea pedidos de apuntes, los sellers ofrecen archivos cifrados via IPFS, y los requesters aceptan y pagan.
- Desplegado en **Celo Sepolia** (chain ID `11142220`).

---

## Requisitos

- Node.js >= 18
- pnpm >= 8

## Empezar

```bash
# Instalar dependencias
pnpm install

# Iniciar frontend (dev)
pnpm dev
# → http://localhost:3000
```

## Scripts Disponibles

| Comando | Descripción |
|---|---|
| `pnpm dev` | Iniciar servidores de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm lint` | Lint de todos los proyectos |
| `pnpm type-check` | TypeScript type checking |
| `pnpm contracts:compile` | Compilar contratos |
| `pnpm contracts:test` | Ejecutar tests |
| `pnpm contracts:deploy:celo-sepolia` | Deploy a Celo Sepolia |

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| UI Library | shadcn/ui |
| Web3 | Wagmi + Viem + RainbowKit |
| Off-chain | XMTP (mensajería cifrada) |
| Storage | IPFS (Pinata) |
| Contratos | Solidity + Hardhat + Hardhat Ignition |
| Monorepo | Turborepo |
| Package Manager | PNPM |

## Despliegue de Contratos

1. Copiar `.env.example` → `.env` en `apps/contracts/`
2. Configurar `PRIVATE_KEY` y `ETHERSCAN_API_KEY`
3. Desplegar:
   ```bash
   pnpm contracts:deploy:celo-sepolia
   ```
4. Copiar la address desplegada en `apps/web/.env.local`:
   ```
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
   ```

## Redes

| Red | Chain ID | RPC |
|---|---|---|
| Celo Mainnet | `42220` | `https://forno.celo.org` |
| Celo Sepolia | `11142220` | `https://forno.celo-sepolia.celo-testnet.org` |

---

Hecho con ❤️ sobre Celo.
