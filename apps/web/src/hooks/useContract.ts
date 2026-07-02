"use client";

import { useReadContract, useWriteContract, usePublicClient, useAccount } from "wagmi";
import { useCallback } from "react";
import { parseUnits, erc20Abi } from "viem";
import { celo } from "wagmi/chains";
import { CONTRACT_ADDRESS, NOTES_MARKETPLACE_ABI } from "@/lib/contract";
import type { BountyRequest, Offer } from "@/lib/contract";

export const ERC20_ABI = erc20Abi;

export function useContract() {
  const { address } = useAccount();
  const { data: requestCount, refetch: refetchCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: NOTES_MARKETPLACE_ABI,
    functionName: "getRequestCount",
    chainId: celo.id,
    query: { enabled: !!address },
  });

  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  const publicClient = usePublicClient();

  const waitForTx = useCallback(
    async (hash: `0x${string}`) => {
      if (!publicClient) return;
      await publicClient.waitForTransactionReceipt({ hash });
    },
    [publicClient]
  );

  const createRequest = useCallback(
    async (contentHash: `0x${string}`, tokenAddress: `0x${string}`, amount: bigint, value?: bigint) => {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: NOTES_MARKETPLACE_ABI,
        functionName: "createRequest",
        args: [contentHash, tokenAddress, amount],
        value,
      });
      await waitForTx(hash);
    },
    [writeContractAsync, waitForTx]
  );

  const offerNote = useCallback(
    async (requestId: bigint) => {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: NOTES_MARKETPLACE_ABI,
        functionName: "offerNote",
        args: [requestId],
      });
      await waitForTx(hash);
    },
    [writeContractAsync, waitForTx]
  );

  const acceptOffer = useCallback(
    async (requestId: bigint, offerIndex: bigint, rating: number) => {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: NOTES_MARKETPLACE_ABI,
        functionName: "acceptOffer",
        args: [requestId, offerIndex, rating],
      });
      await waitForTx(hash);
    },
    [writeContractAsync, waitForTx]
  );

  const cancelRequest = useCallback(
    async (requestId: bigint) => {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: NOTES_MARKETPLACE_ABI,
        functionName: "cancelRequest",
        args: [requestId],
      });
      await waitForTx(hash);
    },
    [writeContractAsync, waitForTx]
  );

  const approveToken = useCallback(
    async (tokenAddress: `0x${string}`, amount: bigint) => {
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, amount],
      });
      await waitForTx(hash);
    },
    [writeContractAsync, waitForTx]
  );

  const getRequest = useCallback(
    async (requestId: bigint): Promise<BountyRequest> => {
      const result = await publicClient!.readContract({
        address: CONTRACT_ADDRESS,
        abi: NOTES_MARKETPLACE_ABI,
        functionName: "getRequest",
        args: [requestId],
      });
      const [id, requester, contentHash, reward, token, status] = result as [
        bigint,
        `0x${string}`,
        `0x${string}`,
        bigint,
        `0x${string}`,
        number
      ];
      return { id, requester, contentHash, reward, token, status };
    },
    [publicClient]
  );

  const getAllRequests = useCallback(async (): Promise<BountyRequest[]> => {
    const count = Number(requestCount || 0n);
    if (count === 0) return [];
    const ids = Array.from({ length: count }, (_, i) => BigInt(i + 1));
    const results = await Promise.all(
      ids.map((id) => getRequest(id).catch((err) => {
        console.error(`Error obteniendo request ${id}:`, err);
        return null;
      }))
    );
    return results.filter((r): r is BountyRequest => r !== null);
  }, [requestCount, getRequest]);

  const getOffers = useCallback(
    async (requestId: bigint): Promise<Offer[]> => {
      const result = await publicClient!.readContract({
        address: CONTRACT_ADDRESS,
        abi: NOTES_MARKETPLACE_ABI,
        functionName: "getOffers",
        args: [requestId],
      });
      return (result as `0x${string}`[]).map((seller) => ({ seller }));
    },
    [publicClient]
  );

  const getReputation = useCallback(
    async (seller: `0x${string}`): Promise<bigint> => {
      const result = await publicClient!.readContract({
        address: CONTRACT_ADDRESS,
        abi: NOTES_MARKETPLACE_ABI,
        functionName: "reputation",
        args: [seller],
      });
      return result as bigint;
    },
    [publicClient]
  );

  const getCompletedTasks = useCallback(
    async (seller: `0x${string}`): Promise<bigint> => {
      const result = await publicClient!.readContract({
        address: CONTRACT_ADDRESS,
        abi: NOTES_MARKETPLACE_ABI,
        functionName: "completedTasks",
        args: [seller],
      });
      return result as bigint;
    },
    [publicClient]
  );

  return {
    requestCount,
    refetchCount,
    createRequest,
    offerNote,
    acceptOffer,
    cancelRequest,
    approveToken,
    getRequest,
    getAllRequests,
    getOffers,
    getReputation,
    getCompletedTasks,
    isWriting,
  };
}
