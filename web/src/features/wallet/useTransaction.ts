import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Abi, Address } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { formatError } from "@/lib/format";

export type TransactionPhase =
  | "IDLE"
  | "VALIDATING"
  | "SIMULATING"
  | "AWAITING_APPROVAL_SIGNATURE"
  | "APPROVAL_PENDING"
  | "AWAITING_TRANSACTION_SIGNATURE"
  | "TRANSACTION_PENDING"
  | "CONFIRMED"
  | "FAILED";

export interface ContractRequest {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
}

export function useTransaction() {
  const { address: account } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<TransactionPhase>("IDLE");
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<`0x${string}` | null>(null);

  async function execute(request: ContractRequest, approval = false) {
    setError(null);
    setHash(null);
    if (!account) throw new Error("Connect your wallet before signing.");
    if (!publicClient) throw new Error("Blockchain client is not ready.");
    try {
      setPhase("VALIDATING");
      setPhase("SIMULATING");
      const simulation = await publicClient.simulateContract({
        ...request,
        account,
      } as never);
      setPhase(
        approval
          ? "AWAITING_APPROVAL_SIGNATURE"
          : "AWAITING_TRANSACTION_SIGNATURE",
      );
      const transactionHash = await writeContractAsync(
        simulation.request as never,
      );
      setHash(transactionHash);
      setPhase(approval ? "APPROVAL_PENDING" : "TRANSACTION_PENDING");
      await publicClient.waitForTransactionReceipt({ hash: transactionHash });
      setPhase("CONFIRMED");
      await queryClient.invalidateQueries();
      return transactionHash;
    } catch (cause) {
      setPhase("FAILED");
      const message = formatError(cause);
      setError(message);
      throw new Error(message);
    }
  }

  return {
    execute,
    phase,
    error,
    hash,
    isPending: phase !== "IDLE" && phase !== "CONFIRMED" && phase !== "FAILED",
  };
}
