export interface RequestMetadata {
  id: number;
  content_hash: string;
  requester: string;
  title: string;
  description: string;
  reward: string;
  token: string;
  status: number;
  created_at: string;
}

export interface OfferMetadata {
  id: number;
  request_id: number;
  seller: string;
  ipfs_cid: string;
  encrypted_key: string;
  file_name: string;
  file_type: string;
  created_at: string;
}

export async function fetchRequestMetadata(contentHash: string): Promise<RequestMetadata | null> {
  try {
    const res = await fetch(`/api/requests`);
    if (!res.ok) return null;
    const all: RequestMetadata[] = await res.json();
    return all.find((r) => r.content_hash === contentHash) || null;
  } catch {
    return null;
  }
}

export async function fetchAllRequestsMetadata(): Promise<RequestMetadata[]> {
  try {
    const res = await fetch("/api/requests");
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function saveRequestMetadata(data: {
  id: number;
  content_hash: string;
  requester: string;
  title: string;
  description: string;
  reward: string;
  token: string;
}) {
  const res = await fetch("/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error saving request metadata");
  }
  return res.json();
}

export async function fetchOffersMetadata(requestId: number): Promise<OfferMetadata[]> {
  try {
    const res = await fetch(`/api/offers?request_id=${requestId}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function saveOfferMetadata(data: {
  request_id: number;
  seller: string;
  ipfs_cid: string;
  encrypted_key: string;
  file_name: string;
  file_type: string;
}) {
  const res = await fetch("/api/offers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error saving offer metadata");
  }
  return res.json();
}
