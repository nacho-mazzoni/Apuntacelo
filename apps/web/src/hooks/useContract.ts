import { useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { parseUnits, erc20Abi } from "viem";
import { CONTRACT_ADDRESS, NOTES_MARKETPLACE_ABI } from "@/lib/contract";
import type { BountyRequest, Offer } from "@/lib/contract";

export const ERC20_ABI = erc20Abi;

export function useContract() {
  const { data: requestCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: NOTES_MARKETPLACE_ABI,
    functionName: "getRequestCount",
    query: { staleTime: 30_000 },
  });

  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  const publicClient = usePublicClient();

  const createRequest = async (
    title: string,
    description: string,
    tokenAddress: `0x${string}`,
    amount: bigint
  ) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: NOTES_MARKETPLACE_ABI,
      functionName: "createRequest",
      args: [title, description, tokenAddress, amount],
    });
  };

  const offerNote = async (requestId: bigint, ipfsCID: string) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: NOTES_MARKETPLACE_ABI,
      functionName: "offerNote",
      args: [requestId, ipfsCID],
    });
  };

  const acceptOffer = async (
    requestId: bigint,
    offerIndex: bigint,
    rating: number
  ) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: NOTES_MARKETPLACE_ABI,
      functionName: "acceptOffer",
      args: [requestId, offerIndex, rating],
    });
  };

  const approveToken = async (
    tokenAddress: `0x${string}`,
    amount: bigint
  ) => {
    return writeContractAsync({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [CONTRACT_ADDRESS, amount],
    });
  };

  const getRequest = async (requestId: bigint): Promise<BountyRequest> => {
    const result = await publicClient!.readContract({
      address: CONTRACT_ADDRESS,
      abi: NOTES_MARKETPLACE_ABI,
      functionName: "getRequest",
      args: [requestId],
    });
    const [id, requester, title, description, reward, token, status] = result as [
      bigint,
      `0x${string}`,
      string,
      string,
      bigint,
      `0x${string}`,
      number
    ];
    return { id, requester, title, description, reward, token, status };
  };

  const getRequests = async (): Promise<BountyRequest[]> => {
    const count = Number(requestCount || 0n);
    if (count === 0) return [];
    const promises = Array.from({ length: count }, (_, i) =>
      getRequest(BigInt(i + 1)).catch(() => null)
    );
    const results = await Promise.all(promises);
    return results.filter((r): r is BountyRequest => r !== null && r.status === 0);
  };

  const getOffers = async (requestId: bigint): Promise<Offer[]> => {
    const result = await publicClient!.readContract({
      address: CONTRACT_ADDRESS,
      abi: NOTES_MARKETPLACE_ABI,
      functionName: "getOffers",
      args: [requestId],
    });
    return result as Offer[];
  };

  const waitForTx = async (hash: `0x${string}`) => {
    await publicClient!.waitForTransactionReceipt({ hash });
  };

  return {
    requestCount,
    createRequest,
    offerNote,
    acceptOffer,
    approveToken,
    getRequest,
    getRequests,
    getOffers,
    isWriting,
    waitForTx,
  };
}
