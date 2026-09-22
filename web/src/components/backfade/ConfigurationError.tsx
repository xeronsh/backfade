import { detectLocale, translate } from "@/lib/i18n";

export function ConfigurationError({ message }: { message: string }) {
  // Rendered from main.tsx's catch, outside LocaleProvider, so the locale is
  // read straight from storage instead of through a hook.
  const locale = detectLocale();
  // Only a genuine schema failure should tell the reader to edit env files.
  // Any other throw here is a module/import failure, and sending someone to
  // `.env.local` for that wastes their time.
  const isConfig = message.startsWith("Configuration Error:");
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6">
      <section className="w-full rounded-panel border border-fade bg-fade-soft p-6">
        <p className="mb-2 font-mono text-meta uppercase tracking-eyebrow text-fade">
          {translate(
            locale,
            isConfig ? "error.configEyebrow" : "error.startupEyebrow",
          )}
        </p>
        <h1 className="mb-3 text-page-title font-semibold">
          {translate(locale, isConfig ? "error.config" : "error.startup")}
        </h1>
        <p className="text-body text-text-2">{message}</p>
        <p className="mt-4 text-body text-text-3">
          {translate(locale, isConfig ? "error.configBody" : "error.startupBody")}
        </p>
      </section>
    </main>
  );
}
