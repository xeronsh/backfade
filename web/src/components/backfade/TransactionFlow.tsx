import { Check, CircleAlert, LoaderCircle } from "lucide-react";
import type { TransactionPhase } from "@/features/wallet/useTransaction";
import { config } from "@/lib/config";

const labels: Record<TransactionPhase, string> = {
  IDLE: "Ready",
  VALIDATING: "Validating action",
  SIMULATING: "Simulating transaction",
  AWAITING_APPROVAL_SIGNATURE: "Approve in wallet",
  APPROVAL_PENDING: "Approval pending",
  AWAITING_TRANSACTION_SIGNATURE: "Confirm in wallet",
  TRANSACTION_PENDING: "Transaction pending",
  CONFIRMED: "Confirmed",
  FAILED: "Failed",
};

export function TransactionFlow({
  phase,
  hash,
}: {
  phase: TransactionPhase;
  hash?: `0x${string}` | null;
}) {
  if (phase === "IDLE") return null;
  const icon =
    phase === "CONFIRMED" ? (
      <Check size={16} aria-hidden="true" />
    ) : phase === "FAILED" ? (
      <CircleAlert size={16} aria-hidden="true" />
    ) : (
      <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
    );
  return (
    <div className="mt-4 flex items-center gap-2 rounded-field border border-border bg-surface-2 px-3 py-2 text-sm text-text-2">
      {icon}
      <span>{labels[phase]}</span>
      {hash ? (
        <a
          className="ml-auto text-brand hover:underline"
          href={`${config.explorerUrl}/tx/${hash}`}
          target="_blank"
          rel="noreferrer"
        >
          Explorer
        </a>
      ) : null}
    </div>
  );
}
