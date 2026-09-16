import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type Locale,
  locales,
  type MessageKey,
  phaseLabel,
  translate,
} from "@/lib/i18n";

const STORAGE_KEY = "backfade.locale";

function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && (locales as readonly string[]).includes(stored))
    return stored as Locale;
  // Fall back to the browser's preference: Chinese browsers get Chinese.
  return navigator.language?.toLowerCase().startsWith("zh") ? "zh" : "en";
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  toggleLocale: () => void;
  /** Translate a key, with optional `{placeholder}` values. */
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  /** Label a chain-owned enum such as a transaction phase. */
  phaseLabel: (phase: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  // Keep the document language in sync for assistive tech and hyphenation.
  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode: the choice simply does not persist.
    }
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      toggleLocale: () => setLocale(locale === "en" ? "zh" : "en"),
      t: (key, vars) => translate(locale, key, vars),
      phaseLabel: (phase) => phaseLabel(locale, phase),
    }),
    [locale, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context)
    throw new Error("useLocale must be used inside a LocaleProvider");
  return context;
}

/** Convenience hook for the common case of only needing `t`. */
export function useT() {
  return useLocale().t;
}
