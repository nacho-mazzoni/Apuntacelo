export interface EncryptedFile {
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  key: CryptoKey;
  keyExported: ArrayBuffer;
  fileName: string;
  mimeType: string;
}

export interface DecryptedFile {
  blob: Blob;
  fileName: string;
  mimeType: string;
}

export async function encryptFile(file: File): Promise<EncryptedFile> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const fileBuffer = await file.arrayBuffer();
  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    fileBuffer
  );

  const keyExported = await crypto.subtle.exportKey("raw", key);

  return {
    encryptedData,
    iv,
    key,
    keyExported,
    fileName: file.name,
    mimeType: file.type,
  };
}

export async function decryptFile(
  encryptedData: BufferSource,
  keyRaw: BufferSource,
  iv: BufferSource,
  fileName: string,
  mimeType: string
): Promise<DecryptedFile> {
  const key = await crypto.subtle.importKey(
    "raw",
    keyRaw,
    { name: "AES-GCM", length: 256 },
    true,
    ["decrypt"]
  );

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encryptedData
  );

  return {
    blob: new Blob([decryptedBuffer], { type: mimeType }),
    fileName,
    mimeType,
  };
}

export function arrayBufferToBase64(buffer: ArrayBufferLike): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encryptKeyForXMTP(
  keyExported: ArrayBuffer,
  recipientAddress: string,
  xmtpClient: any
): Promise<string> {
  const keyBase64 = arrayBufferToBase64(keyExported);
  const conversation = await xmtpClient.conversations.newConversation(
    recipientAddress
  );
  await conversation.send({
    content: `ENCRYPTION_KEY:${keyBase64}`,
    contentType: "text",
  });
  return keyBase64;
}

export async function decryptKeyFromXMTP(
  messageContent: string
): Promise<ArrayBuffer | null> {
  if (!messageContent.startsWith("ENCRYPTION_KEY:")) return null;
  const keyBase64 = messageContent.replace("ENCRYPTION_KEY:", "");
  return base64ToArrayBuffer(keyBase64);
}
