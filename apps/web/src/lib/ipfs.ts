const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "";
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

export async function uploadToIPFS(
  file: File,
  onProgress?: (bytesUploaded: number, totalBytes: number) => void
): Promise<string> {
  if (!PINATA_JWT) {
    throw new Error("NEXT_PUBLIC_PINATA_JWT no configurado");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error subiendo a IPFS: ${response.status} - ${error}`);
  }

  const result = await response.json();
  return result.IpfsHash;
}

export async function uploadEncryptedFile(
  encryptedData: ArrayBuffer,
  fileName: string
): Promise<string> {
  const encryptedBlob = new Blob([encryptedData], {
    type: "application/octet-stream",
  });
  const encryptedFile = new File([encryptedBlob], `${fileName}.enc`, {
    type: "application/octet-stream",
  });
  return uploadToIPFS(encryptedFile);
}

export function getIPFSUrl(cid: string): string {
  return `${PINATA_GATEWAY}${cid}`;
}

const ipfsCache = new Map<string, Promise<ArrayBuffer>>();
const IPFS_CACHE_MAX = 20;

export async function downloadFromIPFS(cid: string): Promise<ArrayBuffer> {
  const cached = ipfsCache.get(cid);
  if (cached) {
    ipfsCache.delete(cid);
    ipfsCache.set(cid, cached);
    return cached;
  }
  const promise = (async () => {
    const response = await fetch(getIPFSUrl(cid));
    if (!response.ok) {
      ipfsCache.delete(cid);
      throw new Error(`Error descargando de IPFS: ${response.status}`);
    }
    return response.arrayBuffer();
  })();
  ipfsCache.set(cid, promise);
  if (ipfsCache.size > IPFS_CACHE_MAX) {
    const firstKey = ipfsCache.keys().next().value;
    if (firstKey !== undefined) ipfsCache.delete(firstKey);
  }
  return promise;
}

export function clearIPFSCache() {
  ipfsCache.clear();
}
