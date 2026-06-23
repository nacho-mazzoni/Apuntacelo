export interface EncryptionKeyPayload {
  bountyId: bigint;
  aesKeyBase64: string;
  fileName: string;
  mimeType: string;
}

export const XMTP_MESSAGE_PREFIX = "OFFER_KEY";
export const XMTP_MESSAGE_SEPARATOR = ":";
