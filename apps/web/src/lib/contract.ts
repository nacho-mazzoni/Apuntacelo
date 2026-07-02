export const CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`) ||
  "0x0000000000000000000000000000000000000000";

export const NOTES_MARKETPLACE_ABI = [
  {
    inputs: [
      { internalType: "bytes32", name: "_contentHash", type: "bytes32" },
      { internalType: "address", name: "_token", type: "address" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
    ],
    name: "createRequest",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_requestId", type: "uint256" },
    ],
    name: "offerNote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_requestId", type: "uint256" },
      { internalType: "uint256", name: "_offerIndex", type: "uint256" },
      { internalType: "uint8", name: "rating", type: "uint8" },
    ],
    name: "acceptOffer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_requestId", type: "uint256" },
    ],
    name: "cancelRequest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_requestId", type: "uint256" }],
    name: "getRequest",
    outputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "address", name: "requester", type: "address" },
      { internalType: "bytes32", name: "contentHash", type: "bytes32" },
      { internalType: "uint256", name: "reward", type: "uint256" },
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint8", name: "status", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getRequestCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_requestId", type: "uint256" }],
    name: "getOffers",
    outputs: [
      { internalType: "address[]", name: "", type: "address[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "reputation",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "completedTasks",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "requestId", type: "uint256" },
      { indexed: true, internalType: "address", name: "requester", type: "address" },
      { indexed: true, internalType: "bytes32", name: "contentHash", type: "bytes32" },
      { indexed: false, internalType: "uint256", name: "reward", type: "uint256" },
      { indexed: false, internalType: "address", name: "token", type: "address" },
    ],
    name: "RequestCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "requestId", type: "uint256" },
      { indexed: true, internalType: "address", name: "seller", type: "address" },
    ],
    name: "OfferSubmitted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "requestId", type: "uint256" },
      { indexed: true, internalType: "address", name: "seller", type: "address" },
      { indexed: false, internalType: "uint256", name: "reward", type: "uint256" },
    ],
    name: "OfferAccepted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "requestId", type: "uint256" },
      { indexed: true, internalType: "address", name: "requester", type: "address" },
      { indexed: false, internalType: "uint256", name: "reward", type: "uint256" },
    ],
    name: "RequestCancelled",
    type: "event",
  },
] as const;

export interface BountyRequest {
  id: bigint;
  requester: `0x${string}`;
  contentHash: `0x${string}`;
  reward: bigint;
  token: `0x${string}`;
  status: number;
}

export interface Offer {
  seller: `0x${string}`;
}
