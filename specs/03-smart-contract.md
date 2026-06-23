# Smart Contract Specification

## BountyBasedNotes

### State

```solidity
BountyRequest[] public requests;
mapping(address => User) public users;
mapping(uint256 => Offer[]) public offers;
mapping(address => bool) public supportedTokens;
uint256 public requestCount;
```

### Functions

#### `createRequest(string title, string description, address token, uint256 amount)`

| | |
|---|---|
| **Quién** | Cualquier address |
| **Pre-conditions** | `msg.sender` tiene `≥ amount` de `token`; `token` está en `supportedTokens`; `amount > 0` |
| **Post-conditions** | `requests.push(BountyRequest(...))`; `requestCount++`; `token` transferido al contrato via `safeTransferFrom`; `RequestCreated` emitido |
| **Invariant** | `IERC20(token).balanceOf(this) == sum(amount) for all requests where status == Open` |

#### `offerNote(uint256 requestId, string ipfsCID)`

| | |
|---|---|
| **Quién** | Cualquier address excepto el requester del request |
| **Pre-conditions** | `requestId` existe; `request.status == Open` |
| **Post-conditions** | `offers[requestId].push(Offer(...))`; `OfferSubmitted` emitido |

#### `acceptOffer(uint256 requestId, uint256 offerIndex, uint8 rating)`

| | |
|---|---|
| **Quién** | Solo `request.requester` |
| **Pre-conditions** | `requestId` existe; `request.status == Open`; `offers[requestId][offerIndex].status == Pending`; `1 ≤ rating ≤ 5` |
| **Post-conditions** | `request.status = Fulfilled`; `offers[requestId][offerIndex].status = Accepted`; `seller.reputation += rating`; `seller.completedTasks += 1`; Tokens transferidos al seller via `safeTransfer`; `OfferAccepted` y `ReputationUpdated` emitidos |

### Events

| Event | Parámetros |
|-------|-----------|
| `RequestCreated` | `uint256 id`, `address requester`, `string title`, `uint256 amount` |
| `OfferSubmitted` | `uint256 requestId`, `uint256 offerIndex`, `address seller`, `string ipfsCID` |
| `OfferAccepted` | `uint256 requestId`, `uint256 offerIndex`, `address seller`, `uint8 rating` |
| `ReputationUpdated` | `address seller`, `uint256 newReputation`, `uint256 completedTasks` |

### Modifiers

- `requestExists(uint256 requestId)` — previene acceso a IDs inválidos
- `onlyRequester(uint256 requestId)` — solo el creador del request
- `supportedToken(address token)` — solo permite tokens whitelisted
- `offerPending(uint256 requestId, uint256 offerIndex)` — oferta no fue aceptada/rechazada

### Security

- Uso de OpenZeppelin `SafeERC20` para todos los transfers
- Uso de OpenZeppelin `ReentrancyGuard` en funciones que transfieren tokens
- No hay funciones de withdraw — los tokens siempre van a un seller al aceptar
- No hay owner/admin — el contrato es inmutable y sin roles
