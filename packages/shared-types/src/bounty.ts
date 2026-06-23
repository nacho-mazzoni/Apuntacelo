export enum BountyStatus {
  Open = 0,
  Fulfilled = 1,
  Cancelled = 2,
}

export interface BountyRequest {
  id: bigint;
  requester: `0x${string}`;
  title: string;
  description: string;
  token: `0x${string}`;
  amount: bigint;
  status: BountyStatus;
  createdAt: bigint;
}
