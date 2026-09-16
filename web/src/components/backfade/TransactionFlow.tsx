import { Figure } from "@/components/data";
import type { TransactionPhase } from "@/features/wallet/useTransaction";
import { config } from "@/lib/config";
import { useLocale } from "@/lib/locale-provider";
import { cn } from "@/lib/utils";

const STEP_KEYS = ["tx.prepare", "tx.sign", "tx.submit", "tx.confirm"] as const;

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
  const { t, phaseLabel } = useLocale();
  // Hook order must be stable: bail out only after every hook has run.
  if (phase === "IDLE") return null;
  const current = activeStep(phase);
  const failed = phase === "FAILED";

  return (
    <div
      className="mt-4 rounded-card border border-border bg-surface-2 p-4"
      aria-live="polite"
    >
      <ol className="grid grid-cols-4 gap-1" aria-label={t("tx.progress")}>
        {STEP_KEYS.map((stepKey, index) => {
          const complete = !failed && index < current;
          const currentStep = index === current;
          return (
            <li
              key={stepKey}
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
                  "relative z-1 grid size-6 place-items-center border border-border-strong bg-surface-2",
                  "transition-colors duration-slow",
                  complete && "border-back bg-back-soft",
                  currentStep && !failed && "border-brand bg-brand/12",
                  failed && currentStep && "border-fade bg-fade-soft",
                )}
              >
                {complete ? (
                  <span aria-hidden="true">✓</span>
                ) : failed && currentStep ? (
                  <span aria-hidden="true">!</span>
                ) : currentStep ? (
                  <span
                    aria-hidden="true"
                    className="size-2 animate-pulse bg-current"
                  />
                ) : (
                  <Figure>{index + 1}</Figure>
                )}
              </span>
              <span>{t(stepKey)}</span>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex items-center justify-between gap-4 border-t border-border pt-3 text-body text-text-2">
        <span>{phaseLabel(phase)}</span>
        {hash ? (
          <a
            className="text-brand hover:underline"
            href={`${config.explorerUrl}/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
          >
            {t("market.explorer")}
          </a>
        ) : null}
      </div>
      {failed ? (
        <p className="mt-2 text-meta text-fade">{t("tx.failedBody")}</p>
      ) : null}
    </div>
  );
}
