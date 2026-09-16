import { Check, CircleAlert, LoaderCircle } from "lucide-react";
import type { TransactionPhase } from "@/features/wallet/useTransaction";
import { config } from "@/lib/config";
import { cn } from "@/lib/utils";

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

const steps = ["Prepare", "Sign", "Submit", "Confirm"];

function activeStep(phase: TransactionPhase) {
  if (phase === "CONFIRMED") return 3;
  if (phase === "TRANSACTION_PENDING") return 2;
  if (
    phase === "AWAITING_APPROVAL_SIGNATURE" ||
    phase === "APPROVAL_PENDING" ||
    phase === "AWAITING_TRANSACTION_SIGNATURE"
  )
    return 1;
  return 0;
}

export function TransactionFlow({
  phase,
  hash,
}: {
  phase: TransactionPhase;
  hash?: `0x${string}` | null;
}) {
  if (phase === "IDLE") return null;
  const current = activeStep(phase);
  const failed = phase === "FAILED";
  return (
    <div className="transaction-rail" aria-live="polite">
      <ol className="transaction-steps" aria-label="Transaction progress">
        {steps.map((step, index) => {
          const complete = !failed && index < current;
          const currentStep = index === current;
          return (
            <li
              className={cn(
                "transaction-step",
                complete && "transaction-step--complete",
                currentStep && "transaction-step--current",
                failed && currentStep && "transaction-step--failed",
              )}
              key={step}
            >
              <span className="transaction-step__node">
                {complete ? (
                  <Check size={12} aria-hidden="true" />
                ) : failed && currentStep ? (
                  <CircleAlert size={12} aria-hidden="true" />
                ) : currentStep ? (
                  <LoaderCircle
                    size={12}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  index + 1
                )}
              </span>
              <span>{step}</span>
            </li>
          );
        })}
      </ol>
      <div className="transaction-rail__status">
        <span>{labels[phase]}</span>
        {hash ? (
          <a
            className="text-brand hover:underline"
            href={`${config.explorerUrl}/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
          >
            Explorer
          </a>
        ) : null}
      </div>
      {failed ? (
        <p className="transaction-rail__error">
          Transaction did not confirm. Review the wallet request and amount,
          then retry.
        </p>
      ) : null}
    </div>
  );
}
