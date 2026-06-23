export enum OfferStatus {
  Pending = 0,
  Accepted = 1,
  Rejected = 2,
}

export interface Offer {
  seller: `0x${string}`;
  ipfsCID: string;
  status: OfferStatus;
}
