import { useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { parseEther } from "viem";
import { CONTRACT_ADDRESS, NOTES_MARKETPLACE_ABI } from "@/lib/contract";
import type { BountyRequest, Offer } from "@/lib/contract";

export function useContract() {
  const { data: requestCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: NOTES_MARKETPLACE_ABI,
    functionName: "getRequestCount",
  });

  const { data: reputation } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: NOTES_MARKETPLACE_ABI,
    functionName: "reputation",
    args: [] as any,
  });

  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  const publicClient = usePublicClient();

  const createRequest = async (
    title: string,
    description: string,
    rewardCELO: string
  ) => {
    const rewardWei = parseEther(rewardCELO);
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: NOTES_MARKETPLACE_ABI,
      functionName: "createRequest",
      args: [title, description],
      value: rewardWei,
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

  const getRequest = async (requestId: bigint): Promise<BountyRequest> => {
    const result = await publicClient!.readContract({
      address: CONTRACT_ADDRESS,
      abi: NOTES_MARKETPLACE_ABI,
      functionName: "getRequest",
      args: [requestId],
    });
    const [id, requester, title, description, reward, status] = result as [
      bigint,
      `0x${string}`,
      string,
      string,
      bigint,
      number
    ];
    return { id, requester, title, description, reward, status };
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
    getRequest,
    getRequests,
    getOffers,
    isWriting,
  };
}
