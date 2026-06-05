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
    const requests: BountyRequest[] = [];
    for (let i = 1; i <= count; i++) {
      try {
        const req = await getRequest(BigInt(i));
        if (req.status === 0) {
          requests.push(req);
        }
      } catch {
        break;
      }
    }
    return requests;
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
  };
}
