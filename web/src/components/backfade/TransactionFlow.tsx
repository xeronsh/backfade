import { Check, CircleAlert, LoaderCircle } from "lucide-react";
import { Figure } from "@/components/data";
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
    <div
      className="mt-4 rounded-card border border-border bg-surface-2 p-4"
      aria-live="polite"
    >
      <ol className="grid grid-cols-4 gap-1" aria-label="Transaction progress">
        {steps.map((step, index) => {
          const complete = !failed && index < current;
          const currentStep = index === current;
          return (
            <li
              key={step}
              className={cn(
                "relative grid justify-items-center gap-1 font-mono text-meta uppercase tracking-label",
                "not-last:after:absolute not-last:after:top-2.75 not-last:after:left-[calc(50%+13px)] not-last:after:h-px not-last:after:w-[calc(100%-26px)] not-last:after:bg-border not-last:after:transition-colors not-last:after:duration-slow not-last:after:content-['']",
                complete && "text-back not-last:after:bg-back",
                currentStep && !failed && "text-text-1",
                failed && currentStep && "text-fade",
                !complete && !currentStep && "text-text-3",
              )}
            >
              <span
                className={cn(
                  "relative z-1 grid size-6 place-items-center rounded-full border border-border-strong bg-surface-2",
                  "transition-colors duration-slow",
                  complete && "border-back bg-back-soft",
                  currentStep && !failed && "border-brand bg-brand/12",
                  failed && currentStep && "border-fade bg-fade-soft",
                )}
              >
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
                  <Figure>{index + 1}</Figure>
                )}
              </span>
              <span>{step}</span>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex items-center justify-between gap-4 border-t border-border pt-3 text-body text-text-2">
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
        <p className="mt-2 text-meta text-fade">
          Transaction did not confirm. Review the wallet request and amount,
          then retry.
        </p>
      ) : null}
    </div>
  );
}
