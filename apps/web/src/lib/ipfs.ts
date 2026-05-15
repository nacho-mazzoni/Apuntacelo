const WEB3_STORAGE_TOKEN =
  process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN || "";
const WEB3_STORAGE_GATEWAY = "https://w3s.link/ipfs/";

export async function uploadToIPFS(
  file: File,
  onProgress?: (bytesUploaded: number, totalBytes: number) => void
): Promise<string> {
  if (!WEB3_STORAGE_TOKEN) {
    throw new Error("NEXT_PUBLIC_WEB3_STORAGE_TOKEN no configurado");
  }

  const response = await fetch("https://api.web3.storage/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WEB3_STORAGE_TOKEN}`,
      "Content-Type": "application/octet-stream",
      "X-Name": encodeURIComponent(file.name),
    },
    body: file,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error subiendo a IPFS: ${response.status} - ${error}`);
  }

  const result = await response.json();
  return result.cid;
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
  return `${WEB3_STORAGE_GATEWAY}${cid}`;
}

export async function downloadFromIPFS(cid: string): Promise<ArrayBuffer> {
  const response = await fetch(getIPFSUrl(cid));
  if (!response.ok) {
    throw new Error(`Error descargando de IPFS: ${response.status}`);
  }
  return response.arrayBuffer();
}
