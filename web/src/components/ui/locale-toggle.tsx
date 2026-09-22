import { useLocale } from "@/lib/locale-provider";
import { cn } from "@/lib/utils";

/**
 * Two-state language switch. Shows both codes so the current one is obvious
 * without a tooltip. The buttons carry `aria-pressed`, so no wrapper role is
 * needed — a `role="group"` wrapper here would also fight the header's flex
 * layout and gains nothing over two labelled toggle buttons.
 */
export function LocaleToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div data-slot="locale-toggle" className={cn("grid grid-cols-2 gap-0.5", className)}>
      {(["en", "zh"] as const).map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={active}
            title={t("lang.toggle")}
            className={cn(
              "min-h-9 w-full rounded-chip border px-2 font-mono text-meta uppercase tracking-label transition-colors duration-standard",
              active
                ? "border-brand/40 bg-brand/15 text-brand"
                : "border-transparent text-text-3 hover:border-border hover:text-text-1",
            )}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
